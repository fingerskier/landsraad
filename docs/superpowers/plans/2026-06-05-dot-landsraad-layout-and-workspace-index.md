# `.landsraad/` layout + workspace indexing — Implementation Plan

> **For agentic workers:** red/green TDD, task-by-task. Steps use checkbox
> (`- [ ]`) syntax. Run `npm test` / `npm run check` at the marked gates.

**Goal:** (1) Relocate every council artifact under `<cwd>/.landsraad/` so the
council (the machine) is cleanly separated from the working directory (the
product); (2) extend the semantic index to cover the product tree's prose
(`.md`/`.txt`), respecting `.gitignore`, while always indexing `.landsraad/`.

**Design:** `docs/superpowers/specs/2026-06-05-dot-landsraad-layout-and-workspace-index-design.md`

**Tech stack:** SvelteKit, TypeScript (strict), Vitest, chokidar (existing),
`ignore` (new, Phase 2).

**Key invariants preserved:** one council per directory; `councilRoot()` = cwd
(and the adapter cwd); the app never writes outside `councilRoot()`; the index is
pull-based (writers never touch it).

---

## File structure

| File | Responsibility | Phase | Action |
|---|---|---|---|
| `src/lib/server/paths.ts` | `councilDataRoot()` + re-root data helpers | 1 | Modify |
| `src/lib/server/paths.test.ts` | Layout assertions | 1 | Create |
| `src/lib/server/index-sources.ts` | Peel `.landsraad/`; project source | 1,2 | Modify |
| `src/lib/server/watcher.ts` | Function-based ignore; gitignore+allowlist | 1,2 | Modify |
| `src/lib/server/councils.ts` | `deleteCouncilData` → `rm(dataRoot)` | 1 | Modify |
| `scripts/reset.ts` | Printed text | 1 | Modify |
| `.gitignore` (repo) | Collapse anchored block to `/.landsraad/` | 1 | Modify |
| `SPECIFICATION.md`, `docs/*.md` | Storage + indexing model | 1,2 | Modify |
| `src/lib/server/embeddings.ts` | `ChunkKind += 'project_file'` | 2 | Modify |
| `src/lib/server/gitignore.ts` | Root `.gitignore` matcher | 2 | Create |
| `src/lib/server/reconcile.ts` | Oversize-file skip | 2 | Modify |
| `src/lib/server/context.ts` | Third retrieval bucket | 2 | Modify |
| `src/lib/server/config.ts` | `PROJECT_TOPK`, `INDEX_MAX_FILE_BYTES` | 2 | Modify |
| `package.json` | Add `ignore` | 2 | Modify |
| `README.md` | Env vars + dev-council note | 2 | Modify |

**Reference facts (verified against the tree):**
- All data paths derive from `councilRoot()` in `paths.ts`; no `readdir(councilRoot())` elsewhere in `src/`.
- Index `rel` is `relative(councilRoot(), abs)` in `watcher.ts:10` and `reconcile.ts:11`.
- `resolveSource(rel)` is the single dispatch in `index-sources.ts`; reconcile passes the **full** rel to `refId`/`buildChunks` and builds `abs = join(councilRoot(), rel)`.
- Current watcher ignore: `['**/.index/**', '**/node_modules/**', '**/.git/**', /(^|[/\\])\../]` — the last entry would swallow `.landsraad/`.
- `deleteCouncilData` (councils.ts:69) enumerates `['council.json','councillors','memory','jobs','.index','proposals','schedules']` — already omits `meetings/`, `oeuvres/`, `meetings-incoming.jsonl`.
- Test harness pattern: `env.LANDSRAAD_COUNCIL_ROOT = mkdtempSync(...)`, `setEmbedder(fakeEmbedder())`, `await createCouncil({ name })`; teardown `closeAll(); setEmbedder(null); rmSync(...)`.

---

# PHASE 1 — Relocate into `.landsraad/`

## Task 1: `councilDataRoot()` + re-rooted path helpers

**Files:** Modify `src/lib/server/paths.ts`; Create `src/lib/server/paths.test.ts`

