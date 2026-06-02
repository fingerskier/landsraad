# Pull-Based Indexer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the filesystem the single source of truth for the semantic index — writers stop touching the index, a chokidar watcher re-derives chunks from a path→kind source registry.

**Architecture:** A declarative `index-sources` registry maps council-root-relative paths to `{kind, refId, buildChunks}`. A `reconcile` module turns one file into index chunks (or removes them). A chokidar `watcher` drives reconcile on add/change/unlink, using a startup **manifest map** (`rel → source_mtime`) to skip unchanged files and detect orphans. Keeps sqlite-vec + the Xenova embedder; `underrow` was the reference only.

**Tech Stack:** SvelteKit, TypeScript (strict), Vitest, better-sqlite3 + sqlite-vec, **chokidar** (new dep).

**Spec:** `docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md`

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/server/index-sources.ts` | Path→`{kind, refId, buildChunks}` registry + `resolveSource` | Create |
| `src/lib/server/index-sources.test.ts` | Table-driven mapping tests | Create |
| `src/lib/server/reconcile.ts` | `reindexFile(rel)` / `removeFile(rel)` | Create |
| `src/lib/server/reconcile.test.ts` | Reconcile behavior incl. mtime-skip | Create |
| `src/lib/server/watcher.ts` | chokidar wiring, manifest map, serial queue | Create |
| `src/lib/server/watcher.test.ts` | Watcher smoke + orphan prune | Create |
| `src/lib/server/embeddings.ts` | Add `listIndexedFiles(h)` | Modify |
| `src/lib/server/indexer.ts` | Add `indexListFiles()` wrapper | Modify |
| `src/lib/server/jobs.ts` | Strip `indexUpsert` calls | Modify |
| `src/lib/server/memory.ts` | Strip `indexUpsert`/`indexDelete` | Modify |
| `src/lib/server/memory_private.ts` | Strip `indexUpsert`/`indexDelete` | Modify |
| `src/lib/server/meetings.ts` | Strip `indexUpsert` calls | Modify |
| `src/lib/server/councillors.ts` | Strip `indexUpsert`/`indexDelete` | Modify |
| `src/lib/server/indexer.test.ts` | Drive indexing via `reindexFile` instead of write-hooks | Modify |
| `src/hooks.server.ts` | Start/stop watcher behind `LANDSRAAD_WATCH` | Modify |
| `SPECIFICATION.md` | Note the pull-based index | Modify |
| `package.json` | Add chokidar | Modify |

**Reference facts (verified):**
- Test harness pattern (from `indexer.test.ts`): set `env.LANDSRAAD_COUNCIL_ROOT = mkdtempSync(...)`, `setEmbedder(fakeEmbedder())`, `await createCouncil({ name })`; teardown `closeAll(); setEmbedder(null); rmSync(...)`.
- `councilRoot()`, `councillorsRoot()` exported from `paths.ts`.
- Sibling metadata filenames: `job.json`, `councillor.json` (+ `persona.md`), `meeting.json` (+ `topic.md`/`transcript.md`/`summary.md`/`synthesis.md`).
- `parseTranscript(text): ParsedTurn[]` exported from `meetings.ts` — `{turnIndex, speaker, at, body}`.
- Per-turn councillor rule (meetings.ts:160): `speaker === 'director' || speaker.includes(':') ? null : speaker`.
- `deleteByRef(h, kind, ref_id)` exported from `embeddings.ts`; `indexUpsert(args)` async, `indexDelete(kind, ref_id)` sync, `indexSearch(query, opts)` from `indexer.ts`.

---

## Task 1: Add chokidar dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install chokidar**

Run: `npm install chokidar@^3.6.0`
Expected: `package.json` `dependencies` gains `"chokidar": "^3.6.0"`; install succeeds.

- [ ] **Step 2: Verify type resolution**

Run: `npx tsc --noEmit -p tsconfig.json` (or `npm run check`)
Expected: no new errors (chokidar ships its own types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add chokidar for pull-based indexer"
```

---

## Task 2: `listIndexedFiles` query + indexer wrapper

**Files:**
- Modify: `src/lib/server/embeddings.ts`
- Modify: `src/lib/server/indexer.ts`
- Test: `src/lib/server/reconcile.test.ts` (created Task 4; the wrapper is exercised there)

- [ ] **Step 1: Add the query to `embeddings.ts`**

Add after `deleteByRef` (around embeddings.ts:250):

```ts
export interface IndexedFileRow {
  source_path: string;
  kind: ChunkKind;
  ref_id: string;
  source_mtime: string;
}

export function listIndexedFiles(h: IndexHandle): IndexedFileRow[] {
  return h.db
    .prepare('SELECT DISTINCT source_path, kind, ref_id, source_mtime FROM chunks')
    .all() as IndexedFileRow[];
}
```

- [ ] **Step 2: Add the wrapper to `indexer.ts`**

Update the import at indexer.ts:2 to include `listIndexedFiles` and the type:

