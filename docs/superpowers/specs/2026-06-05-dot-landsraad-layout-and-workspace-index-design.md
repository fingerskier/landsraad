# `.landsraad/` layout + workspace indexing

**Date:** 2026-06-05
**Status:** Approved design, pending implementation plan
**Reference plan:** `docs/superpowers/plans/2026-06-05-dot-landsraad-layout-and-workspace-index.md`

## Problem

Today the council root **is** the process cwd, and every council artifact sits
flat at cwd: `council.json`, `councillors/`, `memory/`, `jobs/`, `proposals/`,
`schedules/`, `meetings/`, `oeuvres/`, `.index/`, `meetings-incoming.jsonl`. Two
consequences:

- **Clutter / collision.** Running a council alongside a code repo or a
  document workspace dumps 9+ entries at the root and can collide with the
  user's own `jobs/`, `memory/`, `docs/` directories.
- **No separation between the machine and the product.** The council is the
  *machine that assembles a product*, not the product. The product is whatever
  the agents write into the working directory — curated docs, CSVs, reports.
  Right now the machine and the product share one namespace, and the index only
  ever sees the machine's own files.

## Premise

> The Landsraad council is **not** the product — it's the machine assembling the
> product. The two need a clean separation.

This yields a two-way split:

- **`.landsraad/` = the machine.** Councillors, memory, jobs, schedules,
  meetings, oeuvres, the semantic index. (Memory included: it's the machine's
  working memory, not a deliverable.)
- **cwd (the council root) = the product.** The docs/CSVs/code the agents
  produce, edited in place, visible, version-controllable by the user however
  they like.

And it implies a second capability: the machine should be able to **see the
product it's building** — so the semantic index should cover the product's prose
(`.md`/`.txt`), not only the machine's own artifacts.

## Decision summary

| Fork | Decision |
|---|---|
| Where the machine lives | **`<cwd>/.landsraad/`** — all council data nests under one dot-dir |
| What stays at the root | **`.env`** and **`.gitignore`** only (dotenv/tooling convention; a `.gitignore` governs the dir it sits in) |
| Path plumbing | New **`councilDataRoot()` = `join(councilRoot(), '.landsraad')`**; data helpers re-root onto it. `councilRoot()` stays = cwd (still what `LANDSRAAD_COUNCIL_ROOT` points at, still the adapter cwd) |
| Adapter cwd | **Unchanged** = `councilRoot()`. Agents run in the product tree and see it directly; machinery is tucked away |
| Index `rel` base | **`councilRoot()`** (single base). `resolveSource` **peels a leading `.landsraad/`** before structured matching, so the existing matchers + split-indices are untouched |
| Migration | **None.** No installed base but the author; new layout is authoritative. Reset/recreate the dev scratch council |
| Delete/reset | Collapses to **`rm(councilDataRoot())`** — one call; also fixes today's latent leak (the enumerated list omits `meetings/`, `oeuvres/`, `meetings-incoming.jsonl`) and is safe (never walks the product root) |
| Index the product tree | **Yes** — but constrained to a prose **allowlist: `.md`, `.txt`** |
| Index code/CSV/binaries | **No.** The index is semantic *memory*; code's meaning is structural, CSV's is positional, binaries embed to noise. Adapters already run in cwd with their own grep/file tools |
| Respect `.gitignore` | **Yes**, for the product tree — both denoise and a safety default (keeps conventionally-ignored secrets out of embeddings). Root `.gitignore` only in v1; **no git binary required** (uses the `ignore` package) |
| `.landsraad/` vs gitignore | `.landsraad/` is **always indexed** by the structured sources regardless of gitignore — it's the machine's own data. Gitignore is consulted **only** for the product tree. (So gitignoring `.landsraad/` to avoid committing PII has zero effect on indexing.) |
| New prod dep | **`ignore`** (Phase 2 only; tiny, zero-dep) |

## Two phases

The work splits cleanly. **Phase 1 is a prerequisite for Phase 2** — you can't
say "index the product but not the machine" until the machine is corralled into
one dir.

### Phase 1 — Relocate the machine into `.landsraad/`

**Layout (after):**

```
<cwd>/                         # = councilRoot() = the product (agents' workspace)
  .env                         # stays at root (gitignored, never indexed)
  .gitignore                   # stays at root
  <the user's product files>   # docs/, *.csv, code, … (indexed in Phase 2)
  .landsraad/                  # = councilDataRoot() = the machine
    council.json
    councillors/<slug>/{councillor.json, persona.md, memory/*.md}
    memory/*.md
    jobs/<id>/{job.json,input.md,transcript.md,output.md,events.jsonl}
    proposals/jobs/*.json
    schedules/*.json
    meetings/<id>/…
    oeuvres/<id>/…
    meetings-incoming.jsonl
    .index/embeddings.db
```