- [ ] **Step 1: Failing test.** Create `paths.test.ts` asserting (with
  `LANDSRAAD_COUNCIL_ROOT` set to a temp dir):
  - `councilDataRoot()` === `join(councilRoot(), '.landsraad')`
  - `councilFile()`, `councillorsRoot()`, `memoryDir()`, `jobsDir()`,
    `indexDirPath()`, `proposalsDir()`, `schedulesDir()`, `meetingsDir()`,
    `meetingsIncomingFile()`, `oeuvresDir()` all start with `councilDataRoot()`
  - `councilEnvFile()` === `join(councilRoot(), '.env')` (stays at root)

  Run `npx vitest run src/lib/server/paths.test.ts` → FAIL (`councilDataRoot` undefined).

- [ ] **Step 2: Implement.** In `paths.ts` add:

  ```ts
  export function councilDataRoot(): string {
    return join(councilRoot(), '.landsraad');
  }
  ```

  Repoint each data helper from `join(councilRoot(), …)` to
  `join(councilDataRoot(), …)`: `councilFile`, `councillorsRoot`, `memoryDir`,
  `jobsDir`, `indexDirPath`, `proposalsDir`, `schedulesDir`, `meetingsDir`,
  `meetingsIncomingFile`, `oeuvresDir`. **Do not touch** `councilEnvFile` (root
  `.env`). `slugify`/`*IdFor` are unchanged.

  Run the test → PASS. Then `npm run check` → no errors.

- [ ] **Step 3: Commit** — `feat(layout): nest council data under .landsraad/ via councilDataRoot()`

## Task 2: Peel `.landsraad/` in the source registry

**Files:** Modify `src/lib/server/index-sources.ts` + `index-sources.test.ts`

- [ ] **Step 1: Failing test.** Update the existing cases to prefix rels with
  `.landsraad/` and assert the same kinds/refIds, e.g.:

  ```ts
  const src = resolveSource('.landsraad/memory/capital-allocation.md')!;
  expect(src.kind).toBe('memory');
  expect(src.refId('.landsraad/memory/capital-allocation.md')).toBe('capital-allocation');
  ```

  Add: `expect(resolveSource('memory/capital-allocation.md')).toBeNull();`
  (a bare product path is not machine memory in Phase 1). Run → FAIL.

- [ ] **Step 2: Implement the peel.** Keep `SOURCES` (now `STRUCTURED`)
  unchanged. Add a `stripPrefix` wrapper and gate `resolveSource`:

  ```ts
  const DATA_PREFIX = '.landsraad/';
  function strip(rel: string): string { return norm(rel).slice(DATA_PREFIX.length); }
  function stripPrefix(src: IndexSource): IndexSource {
    return {
      kind: src.kind,
      test: (rel) => src.test(strip(rel)),
      refId: (rel) => src.refId(strip(rel)),
      buildChunks: (text, rel, abs) => src.buildChunks(text, strip(rel), abs)
    };
  }
  export function resolveSource(rel: string): IndexSource | null {
    const n = norm(rel);
    if (n.startsWith(DATA_PREFIX)) {
      const inner = n.slice(DATA_PREFIX.length);
      const src = STRUCTURED.find((s) => s.test(inner));
      return src ? stripPrefix(src) : null;
    }
    return null; // Phase 2 fills this branch with the project source
  }
  ```

  Run → PASS. `__sourcesForTest` stays exported (now `STRUCTURED`).

- [ ] **Step 3: Commit** — `feat(indexer): resolve .landsraad/-prefixed paths via prefix peel`

## Task 3: Function-based watcher ignore (index only `.landsraad/`)

**Files:** Modify `src/lib/server/watcher.ts` + `watcher.test.ts`

- [ ] **Step 1: Failing test.** Assert: a note at `.landsraad/memory/live.md`
  becomes searchable; a file at the **root** (`memory/stray.md` and `notes.md`)
  does **not** get indexed; `.landsraad/.index/**` is never indexed. Run → FAIL
  (current ignore regex drops `.landsraad/`).