```ts
import { closeIndex, deleteByRef, listIndexedFiles, openIndex, searchAsync, upsertChunkAsync } from './embeddings';
import type { IndexedFileRow, SearchHit, SearchOptions } from './embeddings';
```

Add this exported function at the end of `indexer.ts`:

```ts
export function indexListFiles(): IndexedFileRow[] {
  const h = get();
  if (!h) return [];
  try {
    return listIndexedFiles(h);
  } catch (err) {
    console.warn(`[indexer] listIndexedFiles failed:`, (err as Error).message);
    return [];
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/embeddings.ts src/lib/server/indexer.ts
git commit -m "feat(indexer): listIndexedFiles query + indexListFiles wrapper"
```

---

## Task 3: Source registry — whole-file kinds

**Files:**
- Create: `src/lib/server/index-sources.ts`
- Test: `src/lib/server/index-sources.test.ts`

- [ ] **Step 1: Write failing tests for whole-file sources**

Create `src/lib/server/index-sources.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSource } from './index-sources';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'landsraad-sources-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(rel: string, body: string): string {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body, 'utf8');
  return abs;
}

describe('resolveSource — whole-file kinds', () => {
  it('maps a shared memory note', () => {
    const rel = 'memory/capital-allocation.md';
    const abs = write(rel, '# Capital Allocation\n\nReserve runway.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory');
    expect(src.refId(rel)).toBe('capital-allocation');
    const [c] = src.buildChunks('# Capital Allocation\n\nReserve runway.', rel, abs);
    expect(c).toMatchObject({ chunk_idx: 0, title: 'Capital Allocation', councillor_slug: null });
  });

  it('maps a private memory note with councillor slug', () => {
    const rel = 'councillors/quant/memory/hedging.md';
    const abs = write(rel, '# Hedging\n\nbody');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory_private');
    expect(src.refId(rel)).toBe('quant/hedging');
    const [c] = src.buildChunks('# Hedging\n\nbody', rel, abs);
    expect(c).toMatchObject({ title: 'Hedging', councillor_slug: 'quant' });
  });

  it('maps a persona, title from sibling councillor.json', () => {
    write('councillors/quant/councillor.json', JSON.stringify({ name: 'Quant', slug: 'quant' }));
    const rel = 'councillors/quant/persona.md';
    const abs = write(rel, 'I am the quant.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('persona');
    expect(src.refId(rel)).toBe('quant');
    const [c] = src.buildChunks('I am the quant.', rel, abs);
    expect(c).toMatchObject({ title: 'Quant', councillor_slug: 'quant' });
  });

  it('maps job input/output/transcript from sibling job.json', () => {
    write('jobs/2026-job-x/job.json', JSON.stringify({ title: 'Job X', councillor_slug: 'quant' }));
    for (const [file, kind] of [
      ['input.md', 'job_input'],
      ['output.md', 'job_output'],
      ['transcript.md', 'transcript']
    ] as const) {
      const rel = `jobs/2026-job-x/${file}`;
      const abs = write(rel, 'content here');
      const src = resolveSource(rel)!;
      expect(src.kind).toBe(kind);
      expect(src.refId(rel)).toBe('2026-job-x');
      const [c] = src.buildChunks('content here', rel, abs);
      expect(c).toMatchObject({ title: 'Job X', councillor_slug: 'quant' });
    }
  });

  it('maps meeting topic/summary/synthesis from sibling meeting.json', () => {
    write('meetings/2026-m1/meeting.json', JSON.stringify({ title: 'M1', chair_slug: 'quant' }));
    const topic = resolveSource('meetings/2026-m1/topic.md')!;
    expect(topic.kind).toBe('meeting_topic');
    expect(topic.buildChunks('t', 'meetings/2026-m1/topic.md', join(root, 'meetings/2026-m1/topic.md'))[0])
      .toMatchObject({ title: 'M1', councillor_slug: null });
    const summary = resolveSource('meetings/2026-m1/summary.md')!;
    expect(summary.kind).toBe('meeting_summary');
    expect(summary.buildChunks('s', 'meetings/2026-m1/summary.md', join(root, 'meetings/2026-m1/summary.md'))[0])
      .toMatchObject({ title: 'M1 · summary', councillor_slug: 'quant' });
    const synth = resolveSource('meetings/2026-m1/synthesis.md')!;
    expect(synth.kind).toBe('meeting_synthesis');
    expect(synth.buildChunks('s', 'meetings/2026-m1/synthesis.md', join(root, 'meetings/2026-m1/synthesis.md'))[0])
      .toMatchObject({ title: 'M1 · synthesis', councillor_slug: 'quant' });
  });

  it('returns null for unclaimed paths', () => {
    expect(resolveSource('jobs/2026-job-x/job.json')).toBeNull();
    expect(resolveSource('jobs/2026-job-x/events.jsonl')).toBeNull();
    expect(resolveSource('.index/embeddings.db')).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npx vitest run src/lib/server/index-sources.test.ts`
Expected: FAIL — `Cannot find module './index-sources'`.