**Components:**

1. **`paths.ts`** — add `councilDataRoot()`; re-root `councilFile`,
   `councillorsRoot`, `memoryDir`, `jobsDir`, `indexDirPath`, `proposalsDir`,
   `schedulesDir`, `meetingsDir`, `meetingsIncomingFile`, `oeuvresDir` onto
   `councilDataRoot()`. **`councilEnvFile()` and the `.gitignore` path keep
   deriving from `councilRoot()`.** Everything else (councils, councillors,
   jobs, runner, meetings, oeuvres, API routes) flows through these helpers and
   follows automatically.

2. **`index-sources.ts`** — `resolveSource(rel)` peels a leading `.landsraad/`
   before structured matching:

   ```
   resolveSource(rel):
     if rel starts with ".landsraad/":  structured match on rel.slice(".landsraad/".length)
     else:                              (Phase 1: null;  Phase 2: project source)
   ```

   The peel is centralized (a thin `stripPrefix` wrapper), so every existing
   matcher regex (`^memory/…`, `^jobs/…`) and positional `split('/')` index stays
   **byte-for-byte unchanged**. Reconcile keeps passing the full `rel`; `abs =
   join(councilRoot(), rel)` is still correct because `rel` includes `.landsraad/`.

3. **`watcher.ts`** — keep watching `councilRoot()`, keep `rel` relative to
   `councilRoot()`. Replace the broad dot-dir ignore regex (`/(^|[/\\])\../`,
   which would swallow the entire `.landsraad/` subtree) with a **function
   matcher**. Phase 1 rule: index **only** `.landsraad/`, minus its `.index`
   subdir and `node_modules`:

   ```ts
   ignored(abs):
     r = relative(root, abs)              // normalized, '/'-sep
     if r === '' return false             // the root itself — descend
     if parts(r).includes('node_modules') return true
     if r !== '.landsraad' && !r.startsWith('.landsraad/') return true   // Phase 1
     if parts(r).slice(1).some(p => p.startsWith('.')) return true       // .index, stray dotfiles
     return false
   ```