- [ ] **Step 2: Implement.** Replace the `ignored: [...]` array with a function:

  ```ts
  import { relative } from 'node:path';
  function makeIgnored(root: string) {
    return (abs: string): boolean => {
      const r = relative(root, abs).replace(/\\/g, '/');
      if (r === '') return false;
      const parts = r.split('/');
      if (parts.includes('node_modules')) return true;
      // Phase 1: only the data root is indexed
      if (r !== '.landsraad' && !r.startsWith('.landsraad/')) return true;
      // inside .landsraad: skip dot-children (.index, stray dotfiles)
      if (parts.slice(1).some((p) => p.startsWith('.'))) return true;
      return false;
    };
  }
  // chokidar.watch(root, { ignored: makeIgnored(root), ignoreInitial: false, awaitWriteFinish: {...} })
  ```

  `rel`, manifest, queue, orphan-prune logic unchanged. Run → PASS.

- [ ] **Step 3: Commit** — `feat(indexer): function-based ignore; index .landsraad/ only`

## Task 4: Delete/reset target `.landsraad/`

**Files:** Modify `src/lib/server/councils.ts`, `scripts/reset.ts` + `councils.test.ts`

- [ ] **Step 1: Failing test.** In `councils.test.ts`: create a council, write a
  fixture file at the product root (e.g. `<root>/keep-me.md`) and one under
  `.landsraad/memory/`, call `deleteCouncilData()`, assert `.landsraad/` is gone
  and `keep-me.md` + root `.env` survive. Run → FAIL (enumerated rm leaves
  `.landsraad/` partly intact / wrong paths).

- [ ] **Step 2: Implement.**

  ```ts
  import { councilDataRoot } from './paths';
  export async function deleteCouncilData(): Promise<void> {
    await rm(councilDataRoot(), { recursive: true, force: true });
  }
  ```

  In `scripts/reset.ts` update the two "Removed:" strings and the `--help`
  line to read `.landsraad/ (council.json, councillors/, memory/, jobs/, …)`.
  Run → PASS.

- [ ] **Step 3: Commit** — `feat(layout): delete/reset remove .landsraad/ wholesale (safe, fixes leak)`

## Task 5: Repo `.gitignore` + fixture sweep

**Files:** Modify `.gitignore`; sweep `src/**/*.test.ts`

- [ ] **Step 1: Collapse the repo ignore block.** Replace the anchored lines
  (`/council.json`, `/councillors/`, `/memory/`, `/jobs/`, `/proposals/`,
  `/meetings/`, `/schedules/`, `/oeuvres/`, `/.index/`) with a single
  `/.landsraad/`. Keep the dogfood + Playwright entries.

- [ ] **Step 2: Sweep fixtures.** Run
  `git grep -nE "'(memory|jobs|councillors|meetings|oeuvres|proposals|schedules)/" src` and
  fix any test that hand-writes a council file at a root-relative path to use
  `.landsraad/…` (or, preferably, the matching CRUD helper). Tests already using
  `createNote`/`createJob`/`createCouncillor`/`createMeeting` need no change.

- [ ] **Step 3: Gate.** `npm test` → all green. `npm run check` → clean.

- [ ] **Step 4: Commit** — `test+chore: relocate fixtures and repo ignore to .landsraad/`

## Task 6: Docs — Phase 1

**Files:** Modify `SPECIFICATION.md`, `docs/data-model.md`, `docs/architecture.md`

- [ ] Update the **Storage Model** tree in `SPECIFICATION.md` and the **Layout**
  tree in `docs/data-model.md` to nest everything under `.landsraad/`, with
  `.env`/`.gitignore` at the root. Note `councilRoot()` (cwd, adapter cwd) vs
  `councilDataRoot()` (`.landsraad/`) in `docs/architecture.md` (paths.ts bullet).
  State the machine/product separation in one line.
- [ ] **Commit** — `docs: describe the .landsraad/ layout (machine vs product)`

**Phase 1 gate:** `npm test` green, `npm run check` clean, and a manual smoke
(`npm run dev`, create a councillor + memory note, confirm they land under
`.landsraad/` and search still works).

---

# PHASE 2 — Index the product tree (`.md`/`.txt`, gitignore-aware)

## Task 7: Add `ignore` dependency

- [ ] `npm install ignore@^5` → `package.json` gains it; `npm run check` clean
  (ships its own types). Commit — `chore(deps): add ignore for gitignore-aware indexing`.

## Task 8: `project_file` chunk kind

**Files:** Modify `src/lib/server/embeddings.ts`

