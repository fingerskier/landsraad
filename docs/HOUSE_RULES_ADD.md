# Plan — Council guide files + docs consolidation

Status: **plan / not started.** Working name was `HOUSE_RULES.md`; the shipped
artifact is `AGENTS.md` (plus adapter-specific copies). This document is the plan
only — no code has been written.

> **Revisions:** updated per [PR #2](https://github.com/fingerskier/landsraad/pull/2)
> review (2026-06-05): (1) the "secretary" idea is vestigial — remove it, don't
> just reconcile it; (2) copies are **adapter-aware** (canonical `AGENTS.md`,
> copied to a tool file only when a councillor uses that adapter); (3) if a
> prompt file already exists, **append** the Landsraad section rather than
> overwrite. Ownership model changed from "owns & overwrites" to a non-destructive
> **managed block**.

## One-liner

Land a terse, **indexed** Landsraad guide in **every** council so any councillor
knows what system it has been included in — `AGENTS.md` is canonical, copied to
adapter-specific files (`CLAUDE.md`, `QWEN.md`, …) as the council's adapters
require. Use the glossary that guide needs as the forcing function to
**consolidate and tighten the existing docs**. The docs cleanup is the bigger
prize; the guide file is what it feeds.

---

## Why

A councillor invoked as a CLI subprocess gets a persona, a roster, and retrieved
memory — but **no orientation about Landsraad itself**. It can't reliably know
that "Turn" is a structured contribution inside a meeting round or an oeuvre
loop (not a chat message), that a `<<JOB>>` block becomes a *reviewed proposal*
rather than an auto-run job, or that the director does all coordination. The
guide gives every councillor that context in its own native workflow.

Building the guide requires a single, canonical vocabulary. Auditing the repo for
this plan surfaced real drift (see [Part B](#part-b--docs-consolidation-the-headline-win)),
so the same pass that writes the glossary should tighten the docs that the
glossary describes.

---

## Decisions (locked with the director)

| # | Question | Decision |
|---|---|---|
| 1 | What is delivered now? | **A plan doc only** (`docs/HOUSE_RULES_ADD.md`). No implementation yet. |
| 2 | File name | Canonical **`AGENTS.md`** at the council root. |
| 3 | Per-tool pickup | **Adapter-aware copies.** `AGENTS.md` is always written; a tool-specific file is created **only when a councillor uses that adapter** (e.g. a `cli:qwen` councillor ⇒ `QWEN.md`). |
| 4 | Ownership | **Managed block, non-destructive.** If the file is absent, create it with the Landsraad block; if it exists without our block, **append** it; if it already has our block, **replace that block with the latest text**. The check runs on create, startup, and adapter change. Never clobbers other content. |
| 5 | Indexing | **Always index** — the Landsraad block extracted from `AGENTS.md` only, as a new `agents_doc` chunk kind. Copies are not indexed. |
| 6 | Prompt injection | **None.** Delivery is native file pickup, not `assembleContextFor`. |
| 7 | Which councils | **Every** council — written on create, refreshed on startup, and refreshed when adapters change (backfills + tracks the adapter-aware copy set). |
| 8 | Docs sweep | **Broad** consolidation across the living docs, anchored to one canonical glossary. Includes **removing the vestigial "secretary" idea.** |
| 9 | Content goal | **Token-light** while conveying Landsraad's capabilities + opinionation + glossary. |

---

## Part A — The council guide file

### Adapter → convention-file mapping

Verified headless behavior of the adapters Landsraad ships
(`SPECIFICATION.md` adapter table), early 2026:

| Adapter | Convention file to copy `AGENTS.md` → | Notes |
|---|---|---|
| `cli:codex` | *(none — reads `AGENTS.md` directly)* | Canonical covers it. |
| `cli:claude` | `CLAUDE.md` | `claude -p` reads `CLAUDE.md`, **not** `AGENTS.md` ([#34235](https://github.com/anthropics/claude-code/issues/34235)); loaded unless `--bare`. |
| `cli:gemini` | `GEMINI.md` | |
| `cli:qwen` | `QWEN.md` | |
| `cli:grok` | *(none)* | Config-only; no project memory file. |
| `cli:vibe` | *(verify)* | Convention unconfirmed. |
| `cli:aider` | *(none / `CONVENTIONS.md` via `--read`)* | Not auto-read from root; skip unless configured. |
| `cli:warp` | *(verify)* | Convention unconfirmed. |
| `mock:local` | *(none)* | Reads no file (stub). |

**"As needed" = create the copy when ≥1 councillor uses that adapter.** No single
filename covers the fleet, so adapter-awareness keeps the council dir to exactly
the files its councillors will actually read. The copy set is therefore a
function of the current councillor adapters and must be refreshed when those
change (see [Where it lands](#where-it-lands)).

### Content (token-light)

A single short markdown block. Sections, roughly:

1. **What Landsraad is** (2–3 lines): a local-first council of AI **councillors**
   directed by one human **director**; you are a councillor; the council *is*
   this directory.
2. **Opinionation** (terse bullets): file-first/local-first; one council per
   directory; the director does all coordination; memory is markdown; nothing
   leaves the machine.
3. **How you participate**: jobs (brief → output), meetings (turns within rounds,
   a chair synthesizes), oeuvres (turns on a shared scratchpad, votes, a leader
   orchestrates).
4. **Block protocol** — the highest-leverage, easiest-to-get-wrong bit:
   ```
   <<MEMORY title="...">> … <</MEMORY>>          # applied to memory
   <<JOB title="..." councillor="slug">> … <</JOB>>  # becomes a reviewed proposal
   ```
5. **Glossary** — the canonical terms (see [Part B](#canonical-glossary)),
   trimmed to what a councillor needs in-context, with **Turn** disambiguated
   (meeting turn vs oeuvre turn).

Keep the whole block tight — it is read into context by every tool that supports
it, so every line costs tokens at run time for those tools.

### Ownership — managed block (non-destructive)

The Landsraad content lives inside a delimited block so it can be created,
appended, refreshed, or removed without touching anything else in the file:

```
<!-- LANDSRAAD:BEGIN agents-doc v1 -->
…the guide content…
<!-- LANDSRAAD:END -->
```

Rules for each managed file (`AGENTS.md` and every adapter copy):

- **Absent** → create the file containing just the block.
- **Exists, no Landsraad block** (a foreign `AGENTS.md`/`CLAUDE.md`, incl. **this
  repo's own** in dev) → **append** the block to the end, preserving all existing
  content.
- **Exists, already has a Landsraad block** → **replace that block in place with
  the latest canonical text** (located by the `LANDSRAAD:BEGIN … END` markers, so
  surrounding content is untouched); if the existing block is already byte-identical
  to the latest → no-op (don't churn mtime / re-embed). This is how a guide update
  lands on an initialized council — the old block is swapped, never appended twice.

The block content is **identical across all managed files** (one source
constant), so copies never drift. There is no overwrite of foreign content
anywhere — the earlier "owns & overwrites / sentinel-skip" model is dropped in
favor of this append-and-update model.

### Indexing

- Add `agents_doc` to the `ChunkKind` union (`src/lib/server/embeddings.ts`).
- Add an `IndexSource` (`src/lib/server/index-sources.ts`) matching `^AGENTS\.md$`
  at the council root: `kind: 'agents_doc'`, constant `refId` (`'agents'`). Its
  `buildChunks` **extracts the text between the BEGIN/END markers** so only the
  Landsraad guide is indexed (never any foreign content the file may also hold).
- The pull-based watcher already scans the root and ignores only dotfiles /
  `.index` / `node_modules` / `.git`, so `AGENTS.md` is picked up with **no
  watcher change**. The adapter copies (`CLAUDE.md`, `QWEN.md`, …) match no source
  and are **not indexed**, so there is exactly one `agents_doc` chunk.

### Where it lands — and when the block refreshes

`ensureAgentsDoc()` runs the same create / append / replace-latest logic at each
trigger below. **Startup is the moment a shipped guide-version bump propagates**
to an already-initialized council (the stale block is swapped for the new text);
the other triggers keep the file present and the adapter-aware copy set in sync.

- **On create:** at the end of `createCouncil()` (`src/lib/server/councils.ts`) —
  the single chokepoint, since `applyTemplate()` routes through `createCouncil()`
  (`templates.ts:436`). A blank create has no councillors yet, so only `AGENTS.md`
  is written here; adapter copies appear via the councillor-change trigger as
  councillors are added.
- **On startup (backfill + version refresh):** call from `src/hooks.server.ts`,
  guarded by `hasCouncil()` so it never scaffolds into an empty dir before the
  setup form. Replaces a stale block with the latest text on every launch.
- **On adapter change:** because the copy set is adapter-aware, refresh it when
  councillors are created / edited / deleted (`src/lib/server/councillors.ts`):
  ensure a copy exists for every adapter now present, and prune a copy whose
  adapter is gone **only if that file is solely our block** (leave files that also
  carry user content — just drop our block from them, or leave it as harmless).
- **On delete:** `deleteCouncilData()` strips the Landsraad block from managed
  files (removing a file only if our block was its entire content). (Fix a
  pre-existing gap in passing: `deleteCouncilData` also omits `meetings/` and
  `oeuvres/`.)

### Explicitly NOT injected

Distinct from the **roster**, which `assembleContextFor` injects into every
prompt: the guide is delivered by native file pickup, so `context.ts` is
untouched and assembled prompts carry zero extra tokens.

---

## Part B — Docs consolidation (the headline win)

One canonical vocabulary, applied across the **living** docs. Leave the dated
`docs/superpowers/specs/*` and `docs/superpowers/plans/*` as historical records —
rewriting point-in-time design history is out of scope.

### Canonical glossary

Source of truth lives in `SPECIFICATION.md` (`## Glossary`); the council
`AGENTS.md` block is the terse derivative. Proposed canonical terms:

- **Director** — the one human user; creates councils, writes briefs, reviews
  outputs/proposals, edits shared memory, **does all coordination**. (Retire the
  competing nouns "user"/"operator" — and drop "secretary" entirely; see below.)
- **Council** — a group of councillors plus its on-disk state; a council *is* a
  directory; one per directory.
- **Councillor** — a named AI member (role + persona + adapter). The canonical
  term; "agent" / "council member" are informal synonyms only.
- **Adapter** — how a councillor is invoked (`cli:claude`, `mock:local`, …).
- **Job** — one unit of work for one councillor. Canonical noun (not "task").
- **Brief** — the director's free-form prompt for a job. Distinct from **Prompt**
  = the fully assembled `input.md` the adapter receives.
- **Reflection** — the post-success extra adapter call that may emit blocks.
- **Memory** — markdown notes; **shared** (council-wide) vs **private**
  (per-councillor, reflection-created).
- **`<<MEMORY>>` / `<<JOB>>` blocks** — the fenced protocol; MEMORY is applied,
  JOB becomes a proposal.
- **Proposal** — a `<<JOB>>` suggestion queued for director approve/reject (never
  auto-run).
- **Roster** — auto-generated one-line-per-councillor list injected into prompts.
- **Schedule** — a declaration to create a job later (once) or on a cron
  (recurring).
- **Meeting** — synchronous round-table; director participates each round.
  - **Round** — one full pass: director speaks (or skips), then each attendee
    speaks once.
  - **Turn (meeting)** — one councillor speaking once within a round.
  - **Chair** — the councillor who writes the rolling summary + closing synthesis.
- **Oeuvre** — asynchronous, goal-driven work loop that produces an artifact.
  - **Leader** — orchestrates; picks who goes next; never takes a turn, never
    picks itself, never votes.
  - **Participant** — a non-leader councillor who takes turns and votes.
  - **Turn (oeuvre)** — one participant taking the baton (revise scratchpad +
    vote). **Each oeuvre turn is a real Job under the hood.**
  - **Scratchpad** — the shared evolving artifact (the "baton").
  - **Vote** — `finish`/`continue` against the current scratchpad version.
- **Template** — a reusable, shareable council definition (`*.template.json`).
- **Host / peer / remote attendee** — cross-council terms: the **host** convenes
  and owns a cross-council meeting; a **peer** is another running council; a
  **remote attendee** is a councillor on a peer.
- **Turn (the gotcha)** — always a *structured contribution* inside a meeting
  round or an oeuvre loop — never a chat message or a free-running session.
- Standardize on **turn**; retire loose use of **cycle** (the oeuvre spec's
  "each cycle …" → "each turn …" or define cycle = one leader-pick + one turn).

### Specific inconsistencies to fix (found during this audit)

- **Remove the vestigial "secretary" idea.** Per PR #2, the concept is dead
  wood. Delete "You are also the secretary" (`README.md:60`) and drop the now-moot
  "there is no secretary agent" caveat (`SPECIFICATION.md:47`) — the director
  simply "does all coordination." Grep the tree to confirm no other "secretary"
  references remain.
- **Stale duplicate:** repo `AGENTS.md` and `CLAUDE.md` are near-identical, but
  `AGENTS.md`'s "Out of scope" is stale — it still lists agent execution /
  scheduler / memory / retrieval / adapters as unbuilt, when those shipped
  (`CLAUDE.md` is the updated copy). Converge them (single source + thin pointer,
  or keep in lockstep).
- **Orphaned doc tree:** `doc/UX.md` (singular `doc/`) sits outside the `docs/`
  tree. Relocate to `docs/` (e.g. `docs/ux-review.md`); light term reconciliation
  only — it's a dated review, don't rewrite it.
- **"agent" vs "councillor":** the spec is canonical on "councillor" but sprinkles
  "AI agents"; the feature is named "Agent Proposals." Apply the glossary; a
  doc-only rename of the spec section "Agent Proposals" → "Proposals" is safe
  (avoid renaming code symbols / tests in this pass).
- **turn / round / cycle** overload (257 hits across 18 files): tighten the
  living docs to the glossary definitions above.

### Docs to touch

- `SPECIFICATION.md` — new **Council guide (`AGENTS.md`)** concept under Core
  Concepts; new **`## Glossary`** section; Storage-model entry for the root
  `AGENTS.md` (+ adapter copies); terminology canonicalization; secretary removal.
- `README.md` — mention the guide files; **delete the "secretary" line**;
  vocabulary.
- `docs/data-model.md` — add `AGENTS.md` (+ adapter copies) to the layout tree;
  note managed-block / append / indexed semantics.
- `docs/architecture.md` — note the new `agents-doc` module and that the guide is
  **not** injected (contrast with the roster, which is).
- `docs/embeddings.md` — add `agents_doc` to the kind list + a logical-key
  example (it already uses `memory/house-rules#0` as an example — keep aligned).
- repo `AGENTS.md` + `CLAUDE.md` — converge the stale drift.
- `doc/UX.md` → `docs/`.

---

## Integration seams (concrete)

| File | Change |
|---|---|
| `src/lib/server/agents-doc.ts` *(new)* | Block constant + version + BEGIN/END markers; `ensureAgentsDoc()` (create-or-append-or-refresh, adapter-aware copy set), block extract/replace/strip helpers, `removeManagedBlocks()`. |
| `src/lib/server/paths.ts` | `agentsDocFile()` + adapter→filename map for the copy set. |
| `src/lib/server/embeddings.ts` | Add `'agents_doc'` to `ChunkKind`. |
| `src/lib/server/index-sources.ts` | New `IndexSource` for `^AGENTS\.md$` that indexes only the extracted BEGIN/END block. |
| `src/lib/server/councils.ts` | `createCouncil()` → `ensureAgentsDoc()`; `deleteCouncilData()` → strip managed blocks. |
| `src/lib/server/councillors.ts` | Refresh the adapter-aware copy set on create / update / delete. |
| `src/hooks.server.ts` | Startup `ensureAgentsDoc()` guarded by `hasCouncil()`. |
| `.gitignore` (repo) | Decide handling for dev append into the repo's tracked `AGENTS.md`/`CLAUDE.md` (see Risks). |
| `context.ts`, `watcher.ts`, `reconcile.ts` | **No change** (injection untouched; watcher already scans root; reconcile already routes through `resolveSource`). |

---

## Test plan (TDD — red first)

- `src/lib/server/agents-doc.test.ts` *(new)*
  - absent file → created with the BEGIN/END block;
  - existing foreign file → block **appended**, original content preserved;
  - existing block, old version → replaced in place (no duplicate block);
  - existing block, current → no-op (mtime not churned);
  - adapter-aware: a council with a `cli:qwen` councillor gets `QWEN.md`; a
    mock-only council gets no copies; the managed block is **identical** across
    `AGENTS.md` and every copy;
  - content sanity: block contains key glossary terms (Turn, Round, Councillor,
    Director) and stays under a byte budget (token-light).
- `src/lib/server/index-sources.test.ts` — `AGENTS.md` resolves to `agents_doc`
  (refId `'agents'`, one chunk = the extracted block, foreign text excluded); a
  copy (`CLAUDE.md`) resolves to `null`.
- `src/lib/server/councils.test.ts` — `createCouncil` lands `AGENTS.md`;
  `deleteCouncilData` strips the block and spares surrounding foreign content.
- `npm run check` clean; `npm test` green.

---

## Risks / wrinkles / open questions

- **Dev append into tracked files** — with append semantics, a dev-as-council run
  (`npm run dev`, repo = council root) appends the Landsraad block to the repo's
  tracked `AGENTS.md`/`CLAUDE.md` once a dev `council.json` exists, showing in
  `git status`. It is idempotent (re-runs update in place, no duplication) but
  pollutes the working tree. Options: guard the repo-root case
  (`councilRoot() === pkgRoot()` → skip), or accept the idempotent block. **Decide
  before building.**
- **Orphan copies** — removing the last councillor of an adapter: drop our block
  from that tool file (and delete the file if it was solely our block); leave
  files that also hold user content.
- **Director edits inside the block are lost on refresh** — the block is managed;
  the BEGIN marker should say so. Editing *outside* the block is always safe.
- **Coverage gaps** — `mock:local`, `cli:grok`, and unconfirmed
  `cli:vibe`/`cli:warp`/`cli:aider` read no dropped file. Acceptable; revisit
  per-tool (confirm vibe/warp conventions).
- **Versioning / staleness detection** — simplest is to **compare the extracted
  block against the current canonical text and replace if they differ** (no
  explicit version number needed); the `v1` tag in the BEGIN marker is then just
  informational. A content hash in the marker is only an optimization if
  extract-and-compare ever gets expensive.
- **Glossary home** — `SPECIFICATION.md` vs a standalone `docs/glossary.md` the
  spec links. Leaning spec-as-source.

---

## Suggested sequencing (when we build)

1. Docs consolidation + canonical glossary in `SPECIFICATION.md` (spec-first),
   including the secretary removal.
2. Failing tests for `agents-doc` (managed block + adapter-aware) + index source.
3. `agents-doc.ts` module + block constant; wire `createCouncil` + startup +
   councillor-change refresh + delete; add the `agents_doc` index source/kind.
4. Remaining doc updates (README, data-model, architecture, embeddings; repo
   `AGENTS.md`/`CLAUDE.md` convergence; relocate `doc/UX.md`).
5. `npm test` + `npm run check`; smoke a fresh council, an existing one, and an
   add-a-Qwen-councillor flow.