4. **`councils.ts` / `reset.ts`** — `deleteCouncilData()` becomes
   `rm(councilDataRoot(), { recursive: true, force: true })`. Leaves root
   `.env`/`.gitignore` (matches today's behavior). `hasCouncil()` /
   `createCouncil()` follow `paths.ts` automatically. Update reset's printed
   "Removed:" text to name `.landsraad/`.

5. **Repo `.gitignore`** — collapse the anchored block (`/council.json`,
   `/councillors/`, …) to a single `/.landsraad/`. Keep the dogfood entries.

6. **Tests** — fixtures that hand-write council files at root-relative paths
   (`memory/x.md`) move to `.landsraad/…`; the `index-sources`/`watcher`/
   `reconcile` tests assert the peel + new ignore. Tests that go through CRUD
   helpers (`createNote`, `createJob`, …) follow automatically.

**Out of scope for Phase 1:** auto-adding `.landsraad/` to the user's
`.gitignore` (their choice — they may want to commit the council). Document it
as a suggestion only.

### Phase 2 — Index the product tree (`.md`/`.txt`, gitignore-aware)

**Components:**

1. **`embeddings.ts`** — add `'project_file'` to the `ChunkKind` union.

2. **`gitignore.ts`** (new) — load the root `.gitignore` via the `ignore`
   package into a matcher; expose `isIgnored(rel): boolean`. No git binary
   needed, so non-git councils (the hedge-fund case) work too. Reloadable when
   `.gitignore` changes. v1: **root `.gitignore` only** — nested `.gitignore`
   files are a follow-up.

3. **`index-sources.ts`** — the `else` branch of `resolveSource` resolves the
   **project source**:
   - matches product-tree paths (not under `.landsraad/`) with extension
     `.md`/`.txt`
   - `kind: 'project_file'`, `ref_id: <rel path>` (unique per file; slashes in
     ref ids are already used by `memory_private`)
   - `title`: first markdown heading (`.md`) or basename (`.txt`);
     `councillor_slug: null` (project-wide)
   - `buildChunks`: whole-file, one chunk (matches every existing source).
     Sub-file heading/size chunking deferred.

4. **`reconcile.ts`** — skip files larger than
   `LANDSRAAD_INDEX_MAX_FILE_BYTES` (default 512 KB) so a giant text file can't
   blow up an embed. Applies to project files.

5. **`watcher.ts`** — relax the Phase-1 "only `.landsraad/`" rule. For
   product-tree paths: ignore any dot-segment (`.git`, `.svelte-kit`, `.env`,
   `.gitignore`, …), ignore `isIgnored(rel)`, and (perf) ignore non-allowlisted
   files. Correctness is guaranteed by `resolveSource` (project source matches
   only `.md`/`.txt`); the ignore is the cheap pre-filter. Reload the gitignore
   matcher on `.gitignore` add/change.

   ```ts
   // product-tree branch (r not under .landsraad/):
   if parts(r).some(p => p.startsWith('.')) return true        // dotfiles/dirs
   if gitignore.isIgnored(r) return true
   if stat?.isFile() && !/\.(md|txt)$/i.test(r) return true    // allowlist (perf)
   return false
   ```

6. **`context.ts` / `config.ts`** — add a **third retrieval bucket**.
   `assembleContextFor` runs a `kinds: ['project_file']` search
   (`PROJECT_TOPK`, default 6, env `LANDSRAAD_PROJECT_TOPK`), folds the hits into
   a generalized `applyBudget` (three buckets share `MEMORY_CHAR_BUDGET`, evict
   lowest-similarity globally), and emits a `# Project context` section between
   memory and the brief. The no-embedder fallback stays memory-only (never dump
   the product tree verbatim).

**Prompt section order (after):** persona → roster → shared memory → private
memory → **project context** → brief.

## Data flow (after both phases)

```
write .landsraad/memory/x.md        → add → resolveSource peels → memory chunk
write docs/plan.md (not gitignored) → add → resolveSource → project_file chunk
write src/app.ts                    → ignored (not allowlisted) → no chunk
write secrets.txt (gitignored)      → ignored (gitignore) → no chunk
edit .gitignore                     → reload matcher
delete file                         → unlink → removeFile
job runs (adapter cwd = councilRoot) → agent reads/writes product files directly
```

## Testing (TDD, red/green)

- **`paths`**: `councilDataRoot()` nests under `councilRoot()`; data helpers
  resolve under `.landsraad/`; `.env`/`.gitignore` stay at root.
- **`index-sources`**: peel — `.landsraad/memory/x.md` → `memory` (refId `x`);
  bare `memory/x.md` → project_file (Phase 2) / null (Phase 1). Project source:
  `.md` title from heading, `.txt` from basename, ref id = rel path.
- **`gitignore`**: a pattern in root `.gitignore` ignores a matching product
  path; `.landsraad/**` is never consulted; works with no `.git` dir.
- **`reconcile`**: project `.md` becomes searchable; oversize file skipped.
- **`watcher`**: `.landsraad/memory` indexed even when `.landsraad/` is
  gitignored; a product `.md` indexed; a gitignored product file and a `.ts`
  file are **not**; `.index` never indexed.
- **`context`**: project hits appear as their own section and compete in the
  shared char budget; fallback path stays memory-only.
- **`councils`**: `deleteCouncilData` removes `.landsraad/` and leaves root
  `.env`.

## Risks / mitigations

- **Test churn** (Phase 1): every fixture that hand-writes a council file at a
  root-relative path moves under `.landsraad/`. Mitigation: prefer CRUD helpers
  in fixtures; the rest is mechanical and caught by red tests.
- **Watcher traverses the product tree** (Phase 2): a large repo means more
  `add` events. Mitigation: gitignore prunes `node_modules`/build output;
  dot-dirs pruned; non-allowlisted files pruned in the ignore; `awaitWriteFinish`
  + mtime-skip already debounce. An index-size ceiling is a later knob.
- **Retrieval crowding**: product prose could swamp memory in the prompt.
  Mitigation: separate `PROJECT_TOPK` and a shared similarity-ranked budget;
  tune empirically (mirrors the existing `MEMORY_TOPK_*` open question).
- **Adapter cwd unchanged** is a feature, not a risk: the CLI sees the product;
  the machine stays out of the way.

## Out of scope (later, if needed)

- Nested `.gitignore` files; honoring global gitignore / `.git/info/exclude`.
- Additional indexed extensions (`.csv` as data, code via AST) — explicitly not
  semantic memory.
- Sub-file chunking of long product docs (heading/size split).
- Auto-managing the user's `.gitignore`.
- Migration of a pre-`.landsraad/` council (no installed base).

## Spec note

This **does** change product behavior (on-disk layout + what the index covers),
so `SPECIFICATION.md` (Storage Model + Indexing model) is updated **first** when
implementing, per `CLAUDE.md`. `docs/data-model.md`, `docs/architecture.md`,
`docs/embeddings.md`, and `README.md` follow.