- [ ] Add `| 'project_file'` to the `ChunkKind` union. `npm run check` clean.
  Commit — `feat(indexer): add project_file chunk kind`.

## Task 9: Gitignore matcher

**Files:** Create `src/lib/server/gitignore.ts` + `gitignore.test.ts`

- [ ] **Step 1: Failing test.** With a temp `councilRoot()`: a root `.gitignore`
  containing `build/` and `secrets.txt` → `isIgnored('build/x')` and
  `isIgnored('secrets.txt')` true; `isIgnored('docs/a.md')` false; works with **no
  `.git` dir**; `reloadGitignore()` picks up an edited `.gitignore`.

- [ ] **Step 2: Implement** with the `ignore` package:

  ```ts
  import ignore, { type Ignore } from 'ignore';
  import { readFileSync, existsSync } from 'node:fs';
  import { join } from 'node:path';
  import { councilRoot } from './paths';

  let ig: Ignore | null = null;
  function load(): Ignore {
    const m = ignore();
    const f = join(councilRoot(), '.gitignore');
    if (existsSync(f)) m.add(readFileSync(f, 'utf8'));
    return m;
  }
  export function reloadGitignore(): void { ig = load(); }
  export function isIgnored(rel: string): boolean {
    if (!rel || rel === '.') return false;
    if (!ig) ig = load();
    return ig.ignores(rel.replace(/\\/g, '/'));
  }
  ```

  Run → PASS. Commit — `feat(indexer): root .gitignore matcher`.

## Task 10: Project source in the registry

**Files:** Modify `src/lib/server/index-sources.ts` + test

- [ ] **Step 1: Failing test.**
  - `resolveSource('docs/plan.md').kind === 'project_file'`, `refId === 'docs/plan.md'`,
    title from first heading.
  - `resolveSource('notes.txt')` → `project_file`, title = `notes.txt`.
  - `resolveSource('src/app.ts')` → null. `resolveSource('data.csv')` → null.
  - `.landsraad/memory/x.md` still → `memory` (peel unaffected).

- [ ] **Step 2: Implement.** Fill the `else` branch of `resolveSource` with a
  `PROJECT` matcher:

  ```ts
  const PROJECT: IndexSource = {
    kind: 'project_file',
    test: (rel) => /\.(md|txt)$/i.test(norm(rel)),
    refId: (rel) => norm(rel),
    buildChunks: (text, rel) => [{
      chunk_idx: 0, text,
      title: /\.md$/i.test(rel) ? firstHeading(text, basename(norm(rel))) : basename(norm(rel)),
      councillor_slug: null
    }]
  };
  // resolveSource else-branch: return PROJECT.test(n) ? PROJECT : null;
  ```

  Run → PASS. Commit — `feat(indexer): index product .md/.txt as project_file`.

## Task 11: Oversize-file guard in reconcile

**Files:** Modify `src/lib/server/reconcile.ts`, `config.ts` + test

- [ ] **Step 1: Failing test.** A `project_file` larger than the cap is not
  indexed; one under the cap is.
- [ ] **Step 2: Implement.** Add `INDEX_MAX_FILE_BYTES = envInt('LANDSRAAD_INDEX_MAX_FILE_BYTES', 512_000)`
  to `config.ts`. In `reindexFile`, after `statSync`, if
  `src.kind === 'project_file' && stat.size > INDEX_MAX_FILE_BYTES` →
  `indexDelete(kind, refId); return;`. Run → PASS. Commit —
  `feat(indexer): skip oversize project files (LANDSRAAD_INDEX_MAX_FILE_BYTES)`.

## Task 12: Broaden the watcher to the product tree

**Files:** Modify `src/lib/server/watcher.ts` + test

- [ ] **Step 1: Failing test.**
  - `docs/plan.md` (not gitignored) → searchable.
  - `secret.txt` matched by `.gitignore` → not indexed.
  - `src/app.ts` → not indexed; `.svelte-kit/x.md` → not indexed.
  - `.landsraad/memory/x.md` → indexed **even when `.gitignore` contains
    `.landsraad/`** (proves gitignore is not consulted for the machine).
  - editing `.gitignore` triggers `reloadGitignore()`.

