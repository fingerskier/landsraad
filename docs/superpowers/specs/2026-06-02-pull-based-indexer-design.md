# Pull-based indexer

**Date:** 2026-06-02
**Status:** Approved design, pending implementation plan
**Reference:** `underrow` (npm) — same architecture; used as blueprint, not a dependency.

## Problem

The semantic index is **push-only**: `indexUpsert` / `indexDelete` fire only from
inside writer functions (`writeOutput`, `createNote`, `meetings.ts`, …). Nothing
reconciles the index against disk. Consequences:

- A file moved or deleted out of band leaves **orphan chunks** pointing at gone paths.
- A file edited out of band (manual edit, `git checkout`, restore) is **never reindexed**.
- Any "move a finished job's `.md` into a councillor's memory" scheme would require
  manual `indexDelete` of the old chunks + manual re-index of the new file.

We want the **filesystem to be the single source of truth**, with the index derived
from it automatically ("pure pull").

## Decision summary

| Fork | Decision |
|---|---|
| Trigger model | **Pure pull** — writers stop touching the index entirely |
| Change detection | **chokidar** recursive watch (`ignoreInitial:false` = startup scan; `ready` = orphan prune) |
| Reuse `underrow`? | **No** — borrow the pattern, keep landsraad's stack (sqlite-vec + Xenova). `underrow` lacks kind-filtered search and semantic meeting chunking. |
| Timestamp tracking | Per-file `source_mtime` (existing column) + a one-shot **startup manifest map**. No global watermark. |
| Vector store | Keep **sqlite-vec** (SQL filtering by kind/councillor) |
| Embedder | Keep **Xenova MiniLM** |
| New prod dep | **chokidar** (only addition) |
| Dev double-watcher guard | **`LANDSRAAD_WATCH=0`** env flag, mirroring `LANDSRAAD_SCHEDULER` / `LANDSRAAD_EMBED` |

## Components

### 1. Source registry — `src/lib/server/index-sources.ts`

A declarative table mapping a council-root-relative path to a source descriptor.
This is "kind rolled into the path."

```ts
interface IndexSource {
  /** Does this source own the given council-relative path? */
  match(relPath: string): boolean;
  kind: ChunkKind;
  /** Stable dedupe id for UNIQUE(kind, ref_id, chunk_idx). */
  refId(relPath: string): string;
  councillor(relPath: string, ctx: SourceCtx): string | null;
  title(relPath: string, text: string, ctx: SourceCtx): string | null;
  /** Split file text into chunks. Whole-file sources return one chunk. */
  chunk(text: string, relPath: string, ctx: SourceCtx): Chunk[];
}

interface Chunk {
  chunk_idx: number;
  text: string;
  title?: string | null;
  councillor_slug?: string | null;
}
```

`SourceCtx` is a per-directory context loader (e.g. reads the sibling
`meeting.json` for `title` / `chair_slug`), memoized per reconcile pass.

Entries (one per current mapping):

| Path pattern | kind | refId | councillor | chunk |
|---|---|---|---|---|
| `memory/*.md` | `memory` | filename slug | `null` | whole |
| `councillors/<s>/memory/*.md` | `memory_private` | `<s>/<slug>` | `<s>` | whole |
| `councillors/<s>/persona.md` | `persona` | `<s>` | `<s>` | whole |
| `jobs/<id>/input.md` | `job_input` | `<id>` | `null` | whole |
| `jobs/<id>/output.md` | `job_output` | `<id>` | `null` | whole |
| `jobs/<id>/transcript.md` | `transcript` | `<id>` | `null` | whole |
| `meetings/<id>/topic.md` | `meeting_topic` | `<id>` | `null` | whole |
| `meetings/<id>/transcript.md` | `meeting_turn` | `<id>` | per-turn speaker rule | **`parseTranscript` → 1 chunk / turn** (`chunk_idx = turnIndex`) |
| `meetings/<id>/summary.md` | `meeting_summary` | `<id>` | `chair_slug` | whole |
| `meetings/<id>/synthesis.md` | `meeting_synthesis` | `<id>` | `chair_slug` | whole |

Notes:

- Meeting transcript chunking reuses the existing `parseTranscript` (meetings.ts:217).
  This is the one thing `underrow`'s generic 512-char chunker would have lost —
  semantic per-turn chunks with speaker→councillor attribution.
- `match()` doubles as the watcher filter: any path no source claims
  (`*.json`, `events.jsonl`, `.index/`, `.env*`) is ignored.
- The per-turn councillor rule is lifted verbatim from meetings.ts:160
  (`director` / `slug:`-prefixed speakers → `null`).

### 2. Reconciler — folded into `indexer.ts`

- `reindexFile(relPath)`: resolve source; read text; `deleteByRef(kind, refId)`
  then upsert each chunk with `source_mtime = file fs mtime` (ISO). Empty file →
  ensure removed. Delete-then-add handles a shrinking chunk count safely.