- [ ] **Step 3: Implement `index-sources.ts` (whole-file kinds)**

Create `src/lib/server/index-sources.ts`:

```ts
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { ChunkKind } from './embeddings';
import { parseTranscript } from './meetings';

export interface IndexChunk {
  chunk_idx: number;
  text: string;
  title: string | null;
  councillor_slug: string | null;
}

export interface IndexSource {
  kind: ChunkKind;
  test(rel: string): boolean;
  refId(rel: string): string;
  buildChunks(text: string, rel: string, absPath: string): IndexChunk[];
}

function norm(rel: string): string {
  return rel.replace(/\\/g, '/');
}

function firstHeading(body: string, fallback: string): string {
  const line = body.split('\n').find((l) => l.trim()) ?? '';
  const h = line.replace(/^#+\s*/, '').trim();
  return h || fallback;
}

function readJson(absPath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(absPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sibling(absPath: string, name: string): string {
  return join(dirname(absPath), name);
}

function jobSource(file: string, kind: ChunkKind): IndexSource {
  return {
    kind,
    test: (rel) => new RegExp(`^jobs/[^/]+/${file}$`).test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, _rel, abs) => {
      const job = readJson(sibling(abs, 'job.json'));
      return [
        {
          chunk_idx: 0,
          text,
          title: (job?.title as string) ?? null,
          councillor_slug: (job?.councillor_slug as string) ?? null
        }
      ];
    }
  };
}

function meetingWholeSource(file: string, kind: ChunkKind, titleSuffix: string, useChair: boolean): IndexSource {
  return {
    kind,
    test: (rel) => new RegExp(`^meetings/[^/]+/${file}$`).test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, _rel, abs) => {
      const m = readJson(sibling(abs, 'meeting.json'));
      const title = (m?.title as string) ?? norm(_rel).split('/')[1];
      return [
        {
          chunk_idx: 0,
          text,
          title: titleSuffix ? `${title}${titleSuffix}` : title,
          councillor_slug: useChair ? ((m?.chair_slug as string) ?? null) : null
        }
      ];
    }
  };
}

const SOURCES: IndexSource[] = [
  {
    kind: 'memory',
    test: (rel) => /^memory\/[^/]+\.md$/.test(norm(rel)),
    refId: (rel) => basename(norm(rel), '.md'),
    buildChunks: (text, rel) => [
      { chunk_idx: 0, text, title: firstHeading(text, basename(norm(rel), '.md')), councillor_slug: null }
    ]
  },
  {
    kind: 'memory_private',
    test: (rel) => /^councillors\/[^/]+\/memory\/[^/]+\.md$/.test(norm(rel)),
    refId: (rel) => {
      const p = norm(rel).split('/');
      return `${p[1]}/${basename(p[3], '.md')}`;
    },
    buildChunks: (text, rel) => {
      const p = norm(rel).split('/');
      return [{ chunk_idx: 0, text, title: firstHeading(text, basename(p[3], '.md')), councillor_slug: p[1] }];
    }
  },
  {
    kind: 'persona',
    test: (rel) => /^councillors\/[^/]+\/persona\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const slug = norm(rel).split('/')[1];
      const meta = readJson(sibling(abs, 'councillor.json'));
      return [{ chunk_idx: 0, text, title: (meta?.name as string) ?? slug, councillor_slug: slug }];
    }
  },
  jobSource('input\\.md', 'job_input'),
  jobSource('output\\.md', 'job_output'),
  jobSource('transcript\\.md', 'transcript'),
  meetingWholeSource('topic\\.md', 'meeting_topic', '', false),
  meetingWholeSource('summary\\.md', 'meeting_summary', ' · summary', true),
  meetingWholeSource('synthesis\\.md', 'meeting_synthesis', ' · synthesis', true)
  // meeting transcript (multi-chunk) added in Task 4
];

export function resolveSource(rel: string): IndexSource | null {
  const n = norm(rel);
  return SOURCES.find((s) => s.test(n)) ?? null;
}

export const __sourcesForTest = SOURCES;
export { parseTranscript };
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/lib/server/index-sources.test.ts`
Expected: PASS (the meeting-transcript multi-chunk case is added in Task 4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/index-sources.ts src/lib/server/index-sources.test.ts
git commit -m "feat(indexer): path->kind source registry for whole-file kinds"
```

---

## Task 4: Source registry — meeting transcript (multi-chunk)

**Files:**
- Modify: `src/lib/server/index-sources.ts`
- Modify: `src/lib/server/index-sources.test.ts`

- [ ] **Step 1: Add failing test for per-turn chunks**

Append to `src/lib/server/index-sources.test.ts` inside the `describe`:

```ts
it('maps a meeting transcript into one chunk per turn', () => {
  write('meetings/2026-m1/meeting.json', JSON.stringify({ title: 'M1', chair_slug: 'quant' }));
  const body =
    '\n## Turn 1 — quant — 2026-06-02T00:00:00Z\n\nHello from quant.\n' +
    '\n## Turn 2 — director — 2026-06-02T00:01:00Z\n\nDirector speaks.\n';
  const rel = 'meetings/2026-m1/transcript.md';
  const abs = write(rel, body);
  const src = resolveSource(rel)!;
  expect(src.kind).toBe('meeting_turn');
  expect(src.refId(rel)).toBe('2026-m1');
  const chunks = src.buildChunks(body, rel, abs);
  expect(chunks).toHaveLength(2);
  expect(chunks[0]).toMatchObject({ chunk_idx: 1, councillor_slug: 'quant', text: 'Hello from quant.' });
  expect(chunks[0].title).toBe('M1 · turn 1 · quant');
  expect(chunks[1]).toMatchObject({ chunk_idx: 2, councillor_slug: null });
  expect(chunks[1].title).toBe('M1 · turn 2 · director');
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npx vitest run src/lib/server/index-sources.test.ts`
Expected: FAIL — transcript currently resolves to no source (returns null) → `Cannot read properties of null`.

- [ ] **Step 3: Add the meeting-transcript source**

In `src/lib/server/index-sources.ts`, insert this entry into `SOURCES` immediately before `meetingWholeSource('topic\\.md', ...)`:

```ts
  {
    kind: 'meeting_turn',
    test: (rel) => /^meetings\/[^/]+\/transcript\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const m = readJson(sibling(abs, 'meeting.json'));
      const title = (m?.title as string) ?? norm(rel).split('/')[1];
      return parseTranscript(text).map((t) => ({
        chunk_idx: t.turnIndex,
        text: t.body,
        title: `${title} · turn ${t.turnIndex} · ${t.speaker}`,
        councillor_slug: t.speaker === 'director' || t.speaker.includes(':') ? null : t.speaker
      }));
    }
  },
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/lib/server/index-sources.test.ts`
Expected: PASS (all cases incl. multi-turn).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/index-sources.ts src/lib/server/index-sources.test.ts
git commit -m "feat(indexer): semantic per-turn chunking for meeting transcripts"
```

---

## Task 5: Reconcile module

**Files:**
- Create: `src/lib/server/reconcile.ts`
- Test: `src/lib/server/reconcile.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/server/reconcile.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { createHash } from 'node:crypto';

import { createCouncil } from './councils';
import type { Embedder } from './embeddings';
import { closeAll, indexSearch, indexListFiles, setEmbedder } from './indexer';
import { reindexFile, removeFile } from './reconcile';

const DIM = 384;
const embedSpy = vi.fn();

function fakeEmbedder(): Embedder {
  return {
    dim: DIM,
    embed(texts) {
      embedSpy();
      return texts.map((text) => {
        const v = new Float32Array(DIM);
        for (const t of text.toLowerCase().split(/\s+/).filter(Boolean)) {
          const h = createHash('sha1').update(t).digest();
          v[h.readUInt16BE(0) % DIM] += 1;
        }
        let n = 0;
        for (let i = 0; i < DIM; i++) n += v[i] * v[i];
        n = Math.sqrt(n) || 1;
        for (let i = 0; i < DIM; i++) v[i] /= n;
        return v;
      });
    }
  };
}

let root: string;
let prev: string | undefined;

beforeEach(async () => {
  prev = env.LANDSRAAD_COUNCIL_ROOT;
  root = mkdtempSync(join(tmpdir(), 'landsraad-reconcile-'));
  env.LANDSRAAD_COUNCIL_ROOT = root;
  setEmbedder(fakeEmbedder());
  await createCouncil({ name: 'Reconcile Test' });
  embedSpy.mockClear();
});

afterEach(() => {
  closeAll();
  setEmbedder(null);
  rmSync(root, { recursive: true, force: true });
  if (prev === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prev;
});

function write(rel: string, body: string): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body, 'utf8');
}

describe('reconcile', () => {
  it('reindexFile makes a memory note searchable', async () => {
    write('memory/runway.md', '# Runway\n\nReserve thirty percent unique-token.');
    await reindexFile('memory/runway.md');
    const hits = await indexSearch('unique-token reserve');
    expect(hits[0].kind).toBe('memory');
    expect(hits[0].ref_id).toBe('runway');
  });

  it('removeFile deletes the chunks', async () => {
    write('memory/doomed.md', '# Doomed\n\nunique-token-doomed body');
    await reindexFile('memory/doomed.md');
    expect((await indexSearch('unique-token-doomed')).length).toBe(1);
    removeFile('memory/doomed.md');
    expect(await indexSearch('unique-token-doomed')).toEqual([]);
  });

  it('reindexFile re-embeds changed content and drops old text', async () => {
    write('memory/doc.md', '# Doc\n\nfirst draft pancakes');
    await reindexFile('memory/doc.md');
    write('memory/doc.md', '# Doc\n\nsecond draft waffles');
    await reindexFile('memory/doc.md');
    const hits = await indexSearch('waffles');
    expect(hits[0].text).toContain('waffles');
    expect(hits[0].text).not.toContain('pancakes');
  });

  it('records source_mtime equal to the file mtime', async () => {
    write('memory/stamp.md', '# Stamp\n\nbody');
    await reindexFile('memory/stamp.md');
    const { statSync } = await import('node:fs');
    const mtime = statSync(join(root, 'memory/stamp.md')).mtime.toISOString();
    const row = indexListFiles().find((r) => r.ref_id === 'stamp');
    expect(row?.source_mtime).toBe(mtime);
  });

  it('reindexFile on a missing file removes existing chunks', async () => {
    write('memory/gone.md', '# Gone\n\nunique-gone body');
    await reindexFile('memory/gone.md');
    rmSync(join(root, 'memory/gone.md'));
    await reindexFile('memory/gone.md');
    expect(await indexSearch('unique-gone')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npx vitest run src/lib/server/reconcile.test.ts`
Expected: FAIL — `Cannot find module './reconcile'`.

- [ ] **Step 3: Implement `reconcile.ts`**

Create `src/lib/server/reconcile.ts`:

```ts
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSource } from './index-sources';
import { indexDelete, indexUpsert } from './indexer';
import { councilRoot } from './paths';

export async function reindexFile(rel: string): Promise<void> {
  const src = resolveSource(rel);
  if (!src) return;
  const refId = src.refId(rel);
  const abs = join(councilRoot(), rel);

  let text: string;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    indexDelete(src.kind, refId);
    return;
  }

  indexDelete(src.kind, refId);
  if (!text.trim()) return;

  const mtime = statSync(abs).mtime.toISOString();
  const chunks = src.buildChunks(text, rel, abs);
  for (const c of chunks) {
    await indexUpsert({
      kind: src.kind,
      ref_id: refId,
      chunk_idx: c.chunk_idx,
      text: c.text,
      source_path: abs,
      source_mtime: mtime,
      title: c.title,
      councillor_slug: c.councillor_slug
    });
  }
}

export function removeFile(rel: string): void {
  const src = resolveSource(rel);
  if (!src) return;
  indexDelete(src.kind, src.refId(rel));
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/lib/server/reconcile.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/reconcile.ts src/lib/server/reconcile.test.ts
git commit -m "feat(indexer): reconcile module (reindexFile/removeFile)"
```

---

## Task 6: Watcher

**Files:**
- Create: `src/lib/server/watcher.ts`
- Test: `src/lib/server/watcher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/server/watcher.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { createHash } from 'node:crypto';

import { createCouncil } from './councils';
import type { Embedder } from './embeddings';
import { closeAll, indexSearch, setEmbedder } from './indexer';
import { reindexFile } from './reconcile';
import { startIndexWatcher, stopIndexWatcher } from './watcher';

const DIM = 384;
function fakeEmbedder(): Embedder {
  return {
    dim: DIM,
    embed(texts) {
      return texts.map((text) => {
        const v = new Float32Array(DIM);
        for (const t of text.toLowerCase().split(/\s+/).filter(Boolean)) {
          const h = createHash('sha1').update(t).digest();
          v[h.readUInt16BE(0) % DIM] += 1;
        }
        let n = 0;
        for (let i = 0; i < DIM; i++) n += v[i] * v[i];
        n = Math.sqrt(n) || 1;
        for (let i = 0; i < DIM; i++) v[i] /= n;
        return v;
      });
    }
  };
}

let root: string;
let prev: string | undefined;

beforeEach(async () => {
  prev = env.LANDSRAAD_COUNCIL_ROOT;
  root = mkdtempSync(join(tmpdir(), 'landsraad-watcher-'));
  env.LANDSRAAD_COUNCIL_ROOT = root;
  setEmbedder(fakeEmbedder());
  await createCouncil({ name: 'Watcher Test' });
});

afterEach(async () => {
  await stopIndexWatcher();
  closeAll();
  setEmbedder(null);
  rmSync(root, { recursive: true, force: true });
  if (prev === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prev;
});

function write(rel: string, body: string): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body, 'utf8');
}

function waitUntil(fn: () => Promise<boolean>, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = async () => {
      if (await fn()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

describe('index watcher', () => {
  it('indexes a file created after the watcher starts', async () => {
    startIndexWatcher(root);
    write('memory/live.md', '# Live\n\nunique-live indexed by watcher');
    await waitUntil(async () => (await indexSearch('unique-live')).length > 0);
    expect((await indexSearch('unique-live'))[0].ref_id).toBe('live');
  });

  it('removes a file on unlink', async () => {
    write('memory/temp.md', '# Temp\n\nunique-temp body');
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-temp')).length > 0);
    unlinkSync(join(root, 'memory/temp.md'));
    await waitUntil(async () => (await indexSearch('unique-temp')).length === 0);
    expect(await indexSearch('unique-temp')).toEqual([]);
  });

  it('prunes orphan chunks for files deleted while stopped', async () => {
    write('memory/orphan.md', '# Orphan\n\nunique-orphan body');
    await reindexFile('memory/orphan.md');
    expect((await indexSearch('unique-orphan')).length).toBe(1);
    // delete the file while no watcher is running, then start
    unlinkSync(join(root, 'memory/orphan.md'));
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-orphan')).length === 0);
    expect(await indexSearch('unique-orphan')).toEqual([]);
  });

  it('no-ops when no embedder is set', async () => {
    setEmbedder(null);
    expect(startIndexWatcher(root)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npx vitest run src/lib/server/watcher.test.ts`
Expected: FAIL — `Cannot find module './watcher'`.

- [ ] **Step 3: Implement `watcher.ts`**

Create `src/lib/server/watcher.ts`:

```ts
import { statSync } from 'node:fs';
import { relative } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { councilRoot } from './paths';
import { hasEmbedder, indexListFiles } from './indexer';
import { reindexFile, removeFile } from './reconcile';

let watcher: FSWatcher | null = null;

function rel(root: string, abs: string): string {
  return relative(root, abs).replace(/\\/g, '/');
}

export function startIndexWatcher(root: string = councilRoot()): FSWatcher | null {
  if (!hasEmbedder()) return null;
  if (watcher) return watcher;

  // manifest: normalized-rel -> source_mtime, for startup skip + orphan prune
  const manifest = new Map<string, string>();
  for (const row of indexListFiles()) {
    manifest.set(rel(root, row.source_path), row.source_mtime);
  }
  const seen = new Set<string>();

  const queue: string[] = [];
  let processing = false;
  async function drain(): Promise<void> {
    if (processing) return;
    processing = true;
    while (queue.length) {
      const r = queue.shift() as string;
      try {
        await reindexFile(r);
      } catch (err) {
        console.warn(`[indexer] watch reindex ${r} failed:`, (err as Error).message);
      }
    }
    processing = false;
  }
  function enqueue(r: string): void {
    if (!queue.includes(r)) queue.push(r);
    void drain();
  }

  function onUpsert(abs: string): void {
    const r = rel(root, abs);
    seen.add(r);
    const known = manifest.get(r);
    if (known) {
      try {
        if (statSync(abs).mtime.toISOString() === known) return; // unchanged → skip
      } catch {
        // fall through to reindex
      }
    }
    enqueue(r);
  }

  watcher = chokidar.watch(root, {
    ignored: ['**/.index/**', '**/node_modules/**', '**/.git/**', /(^|[/\\])\../],
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  });

  watcher
    .on('add', onUpsert)
    .on('change', onUpsert)
    .on('unlink', (abs) => removeFile(rel(root, abs)))
    .on('ready', () => {
      for (const [r] of manifest) {
        if (!seen.has(r)) removeFile(r);
      }
    });

  return watcher;
}

export async function stopIndexWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/lib/server/watcher.test.ts`
Expected: PASS (4 tests). If the orphan-prune test is flaky because `ready` fires before the manifest comparison, increase the `waitUntil` timeout; the prune runs once on `ready`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/watcher.ts src/lib/server/watcher.test.ts
git commit -m "feat(indexer): chokidar watcher with manifest skip + orphan prune"
```

---

## Task 7: Wire the watcher into server startup

**Files:**
- Modify: `src/hooks.server.ts`

- [ ] **Step 1: Import watcher functions**

Update the imports at the top of `src/hooks.server.ts` (after the existing `setEmbedder` import):

```ts
import { setEmbedder } from '$lib/server/indexer';
import { startIndexWatcher, stopIndexWatcher } from '$lib/server/watcher';
```

- [ ] **Step 2: Start the watcher after the embedder is ready**

Replace the embedder block (hooks.server.ts:16-23) with:

```ts
if (env.LANDSRAAD_EMBED !== '0') {
  try {
    setEmbedder(xenovaEmbedder());
    console.log('[landsraad] embedder ready (Xenova/all-MiniLM-L6-v2)');
  } catch (err) {
    console.warn('[landsraad] embedder init failed; search disabled:', (err as Error).message);
  }

  if (env.LANDSRAAD_WATCH !== '0') {
    try {
      startIndexWatcher();
      console.log('[landsraad] index watcher started');
    } catch (err) {
      console.warn('[landsraad] index watcher failed:', (err as Error).message);
    }
  }
}
```

- [ ] **Step 3: Stop the watcher on shutdown**

In the scheduler signal-handler block (hooks.server.ts:29-33), add `stopIndexWatcher()` alongside `stopScheduler()`:

```ts
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.once(sig, () => {
      stopScheduler();
      void stopIndexWatcher();
    });
  }
```

If `LANDSRAAD_SCHEDULER=0` disables that block, also register a standalone handler. Add this immediately after the scheduler block:

```ts
if (env.LANDSRAAD_SCHEDULER === '0') {
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.once(sig, () => void stopIndexWatcher());
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks.server.ts
git commit -m "feat(indexer): start/stop index watcher in server hooks (LANDSRAAD_WATCH)"
```

---

## Task 8: Strip write-time indexing from writers

The index is now derived by the watcher. Remove every `indexUpsert`/`indexDelete` call and now-unused imports from the writers, and migrate `indexer.test.ts` to drive indexing through `reindexFile`.

**Files:**
- Modify: `src/lib/server/jobs.ts`, `memory.ts`, `memory_private.ts`, `meetings.ts`, `councillors.ts`
- Modify: `src/lib/server/indexer.test.ts`

- [ ] **Step 1: Migrate `indexer.test.ts` first (red)**

Rewrite `src/lib/server/indexer.test.ts` so each case writes via the existing writer, then calls `reindexFile(rel)` before asserting. Replace the file body's `describe` block with:

```ts
import { reindexFile } from './reconcile';

// ... keep the existing imports, fakeEmbedder, beforeEach/afterEach ...

describe('indexer via reconcile', () => {
  it('indexes a memory note', async () => {
    await createNote({ title: 'Capital Allocation', body: 'Reserve 30% runway.' });
    await reindexFile('memory/capital-allocation.md');
    const hits = await indexSearch('runway reserve');
    expect(hits[0].kind).toBe('memory');
    expect(hits[0].ref_id).toBe('capital-allocation');
  });

  it('re-indexes on update', async () => {
    await createNote({ title: 'Doc', body: 'first draft about pancakes' });
    await reindexFile('memory/doc.md');
    await updateNote('doc', '# Doc\n\nsecond draft about waffles');
    await reindexFile('memory/doc.md');
    const hits = await indexSearch('waffles');
    expect(hits[0]?.text).toContain('waffles');
    expect(hits[0]?.text).not.toContain('pancakes');
  });

  it('removes from index on delete', async () => {
    await createNote({ title: 'Doomed', body: 'unique-tk delete-me-soon' });
    await reindexFile('memory/doomed.md');
    expect((await indexSearch('unique-tk delete-me-soon')).length).toBe(1);
    await deleteNote('doomed');
    await reindexFile('memory/doomed.md'); // file gone → chunks removed
    expect(await indexSearch('unique-tk delete-me-soon')).toEqual([]);
  });

  it('indexes job input, transcript, output', async () => {
    await createCouncillor({ name: 'Mocky', role: 'tester', adapter: 'mock:local' });
    const job = await createJob({ title: 'Test Job', brief: 'do the thing', councillor_slug: 'mocky' });
    await writeInput(job.id, 'Please analyze quarterly revenue trends.');
    await appendTranscript(job.id, '\n## Turn 1 — mocky — 2026-06-02T00:00:00Z\n\nQ3 revenue up 12%.\n');
    await writeOutput(job.id, 'Final: Q3 revenue up 12% YoY, driven by enterprise.');
    await reindexFile(`jobs/${job.id}/input.md`);
    await reindexFile(`jobs/${job.id}/output.md`);
    const out = await indexSearch('quarterly revenue enterprise');
    const outHit = out.find((h) => h.kind === 'job_output');
    expect(outHit?.councillor_slug).toBe('mocky');
    expect(outHit?.title).toBe('Test Job');
  });

  it('indexes and removes a councillor persona', async () => {
    await createCouncillor({
      name: 'Polly',
      role: 'oracle',
      adapter: 'mock:local',
      persona: 'I am Polly, a uniquely-tokened oracle for risk forecasts.'
    });
    await reindexFile('councillors/polly/persona.md');
    const hits = await indexSearch('uniquely-tokened oracle risk forecasts');
    expect(hits[0]?.kind).toBe('persona');
    expect(hits[0]?.councillor_slug).toBe('polly');
    await deleteCouncillor('polly');
    await reindexFile('councillors/polly/persona.md');
    expect(await indexSearch('uniquely-tokened oracle risk forecasts')).toEqual([]);
  });

  it('updates persona index on update', async () => {
    await createCouncillor({
      name: 'Mutable',
      role: 'changeling',
      adapter: 'mock:local',
      persona: 'before-shape tokens-alpha'
    });
    await reindexFile('councillors/mutable/persona.md');
    await updateCouncillor('mutable', { persona: 'after-shape tokens-beta' });
    await reindexFile('councillors/mutable/persona.md');
    const hits = await indexSearch('after-shape tokens-beta');
    expect(hits[0].text).toContain('after-shape');
    expect(hits[0].text).not.toContain('before-shape');
  });
});
```

Run: `npx vitest run src/lib/server/indexer.test.ts`
Expected: PASS already (writers still index AND reindexFile re-derives — both paths agree). This proves the reconcile path covers every kind before we remove the writer path.

- [ ] **Step 2: Strip `jobs.ts`**

In `src/lib/server/jobs.ts`: delete the `import { indexUpsert } from './indexer';` line (jobs.ts:7) and remove the `await indexUpsert({...})` blocks inside `writeInput` (jobs.ts:101-109), `writeOutput` (jobs.ts:130-138), and the transcript re-index block in `writeOutput` (jobs.ts:139-151). `writeInput`/`writeOutput` keep only their `writeFile` calls.

- [ ] **Step 3: Strip `memory.ts`**

In `src/lib/server/memory.ts`: delete `import { indexDelete, indexUpsert } from './indexer';` (memory.ts:7) and remove the `await indexUpsert({...})` blocks in `createSharedNoteAutoSuffix`, `createNote`, `updateNote`, and the `indexDelete('memory', slug);` line in `deleteNote`. Each function keeps its `writeFile`/`rm` + `readNote` return.

- [ ] **Step 4: Strip `memory_private.ts`**

In `src/lib/server/memory_private.ts`: delete the `indexUpsert`/`indexDelete` import and remove the `await indexUpsert({...})` blocks in `createPrivateNote`, `updatePrivateNote`, and the `indexDelete('memory_private', ...)` call in `deletePrivateNote`.

- [ ] **Step 5: Strip `meetings.ts`**

In `src/lib/server/meetings.ts`: delete the `indexUpsert` import and remove the `await indexUpsert({...})` blocks in `createMeeting` (meeting_topic), `appendTranscriptBlock` (meeting_turn), `writeSummary` (meeting_summary), and `writeSynthesis` (meeting_synthesis). Keep all `writeFile`/`appendFile`/`readMeeting` logic.

- [ ] **Step 6: Strip `councillors.ts`**

In `src/lib/server/councillors.ts`: delete the `indexUpsert`/`indexDelete` import and remove the `await indexUpsert({...})` blocks in `createCouncillor` and `updateCouncillor`, plus any `indexDelete('persona', ...)` in `deleteCouncillor`.

- [ ] **Step 7: Update affected writer tests**

Search for index assertions in writer test files and remove only those assertions (keep the file-writing assertions):

Run: `git grep -n "indexSearch\|indexUpsert\|indexDelete" src/lib/server/*.test.ts`

For each hit **outside** `indexer.test.ts`, `reconcile.test.ts`, `watcher.test.ts`, `context.test.ts`, and `embeddings.test.ts`, delete the assertion lines that expect write-time indexing (these now belong to the reconcile/watcher tests). Do not delete tests that assert file contents or return values.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS. `indexer.test.ts` still passes because `reindexFile` now does the indexing; writers no longer double-index.

- [ ] **Step 9: Type-check**

Run: `npm run check`
Expected: no unused-import or type errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/server/jobs.ts src/lib/server/memory.ts src/lib/server/memory_private.ts \
  src/lib/server/meetings.ts src/lib/server/councillors.ts src/lib/server/indexer.test.ts \
  src/lib/server/*.test.ts
git commit -m "refactor(indexer): pure pull — writers no longer touch the index"
```

---

## Task 9: Docs — SPECIFICATION.md note

**Files:**
- Modify: `SPECIFICATION.md`

- [ ] **Step 1: Add a short section**

Find the section describing the semantic index / memory retrieval in `SPECIFICATION.md` and add (or append a subsection):

```markdown
### Indexing model

The semantic index is **pull-based**: the filesystem under the council root is the
single source of truth. Writers only write files; they never call the indexer. A
chokidar watcher (`src/lib/server/watcher.ts`) re-derives index chunks from a
path→kind source registry (`src/lib/server/index-sources.ts`) on add/change/unlink.

- On startup the watcher loads a manifest (`source_path → source_mtime`) and skips
  files whose mtime is unchanged; files indexed for paths that no longer exist are
  pruned (orphan sweep on `ready`).
- Moving a finished job's `output.md` into `councillors/<slug>/memory/` therefore
  re-kinds it as private memory automatically.
- Set `LANDSRAAD_WATCH=0` to disable the watcher (e.g. to avoid two processes
  writing the same `.index/` in development).
```

- [ ] **Step 2: Commit**

```bash
git add SPECIFICATION.md
git commit -m "docs(spec): describe pull-based indexing model"
```

---

## Final verification

- [ ] **Run the whole test suite**

Run: `npm test`
Expected: all green.

- [ ] **Type-check**

Run: `npm run check`
Expected: no errors.

- [ ] **Manual smoke (optional but recommended)**

Run: `npm run dev`, create a memory note in the UI, then search for it. Confirm it
appears (watcher indexed it). Delete it, confirm it drops from search. Stop the dev
server cleanly (Ctrl-C) and confirm no unhandled errors from the watcher shutdown.

---

## Notes for the implementer

- **Windows paths:** chokidar emits OS-native paths; `index-sources` normalizes via
  `replace(/\\/g, '/')`, and the watcher keys its manifest/seen sets on normalized
  relative paths. Don't compare absolute path strings directly.
- **`source_mtime` is now the file's fs mtime** for every kind — the old ad-hoc
  values (`block.at`, `new Date()`) are gone. Reconcile depends on this.
- **Latency:** chokidar → searchable is a few hundred ms (awaitWriteFinish) + embed
  time. If a future feature needs a just-written file visible synchronously to the
  very next operation, call `await reindexFile(rel)` at that seam explicitly — do not
  reintroduce blanket write-time indexing.
- **Do not** add a global "last indexed at" watermark — per-file `source_mtime` +
  the manifest map is the agreed approach (correct under old-mtime restores and
  deletions, which a global watermark is not).
```