- [ ] **Step 2: Implement.** Relax `makeIgnored`'s Phase-1 rule:

  ```ts
  if (r !== '.landsraad' && !r.startsWith('.landsraad/')) {
    if (parts.some((p) => p.startsWith('.'))) return true;  // .git, .svelte-kit, .env, .gitignore…
    if (isIgnored(r)) return true;                          // root .gitignore (machine never reaches here)
    if (stat?.isFile() && !/\.(md|txt)$/i.test(r)) return true; // allowlist (perf; resolveSource is authoritative)
    return false;
  }
  ```

  Change the matcher signature to `(abs, stat?) => boolean` (chokidar passes
  stats when available). On `add`/`change` of `<root>/.gitignore`, call
  `reloadGitignore()` before draining the queue. Call `reloadGitignore()` once at
  watcher start. Run → PASS.

- [ ] **Step 3: Commit** — `feat(indexer): index product .md/.txt, respecting .gitignore; always index .landsraad/`

## Task 13: Third retrieval bucket

**Files:** Modify `src/lib/server/context.ts`, `config.ts` + `context.test.ts`

- [ ] **Step 1: Failing test.** With a `project_file` indexed, `assembleContextFor`
  output contains a `# Project context` section with the matching doc; under a
  tight budget, lowest-similarity entries are evicted across all three buckets;
  the no-embedder fallback contains **no** project section.

- [ ] **Step 2: Implement.** Add `PROJECT_TOPK = envInt('LANDSRAAD_PROJECT_TOPK', 6)`
  to `config.ts`. In `assembleContextFor`, after the private search, add a
  `kinds: ['project_file']` search; generalize `applyBudget` to take the third
  bucket (share `MEMORY_CHAR_BUDGET`, pop the globally-lowest similarity);
  append `formatSection('Project context', projectEntries)` after private memory.
  Leave `fallback()` memory-only. Run → PASS.

- [ ] **Step 3: Commit** — `feat(context): retrieve product docs as a third prompt bucket`

## Task 14: Docs — Phase 2

**Files:** Modify `SPECIFICATION.md`, `docs/embeddings.md`, `docs/data-model.md`, `README.md`

- [ ] `SPECIFICATION.md`: under the Indexing model, add **what gets indexed** —
  `.landsraad/**` structured sources (always) + product `.md`/`.txt` (respecting
  root `.gitignore`, skipping dot-dirs/non-allowlisted); note the
  machine-vs-product framing.
- [ ] `docs/embeddings.md`: add the `project_file` kind.
- [ ] `README.md`: add `LANDSRAAD_PROJECT_TOPK`, `LANDSRAAD_INDEX_MAX_FILE_BYTES`
  to the config table; update the dev-council section (council files now live in
  `.landsraad/`, gitignored via the single `/.landsraad/` line).
- [ ] **Commit** — `docs: workspace indexing (allowlist + gitignore) and new env vars`

**Phase 2 gate:** `npm test` green, `npm run check` clean, manual smoke —
`npm run dev`, drop a `notes.md` in the council root, confirm a job retrieves it
under "Project context"; add `notes.md` to `.gitignore`, restart, confirm it
drops out; confirm `.landsraad/` memory still retrieves.

---

## Notes for the implementer

- **Single `rel` base.** Everything is `relative(councilRoot(), abs)`. The only
  place that knows about `.landsraad/` is `resolveSource` (peel) and the watcher
  ignore. Don't reintroduce a second base.
- **Correctness vs perf in the ignore.** The extension allowlist in the watcher
  is a perf pre-filter; `resolveSource` (project source matches only `.md`/`.txt`)
  is authoritative. If stats are absent, let files through — reconcile no-ops on
  non-allowlisted paths.
- **`.landsraad/` is never gitignore-checked.** The machine indexes its own data
  unconditionally; gitignore governs only the product tree. This is what makes
  "gitignore `.landsraad/` to avoid committing PII" safe.
- **No migration.** A pre-existing flat council is not auto-moved; reset and
  recreate, or move the dirs into `.landsraad/` by hand.
- **`.env` stays at the root**, is gitignored, has no allowlisted extension, and
  is dot-prefixed — triply excluded from the index. Keep it that way.
