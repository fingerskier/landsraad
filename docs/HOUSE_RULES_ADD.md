# Plan — Council guide files + docs consolidation

Status: **plan / not started.** Working name was `HOUSE_RULES.md`; the shipped
artifact is `AGENTS.md` (plus per-tool copies). This document is the plan only —
no code has been written.

## One-liner

Land a terse, **indexed** Landsraad guide (`AGENTS.md` + per-tool copies) in
**every** council so any councillor knows what system it has been included in —
and use the glossary that guide needs as the forcing function to **consolidate
and tighten the existing docs**. The docs cleanup is the bigger prize; the guide
file is what it feeds.

---

## Why

A councillor invoked as a CLI subprocess gets a persona, a roster, and retrieved
memory — but **no orientation about Landsraad itself**. It can't reliably know
that "Turn" is a structured contribution inside a meeting round or an oeuvre
loop (not a chat message), that a `<<JOB>>` block becomes a *reviewed proposal*
rather than an auto-run job, or that there is no secretary agent and the director
does all coordination. The guide gives every councillor that context in its own
native workflow.

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
| 3 | Per-tool pickup | **Copies for every tool**, generated from the canonical `AGENTS.md` (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`, … — see [matrix](#per-tool-pickup-why-copies)). |
| 4 | Ownership | **Landsraad owns & overwrites**, guarded by a sentinel so it only ever rewrites its *own* managed files, never a foreign `AGENTS.md`/`CLAUDE.md`. |
| 5 | Indexing | **Always index** — the canonical `AGENTS.md` only, as a new `agents_doc` chunk kind. Copies are not indexed. |
| 6 | Prompt injection | **None.** Delivery is native file pickup, not `assembleContextFor`. |
| 7 | Which councils | **Every** council — written on create *and* ensured on startup (backfills existing councils). |
| 8 | Docs sweep | **Broad** consolidation across the living docs, anchored to one canonical glossary. |
| 9 | Content goal | **Token-light** while conveying Landsraad's capabilities + opinionation + glossary. |

---

## Part A — The council guide file

### Per-tool pickup (why copies)

Verified headless behavior of the adapters Landsraad ships (`SPECIFICATION.md`
adapter table), early 2026:

| Adapter | Memory file read in headless mode | Sees a bare `AGENTS.md`? |
|---|---|---|
| `cli:claude` | `CLAUDE.md` (loaded by `claude -p` unless `--bare`) | ❌ needs `CLAUDE.md` |
| `cli:codex` | `AGENTS.md` | ✅ |
| `cli:gemini` | `GEMINI.md` | ❌ needs `GEMINI.md` |
| `cli:qwen` | `QWEN.md` | ❌ needs `QWEN.md` |
| `cli:grok` | none (config-only) | n/a — inert |
| `cli:vibe` | unconfirmed | verify |
| `cli:aider` | `CONVENTIONS.md` via `--read` / config, not auto root memory | inert unless configured |
| `cli:warp` | unconfirmed | verify |
| `mock:local` | reads no file | inert (stub) |

Reference: Claude Code reads `CLAUDE.md`, not `AGENTS.md`, today
([anthropics/claude-code#34235](https://github.com/anthropics/claude-code/issues/34235));
`@AGENTS.md` import is the documented bridge. Because no single filename covers
the fleet, **write the same content to every known convention file.**

**Copy set (fixed):** `AGENTS.md` (canonical) + `CLAUDE.md`, `GEMINI.md`,
`QWEN.md`. Optionally `GROK.md` and others as inert-but-harmless placeholders.
All copies are byte-identical to the canonical and regenerated from one source
constant, so they never drift.

> Open question: fixed set vs **adapter-aware** (only emit the convention file
> for adapters actually configured in the council). Fixed is simpler and matches
> "every Landsraad gets them"; adapter-aware keeps council dirs cleaner. Default
> to fixed; revisit if the clutter bites.

### Content (token-light)

A single short markdown doc. Sections, roughly:

1. **What Landsraad is** (2–3 lines): a local-first council of AI **councillors**
   directed by one human **director**; you are a councillor; the council *is*
   this directory.
2. **Opinionation** (terse bullets): file-first/local-first; one council per
   directory; the director does all coordination (no secretary agent); memory is
   markdown; nothing leaves the machine.
3. **How you participate**: jobs (brief → output), meetings (turns within rounds,
   a chair synthesizes), oeuvres (turns on a shared scratchpad, votes, a leader
   orchestrates).
4. **Block protocol** — the highest-leverage, easiest-to-get-wrong bit:
   ```
   <<MEMORY title="...">> … <</MEMORY>>          # applied to memory
   <<JOB title="..." councillor="slug">> … <</JOB>>  # becomes a reviewed proposal
   ```
5. **Glossary** — the canonical terms (see [Part B](#canonical-glossary)),
   trimmed to the entries a councillor needs in-context, with **Turn**
   disambiguated (meeting turn vs oeuvre turn).

First line is the **sentinel** (see below). Keep the whole file tight — it is
read into context by every tool that supports it, so every line costs tokens at
run time for those tools.

### Ownership & the sentinel guard

`AGENTS.md` is Landsraad-owned and refreshed to the current shipped version, but
must never destroy a *foreign* file (notably **this repo's own tracked
`AGENTS.md` and `CLAUDE.md`** when `npm run dev` runs with the checkout as the
council root).

- First line is a sentinel comment, e.g.
  `<!-- LANDSRAAD:AGENTS_DOC v1 — managed file; edits may be overwritten. Edit your council, not this file. -->`
- Write/overwrite a convention file **only if** it is absent **or** already
  carries the sentinel. A file present *without* the sentinel is foreign → skip
  and log once.
- When the sentinel is present and content already matches the current version →
  **no-op** (don't churn mtime, so the watcher doesn't re-embed needlessly).

> If the director later wants editable house rules, add a `managed: false` escape
> hatch; out of scope for v1.

### Indexing

- Add `agents_doc` to the `ChunkKind` union (`src/lib/server/embeddings.ts`).
- Add an `IndexSource` (`src/lib/server/index-sources.ts`) matching `^AGENTS\.md$`
  at the council root: `kind: 'agents_doc'`, constant `refId` (`'agents'`),
  one whole-file chunk with the sentinel line stripped.
- The pull-based watcher already scans the root and ignores only dotfiles /
  `.index` / `node_modules` / `.git`, so `AGENTS.md` is picked up with **no
  watcher change**. The copies (`CLAUDE.md`, `GEMINI.md`, …) match no source and
  are therefore **not indexed** — only the canonical is, so there is exactly one
  `agents_doc` chunk and no duplicates.

### Where it lands

- **On create:** call `ensureAgentsDoc()` at the end of `createCouncil()`
  (`src/lib/server/councils.ts`). This is the single chokepoint — `applyTemplate()`
  routes through `createCouncil()` (`templates.ts:436`), so template installs get
  it for free.
- **On startup (backfill):** call `ensureAgentsDoc()` from `src/hooks.server.ts`,
  guarded by `hasCouncil()` so it never scaffolds into an empty dir before the
  setup form runs. Existing councils pick it up on next launch; the sentinel
  no-op keeps it cheap.
- **On delete:** `deleteCouncilData()` should remove the managed convention files
  **only if** they carry the sentinel (don't delete a foreign `AGENTS.md`).
  (Note a pre-existing gap to fix in passing: `deleteCouncilData` already omits
  `meetings/` and `oeuvres/`.)

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
`AGENTS.md` is the terse derivative. Proposed canonical terms:

- **Director** — the one human user; creates councils, writes briefs, reviews
  outputs/proposals, edits shared memory, does all coordination. *No secretary
  agent.* (Retire competing nouns: "user", "operator", "secretary".)
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

- **Secretary contradiction:** `README.md:60` ("You are also the secretary") vs
  `SPECIFICATION.md:47` ("there is no secretary agent"). Reconcile to the
  director vocabulary.
- **Stale duplicate:** repo `AGENTS.md` and `CLAUDE.md` are near-identical, but
  `AGENTS.md`'s "Out of scope" is stale — it still lists agent execution /
  scheduler / memory / retrieval / adapters as unbuilt, when those shipped
  (`CLAUDE.md` is the updated copy). Converge them (single source + thin
  pointer, or keep in lockstep). Meta-note: the repo's own agent docs want the
  same treatment the council guide gives councils.
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
  `AGENTS.md` (+ copies); terminology canonicalization.
- `README.md` — mention the guide files; fix the "secretary" line; vocabulary.
- `docs/data-model.md` — add `AGENTS.md` (+ copies) to the layout tree; note
  managed/sentinel/indexed semantics.
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
| `src/lib/server/agents-doc.ts` *(new)* | Canonical content constant + version + sentinel; `ensureAgentsDoc()` (generate/refresh, sentinel-guarded), `removeManagedAgentsDocs()`. |
| `src/lib/server/paths.ts` | `agentsDocFile()` + paths/names for the copy set. |
| `src/lib/server/embeddings.ts` | Add `'agents_doc'` to `ChunkKind`. |
| `src/lib/server/index-sources.ts` | New `IndexSource` for `^AGENTS\.md$` (strip sentinel from indexed text). |
| `src/lib/server/councils.ts` | `createCouncil()` → `ensureAgentsDoc()`; `deleteCouncilData()` → remove managed files (sentinel-guarded). |
| `src/hooks.server.ts` | Startup `ensureAgentsDoc()` guarded by `hasCouncil()`. |
| `.gitignore` (repo) | Ignore generated copies that aren't the repo's own tracked files (e.g. `GEMINI.md`, `QWEN.md`) so dev-as-council doesn't litter `git status`. Do **not** ignore the tracked `AGENTS.md`/`CLAUDE.md`. |
| `context.ts`, `watcher.ts`, `reconcile.ts` | **No change** (injection untouched; watcher already scans root; reconcile already routes through `resolveSource`). |

---

## Test plan (TDD — red first)

- `src/lib/server/agents-doc.test.ts` *(new)*
  - writes `AGENTS.md` + each copy with the sentinel when absent;
  - idempotent: second call no-ops on identical content (mtime not churned);
  - refresh: sentinel present but old content → overwritten to current;
  - guard: file present **without** sentinel → left untouched;
  - content sanity: contains key glossary terms (Turn, Round, Councillor,
    Director) and stays under a byte budget (token-light assertion);
  - copies are byte-identical to the canonical.
- `src/lib/server/index-sources.test.ts` — `AGENTS.md` resolves to `agents_doc`
  (refId `'agents'`, one chunk, sentinel stripped); a copy (`CLAUDE.md`) resolves
  to `null` (not indexed).
- `src/lib/server/councils.test.ts` — `createCouncil` lands the guide files;
  `deleteCouncilData` removes managed ones and spares a planted foreign
  `AGENTS.md`.
- `npm run check` clean; `npm test` green.

---

## Risks / wrinkles / open questions

- **Dev clobber** of the repo's own `AGENTS.md`/`CLAUDE.md` → sentinel guard
  (skip foreign). Untracked `GEMINI.md`/`QWEN.md` in dev → gitignore them or go
  adapter-aware; the `hasCouncil()` startup guard already means a fresh checkout
  with no council writes nothing.
- **Director edits lost on refresh** — "owns & overwrites" means the guide is not
  a customization surface; the sentinel line says so. Future `managed:false`
  toggle if needed.
- **Copy drift** — eliminated by regenerating all copies from one source constant.
- **Coverage gaps** — `mock:local`, `cli:grok`, and unconfirmed
  `cli:vibe`/`cli:warp`/`cli:aider` won't read a dropped file; copies are inert
  there. Acceptable; revisit per-tool.
- **Versioning** — refresh-on-version-bump via an explicit `AGENTS_DOC_VERSION`
  const (or content hash). Decide which.
- **Glossary home** — in `SPECIFICATION.md` vs a standalone `docs/glossary.md`
  that the spec links. Leaning spec-as-source.
- **Reset semantics** — should `npm run reset` / `deleteCouncilData` drop the
  managed guide files? (Plan: yes, sentinel-guarded.)

---

## Suggested sequencing (when we build)

1. Docs consolidation + canonical glossary in `SPECIFICATION.md` (spec-first).
2. Failing tests for `agents-doc` + index source.
3. `agents-doc.ts` module + content constant; wire `createCouncil` + startup +
   delete; add the `agents_doc` index source/kind.
4. Remaining doc updates (README, data-model, architecture, embeddings; repo
   `AGENTS.md`/`CLAUDE.md` convergence; relocate `doc/UX.md`).
5. `npm test` + `npm run check`; smoke a fresh council and an existing one.