- `removeFile(relPath)`: resolve source → `deleteByRef(kind, refId)`. For a meeting
  transcript this drops all turns for that ref.
- The startup pass is driven by chokidar (see §3), not a separate walk.

New helper in `embeddings.ts`:

```ts
/** One row per indexed file, for the startup manifest. */
listIndexedFiles(h): { source_path: string; kind: ChunkKind; ref_id: string; source_mtime: string }[]
```

### 3. Watcher — `src/lib/server/watcher.ts`

```ts
chokidar.watch(councilRoot(), {
  ignored: ['**/.index/**', '**/node_modules/**', dotfiles, /* non-source */],
  ignoreInitial: false,        // startup scan: emits `add` for every existing file
  awaitWriteFinish: { stabilityThreshold: ... }, // editors writing partials
});
```

- **Manifest map (answers "only look at recently changed files"):** at watcher
  start, `listIndexedFiles()` → in-memory `Map<source_path, source_mtime>`.
  - `add` / `change` → consult the map (no per-file DB round-trip). If
    `fs mtime === manifest mtime` → **skip** (no re-embed). Else `reindexFile`.
  - `unlink` → `removeFile`.
  - `ready` → any manifest entry **never touched** by an add = orphan →
    `deleteByRef`. (Deletion detection as a set-diff.)
- Serial processing queue (one file at a time) to avoid embed thrash.
- No-op entirely unless `hasEmbedder()`.

Rationale for no global watermark: a single "last indexed at" timestamp cannot skip
the directory walk (chokidar walks regardless), silently misses files restored with
an **older** mtime (`git checkout`, backup restore), and ignores deletions. Per-file
`source_mtime` compared against the manifest is correct in all three cases and costs
one query.

### 4. Wiring — `hooks.server.ts`

- After `setEmbedder(...)`, if `env.LANDSRAAD_WATCH !== '0'`, call
  `startIndexWatcher(councilRoot())`. Close watcher + `closeAll()` on
  `SIGINT` / `SIGTERM`.
- **Remove every `indexUpsert` / `indexDelete` call** from: `jobs.ts`,
  `memory.ts`, `memory_private.ts`, `meetings.ts`, `councillors.ts`. Writers
  just write files now.

### 5. `source_mtime` standardized to fs mtime

Drop the ad-hoc `block.at` / `new Date()` values currently stored. All chunks store
the file's `stat.mtime` (ISO). The reconciler depends on this.

## Data flow

```
write file (any writer) → chokidar add/change → queue → reindexFile
   → chunk via source → deleteByRef + upsert → sqlite-vec

move jobs/<id>/output.md → councillors/<s>/memory/x.md
   → unlink (prune job_output chunk) + add (reindex as memory_private)
   → re-kinded automatically

delete file → unlink → removeFile
boot → add × N (mtime-skip unchanged) + ready prune
```

## Testing (TDD, red/green)

- **`index-sources`**: table-driven. Given a relPath (+ optional sibling json),
  assert `{ kind, refId, councillor, chunk count, titles }`. Cover every kind,
  including the multi-turn meeting transcript.
- **`reconcile`**: temp council dir. create → reconcile → chunks present; touch file
  (newer mtime) → reindexed; delete file → orphan swept; **unchanged mtime → embed
  spy NOT called**.
- **`watcher`**: fake embedder + temp dir smoke (write → searchable; unlink → gone).
  Unit-test the handlers (enqueue / removeFile / orphan-prune) directly to avoid
  flaky timing.
- **Regression**: writer tests drop their index-assertion blocks (writers no longer
  index). `context.test.ts` / `indexer.test.ts` stay green.

## Risks / mitigations

- **chokidar new prod dep** — accepted (tiny, ubiquitous, its intended use).
- **Dev double-watcher** (vite dev server + built server on same `.index`) → sqlite
  write contention. Guard: `LANDSRAAD_WATCH=0`; watcher starts once in `hooks.server.ts`
  like the scheduler.
- **Cold boot** re-embeds everything once (same total work as today's lazy build,
  paid upfront). Manifest mtime-skip makes subsequent boots cheap.
- **Latency**: chokidar → searchable is ms + embed time. If a reflection-written
  memory must be visible to the *very next* job, add one explicit `await reindexFile()`
  at that seam — deferred unless a test demonstrates the race.

## Out of scope — effort #2 (memorize finished jobs)

With the pull indexer live, "convert a finished job to a memory" becomes: move/copy
`jobs/<id>/output.md` (± transcript) into `councillors/<slug>/memory/<name>.md`. The
watcher re-kinds it `memory_private` and prunes the old `job_*` chunks on unlink. The
remaining product decisions — which files, naming, a "job result" footer marker,
trigger (manual button vs N-months / Q-count sweep), keeping `brief` for re-run — get
their own small spec, shipped **after** the indexer.

## Spec note

This change is mostly internal (search freshness / index integrity), not user-facing
product behavior. When implementing, add a short note to `SPECIFICATION.md` describing
the pull-based index so the source-of-truth doc stays accurate.
