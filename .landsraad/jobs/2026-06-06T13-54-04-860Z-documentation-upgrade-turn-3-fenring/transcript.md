[stderr] OpenAI Codex v0.137.0
--------
[stderr] workdir: .
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)
reasoning effort: medium
reasoning summaries: none
session id: 019e9d36-5ba4-7b22-8238-5670216503b7
--------
user
# Persona

# Persona — Fenring

## Mission
Turn landsraad's specs and decisions into shipped SvelteKit code that
holds up under dogfooding.

## Responsibilities
- Implement features in `src/lib/server/*` and `src/routes/*` against
  the current specs in `docs/superpowers/specs/`.
- Own the storage model: `councillor.json`, `persona.md`, `memory/`,
  `memory_private/`, `jobs/`, `proposals/`, `.index/`.
- Keep the parser/runner/reflection pipeline correct: `<<MEMORY>>`,
  `<<JOB>>`, future `<<PROMOTE>>`.
- Maintain tests in lock-step with code; never ship an untested
  surface.

## How to think
- Reuse what already exists in `src/lib/server` before introducing a
  new module — assembleContextFor, indexer, runner, roster are first
  stops.
- The cwd is the council root. No multi-council routing, no slug
  args in paths. If a change implies otherwise, push back.
- Additive schema beats migrations. Defaulting an unknown field to
  `''` or `false` is the right back-compat move.
- Red-green TDD: a failing test first, then the smallest fix.

## When to defer / route
- Product direction / synthesis across councillors → `leto`.
- "Does this miss an edge case?" or spec gap-finding → `vladimir`.
- Naming, docs, user-facing copy → `shaddam`.

## Output conventions
- `<<JOB councillor="…">>` for concrete code follow-ups only —
  e.g. "extend X to handle Y", not "investigate Z".
- `<<MEMORY scope="shared">>` for invariants every councillor must
  respect (storage shape, parser rules). Implementation trivia stays
  private.
- Cite file paths with line numbers in reflections so reviewers can
  jump straight in.

# Council roster

fenring — Fenring — Implementer — SvelteKit code, schema/storage work, parser/runner internals, tests
leto — Leto — Synthesizer — decisions that need cross-councillor synthesis, product narrative, tie-breaking
shaddam — Shaddam — Evangelist — docs, onboarding, positioning, end-user UX framing
vladimir — Vladimir — Critic — gap audits, spec review, edge-case enumeration, regression risk

# Task: Documentation Upgrade · turn 3 · fenring

You are advancing a shared work loop ("oeuvre") toward a goal.

## Goal

Read documentation to create a docs/GLOSSARY.md of Landsraad specific agent terms (things like "turn", "councillor", "oeuvre" that have a special meaning to Landsraad agents) and a docs/TAGS.md that explains the agents tags like <<JOB ..>>, <<MEMORY ...>>, etc.


## Leader says

Close the three parser/registry mismatches and add council-root/machine frame terms before shaddam wires README.

## Current scratchpad (v1)

# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v2 — both files SHIPPED to disk (shaddam, turn 2).** The drafts below
have been split into two real files, completed (the previously-truncated TAGS
section is now whole), voice-edited for a first-time reader, provenance tags
stripped, and cross-linked. Remaining work is verification, not authoring.

- `docs/GLOSSARY.md` — written. Sections: The frame · Doing work · Memory ·
  Meetings · Oeuvres · Packaging. ~50 terms, canonical-vs-synonym called out,
  "turn" gotcha boxed, frame-four flagged as read-first.
- `docs/TAGS.md` — written. Parsing rules (whitespace-tolerant, unknown-ignored,
  fail-safe) · scan-site table · full per-tag reference for
  `<<MEMORY>>` / `<<JOB>>` / `<<NEXT>>` / `<<SCRATCHPAD>>` / `<<VOTE>>`, each with
  a real example and attribute list. `<<SCHEDULE>>` explicitly marked not-implemented.

All content grounded in `SPECIFICATION.md`, `docs/architecture.md`,
`docs/data-model.md`, `docs/embeddings.md`, `docs/HOUSE_RULES_ADD.md`, and
`docs/superpowers/specs/2026-06-05-oeuvre-design.md` (the canonical source for the
oeuvre tag semantics — invalid-pick re-ask-then-pause, version-bump invalidates
finish votes, missing-vote-defaults-to-continue).

## What's left before this oeuvre should conclude
1. **Technical accuracy pass (→ fenring).** Verify the GLOSSARY/TAGS claims against
   actual code, not just specs: adapter list (`cli:*` tools), the chunk-kind enum
   (`embeddings.md`), `<<NEXT>>`/`<<SCRATCHPAD>>`/`<<VOTE>>` parser behavior in
   `oeuvre-blocks.ts`, and the `?model=` tier names (`lite`/`medium`/`heavy`).
2. **Gap / mislead audit (→ vladimir).** Anything a newcomer would still be
   confused by? Any term defined here that contradicts product UI copy? Any
   load-bearing term missing (e.g. council root vs `.landsraad/` "machine vs
   product" framing — currently implied in the Index entry, not its own term)?
3. **README/INDEX wiring (→ shaddam, next turn).** Link both new files from
   `README.md` and/or `docs/` so they're discoverable. Decide whether `gzip_density`
   and the planned `AGENTS.md` council-guide deserve "(planned)" stubs.

## Decisions locked this turn (carry into any edits)
- Audience: someone landing mid-system who needs word → mental-model fast.
- Canonical terms bold; retired synonyms named inline ("older docs may say…").
- We say **councillor** not "agent", **director** not "user/operator",
  **job** not "task", **turn** only ever means a structured meeting/oeuvre turn.
- TAGS.md leads with parsing guarantees so emitters trust fail-safe behavior.

## Your task

Revise the scratchpad to move the goal forward, OR ratify it unchanged if you
believe the goal is met. If you edit, return the FULL updated scratchpad between
the fences (omit the block entirely to make no change):

<<SCRATCHPAD>>
...full updated scratchpad markdown...
<</SCRATCHPAD>>

Then vote on whether the goal is achieved. Emit exactly one:

<<VOTE value="finish|continue" reason="one line: why">>

[stderr] codex
I’ll initialize against the project orchestration layer first, then I’ll verify the docs against the code and update the scratchpad/vote from that evidence.
[stderr] codex
I don’t have a Ceres MCP tool exposed in this session; discovery only surfaced Reqall and GitHub, and no `list_products`/spec/task tools are callable. I’m continuing with the repository and the provided oeuvre task as the available source of truth.
[stderr] exec
/bin/zsh -lc 'git status --short' in .
 succeeded in 0ms:
?? .landsraad/jobs/2026-06-06T13-54-04-860Z-documentation-upgrade-turn-3-fenring/

[stderr] exec
/bin/zsh -lc 'rg --files' in .
[stderr]  succeeded in 352ms:
src/routes/oeuvres/[id]/+page.svelte
src/routes/oeuvres/[id]/+page.server.ts
src/routes/oeuvres/new/+page.svelte
src/routes/oeuvres/new/+page.server.ts
src/routes/oeuvres/+page.svelte
src/routes/oeuvres/+page.server.ts
src/routes/proposals/+page.svelte
src/routes/proposals/+page.server.ts
src/app.d.ts
CLAUDE.md
vitest.config.ts
vite.config.ts
AGENTS.md
tsconfig.json
src/routes/help/help-route.test.ts
src/routes/help/+page.svelte
src/routes/help/+page.server.ts
src/routes/+layout.svelte
LICENSE
svelte.config.js
SPECIFICATION.md
src/routes/councillors/new/+page.svelte
src/routes/councillors/new/+page.server.ts
templates/dogfood.template.json
bin/diag.js
bin/find-port.js
bin/diag.test.js
bin/landsraad.js
bin/registry.js
bin/find-port.test.js
bin/registry.test.js
docs/embeddings.md
docs/HOUSE_RULES_ADD.md
docs/architecture.md
docs/OPEN_QUESTIONS.md
src/routes/meetings/[id]/+page.svelte
src/routes/meetings/[id]/+page.server.ts
src/routes/meetings/[id]/meeting-detail.test.ts
src/routes/meetings/meetings-route.test.ts
scripts/build-cli.mjs
scripts/template-install.ts
scripts/reset.ts
scripts/template-export.ts
scripts/reindex.ts
src/routes/councillors/[c_slug]/edit/+page.svelte
src/routes/councillors/[c_slug]/edit/+page.server.ts
src/routes/meetings/new/+page.svelte
src/routes/meetings/new/+page.server.ts
src/routes/meetings/+page.svelte
src/routes/meetings/+page.server.ts
static/favicon.svg
example/writing-team.template.json
package.json
example/landsraad.template.json
package-lock.json
example/c-suite.template.json
README.md
example/hedge-fund.template.json
example/engineering.template.json
src/routes/+page.server.ts
src/hooks.server.ts
src/app.html
docs/data-model.md
docs/TAGS.md
docs/GLOSSARY.md
docs/UX.md
docs/superpowers/specs/2026-05-30-cross-council-meetings-design.md
docs/superpowers/specs/2026-05-31-council-settings-page-design.md
docs/superpowers/specs/2026-06-05-dot-landsraad-layout-and-workspace-index-design.md
docs/superpowers/specs/2026-06-05-oeuvre-design.md
docs/superpowers/specs/2026-05-25-scheduler-design.md
docs/superpowers/specs/2026-05-28-council-meetings-design.md
docs/superpowers/specs/2026-05-31-council-env-editor-design.md
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md
docs/superpowers/specs/2026-05-25-engineering-template-design.md
docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md
docs/superpowers/specs/2026-05-28-memory-promotion-design.md
docs/superpowers/specs/2026-06-01-template-env-seeding-design.md
src/app.css
src/routes/councillors/[c_slug]/memory/[note]/+page.svelte
src/routes/councillors/[c_slug]/memory/[note]/+page.server.ts
src/routes/councillors/[c_slug]/+page.svelte
src/routes/councillors/[c_slug]/+page.server.ts
src/lib/time.ts
src/lib/meeting-status.ts
src/lib/back-nav.ts
docs/superpowers/plans/2026-06-01-template-env-seeding.md
docs/superpowers/plans/2026-05-25-tech-writing-template.md
docs/superpowers/plans/2026-05-26-scheduler.md
docs/superpowers/plans/2026-05-30-cross-council-meetings.md
docs/superpowers/plans/2026-06-05-dot-landsraad-layout-and-workspace-index.md
docs/superpowers/plans/2026-06-02-pull-based-indexer.md
docs/superpowers/plans/2026-05-28-memory-promotion.md
docs/superpowers/plans/2026-05-25-engineering-template.md
docs/superpowers/plans/2026-05-31-council-settings-page.md
docs/superpowers/plans/2026-05-28-council-meetings.md
src/routes/memory/+page.server.ts
src/routes/+page.svelte
src/routes/memory/+page.svelte
src/routes/api/openapi.json/+server.ts
src/routes/import/+page.svelte
src/routes/import/+page.server.ts
src/routes/memory/[note]/+page.svelte
src/routes/memory/[note]/+page.server.ts
src/lib/env-suggestions.test.ts
src/lib/back-nav.test.ts
src/lib/env-suggestions.ts
src/lib/meeting-status.test.ts
src/routes/memory/new/+page.svelte
src/routes/memory/new/+page.server.ts
src/lib/types.ts
src/lib/components/EmptyState.svelte
src/routes/api/instances/+server.ts
src/lib/components/Badge.svelte
src/lib/components/Markdown.svelte
src/lib/components/index.ts
src/lib/components/StatusBadge.svelte
src/lib/components/Card.svelte
src/lib/components/Button.svelte
src/lib/components/PageHeader.svelte
src/routes/home-route.test.ts
src/routes/api/peers/peers-route.test.ts
src/routes/api/peers/+server.ts
src/routes/jobs/new/+page.svelte
src/routes/jobs/new/+page.server.ts
src/routes/council/council-route.test.ts
src/routes/council/EnvVarRow.svelte
src/routes/council/+page.svelte
src/routes/council/+page.server.ts
src/routes/+layout.server.ts
src/routes/jobs/+page.server.ts
src/routes/api/council/council-route.test.ts
src/routes/api/council/+server.ts
src/routes/jobs/+page.svelte
src/routes/jobs/[jid]/+page.svelte
src/routes/jobs/[jid]/+page.server.ts
src/lib/server/reconcile.ts
src/routes/export/export-route.test.ts
src/lib/server/scheduler.test.ts
src/lib/server/peers.test.ts
src/lib/server/meeting-prompt.test.ts
src/lib/server/roster.ts
src/lib/server/schedules.ts
src/lib/server/oeuvres.ts
src/lib/server/instances.test.ts
src/lib/server/oeuvres.test.ts
src/lib/server/councillors.ts
src/routes/export/+page.server.ts
src/routes/export/+page.svelte
src/lib/server/meeting-remote.ts
src/lib/server/indexer.test.ts
src/lib/server/index-sources.ts
src/lib/server/reflection.test.ts
src/lib/server/embeddings.test.ts
src/lib/server/schedules.test.ts
src/lib/server/proposals.ts
src/lib/server/meeting-runner.ts
src/lib/server/scheduler.ts
src/lib/server/watcher.ts
src/lib/server/env-file.test.ts
src/lib/server/embedder-xenova.ts
src/lib/server/watcher.test.ts
src/lib/server/cron.test.ts
src/routes/api/meeting/turn/turn-route.test.ts
src/routes/api/meeting/turn/+server.ts
src/lib/server/meetings-paths.test.ts
src/lib/server/oeuvre-runner.test.ts
src/lib/server/gitignore.ts
src/lib/server/templates.ts
src/lib/server/jobs.ts
src/lib/server/embeddings.ts
src/lib/server/oeuvre-index.test.ts
src/lib/server/participation.ts
src/lib/server/oeuvre-runner.ts
src/lib/server/jobs.test.ts
src/lib/server/context.ts
src/lib/server/templates.test.ts
src/lib/server/openapi.test.ts
src/lib/server/indexer.ts
src/lib/server/meetings.test.ts
src/lib/server/context.test.ts
src/routes/export/download/+server.ts
src/lib/server/meeting-index.test.ts
src/lib/server/proposals.test.ts
src/lib/server/memory_private.test.ts
src/lib/server/oeuvre-blocks.test.ts
src/lib/server/meeting-runner.test.ts
src/lib/server/runner.ts
src/lib/server/templates.bundled.test.ts
src/lib/server/index-sources.test.ts
src/lib/server/memory_private.ts
src/lib/server/reconcile.test.ts
src/lib/server/councils.ts
src/lib/server/openapi.ts
src/lib/server/config.ts
src/lib/server/oeuvre-prompt.ts
src/lib/server/meeting-recovery.test.ts
src/lib/server/open_editor.ts
src/lib/server/paths.ts
src/lib/server/councillor-lock.test.ts
src/lib/server/reflection-apply.test.ts
src/lib/server/instances.ts
src/lib/server/paths.test.ts
src/lib/server/meetings.ts
src/lib/server/memory.test.ts
src/lib/server/cron.ts
src/lib/server/runner.test.ts
src/lib/server/reflection.ts
src/lib/server/memory.ts
src/lib/server/oeuvre-blocks.ts
src/lib/server/councils.test.ts
src/routes/schedules/[id]/+page.server.ts
src/lib/server/meeting-runner-remote.test.ts
src/routes/schedules/[id]/+page.svelte
src/lib/server/net.ts
src/lib/server/templates.writing-team.test.ts
src/lib/server/participation.test.ts
src/lib/server/meeting-prompt.ts
src/lib/server/councillor-lock.ts
src/lib/server/peers.ts
src/lib/server/roster.test.ts
src/lib/server/templates.engineering.test.ts
src/routes/schedules/+page.server.ts
src/lib/server/env-file.ts
src/lib/server/net.test.ts
src/routes/schedules/+page.svelte
src/lib/server/oeuvre-prompt.test.ts
src/lib/server/gitignore.test.ts
src/lib/server/meeting-remote.test.ts
src/lib/server/adapters/cli.test.ts
src/lib/server/adapters/index.ts
src/lib/server/adapters/mock.test.ts
src/lib/server/adapters/runAdapter.ts
src/lib/server/adapters/types.ts
src/lib/server/adapters/cli.ts
src/lib/server/adapters/install.test.ts
src/lib/server/adapters/runAdapter.test.ts
src/lib/server/adapters/mock.ts
src/routes/schedules/[id]/edit/+page.svelte
src/routes/schedules/[id]/edit/+page.server.ts
src/routes/schedules/new/+page.svelte
src/routes/schedules/new/+page.server.ts

[stderr] codex
The worktree already has an untracked `.landsraad/jobs/...` directory from this loop; I’ll leave it alone and keep edits scoped to docs if the verification shows mismatches. Next I’m checking the tag parser, registry, index kinds, and model tier handling against the two shipped docs.
[stderr] exec
/bin/zsh -lc "sed -n '1,260p' docs/TAGS.md" in .
 succeeded in 0ms:
# Agent tags

Councillors talk to Landsraad through **tags** — fenced control blocks an agent
writes in its output. The host parses them and acts: records a memory, queues a
proposal, picks the next worker. Everything else a councillor writes is just prose.

For the terms used below (reflection, proposal, oeuvre, leader, participant,
scratchpad), see the [Glossary](GLOSSARY.md).

## How parsing works

- Tags are recognized **only in the outputs where they apply** (see the table).
  A `<<JOB>>` in an ordinary job's main output does nothing — the scan happens in
  reflection.
- Parsing is **whitespace-tolerant** and tolerant of trailing prose around a block.
- **Unknown tags are ignored**, so adding a new tag later won't break old
  councillors.
- A malformed control tag **fails safe** — it's dropped or treated as the harmless
  default, never as a destructive action.

## Where each tag is recognized

| Tag | Who emits it | Scanned in |
|---|---|---|
| [`<<MEMORY>>`](#memory) | any councillor | reflection output · meeting synthesis · oeuvre consolidation |
| [`<<JOB>>`](#job) | any councillor | reflection output · meeting synthesis · oeuvre consolidation |
| [`<<NEXT>>`](#next) | oeuvre **leader** | leader-pick call |
| [`<<SCRATCHPAD>>`](#scratchpad) | oeuvre **participant** | worker-turn output |
| [`<<VOTE>>`](#vote) | oeuvre **participant** | worker-turn output |

`<<SCHEDULE>>` appears in some design notes but is **not implemented** — don't
emit it.

---

## `<<MEMORY>>`

Writes a memory note **directly** (it is not reviewed).

```
<<MEMORY title="short slug-friendly title">>
The thing worth remembering, in markdown.
<</MEMORY>>
```

- **Default → private memory** (the emitting councillor's own, indexed as
  `memory_private`).
- **`scope="shared"` → shared memory** (council-wide `memory/`, indexed as
  `memory`):

  ```
  <<MEMORY title="house style" scope="shared">>
  In the UI we say "councillor", never "agent".
  <</MEMORY>>
  ```

- Title collisions get a `-2`, `-3`, … suffix; nothing is overwritten.
- One reflection pass may emit several `<<MEMORY>>` blocks, mixing private and
  shared freely.

## `<<JOB>>`

Suggests a unit of work. It lands as a **proposal**, *not* a running job —
it waits at `/proposals` for the director to approve or reject.

```
<<JOB title="rewrite the empty state" councillor="shaddam" priority="normal">>
The brief: what the job should accomplish, in markdown.
<</JOB>>
```

- `title` — required; a short label for the proposal.
- `councillor` — optional; the **slug** of who should do it. Use a real slug from
  the roster — an unknown slug is flagged for the director to reassign. Omit it to
  leave the owner open.
- `priority` — optional; `normal` (default) or `high`.
- The block **body is the brief** for the proposed job.

---

## Oeuvre tags

These three only mean anything inside an active oeuvre, and only from the right
role. (See [Oeuvres](GLOSSARY.md#oeuvres-asynchronous-work-loops).)

## `<<NEXT>>`

**Leader only.** Picks the participant who takes the next turn.

```
<<NEXT councillor="fenring" say="focus on the parser edge cases">>
```

- `councillor` — required; must be an **in-pool participant that is not the
  leader**. An unknown, dropped-out, self, or missing slug is an **invalid pick**:
  the runner re-asks once, then pauses the oeuvre.
- `say` — optional steering note for the chosen participant.

## `<<SCRATCHPAD>>`

**Participant only.** Replaces the shared scratchpad with the block's contents.

```
<<SCRATCHPAD>>
...the full updated artifact, in markdown...
<</SCRATCHPAD>>
```

- Present, non-empty, and **different** from the current scratchpad ⇒ a
  **substantive edit**: it overwrites `scratchpad.md` and bumps
  `scratchpad_version` (which invalidates standing `finish` votes).
- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
  unchanged. Omit the block when you mean "leave it as is".
- Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.

## `<<VOTE>>`

**Participant only.** Records this turn's vote on whether the goal is met.

```
<<VOTE value="finish" reason="both files are complete and accurate">>
```

- `value` — `finish` or `continue`.
- `reason` — one line. On a `continue` vote this is what the leader routes on next,
  so make it actionable.
- A missing or malformed `<<VOTE>>` is treated as `continue` with
  `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
  loop.

[stderr] exec
/bin/zsh -lc "sed -n '1,260p' src/lib/server/oeuvre-blocks.ts" in .
[stderr]  succeeded in 0ms:
// Parsers for the fenced blocks an oeuvre's leader and workers emit. Kept pure
// and whitespace-tolerant, mirroring the reflection block parser. Unknown tags
// are ignored (forward-compat).
import type { OeuvreVote } from '$lib/types';

const ATTR_COUNCILLOR_RE = /councillor="([^"]*)"/;
const ATTR_SAY_RE = /say="([^"]*)"/;
const ATTR_VALUE_RE = /value="([^"]*)"/;
const ATTR_REASON_RE = /reason="([^"]*)"/;

export interface ParsedNext {
  councillor: string | null;
  say: string;
}

const NEXT_RE = /<<NEXT\b([^>]*)>>/;

/** Parse the leader's routing directive. Returns the first `<<NEXT>>` found. */
export function parseNext(text: string): ParsedNext | null {
  const m = NEXT_RE.exec(text);
  if (!m) return null;
  const attrs = m[1] ?? '';
  const councillorRaw = ATTR_COUNCILLOR_RE.exec(attrs)?.[1]?.trim() ?? '';
  const say = ATTR_SAY_RE.exec(attrs)?.[1]?.trim() ?? '';
  return { councillor: councillorRaw === '' ? null : councillorRaw, say };
}

const SCRATCHPAD_RE = /<<SCRATCHPAD>>([\s\S]*?)<<\/SCRATCHPAD>>/;

/**
 * Parse a worker's scratchpad edit. Returns the inner body (trimmed of a single
 * leading newline + trailing whitespace), or null when no block is present.
 */
export function parseScratchpad(text: string): string | null {
  const m = SCRATCHPAD_RE.exec(text);
  if (!m) return null;
  return m[1].replace(/^\n/, '').replace(/\s+$/, '');
}

export interface ParsedVote {
  value: OeuvreVote;
  reason: string;
}

const VOTE_RE = /<<VOTE\b([^>]*)>>(?:([\s\S]*?)<<\/VOTE>>)?/;

/**
 * Parse a worker's vote. A missing or malformed vote defaults to `continue` so
 * a garbled turn can never spuriously conclude the loop. The reason comes from
 * a `<</VOTE>>` body when present, otherwise the `reason="..."` attribute.
 */
export function parseVote(text: string): ParsedVote {
  const m = VOTE_RE.exec(text);
  if (!m) return { value: 'continue', reason: '(no vote emitted)' };
  const attrs = m[1] ?? '';
  const valueRaw = ATTR_VALUE_RE.exec(attrs)?.[1]?.trim();
  const value: OeuvreVote = valueRaw === 'finish' ? 'finish' : 'continue';
  const body = m[2]?.replace(/^\n/, '').replace(/\s+$/, '') ?? '';
  const attrReason = ATTR_REASON_RE.exec(attrs)?.[1]?.trim() ?? '';
  const reason = body || attrReason || (value === 'finish' ? '(approved)' : '(no reason given)');
  return { value, reason };
}

[stderr] exec
/bin/zsh -lc "sed -n '1,260p' docs/GLOSSARY.md" in .[stderr] 
[stderr]  succeeded in 0ms:[stderr] 
# Glossary

Landsraad-specific terms. If a word here also means something in plain English,
the entry describes what it means **inside a council**. Canonical terms are in
**bold**; informal synonyms are noted so you can recognize them in older docs.

New here? Read the four entries under [The frame](#the-frame) first — everything
else builds on them.

---

## The frame

**Director** — the one human user. The director creates councils, writes briefs,
reviews outputs, approves or rejects proposals, and edits shared memory. **All
coordination runs through the director** — councillors never command each other.
(Older docs may say "user" or "operator"; prefer "director".)

**Council** — a group of councillors plus all of its state on disk. A council
*is* a directory: one council per directory, no shared database.

**Councillor** — a named AI member of a council. A councillor is the sum of three
things: a **role** (what it's for), a **persona** (how it thinks and writes), and
an **adapter** (how it's actually run). "Agent" and "council member" are informal
synonyms; the product UI says "councillor".

**Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
(a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
small / mid / large model. `sdk:*` adapters are future work and out of scope today.

---

## Doing work

**Job** — one unit of work for one councillor. This is the core noun (not "task").
A job runs once; to repeat it, clone it. Its status moves through
`queued → running → succeeded` or `→ failed` or `→ cancelled`.

**Brief** — the director's free-form markdown prompt for a job: what you want done.

**Prompt** — the fully assembled `input.md` the adapter actually receives. The
brief is only part of it; Landsraad prepends the councillor's persona, the council
roster, shared memory, and that councillor's private memory.

**Reflection** — an extra adapter call made *after* a job succeeds, with the same
councillor, asking it to record what it learned. Reflection output may contain
[`<<MEMORY>>`](TAGS.md) and [`<<JOB>>`](TAGS.md) blocks. It's skipped on failed or
cancelled jobs, is non-fatal if it errors, and is time-bounded. A councillor can
opt out with `reflect: false`. While reflecting, that councillor's lane shows
**reflecting** (distinct from **busy**).

**Proposal** — a job a councillor *suggests*, emitted as a [`<<JOB>>`](TAGS.md)
block. A proposal never runs on its own: it waits at `/proposals` for the director
to approve or reject. This review gate is what stops councillors from spawning
work in a runaway loop.

**Roster** — an auto-generated, one-line-per-councillor list
(`slug — name — role — routing_hint`) injected into every prompt. It's how a
councillor knows which slugs exist, so a `<<JOB councillor="slug">>` lands on a
real teammate.

**routing_hint** — a short self-description each councillor carries
("implements SvelteKit code", "audits for gaps"). It appears in the roster so
others can route follow-up jobs to the right councillor.

**Schedule** — a standing instruction to create a job later. A schedule is either
`once` (at a specific time) or `recurring` (a 5-field cron expression, in local
time). A 30-second tick fires due schedules; missed fires are not replayed.

---

## Memory

**Memory** — markdown notes stored on disk. Two tiers:

- **Shared memory** — files under `memory/`, visible to every councillor in the
  council.
- **Private memory** — files under `councillors/<slug>/memory/`, visible only to
  that one councillor. Private memory is created *only* by reflection.

A reflection [`<<MEMORY>>`](TAGS.md) block writes to private memory by default;
adding `scope="shared"` routes it to the shared tier instead. One reflection pass
can write to both.

**Index** — a pull-based semantic search layer (sqlite-vec). Files on disk are the
source of truth; a watcher re-derives searchable chunks from them. It indexes both
the **council machine** (state under `.landsraad/`) and the **product** (`.md` and
`.txt` files in the working directory).

**Chunk kind** — the type tag on an indexed or retrieved piece of text:
`memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
and `project_file`. (`project_file` is a prose file from *your* project tree, as
opposed to the council's own machine state.)

---

## Meetings (synchronous round-tables)

**Meeting** — a synchronous round-table the director runs live. The director takes
part in every round. A meeting holds the busy-slot for every attendee, so their
jobs wait until it ends.

**Round** — one full pass of a meeting: the director speaks (or skips), then each
attendee speaks once, in randomized order.

**Turn (in a meeting)** — one councillor speaking once within a round.

**Chair** — the councillor that writes the meeting's rolling **summary** and, when
the director ends the meeting, the closing **synthesis**. The synthesis is scanned
for [`<<MEMORY>>`](TAGS.md) and [`<<JOB>>`](TAGS.md) blocks.

### Across councils

**Host** — the council that convenes and owns a cross-council meeting (its
transcript, chair, synthesis, and reflection all live on the host).

**Peer** — another Landsraad council running on the same machine.

**Remote attendee** — a councillor on a peer council, summoned to speak for a turn
over a loopback-only HTTP API.

---

## Oeuvres (asynchronous work loops)

**Oeuvre** — an asynchronous, goal-directed **work loop** that produces an
artifact. The director sets a goal and picks one councillor to lead; participants
take turns editing a shared scratchpad and voting on whether the goal is met. The
loop ends when every active participant's latest vote is `finish` against the
current scratchpad — or when a budget is exhausted or the director stops it. Only
one oeuvre is active per council at a time. (This very document was produced by an
oeuvre.)

**Leader** — the councillor that orchestrates an oeuvre: it reads the state, may
comment, and picks who works next via [`<<NEXT>>`](TAGS.md). The leader **never**
takes a turn, picks itself, or votes.

**Participant** — a non-leader councillor that takes turns and votes.

**Turn (in an oeuvre)** — one participant taking the baton: it revises the
scratchpad and casts a vote. Each oeuvre turn is a real **job** under the hood
(with reflection suppressed).

**Scratchpad** — the shared, evolving artifact of an oeuvre — the "baton" passed
turn to turn. A substantive edit bumps `scratchpad_version`.

**scratchpad_version** — a counter that increments on every substantive edit.
Bumping it invalidates standing `finish` votes, since they were cast against an
older draft (editing and voting are deliberately decoupled).

**Vote** — a participant's call on whether the goal is met: `finish` or `continue`,
cast against the current scratchpad version. A `continue` vote carries a one-line
reason that tells the leader what to route on next. (A participant that hasn't
voted yet blocks conclusion, so no one is skipped on the way in.)

**Pool / out** — the **pool** is the set of participants whose votes still count.
A participant that fails too many turns in a row is dropped **out** of routing and
the vote pool, so one broken adapter can't deadlock the loop.

**Consolidation** — the leader-authored closing pass of an oeuvre. It distills the
final scratchpad and the work log into memories (and optional [`<<JOB>>`](TAGS.md)
proposals), reusing the reflection plumbing.

> **The "turn" gotcha.** A *turn* always means a structured contribution inside a
> meeting round or an oeuvre loop. It is never a chat message or a free-running
> session. If an older note says "cycle", read "turn".

---

## Packaging

**Template** — a reusable, shareable council definition (`*.template.json`):
councillor roles, personas, and optional seed memory, jobs, and env. Templates
never contain secrets or personal data.

**Dogfood council** — the built-in test council (`npm run dogfood:init`), made of
`mock:local` councillors, for exercising Landsraad end-to-end without spending real
CLI tokens.

[stderr] exec
/bin/zsh -lc "sed -n '1,240p' bin/registry.js" in .
[stderr]  succeeded in 0ms:
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export function instancesFile() {
  if (process.env.LANDSRAAD_INSTANCES_FILE) return process.env.LANDSRAAD_INSTANCES_FILE;
  return join(homedir(), '.landsraad', 'instances.json');
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but is owned by another user — still alive.
    return err && err.code === 'EPERM';
  }
}

async function readRaw() {
  const file = instancesFile();
  if (!existsSync(file)) return [];
  try {
    const text = await readFile(file, 'utf8');
    if (!text.trim()) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRaw(entries) {
  const file = instancesFile();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  await rename(tmp, file);
}

export async function readInstances() {
  const entries = await readRaw();
  const live = entries.filter((e) => e && typeof e.pid === 'number' && isAlive(e.pid));
  if (live.length !== entries.length) {
    try {
      await writeRaw(live);
    } catch {
      // best-effort prune
    }
  }
  return live;
}

export async function writeInstance(entry) {
  const entries = await readRaw();
  const next = entries.filter((e) => e && e.pid !== entry.pid);
  next.push(entry);
  await writeRaw(next);
}

export async function removeInstance(pid) {
  const entries = await readRaw();
  const next = entries.filter((e) => e && e.pid !== pid);
  if (next.length === entries.length) return;
  if (next.length === 0) {
    const file = instancesFile();
    try {
      await unlink(file);
      return;
    } catch {
      // fallthrough to writeRaw
    }
  }
  await writeRaw(next);
}

[stderr] codex
One concrete mismatch is already visible: `<<VOTE>>` can put its reason in an attribute or a block body, but `docs/TAGS.md` only documents the attribute form. I’m checking the remaining parser/registry details before editing so the docs line up in one pass.
[stderr] exec
/bin/zsh -lc "sed -n '1,220p' src/lib/server/adapters/index.ts" in .
exec
/bin/zsh -lc "sed -n '1,280p' src/lib/server/adapters/cli.ts" in .
[stderr]  succeeded in 0ms:
import type { AdapterRunStreams } from './types';
import { createMockAdapter } from './mock';
import { effectiveModel, getCliConfig, listCliAdapterIds, parseAdapterId, runCliAdapter } from './cli';

/** Options for {@link resolveAdapter}. */
export interface ResolveAdapterOpts {
  /**
   * Model id to use when the adapter string does not pin one with `?model=`.
   * Meeting call sites pass `LANDSRAAD_MEETING_MODEL` here so a host can run a
   * lighter model for every meeting turn without editing each councillor.
   */
  modelDefault?: string;
}

export interface ResolvedAdapter {
  id: string;
  kind: 'mock' | 'cli';
  run(args: { prompt: string; cwd: string; signal?: AbortSignal }): AdapterRunStreams;
}

export function resolveAdapter(adapterId: string, opts?: ResolveAdapterOpts): ResolvedAdapter | null {
  if (!adapterId) return null;
  const { base } = parseAdapterId(adapterId);
  if (base === 'mock:local') {
    const m = createMockAdapter();
    return { id: m.id, kind: 'mock', run: m.run };
  }
  const cli = getCliConfig(base);
  if (cli) {
    const model = effectiveModel(adapterId, opts?.modelDefault);
    return {
      id: adapterId,
      kind: 'cli',
      run: (args) => runCliAdapter(cli, { ...args, model })
    };
  }
  return null;
}

export function listKnownAdapterIds(): string[] {
  return ['mock:local', ...listCliAdapterIds()];
}

export interface KnownAdapter {
  id: string;
  label: string;
  available: boolean;
  note?: string;
  /** Binary that must be on PATH (CLI adapters only). */
  command?: string;
  /** One-line install command (CLI adapters only). */
  install?: string;
  /** Documentation / setup link (CLI adapters only). */
  docsUrl?: string;
  /** Short description of how the adapter is used after install. */
  blurb?: string;
}

const KNOWN_ADAPTERS: KnownAdapter[] = [
  { id: 'mock:local', label: 'Mock (local echo)', available: true, note: 'Built-in echo adapter for testing.' },
  {
    id: 'cli:claude',
    label: 'Claude CLI (Claude Code)',
    available: true,
    note: 'Requires `claude` on PATH.',
    command: 'claude',
    install: 'npm install -g @anthropic-ai/claude-code',
    docsUrl: 'https://docs.claude.com/en/docs/claude-code/overview',
    blurb: 'Anthropic’s coding agent. After install, run `claude` once to sign in.'
  },
  {
    id: 'cli:codex',
    label: 'Codex CLI',
    available: true,
    note: 'Requires `codex` on PATH.',
    command: 'codex',
    install: 'npm install -g @openai/codex',
    docsUrl: 'https://github.com/openai/codex',
    blurb: 'OpenAI’s coding agent. After install, run `codex` once to sign in.'
  },
  {
    id: 'cli:gemini',
    label: 'Gemini CLI',
    available: true,
    note: 'Requires `gemini` on PATH.',
    command: 'gemini',
    install: 'npm install -g @google/gemini-cli',
    docsUrl: 'https://github.com/google-gemini/gemini-cli',
    blurb: 'Google’s coding agent. After install, run `gemini` once to authenticate.'
  },
  {
    id: 'cli:grok',
    label: 'Grok CLI (xAI)',
    available: true,
    note: 'Requires the official xAI `grok` CLI on PATH.',
    command: 'grok',
    install: 'See https://x.ai/cli',
    docsUrl: 'https://x.ai/cli',
    blurb: 'Official xAI Grok agent CLI. Authenticate with `grok login` (use `grok login --device-auth` for headless environments).'
  },
  {
    id: 'cli:qwen',
    label: 'Qwen Code',
    available: true,
    note: 'Requires `qwen` on PATH.',
    command: 'qwen',
    install: 'npm install -g @qwen-code/qwen-code',
    docsUrl: 'https://github.com/QwenLM/qwen-code',
    blurb: 'Alibaba’s open-source terminal coding agent (a gemini-cli fork). After install, run `qwen` once to authenticate.'
  },
  {
    id: 'cli:vibe',
    label: 'Mistral Vibe',
    available: true,
    note: 'Requires `vibe` on PATH.',
    command: 'vibe',
    install: 'uv tool install mistral-vibe',
    docsUrl: 'https://docs.mistral.ai/mistral-vibe/introduction',
    blurb: 'Mistral’s terminal coding agent. After install, run `vibe` once to sign in; piped prompts run in auto-approve mode.'
  },
  {
    id: 'cli:aider',
    label: 'Aider',
    available: true,
    note: 'Requires `aider` on PATH and an LLM API key in the environment.',
    command: 'aider',
    install: 'python -m pip install aider-install && aider-install',
    docsUrl: 'https://aider.chat/docs/scripting.html',
    blurb: 'AI pair programmer. Set your model’s API key (e.g. OPENAI_API_KEY / ANTHROPIC_API_KEY); each turn runs as `aider --message … --yes --no-auto-commits`.'
  },
  {
    id: 'cli:warp',
    label: 'Warp (Oz CLI)',
    available: true,
    note: 'Requires the Warp `oz` CLI on PATH.',
    command: 'oz',
    install: 'brew install --cask oz',
    docsUrl: 'https://docs.warp.dev/reference/cli/',
    blurb: 'Warp’s headless agent. Authenticate with `oz login` (or set WARP_API_KEY for headless environments); each turn runs as `oz agent run --prompt …`.'
  },
  { id: 'sdk:claude', label: 'Claude SDK', available: false, note: 'Not yet implemented.' },
  { id: 'sdk:codex', label: 'Codex SDK', available: false, note: 'Not yet implemented.' }
];

export function listKnownAdapters(): KnownAdapter[] {
  return KNOWN_ADAPTERS.slice();
}

export interface InstallableAdapter {
  id: string;
  label: string;
  command: string;
  install: string;
  docsUrl: string;
  blurb?: string;
}

/** Available CLI adapters with everything the help page needs to explain install. */
export function listInstallableAdapters(): InstallableAdapter[] {
  return KNOWN_ADAPTERS.filter(
    (a): a is KnownAdapter & InstallableAdapter =>
      a.available && Boolean(a.command && a.install && a.docsUrl)
  ).map(({ id, label, command, install, docsUrl, blurb }) => ({
    id,
    label,
    command,
    install,
    docsUrl,
    blurb
  }));
}

export function getAdapterLabel(id: string): string {
  return KNOWN_ADAPTERS.find((a) => a.id === id)?.label ?? id;
}

export { createMockAdapter };
export type { AdapterRunStreams } from './types';

 succeeded in 0ms:
import { spawn } from 'node:child_process';
import type { AdapterChunk, AdapterResult, AdapterRunStreams } from './types';

export interface CliArgsOpts {
  /** Optional model id, e.g. from a `cli:claude?model=claude-haiku-4-5` adapter string. */
  model?: string;
}

/** Service-agnostic capability tiers. Most CLIs expose a cheap/balanced/top trio. */
export type ModelTier = 'lite' | 'medium' | 'heavy';

export interface CliAdapterConfig {
  id: string;
  command: string;
  args: (prompt: string, opts?: CliArgsOpts) => string[];
  stdinMode: 'arg' | 'pipe';
  /**
   * Maps the service-agnostic tiers `lite`/`medium`/`heavy` to this CLI's own
   * model ids. Lets `LANDSRAAD_MEETING_MODEL=lite` (or `?model=heavy`) mean the
   * right thing per adapter. Omit when the CLI takes no `--model` — a tier
   * keyword then no-ops to the CLI's default model.
   */
  tiers?: Record<ModelTier, string>;
}

const TIER_KEYS: readonly ModelTier[] = ['lite', 'medium', 'heavy'];

function asTier(value: string): ModelTier | null {
  const lower = value.toLowerCase();
  return (TIER_KEYS as readonly string[]).includes(lower) ? (lower as ModelTier) : null;
}

const REGISTRY: Record<string, CliAdapterConfig> = {
  'cli:claude': {
    id: 'cli:claude',
    command: 'claude',
    args: (_prompt, opts) => (opts?.model?.trim() ? ['-p', '--model', opts.model.trim()] : ['-p']),
    stdinMode: 'pipe',
    // The claude CLI accepts these short aliases directly (`claude --model sonnet`).
    tiers: { lite: 'haiku', medium: 'sonnet', heavy: 'opus' }
  },
  'cli:codex': {
    id: 'cli:codex',
    command: 'codex',
    args: () => ['exec', '--skip-git-repo-check', '-'],
    stdinMode: 'pipe'
  },
  'cli:gemini': {
    id: 'cli:gemini',
    command: 'gemini',
    args: () => [],
    stdinMode: 'pipe'
  },
  'cli:grok': {
    id: 'cli:grok',
    command: 'grok',
    // Official xAI Grok CLI (https://x.ai/cli): `--single <PROMPT>` runs a
    // single-turn headless request, prints the response to stdout, and exits.
    args: (prompt) => ['--single', prompt],
    stdinMode: 'arg'
  },
  'cli:qwen': {
    id: 'cli:qwen',
    command: 'qwen',
    // Qwen Code (gemini-cli fork): a piped stdin runs headless, printing the
    // reply to stdout and exiting. Equivalent to `qwen -p "<prompt>"`.
    args: () => [],
    stdinMode: 'pipe'
  },
  'cli:vibe': {
    id: 'cli:vibe',
    command: 'vibe',
    // Mistral Vibe: piping a prompt via stdin runs in programmatic (auto-approve)
    // mode without entering the interactive chat loop.
    args: () => [],
    stdinMode: 'pipe'
  },
  'cli:aider': {
    id: 'cli:aider',
    command: 'aider',
    // Aider scripting: `--message` sends one message, processes the reply, then
    // exits. `--yes` skips confirmations and `--no-auto-commits` leaves git alone.
    args: (prompt) => ['--message', prompt, '--yes', '--no-auto-commits'],
    stdinMode: 'arg'
  },
  'cli:warp': {
    id: 'cli:warp',
    command: 'oz',
    // Warp's headless agent runs through the Oz CLI: `oz agent run --prompt`
    // executes locally and prints results to stdout.
    args: (prompt) => ['agent', 'run', '--prompt', prompt],
    stdinMode: 'arg'
  }
};

export interface ParsedAdapterId {
  /** The bare adapter id with any `?query` stripped, e.g. `cli:claude`. */
  base: string;
  /** Key/value pairs from a `?k=v&k2=v2` suffix. Empty when no query is present. */
  params: Record<string, string>;
}

/**
 * Split an adapter string into its base id and optional `?query` params.
 * Lets a councillor pin a model per-adapter, e.g. `cli:claude?model=claude-haiku-4-5`,
 * so meetings can run a lighter model than the councillor's default jobs.
 */
export function parseAdapterId(adapterId: string): ParsedAdapterId {
  const qIdx = adapterId.indexOf('?');
  if (qIdx === -1) return { base: adapterId, params: {} };
  const base = adapterId.slice(0, qIdx);
  const params: Record<string, string> = {};
  for (const seg of adapterId.slice(qIdx + 1).split('&')) {
    if (!seg) continue;
    const eq = seg.indexOf('=');
    const key = eq === -1 ? seg : seg.slice(0, eq);
    const val = eq === -1 ? '' : seg.slice(eq + 1);
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(val);
  }
  return { base, params };
}

/**
 * Resolve the model id for a CLI adapter turn. A per-councillor `?model=` pin
 * wins; otherwise the caller's `modelDefault` (e.g. the host-wide
 * `LANDSRAAD_MEETING_MODEL`) applies. Either value may be a literal model id or
 * a service-agnostic tier (`lite`/`medium`/`heavy`); a tier is mapped through
 * the adapter's own `tiers` table, so one knob means "cheap" across a mixed
 * fleet. A tier for an adapter with no table no-ops to the CLI default.
 * Returns undefined when nothing resolves, so the CLI runs its own default.
 */
export function effectiveModel(adapterId: string, modelDefault?: string): string | undefined {
  const { base, params } = parseAdapterId(adapterId);
  const raw = params.model?.trim() || modelDefault?.trim() || undefined;
  if (!raw) return undefined;
  const tier = asTier(raw);
  if (!tier) return raw;
  return getCliConfig(base)?.tiers?.[tier] ?? undefined;
}

export function getCliConfig(adapterId: string): CliAdapterConfig | null {
  return REGISTRY[adapterId] ?? null;
}

/**
 * Decide whether to spawn this adapter through a shell. On Windows, npm-installed
 * CLIs (claude, codex, gemini…) are `.cmd`/`.ps1` shims that Node can only launch
 * via the shell — but Node does NOT quote argv when `shell:true`, so a multi-word
 * prompt passed as an arg gets word-split by cmd.exe (grok then read "Persona:" as
 * the `--single` value and the next token as a subcommand). We therefore only use
 * the shell for `pipe` adapters, whose argv is static flags with no user text and
 * whose prompt travels safely over stdin. `arg` adapters (grok/aider/warp) are
 * native exes that spawn fine shell-less, letting Node quote their prompt argv.
 */
export function shouldUseShell(config: CliAdapterConfig): boolean {
  return process.platform === 'win32' && config.stdinMode === 'pipe';
}

export function listCliAdapterIds(): string[] {
  return Object.keys(REGISTRY);
}

export function runCliAdapter(
  config: CliAdapterConfig,
  args: { prompt: string; cwd: string; signal?: AbortSignal; env?: NodeJS.ProcessEnv; model?: string }
): AdapterRunStreams {
  const child = spawn(config.command, config.args(args.prompt, { model: args.model }), {
    cwd: args.cwd,
    env: args.env ?? process.env,
    shell: shouldUseShell(config),
    signal: args.signal
  });

  if (child.stdin) {
    // `pipe` adapters get the prompt over stdin; `arg` adapters carry it in argv.
    // Either way we MUST end stdin: an agentic CLI (e.g. the xAI Grok CLI) keeps
    // reading stdin and won't exit until it sees EOF — leaving it open hangs the
    // process until the turn timeout fires. Closing it sends that EOF immediately.
    if (config.stdinMode === 'pipe') child.stdin.write(args.prompt);
    child.stdin.end();
  }

  let stdoutBuf = '';
  let stderrBuf = '';
  const pending: AdapterChunk[] = [];
  let resolveNext: ((value: IteratorResult<AdapterChunk>) => void) | null = null;
  let done = false;

  function push(chunk: AdapterChunk) {
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r({ value: chunk, done: false });
    } else {
      pending.push(chunk);
    }
  }

  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString('utf8');
    stdoutBuf += text;
    push({ stream: 'stdout', text });
  });
  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString('utf8');
    stderrBuf += text;
    push({ stream: 'stderr', text });
  });

  const result = new Promise<AdapterResult>((resolve, reject) => {
    child.on('error', (err) => {
      done = true;
      if (resolveNext) {
        const r = resolveNext;
        resolveNext = null;
        r({ value: undefined as unknown as AdapterChunk, done: true });
      }
      reject(err);
    });
    child.on('exit', (code) => {
      done = true;
      if (resolveNext) {
        const r = resolveNext;
        resolveNext = null;
        r({ value: undefined as unknown as AdapterChunk, done: true });
      }
      resolve({ exit_code: code ?? 0, stdout: stdoutBuf, stderr: stderrBuf });
    });
  });

  const chunks: AsyncIterable<AdapterChunk> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<AdapterChunk>> {
          if (pending.length > 0) {
            return Promise.resolve({ value: pending.shift()!, done: false });
          }
          if (done) return Promise.resolve({ value: undefined as unknown as AdapterChunk, done: true });
          return new Promise<IteratorResult<AdapterChunk>>((r) => (resolveNext = r));
        }
      };
    }
  };

  return { chunks, result };
}

[stderr] exec
/bin/zsh -lc 'rg "model=|lite|medium|heavy|claude|codex|gemini|grok|qwen|aider|cli:" src bin docs README.md package.json' in .
[stderr]  succeeded in 0ms:
README.md:| `LANDSRAAD_MEETING_MODEL` | _(empty)_ | Model for every meeting LLM call this server runs — attendee turns, rolling summaries, and the closing synthesis. Accepts a literal model id (`haiku`) or a service-agnostic tier (`lite`/`medium`/`heavy`) that each adapter maps to its own model (claude → haiku/sonnet/opus), so one tier means the same intent across a mixed fleet. A tier no-ops for adapters with no mapping (they fall back to the CLI default). A per-councillor `?model=` pin in the adapter string still wins. Per-process: each participating server reads its own value, so it also governs the turns it serves as a remote peer. Empty = each adapter's default model. |
package.json:    "@types/better-sqlite3": "^7.6.13",
package.json:    "better-sqlite3": "^12.10.0",
package.json:    "sqlite-vec": "^0.1.9"
docs/GLOSSARY.md:(a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
docs/GLOSSARY.md:subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
docs/GLOSSARY.md:adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
docs/GLOSSARY.md:suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
docs/GLOSSARY.md:**Index** — a pull-based semantic search layer (sqlite-vec). Files on disk are the
docs/embeddings.md:> Storage swap from the original sketch: `@libsql/client` JS does not expose `loadExtension`, so `sqlite-vec` cannot load against it. Switched to `better-sqlite3`, which is sqlite-vec's primary supported Node binding. Synchronous API is fine — the SvelteKit server is single-process and embed/search calls already block on the model.
docs/embeddings.md:| Storage | `better-sqlite3` (file-mode) | Single-file SQLite, synchronous API, well-supported `loadExtension` for `sqlite-vec`. |
docs/embeddings.md:| Vector index | `sqlite-vec` extension | Same DB as metadata. Atomic writes. No parallel-array hack. |
docs/embeddings.md:Cosine similarity via `vec_chunks MATCH` (sqlite-vec syntax). Post-filter on `kinds` / `councillor_slug` / `min_density` happens in SQL.
docs/embeddings.md:- **No `sqlite-vec` extension available** — search returns empty + logs a one-time warning. Index writes are no-ops. The app degrades cleanly to file-only.
docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md:| Reuse `underrow`? | **No** — borrow the pattern, keep landsraad's stack (sqlite-vec + Xenova). `underrow` lacks kind-filtered search and semantic meeting chunking. |
docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md:| Vector store | Keep **sqlite-vec** (SQL filtering by kind/councillor) |
docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md:   → chunk via source → deleteByRef + upsert → sqlite-vec
docs/superpowers/specs/2026-06-02-pull-based-indexer-design.md:- **Dev double-watcher** (vite dev server + built server on same `.index`) → sqlite
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:| `editor`     | Editor-in-Chief  | Synthesizer | `cli:claude` | doc spine, voice, scope, prioritization, tie-breaking between drafters/critics |
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:| `amanuensis` | Amanuensis       | Implementer | `cli:claude` | drafting prose from outline + research, prose revisions, structure-to-text   |
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:| `researcher` | Researcher       | Implementer | `cli:codex`  | source-hunting, primary docs, citations, examples, code samples              |
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:| `factcheck`  | Fact-Checker     | Critic      | `cli:codex`  | claim verification, code-sample correctness, edge cases, dated facts         |
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:| `reader`     | Reader Advocate  | Evangelist  | `cli:claude` | clarity test, prerequisite checks, jargon flagging, beginner empathy         |
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:Adapter mix: 3 `cli:claude` / 2 `cli:codex`. Codex sits on the rigorous
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:### `editor` — Editor-in-Chief (Synthesizer, claude)
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:### `amanuensis` — Amanuensis (Implementer, claude)
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:### `researcher` — Researcher (Implementer, codex)
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:### `factcheck` — Fact-Checker (Critic, codex)
docs/superpowers/specs/2026-05-25-tech-writing-template-design.md:### `reader` — Reader Advocate (Evangelist, claude)
docs/superpowers/specs/2026-05-28-council-meetings-design.md:Director turns use the literal speaker token `director`.
docs/superpowers/specs/2026-05-25-engineering-template-design.md:| `architect` | Lead Architect        | Synthesizer | `cli:claude` | system arch, requirements, interface allocation, cross-discipline tie-break |
docs/superpowers/specs/2026-05-25-engineering-template-design.md:| `sweng`     | Software Engineer     | Implementer | `cli:codex`  | firmware/embedded/app code, build & test pipelines, comms, telemetry        |
docs/superpowers/specs/2026-05-25-engineering-template-design.md:| `ee`        | Electrical Engineer   | Implementer | `cli:codex`  | schematic, PCB, power tree, signal integrity, BOM, DFM/AVL                  |
docs/superpowers/specs/2026-05-25-engineering-template-design.md:| `mech`      | Mechanical Engineer   | Implementer | `cli:claude` | enclosure, thermal path, mounting, materials, GD&T, DFA                     |
docs/superpowers/specs/2026-05-25-engineering-template-design.md:| `qa`        | Verification Engineer | Critic      | `cli:codex`  | requirements traceability, test plans, FMEA, integration, regulatory/safety |
docs/superpowers/specs/2026-05-25-engineering-template-design.md:Adapter mix: 2 `cli:claude` / 3 `cli:codex`. Codex sits on the rigorous
docs/superpowers/specs/2026-05-25-engineering-template-design.md:### `architect` — Lead Architect (Synthesizer, claude)
docs/superpowers/specs/2026-05-25-engineering-template-design.md:### `sweng` — Software Engineer (Implementer, codex)
docs/superpowers/specs/2026-05-25-engineering-template-design.md:### `ee` — Electrical Engineer (Implementer, codex)
docs/superpowers/specs/2026-05-25-engineering-template-design.md:### `mech` — Mechanical Engineer (Implementer, claude)
docs/superpowers/specs/2026-05-25-engineering-template-design.md:### `qa` — Verification Engineer (Critic, codex)
docs/superpowers/plans/2026-06-01-template-env-seeding.md:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
docs/superpowers/plans/2026-06-01-template-env-seeding.md:  expect(t.env?.[0]).toEqual({ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite', comment: undefined });
docs/superpowers/plans/2026-06-01-template-env-seeding.md:  const bad = { ...validTemplate, env: { LANDSRAAD_MEETING_MODEL: 'lite' } };
docs/superpowers/plans/2026-06-01-template-env-seeding.md:Add `env` to the returned object literal:
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
docs/superpowers/plans/2026-06-01-template-env-seeding.md:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
docs/superpowers/plans/2026-06-01-template-env-seeding.md:Add `env: { add: envAdd, overwrite: envOver }` to the returned `ApplyPlan` literal.
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
docs/superpowers/plans/2026-06-01-template-env-seeding.md:  expect(readCouncilEnv()).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
docs/superpowers/plans/2026-06-01-template-env-seeding.md:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
docs/superpowers/plans/2026-06-01-template-env-seeding.md:  expect(out.env).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
docs/superpowers/plans/2026-06-01-template-env-seeding.md:Add to the returned template literal:
docs/superpowers/plans/2026-06-01-template-env-seeding.md:    expect(byKey.get('LANDSRAAD_MEETING_MODEL')).toBe('lite');
docs/superpowers/plans/2026-06-01-template-env-seeding.md:      "value": "lite",
docs/superpowers/plans/2026-06-01-template-env-seeding.md:> The dash in the nudge is a literal em dash `—` (U+2014), matching the value
docs/superpowers/plans/2026-06-01-template-env-seeding.md:git commit -m "feat(templates): seed meeting brevity + lite-model defaults in all official templates"
docs/superpowers/plans/2026-06-01-template-env-seeding.md:A template may carry an optional `env` array (`{ key, value, comment? }`); on install these seed the council's `.env` via `writeCouncilEnv` (existing keys are replaced only under the same overwrite confirmation as councillors/memory; `comment` is template-only and not written). All bundled templates seed `LANDSRAAD_MEETING_MODEL=lite` and `LANDSRAAD_MEETING_TURN_NUDGE` so meetings start terse and cheap.
docs/UX.md:The global token is warm parchment: `--accent: #d6c08c` (`+layout.svelte:56`). But meeting detail hardcodes a **blue** fallback in three places — `var(--accent, #6aa6ff)` on `.next-up`, `.turn-speaker.remote`, and their backgrounds (`rgba(106,166,255,…)`). The blue never paints today (the token is defined), but the meeting page was clearly designed against a different (blue) accent. If/when the design system lands and `--accent` is themed, meetings will shift in ways nobody intends. Decide on one accent and purge the blue literals.
docs/UX.md:5. Settle the accent (purge the blue literals in meetings).
docs/UX.md:  literals purged to `--info` tokens; markdown via the `Markdown` component.
docs/superpowers/specs/2026-05-31-council-env-editor-design.md:Some adapters need API keys in env (`cli:aider` → `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`;
docs/superpowers/specs/2026-05-31-council-env-editor-design.md:`cli:warp` → `WARP_API_KEY`), and any adapter may want env-driven overrides
docs/superpowers/specs/2026-06-01-template-env-seeding-design.md:    "value": "lite",
docs/HOUSE_RULES_ADD.md:| 3 | Per-tool pickup | **Adapter-aware copies.** `AGENTS.md` is always written; a tool-specific file is created **only when a councillor uses that adapter** (e.g. a `cli:qwen` councillor ⇒ `QWEN.md`). |
docs/HOUSE_RULES_ADD.md:| `cli:codex` | *(none — reads `AGENTS.md` directly)* | Canonical covers it. |
docs/HOUSE_RULES_ADD.md:| `cli:claude` | `CLAUDE.md` | `claude -p` reads `CLAUDE.md`, **not** `AGENTS.md` ([#34235](https://github.com/anthropics/claude-code/issues/34235)); loaded unless `--bare`. |
docs/HOUSE_RULES_ADD.md:| `cli:gemini` | `GEMINI.md` | |
docs/HOUSE_RULES_ADD.md:| `cli:qwen` | `QWEN.md` | |
docs/HOUSE_RULES_ADD.md:| `cli:grok` | *(none)* | Config-only; no project memory file. |
docs/HOUSE_RULES_ADD.md:| `cli:vibe` | *(verify)* | Convention unconfirmed. |
docs/HOUSE_RULES_ADD.md:| `cli:aider` | *(none / `CONVENTIONS.md` via `--read`)* | Not auto-read from root; skip unless configured. |
docs/HOUSE_RULES_ADD.md:| `cli:warp` | *(verify)* | Convention unconfirmed. |
docs/HOUSE_RULES_ADD.md:- **Adapter** — how a councillor is invoked (`cli:claude`, `mock:local`, …).
docs/HOUSE_RULES_ADD.md:  - adapter-aware: a council with a `cli:qwen` councillor gets `QWEN.md`; a
docs/HOUSE_RULES_ADD.md:- **Coverage gaps** — `mock:local`, `cli:grok`, and unconfirmed
docs/HOUSE_RULES_ADD.md:  `cli:vibe`/`cli:warp`/`cli:aider` read no dropped file. Acceptable; revisit
docs/superpowers/plans/2026-05-25-tech-writing-template.md:    expect(bySlug.editor.adapter).toBe('cli:claude');
docs/superpowers/plans/2026-05-25-tech-writing-template.md:    expect(bySlug.amanuensis.adapter).toBe('cli:claude');
docs/superpowers/plans/2026-05-25-tech-writing-template.md:    expect(bySlug.researcher.adapter).toBe('cli:codex');
docs/superpowers/plans/2026-05-25-tech-writing-template.md:    expect(bySlug.factcheck.adapter).toBe('cli:codex');
docs/superpowers/plans/2026-05-25-tech-writing-template.md:    expect(bySlug.reader.adapter).toBe('cli:claude');
docs/superpowers/plans/2026-05-25-tech-writing-template.md:      "adapter": "cli:claude",
docs/superpowers/plans/2026-05-25-tech-writing-template.md:      "adapter": "cli:claude",
docs/superpowers/plans/2026-05-25-tech-writing-template.md:      "adapter": "cli:codex",
docs/superpowers/plans/2026-05-25-tech-writing-template.md:      "adapter": "cli:codex",
docs/superpowers/plans/2026-05-25-tech-writing-template.md:      "adapter": "cli:claude",
docs/superpowers/plans/2026-05-25-tech-writing-template.md:   - `editor` — Synthesizer — `cli:claude`
docs/superpowers/plans/2026-05-25-tech-writing-template.md:   - `amanuensis` — Implementer — `cli:claude`
docs/superpowers/plans/2026-05-25-tech-writing-template.md:   - `researcher` — Implementer — `cli:codex`
docs/superpowers/plans/2026-05-25-tech-writing-template.md:   - `factcheck` — Critic — `cli:codex`
docs/superpowers/plans/2026-05-25-tech-writing-template.md:   - `reader` — Evangelist — `cli:claude`
docs/architecture.md:- `src/lib/server/adapters/` — adapter implementations (`mock:local`, `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`, `cli:vibe`, `cli:aider`, `cli:warp`).
docs/superpowers/plans/2026-05-25-engineering-template.md:    expect(bySlug.architect.adapter).toBe('cli:claude');
docs/superpowers/plans/2026-05-25-engineering-template.md:    expect(bySlug.sweng.adapter).toBe('cli:codex');
docs/superpowers/plans/2026-05-25-engineering-template.md:    expect(bySlug.ee.adapter).toBe('cli:codex');
docs/superpowers/plans/2026-05-25-engineering-template.md:    expect(bySlug.mech.adapter).toBe('cli:claude');
docs/superpowers/plans/2026-05-25-engineering-template.md:    expect(bySlug.qa.adapter).toBe('cli:codex');
docs/superpowers/plans/2026-05-25-engineering-template.md:      "adapter": "cli:claude",
docs/superpowers/plans/2026-05-25-engineering-template.md:      "adapter": "cli:codex",
docs/superpowers/plans/2026-05-25-engineering-template.md:      "adapter": "cli:codex",
docs/superpowers/plans/2026-05-25-engineering-template.md:      "adapter": "cli:claude",
docs/superpowers/plans/2026-05-25-engineering-template.md:      "adapter": "cli:codex",
docs/superpowers/plans/2026-05-25-engineering-template.md:**Type consistency:** Slug list, role values, adapter values are spelled identically in Task 1 test (`'architect'`, `'sweng'`, `'ee'`, `'mech'`, `'qa'`; `'Synthesizer'`, `'Implementer'`, `'Critic'`; `'cli:claude'`, `'cli:codex'`) and in Task 2 JSON.
docs/data-model.md:  "adapter": "cli:claude",
docs/data-model.md:- `adapter` — free-form string. Conventions: `cli:<name>` (subprocess) or `sdk:<name>` (in-process API client). Empty string means "not configured yet." A `?model=<id>` suffix pins the model for this councillor's turns, e.g. `cli:claude?model=claude-haiku-4-5`; the pin wins over the host-wide `LANDSRAAD_MEETING_MODEL` env override, which in turn beats the CLI's own default. The value (in either the suffix or the env override) may be a literal model id or a service-agnostic tier — `lite`/`medium`/`heavy` — which each adapter maps to its own model (`cli:claude` → haiku/sonnet/opus). A tier no-ops for adapters with no mapping.
docs/data-model.md:`target_councillor` is `null` (unassigned), a councillor slug, or the literal `"all"` for a broadcast. `status` is `pending | approved | rejected`. Approved proposals add `decided_at`, `decided_by`, and `resulting_job_ids`. Rejected proposals add `decided_at`, `decided_by`, and an optional `reason`. Approved/rejected files stay on disk for audit; the review UI hides them from the pending view.
docs/superpowers/specs/2026-05-30-cross-council-meetings-design.md:    { "slug": "leto", "label": "Leto", "adapter": "cli:claude", "busy": false }
docs/superpowers/plans/2026-05-26-scheduler.md:Expected: FAIL — `Object literal may only specify known properties` (TS) or runtime field absent.
docs/superpowers/plans/2026-05-26-scheduler.md:Inside `createJob`, modify the `job` literal so the field is included:
docs/superpowers/plans/2026-05-26-scheduler.md:(If the shell is PowerShell and the literal `[id]` causes globbing trouble, run `git add src/routes/schedules` instead.)
docs/superpowers/plans/2026-05-26-scheduler.md:- The `[id]` directory literal can be quoted in PowerShell as `'[id]'` if `git add` complains.
src/lib/env-suggestions.ts:   * `lite`/`medium`/`heavy` tiers). The settings editor offers these in a
src/lib/env-suggestions.ts:  { key: 'ANTHROPIC_API_KEY', description: 'Anthropic — Claude (cli:claude, aider)' },
src/lib/env-suggestions.ts:  { key: 'OPENAI_API_KEY', description: 'OpenAI — GPT/Codex (cli:codex, aider)' },
src/lib/env-suggestions.ts:  { key: 'XAI_API_KEY', description: 'xAI (X) — Grok (cli:grok)' },
src/lib/env-suggestions.ts:  { key: 'GEMINI_API_KEY', description: 'Google — Gemini (cli:gemini)' },
src/lib/env-suggestions.ts:  { key: 'MISTRAL_API_KEY', description: 'Mistral — Vibe (cli:vibe)' },
src/lib/env-suggestions.ts:  { key: 'DASHSCOPE_API_KEY', description: 'Alibaba — Qwen / DashScope (cli:qwen)' },
src/lib/env-suggestions.ts:  { key: 'WARP_API_KEY', description: 'Warp — Oz CLI headless auth (cli:warp)' },
src/lib/env-suggestions.ts:      'Model for all meeting and oeuvre LLM calls. Use a tier — "lite"/"medium"/"heavy" — mapped per adapter, or a literal model id. A councillor ?model= pin still wins.',
src/lib/env-suggestions.ts:    values: ['lite', 'medium', 'heavy']
src/lib/env-suggestions.ts: * value is a non-empty literal outside that set — e.g. a model id loaded from a
src/routes/help/help-route.test.ts:      'cli:aider',
src/routes/help/help-route.test.ts:      'cli:claude',
src/routes/help/help-route.test.ts:      'cli:codex',
src/routes/help/help-route.test.ts:      'cli:gemini',
src/routes/help/help-route.test.ts:      'cli:grok',
src/routes/help/help-route.test.ts:      'cli:qwen',
src/routes/help/help-route.test.ts:      'cli:vibe',
src/routes/help/help-route.test.ts:      'cli:warp'
docs/superpowers/plans/2026-06-02-pull-based-indexer.md:**Architecture:** A declarative `index-sources` registry maps council-root-relative paths to `{kind, refId, buildChunks}`. A `reconcile` module turns one file into index chunks (or removes them). A chokidar `watcher` drives reconcile on add/change/unlink, using a startup **manifest map** (`rel → source_mtime`) to skip unchanged files and detect orphans. Keeps sqlite-vec + the Xenova embedder; `underrow` was the reference only.
docs/superpowers/plans/2026-06-02-pull-based-indexer.md:**Tech Stack:** SvelteKit, TypeScript (strict), Vitest, better-sqlite3 + sqlite-vec, **chokidar** (new dep).
docs/superpowers/plans/2026-05-28-council-meetings.md:**Tech Stack:** TypeScript strict, SvelteKit, Node 20+, `vitest`, `better-sqlite3` + `sqlite-vec` (existing).
docs/superpowers/plans/2026-05-30-cross-council-meetings.md:The spec models attendees as a union `AttendeeRef = {kind:'local',slug} | {kind:'remote',...}` stored in `Meeting.attendees: AttendeeRef[]`. Implementing that literally would change the on-disk shape of *every* meeting and break the existing test suite (`meetings.test.ts:47` asserts `remaining_this_round` is `string[]`; the `/meetings/[id]` UI does `m.attendees.join(', ')` and treats `remaining_this_round[0]` as a string label).
docs/superpowers/plans/2026-05-30-cross-council-meetings.md:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'cli:claude', persona: '' });
docs/superpowers/plans/2026-05-30-cross-council-meetings.md:      { slug: 'leto', label: 'Leto', adapter: 'cli:claude', busy: false }
docs/superpowers/plans/2026-05-30-cross-council-meetings.md:            councillors: [{ slug: 'leto', label: 'Leto', adapter: 'cli:claude', busy: false }]
src/routes/council/EnvVarRow.svelte:  //  - a non-empty literal outside the enum → open in custom mode
src/routes/export/export-route.test.ts:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/routes/export/export-route.test.ts:    await writeCouncilEnv([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/routes/export/export-route.test.ts:    expect(body.env).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/routes/api/meeting/turn/turn-route.test.ts:    const meeting_id = '2026-05-31T21-00-12-212Z-lite-model-debate';
src/routes/api/council/council-route.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'cli:claude', persona: '' });
src/routes/api/council/council-route.test.ts:      { slug: 'leto', label: 'Leto', adapter: 'cli:claude', busy: false }
src/lib/server/oeuvre-runner.ts:// councillor collaboration. A per-councillor `?model=` pin still wins.
src/lib/server/councils.test.ts:      adapter: 'cli:claude',
src/lib/server/councils.test.ts:    expect(read.adapter).toBe('cli:claude');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.editor.adapter).toBe('cli:claude');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.amanuensis.adapter).toBe('cli:claude');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.researcher.adapter).toBe('cli:codex');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.skeptic.adapter).toBe('cli:codex');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.reader.adapter).toBe('cli:claude');
src/lib/server/peers.test.ts:            councillors: [{ slug: 'leto', label: 'Leto', adapter: 'cli:claude', busy: false }]
src/lib/server/templates.test.ts:        { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/lib/server/templates.test.ts:    expect(t.env?.[0]).toEqual({ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite', comment: undefined });
src/lib/server/templates.test.ts:    const bad = { ...validTemplate, env: { LANDSRAAD_MEETING_MODEL: 'lite' } };
src/lib/server/templates.test.ts:      env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
src/lib/server/templates.test.ts:        { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/lib/server/templates.test.ts:      env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
src/lib/server/templates.test.ts:    expect(readCouncilEnv()).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/lib/server/templates.test.ts:      env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
src/lib/server/templates.test.ts:        { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/lib/server/templates.test.ts:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/lib/server/templates.test.ts:    await writeCouncilEnv([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/lib/server/templates.test.ts:      expect(readCouncilEnv()).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/lib/server/templates.test.ts:      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
src/lib/server/templates.test.ts:    expect(out.env).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
src/lib/server/templates.engineering.test.ts:    expect(bySlug.architect.adapter).toBe('cli:claude');
src/lib/server/templates.engineering.test.ts:    expect(bySlug.sweng.adapter).toBe('cli:codex');
src/lib/server/templates.engineering.test.ts:    expect(bySlug.ee.adapter).toBe('cli:codex');
src/lib/server/templates.engineering.test.ts:    expect(bySlug.mech.adapter).toBe('cli:claude');
src/lib/server/templates.engineering.test.ts:    expect(bySlug.qa.adapter).toBe('cli:codex');
src/lib/server/adapters/cli.ts:  /** Optional model id, e.g. from a `cli:claude?model=claude-haiku-4-5` adapter string. */
src/lib/server/adapters/cli.ts:export type ModelTier = 'lite' | 'medium' | 'heavy';
src/lib/server/adapters/cli.ts:   * Maps the service-agnostic tiers `lite`/`medium`/`heavy` to this CLI's own
src/lib/server/adapters/cli.ts:   * model ids. Lets `LANDSRAAD_MEETING_MODEL=lite` (or `?model=heavy`) mean the
src/lib/server/adapters/cli.ts:const TIER_KEYS: readonly ModelTier[] = ['lite', 'medium', 'heavy'];
src/lib/server/adapters/cli.ts:  'cli:claude': {
src/lib/server/adapters/cli.ts:    id: 'cli:claude',
src/lib/server/adapters/cli.ts:    command: 'claude',
src/lib/server/adapters/cli.ts:    // The claude CLI accepts these short aliases directly (`claude --model sonnet`).
src/lib/server/adapters/cli.ts:    tiers: { lite: 'haiku', medium: 'sonnet', heavy: 'opus' }
src/lib/server/adapters/cli.ts:  'cli:codex': {
src/lib/server/adapters/cli.ts:    id: 'cli:codex',
src/lib/server/adapters/cli.ts:    command: 'codex',
src/lib/server/adapters/cli.ts:  'cli:gemini': {
src/lib/server/adapters/cli.ts:    id: 'cli:gemini',
src/lib/server/adapters/cli.ts:    command: 'gemini',
src/lib/server/adapters/cli.ts:  'cli:grok': {
src/lib/server/adapters/cli.ts:    id: 'cli:grok',
src/lib/server/adapters/cli.ts:    command: 'grok',
src/lib/server/adapters/cli.ts:  'cli:qwen': {
src/lib/server/adapters/cli.ts:    id: 'cli:qwen',
src/lib/server/adapters/cli.ts:    command: 'qwen',
src/lib/server/adapters/cli.ts:    // Qwen Code (gemini-cli fork): a piped stdin runs headless, printing the
src/lib/server/adapters/cli.ts:    // reply to stdout and exiting. Equivalent to `qwen -p "<prompt>"`.
src/lib/server/adapters/cli.ts:  'cli:vibe': {
src/lib/server/adapters/cli.ts:    id: 'cli:vibe',
src/lib/server/adapters/cli.ts:  'cli:aider': {
src/lib/server/adapters/cli.ts:    id: 'cli:aider',
src/lib/server/adapters/cli.ts:    command: 'aider',
src/lib/server/adapters/cli.ts:  'cli:warp': {
src/lib/server/adapters/cli.ts:    id: 'cli:warp',
src/lib/server/adapters/cli.ts:  /** The bare adapter id with any `?query` stripped, e.g. `cli:claude`. */
src/lib/server/adapters/cli.ts: * Lets a councillor pin a model per-adapter, e.g. `cli:claude?model=claude-haiku-4-5`,
src/lib/server/adapters/cli.ts: * Resolve the model id for a CLI adapter turn. A per-councillor `?model=` pin
src/lib/server/adapters/cli.ts: * `LANDSRAAD_MEETING_MODEL`) applies. Either value may be a literal model id or
src/lib/server/adapters/cli.ts: * a service-agnostic tier (`lite`/`medium`/`heavy`); a tier is mapped through
src/lib/server/adapters/cli.ts: * CLIs (claude, codex, gemini…) are `.cmd`/`.ps1` shims that Node can only launch
src/lib/server/adapters/cli.ts: * prompt passed as an arg gets word-split by cmd.exe (grok then read "Persona:" as
src/lib/server/adapters/cli.ts: * whose prompt travels safely over stdin. `arg` adapters (grok/aider/warp) are
src/lib/server/adapters/install.test.ts:      'cli:aider',
src/lib/server/adapters/install.test.ts:      'cli:claude',
src/lib/server/adapters/install.test.ts:      'cli:codex',
src/lib/server/adapters/install.test.ts:      'cli:gemini',
src/lib/server/adapters/install.test.ts:      'cli:grok',
src/lib/server/adapters/install.test.ts:      'cli:qwen',
src/lib/server/adapters/install.test.ts:      'cli:vibe',
src/lib/server/adapters/install.test.ts:      'cli:warp'
src/lib/server/adapters/install.test.ts:    expect(ids).not.toContain('sdk:claude');
src/lib/server/adapters/install.test.ts:    expect(ids).not.toContain('sdk:codex');
src/lib/server/adapters/index.ts:   * Model id to use when the adapter string does not pin one with `?model=`.
src/lib/server/adapters/index.ts:    id: 'cli:claude',
src/lib/server/adapters/index.ts:    note: 'Requires `claude` on PATH.',
src/lib/server/adapters/index.ts:    command: 'claude',
src/lib/server/adapters/index.ts:    install: 'npm install -g @anthropic-ai/claude-code',
src/lib/server/adapters/index.ts:    docsUrl: 'https://docs.claude.com/en/docs/claude-code/overview',
src/lib/server/adapters/index.ts:    blurb: 'Anthropic’s coding agent. After install, run `claude` once to sign in.'
src/lib/server/adapters/index.ts:    id: 'cli:codex',
src/lib/server/adapters/index.ts:    note: 'Requires `codex` on PATH.',
src/lib/server/adapters/index.ts:    command: 'codex',
src/lib/server/adapters/index.ts:    install: 'npm install -g @openai/codex',
src/lib/server/adapters/index.ts:    docsUrl: 'https://github.com/openai/codex',
src/lib/server/adapters/index.ts:    blurb: 'OpenAI’s coding agent. After install, run `codex` once to sign in.'
src/lib/server/adapters/index.ts:    id: 'cli:gemini',
src/lib/server/adapters/index.ts:    note: 'Requires `gemini` on PATH.',
src/lib/server/adapters/index.ts:    command: 'gemini',
src/lib/server/adapters/index.ts:    install: 'npm install -g @google/gemini-cli',
src/lib/server/adapters/index.ts:    docsUrl: 'https://github.com/google-gemini/gemini-cli',
src/lib/server/adapters/index.ts:    blurb: 'Google’s coding agent. After install, run `gemini` once to authenticate.'
src/lib/server/adapters/index.ts:    id: 'cli:grok',
src/lib/server/adapters/index.ts:    note: 'Requires the official xAI `grok` CLI on PATH.',
src/lib/server/adapters/index.ts:    command: 'grok',
src/lib/server/adapters/index.ts:    blurb: 'Official xAI Grok agent CLI. Authenticate with `grok login` (use `grok login --device-auth` for headless environments).'
src/lib/server/adapters/index.ts:    id: 'cli:qwen',
src/lib/server/adapters/index.ts:    note: 'Requires `qwen` on PATH.',
src/lib/server/adapters/index.ts:    command: 'qwen',
src/lib/server/adapters/index.ts:    install: 'npm install -g @qwen-code/qwen-code',
src/lib/server/adapters/index.ts:    docsUrl: 'https://github.com/QwenLM/qwen-code',
src/lib/server/adapters/index.ts:    blurb: 'Alibaba’s open-source terminal coding agent (a gemini-cli fork). After install, run `qwen` once to authenticate.'
src/lib/server/adapters/index.ts:    id: 'cli:vibe',
src/lib/server/adapters/index.ts:    id: 'cli:aider',
src/lib/server/adapters/index.ts:    note: 'Requires `aider` on PATH and an LLM API key in the environment.',
src/lib/server/adapters/index.ts:    command: 'aider',
src/lib/server/adapters/index.ts:    install: 'python -m pip install aider-install && aider-install',
src/lib/server/adapters/index.ts:    docsUrl: 'https://aider.chat/docs/scripting.html',
src/lib/server/adapters/index.ts:    blurb: 'AI pair programmer. Set your model’s API key (e.g. OPENAI_API_KEY / ANTHROPIC_API_KEY); each turn runs as `aider --message … --yes --no-auto-commits`.'
src/lib/server/adapters/index.ts:    id: 'cli:warp',
src/lib/server/adapters/index.ts:  { id: 'sdk:claude', label: 'Claude SDK', available: false, note: 'Not yet implemented.' },
src/lib/server/adapters/index.ts:  { id: 'sdk:codex', label: 'Codex SDK', available: false, note: 'Not yet implemented.' }
src/lib/server/openapi.ts:            adapter: { type: 'string', description: 'Adapter string (e.g. "cli:claude").' },
src/lib/env-suggestions.test.ts:  it('exposes lite/medium/heavy as the known values for MEETING_MODEL', () => {
src/lib/env-suggestions.test.ts:      'lite',
src/lib/env-suggestions.test.ts:      'medium',
src/lib/env-suggestions.test.ts:      'heavy'
src/lib/env-suggestions.test.ts:  const tiers = ['lite', 'medium', 'heavy'];
src/lib/env-suggestions.test.ts:    expect(startsInCustomMode('medium', tiers)).toBe(false);
src/lib/env-suggestions.test.ts:  it('is true when a non-empty value is not in the enum (a literal from disk)', () => {
src/lib/env-suggestions.test.ts:    expect(startsInCustomMode('claude-opus-4-8', tiers)).toBe(true);
src/lib/server/config.ts: * either a literal model id (`LANDSRAAD_MEETING_MODEL=haiku`) or a
src/lib/server/config.ts: * service-agnostic tier (`lite`/`medium`/`heavy`) that each adapter maps to its
src/lib/server/config.ts: * per-councillor `?model=` pin in the adapter string still wins. Per-process:
src/lib/server/adapters/cli.test.ts:    // so if stdin is left open the process never exits — the real grok 120s-timeout bug.
src/lib/server/adapters/cli.test.ts:      { id: 'cli:test-cat', command: 'cat', args: () => [], stdinMode: 'arg' },
src/lib/server/adapters/cli.test.ts:  it('codex exec is invoked with --skip-git-repo-check so non-git council dirs work', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:codex');
src/lib/server/adapters/cli.test.ts:  it('claude CLI uses -p print mode', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:claude');
src/lib/server/adapters/cli.test.ts:  it('claude CLI injects --model when a model opt is supplied', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:claude');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.args('prompt', { model: 'claude-haiku-4-5' })).toEqual([
src/lib/server/adapters/cli.test.ts:      'claude-haiku-4-5'
src/lib/server/adapters/cli.test.ts:  it('claude CLI omits --model when the model opt is blank', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:claude');
src/lib/server/adapters/cli.test.ts:    expect(parseAdapterId('cli:claude')).toEqual({ base: 'cli:claude', params: {} });
src/lib/server/adapters/cli.test.ts:  it('parses a ?model= query suffix', () => {
src/lib/server/adapters/cli.test.ts:    expect(parseAdapterId('cli:claude?model=claude-haiku-4-5')).toEqual({
src/lib/server/adapters/cli.test.ts:      base: 'cli:claude',
src/lib/server/adapters/cli.test.ts:      params: { model: 'claude-haiku-4-5' }
src/lib/server/adapters/cli.test.ts:    expect(parseAdapterId('cli:codex?model=gpt-5-mini&foo=bar')).toEqual({
src/lib/server/adapters/cli.test.ts:      base: 'cli:codex',
src/lib/server/adapters/cli.test.ts:    const { base } = parseAdapterId('cli:claude?model=x');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude')).toBeUndefined();
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'haiku')).toBe('haiku');
src/lib/server/adapters/cli.test.ts:  it('lets a per-councillor ?model= win over the host-wide default', () => {
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude?model=opus', 'haiku')).toBe('opus');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', '   ')).toBeUndefined();
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude?model=', 'haiku')).toBe('haiku');
src/lib/server/adapters/cli.test.ts:  it('maps a lite/medium/heavy host-wide default through the adapter tier table', () => {
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'lite')).toBe('haiku');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'medium')).toBe('sonnet');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'heavy')).toBe('opus');
src/lib/server/adapters/cli.test.ts:  it('maps a tier keyword supplied via a per-councillor ?model= pin', () => {
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude?model=heavy', 'lite')).toBe('opus');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'Heavy')).toBe('opus');
src/lib/server/adapters/cli.test.ts:  it('passes a literal model id through untouched (not a tier keyword)', () => {
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude', 'claude-opus-4-8')).toBe('claude-opus-4-8');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:claude?model=claude-haiku-4-5')).toBe('claude-haiku-4-5');
src/lib/server/adapters/cli.test.ts:    expect(effectiveModel('cli:codex', 'lite')).toBeUndefined();
src/lib/server/adapters/cli.test.ts:  it('claude exposes lite/medium/heavy tier aliases', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:claude');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.tiers).toEqual({ lite: 'haiku', medium: 'sonnet', heavy: 'opus' });
src/lib/server/adapters/cli.test.ts:  // the CLI mis-parses it (grok read "Persona:" as --single's value, then the
src/lib/server/adapters/cli.test.ts:    expect(shouldUseShell(getCliConfig('cli:grok')!)).toBe(false);
src/lib/server/adapters/cli.test.ts:    expect(shouldUseShell(getCliConfig('cli:aider')!)).toBe(false);
src/lib/server/adapters/cli.test.ts:    expect(shouldUseShell(getCliConfig('cli:warp')!)).toBe(false);
src/lib/server/adapters/cli.test.ts:    expect(shouldUseShell(getCliConfig('cli:claude')!)).toBe(process.platform === 'win32');
src/lib/server/adapters/cli.test.ts:  it('gemini CLI runs headless via piped stdin', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:gemini');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.command).toBe('gemini');
src/lib/server/adapters/cli.test.ts:  it('grok CLI runs single-turn headless via --single (official xAI CLI)', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:grok');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.command).toBe('grok');
src/lib/server/adapters/cli.test.ts:  it('qwen CLI runs headless via piped stdin', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:qwen');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.command).toBe('qwen');
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:vibe');
src/lib/server/adapters/cli.test.ts:  it('aider runs a single message then exits, with confirmations and auto-commits disabled', () => {
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:aider');
src/lib/server/adapters/cli.test.ts:    expect(cfg!.command).toBe('aider');
src/lib/server/adapters/cli.test.ts:    const cfg = getCliConfig('cli:warp');
src/lib/server/embeddings.ts:import Database from 'better-sqlite3';
src/lib/server/embeddings.ts:import * as sqliteVec from 'sqlite-vec';
src/lib/server/embeddings.ts:  sqliteVec.load(db);
src/lib/server/templates.bundled.test.ts:      expect(byKey.get('LANDSRAAD_MEETING_MODEL')).toBe('lite');
[stderr] 
[stderr] exec
/bin/zsh -lc 'rg "chunk|Chunk|kind|project_file|memory_private|job_input|job_output|transcript|persona" src/lib/server docs/embeddings.md' in .
[stderr]  succeeded in 0ms:
docs/embeddings.md:Let the director (and, later, councillors themselves) semantically search across a council's markdown surface — memory notes, job inputs/outputs, transcripts, councillor personas — without coupling Landsraad to a remote vector service. Local-first, file-first, one operator, one machine.
docs/embeddings.md:- No automatic chunking of giant files in v0 — embed whole-doc; split later if a doc exceeds the model's input window.
docs/embeddings.md:| Embedder | `@xenova/transformers` running `Xenova/all-MiniLM-L6-v2` (384d) | In-process, no API key, ~25MB cached, ~100ms/chunk on CPU. |
docs/embeddings.md:CREATE TABLE chunks (
docs/embeddings.md:  kind         TEXT NOT NULL,        -- 'memory' | 'memory_private' | 'job_input' | 'job_output' | 'transcript' | 'persona'
docs/embeddings.md:  chunk_idx    INTEGER NOT NULL DEFAULT 0,
docs/embeddings.md:  councillor_slug TEXT,              -- non-null when kind in (job_*, persona)
docs/embeddings.md:  UNIQUE(kind, ref_id, chunk_idx)
docs/embeddings.md:CREATE INDEX chunks_kind_ref ON chunks(kind, ref_id);
docs/embeddings.md:CREATE INDEX chunks_councillor ON chunks(councillor_slug) WHERE councillor_slug IS NOT NULL;
docs/embeddings.md:CREATE VIRTUAL TABLE vec_chunks USING vec0(
docs/embeddings.md:  chunk_id INTEGER PRIMARY KEY,
docs/embeddings.md:`chunks.id` and `vec_chunks.chunk_id` are kept in lockstep — insert into `chunks` first, then insert the embedding with the returned `id`. On delete, remove from both.
docs/embeddings.md:<kind>/<ref_id>#<chunk_idx>
docs/embeddings.md:| `memory_private/q1-fcf-watchlist#0` | `<council>/.landsraad/councillors/cfo/memory/q1-fcf-watchlist.md` |
docs/embeddings.md:| `job_input/2026-05-22T14-30-00Z-q1-summary#0` | `<council>/.landsraad/jobs/.../input.md` |
docs/embeddings.md:| `job_output/2026-05-22T14-30-00Z-q1-summary#0` | `<council>/.landsraad/jobs/.../output.md` |
docs/embeddings.md:| `transcript/2026-05-22T14-30-00Z-q1-summary#0` | `<council>/.landsraad/jobs/.../transcript.md` |
docs/embeddings.md:| `persona/mocky#0` | `<council>/.landsraad/councillors/mocky/persona.md` |
docs/embeddings.md:| `project_file/docs/launch-plan.md#0` | `<council>/docs/launch-plan.md` (product tree, not `.landsraad/`) |
docs/embeddings.md:`project_file` chunks come from the **product tree** — `.md`/`.txt` in the working
docs/embeddings.md:All other kinds come from the council machine under `.landsraad/`.
docs/embeddings.md:- Lower (≈ 0.20) → highly redundant / boilerplate / templated text. Often a job_input header that was assembled from memory.
docs/embeddings.md:Useful for filtering search results (down-rank near-boilerplate hits) and for debugging adapter behavior (a transcript with density 0.18 is probably stuck in a loop).
docs/embeddings.md:| Private-memory create / update (reflection) | After `writeFile` | Upsert `memory_private/<entry-slug>#0` with `councillor_slug`. |
docs/embeddings.md:| Private-memory delete | Before `rm` | Delete `memory_private/<entry-slug>#*`. |
docs/embeddings.md:| `writeInput` | After `writeFile` | Upsert `job_input/<job-id>#0`. |
docs/embeddings.md:| `writeOutput` | After `writeFile` | Upsert `job_output/<job-id>#0`. Also embed transcript if non-empty: `transcript/<job-id>#0`. |
docs/embeddings.md:| `setStatus('succeeded' \| 'failed' \| 'cancelled')` | After write | Re-embed output (transcript may have grown since `writeInput`). |
docs/embeddings.md:| Councillor `persona.md` write | After `writeFile` | Upsert `persona/<slug>#0`. |
docs/embeddings.md:| Councillor delete | Before `rm` | Delete `persona/<slug>#*` and any related `job_*` rows for that councillor (TBD — see Open Questions). |
docs/embeddings.md:Walks `<council-root>/.landsraad/memory/`, `<council-root>/.landsraad/councillors/*/persona.md`, `<council-root>/.landsraad/councillors/*/memory/*.md`, and `<council-root>/.landsraad/jobs/*/{input,output,transcript}.md`. For each file:
docs/embeddings.md:1. Compute `text_hash`. If a chunk row exists with the same hash, skip.
docs/embeddings.md:2. Otherwise embed, upsert chunk + vector, update `source_mtime`.
docs/embeddings.md:  kind: ChunkKind;
docs/embeddings.md:  chunk_idx: number;
docs/embeddings.md:  kinds?: ChunkKind[];   // filter
docs/embeddings.md:Cosine similarity via `vec_chunks MATCH` (sqlite-vec syntax). Post-filter on `kinds` / `councillor_slug` / `min_density` happens in SQL.
docs/embeddings.md:- Chunking long transcripts. v0 embeds whole doc, even if it overflows the model's 512-token window (the model will truncate). When this hurts, add sentence-level chunking with overlap. Specify when seen.
src/lib/server/meeting-index.test.ts:import type { ChunkKind } from './embeddings';
src/lib/server/meeting-index.test.ts:describe('meeting chunk kinds', () => {
src/lib/server/meeting-index.test.ts:    const accepted: ChunkKind[] = ['meeting_topic', 'meeting_turn', 'meeting_summary', 'meeting_synthesis'];
src/lib/server/meeting-index.test.ts:      const x: ChunkKind = k;
src/lib/server/memory_private.test.ts:} from './memory_private';
src/lib/server/memory_private.test.ts:describe('memory_private', () => {
src/lib/server/meeting-runner.test.ts:  await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meeting-runner.test.ts:  await createCouncillor({ name: 'Mocky', role: 'sidekick', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meeting-runner.test.ts:    expect(listHeldBy({ kind: 'meeting', id: m.id }).sort()).toEqual(['leto', 'mocky']);
src/lib/server/meeting-runner.test.ts:    tryAcquire('leto', { kind: 'job', id: 'J1' });
src/lib/server/meeting-runner.test.ts:    expect(listHeldBy({ kind: 'meeting', id: 'x' })).toEqual([]);
src/lib/server/meeting-runner.test.ts:  it('directorSpeak appends a transcript block and runs advance to completion', async () => {
src/lib/server/meeting-runner.test.ts:    // to round 2. The director turn is skipped (not in transcript), councillor turn is.
src/lib/server/meeting-runner.test.ts:    await createCouncillor({ name: 'Broken', role: 'test', routing_hint: '', adapter: 'unknown:adapter', persona: '' });
src/lib/server/meeting-runner.test.ts:    expect(listHeldBy({ kind: 'meeting', id: m.id })).toEqual([]);
src/lib/server/meeting-runner.test.ts:    expect(listHeldBy({ kind: 'meeting', id: m.id })).toEqual([]);
src/lib/server/runner.ts:  return h?.kind === 'job';
src/lib/server/runner.ts:  const transcript = await readTranscript(job.id).catch(() => '');
src/lib/server/runner.ts:    transcript,
src/lib/server/runner.ts:async function buildPrompt(job: Job, personaBody: string): Promise<string> {
src/lib/server/runner.ts:  if (personaBody.trim()) sections.push(`# Persona\n\n${personaBody.trim()}`);
src/lib/server/runner.ts:  if (!tryAcquire(councillor.slug, { kind: 'job', id: jobId })) {
src/lib/server/runner.ts:    releaseLock(councillor.slug, { kind: 'job', id: jobId });
src/lib/server/runner.ts:      const prompt = await buildPrompt(job, councillor.persona);
src/lib/server/runner.ts:      // stderrAccum collects streamed stderr chunks (for adapters that stream stderr).
src/lib/server/runner.ts:      // not as streamed chunks — those will be captured from adapterResult.transcript below.
src/lib/server/runner.ts:      // If onStderr received nothing but the transcript has a final stderr block
src/lib/server/runner.ts:        const idx = adapterResult.transcript.lastIndexOf(sep);
src/lib/server/runner.ts:        if (idx !== -1) stderrAccum = adapterResult.transcript.slice(idx + sep.length);
src/lib/server/runner.ts:      // and also appended "\n[stderr]\n<stderr>" to its internal transcript field.
src/lib/server/runner.ts:      // The original runner appended a final "\n[stderr]\n<stderr>" block to the transcript
src/lib/server/runner.ts:      // the transcript consistent with what tests expect (streamed lines only, no double-append).
src/lib/server/runner.ts:      releaseLock(councillor.slug, { kind: 'job', id: jobId });
src/lib/server/index-sources.test.ts:describe('resolveSource — whole-file kinds', () => {
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('memory');
src/lib/server/index-sources.test.ts:    const [c] = src.buildChunks('# Capital Allocation\n\nReserve runway.', rel, abs);
src/lib/server/index-sources.test.ts:    expect(c).toMatchObject({ chunk_idx: 0, title: 'Capital Allocation', councillor_slug: null });
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('memory_private');
src/lib/server/index-sources.test.ts:    const [c] = src.buildChunks('# Hedging\n\nbody', rel, abs);
src/lib/server/index-sources.test.ts:  it('maps a persona, title from sibling councillor.json', () => {
src/lib/server/index-sources.test.ts:    const rel = '.landsraad/councillors/quant/persona.md';
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('persona');
src/lib/server/index-sources.test.ts:    const [c] = src.buildChunks('I am the quant.', rel, abs);
src/lib/server/index-sources.test.ts:  it('maps job input/output/transcript from sibling job.json', () => {
src/lib/server/index-sources.test.ts:    for (const [file, kind] of [
src/lib/server/index-sources.test.ts:      ['input.md', 'job_input'],
src/lib/server/index-sources.test.ts:      ['output.md', 'job_output'],
src/lib/server/index-sources.test.ts:      ['transcript.md', 'transcript']
src/lib/server/index-sources.test.ts:      expect(src.kind).toBe(kind);
src/lib/server/index-sources.test.ts:      const [c] = src.buildChunks('content here', rel, abs);
src/lib/server/index-sources.test.ts:    expect(topic.kind).toBe('meeting_topic');
src/lib/server/index-sources.test.ts:    expect(topic.buildChunks('t', '.landsraad/meetings/2026-m1/topic.md', join(root, '.landsraad/meetings/2026-m1/topic.md'))[0])
src/lib/server/index-sources.test.ts:    expect(summary.kind).toBe('meeting_summary');
src/lib/server/index-sources.test.ts:    expect(summary.buildChunks('s', '.landsraad/meetings/2026-m1/summary.md', join(root, '.landsraad/meetings/2026-m1/summary.md'))[0])
src/lib/server/index-sources.test.ts:    expect(synth.kind).toBe('meeting_synthesis');
src/lib/server/index-sources.test.ts:    expect(synth.buildChunks('s', '.landsraad/meetings/2026-m1/synthesis.md', join(root, '.landsraad/meetings/2026-m1/synthesis.md'))[0])
src/lib/server/index-sources.test.ts:  it('maps a meeting transcript into one chunk per turn', () => {
src/lib/server/index-sources.test.ts:    const rel = '.landsraad/meetings/2026-m1/transcript.md';
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('meeting_turn');
src/lib/server/index-sources.test.ts:    const chunks = src.buildChunks(body, rel, abs);
src/lib/server/index-sources.test.ts:    expect(chunks).toHaveLength(2);
src/lib/server/index-sources.test.ts:    expect(chunks[0]).toMatchObject({ chunk_idx: 1, councillor_slug: 'quant', text: 'Hello from quant.' });
src/lib/server/index-sources.test.ts:    expect(chunks[0].title).toBe('M1 · turn 1 · quant');
src/lib/server/index-sources.test.ts:    expect(chunks[1]).toMatchObject({ chunk_idx: 2, councillor_slug: null });
src/lib/server/index-sources.test.ts:    expect(chunks[1].title).toBe('M1 · turn 2 · director');
src/lib/server/index-sources.test.ts:  it('maps a product .md to project_file, title from first heading', () => {
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('project_file');
src/lib/server/index-sources.test.ts:    const [c] = src.buildChunks('# Launch Plan\n\nShip it.', rel, join(root, rel));
src/lib/server/index-sources.test.ts:    expect(c).toMatchObject({ chunk_idx: 0, title: 'Launch Plan', councillor_slug: null });
src/lib/server/index-sources.test.ts:  it('maps a product .txt to project_file, title from basename', () => {
src/lib/server/index-sources.test.ts:    expect(src.kind).toBe('project_file');
src/lib/server/index-sources.test.ts:    const [c] = src.buildChunks('plain text body', rel, join(root, rel));
src/lib/server/index-sources.test.ts:  it('routes .landsraad/ prose to the structured kind, not project_file', () => {
src/lib/server/index-sources.test.ts:    expect(resolveSource('.landsraad/memory/x.md')!.kind).toBe('memory');
src/lib/server/index-sources.test.ts:    expect(resolveSource('.landsraad/councillors/q/persona.md')!.kind).toBe('persona');
src/lib/server/reconcile.test.ts:    expect(hits[0].kind).toBe('memory');
src/lib/server/reconcile.test.ts:  it('removeFile deletes the chunks', async () => {
src/lib/server/reconcile.test.ts:  it('reindexFile on a missing file removes existing chunks', async () => {
src/lib/server/reconcile.test.ts:  it('indexes a product .md (outside .landsraad/) as project_file', async () => {
src/lib/server/reconcile.test.ts:    expect(hits[0].kind).toBe('project_file');
src/lib/server/config.ts:// Workspace (product-tree) retrieval. `PROJECT_TOPK` is how many `project_file`
src/lib/server/meeting-recovery.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/paths.ts: * persisted (transcripts, outputs, summaries). The council root becomes `.` and
src/lib/server/reflection-apply.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/memory.test.ts:    const n = await createSharedNoteAutoSuffix({ title: 'House Rules', body: 'be kind' });
src/lib/server/memory.test.ts:    expect((await readNote('house-rules')).body).toContain('be kind');
src/lib/server/runner.test.ts:import { listPrivateNotes } from './memory_private';
src/lib/server/runner.test.ts:    persona: 'You are Mocky.'
src/lib/server/runner.test.ts:    const transcript = await readTranscript(j.id);
src/lib/server/runner.test.ts:    expect(transcript).toContain('mock:local');
src/lib/server/runner.test.ts:  it('includes persona and memory in the assembled prompt', async () => {
src/lib/server/runner.test.ts:    const adapterOverride = { id: failing.id, kind: 'mock' as const, run: failing.run };
src/lib/server/runner.test.ts:    const adapterOverride = { id: slow.id, kind: 'mock' as const, run: slow.run };
src/lib/server/runner.test.ts:    const adapterOverride = { id: slow.id, kind: 'mock' as const, run: slow.run };
src/lib/server/runner.test.ts:    const adapterOverride = { id: slow.id, kind: 'mock' as const, run: slow.run };
src/lib/server/runner.test.ts:    async function* chunks() {
src/lib/server/runner.test.ts:      chunks: chunks(),
src/lib/server/runner.test.ts:  return { id: 'mock:reflect', kind: 'mock' as const, run };
src/lib/server/runner.test.ts:      async function* chunks() {
src/lib/server/runner.test.ts:      return { chunks: chunks(), result: Promise.resolve({ exit_code: 0, stdout: 'job output body', stderr: '' }) };
src/lib/server/runner.test.ts:    async function* chunks() {
src/lib/server/runner.test.ts:      chunks: chunks(),
src/lib/server/runner.test.ts:  return { id: 'mock:reflect-hang', kind: 'mock' as const, run };
src/lib/server/runner.test.ts:    async function* chunks() {
src/lib/server/runner.test.ts:      chunks: chunks(),
src/lib/server/runner.test.ts:  return { id: 'mock:bad', kind: 'mock' as const, run };
src/lib/server/runner.test.ts:    const reflection = '<<MEMORY title="Council Rule" scope="shared">>\nBe kind.\n<</MEMORY>>';
src/lib/server/oeuvre-prompt.ts:// Pure prompt composers for the oeuvre loop. The runner assembles persona +
src/lib/server/oeuvre-prompt.ts:  persona: string;
src/lib/server/oeuvre-prompt.ts:    i.persona.trim() ? `# Persona\n\n${i.persona.trim()}` : '',
src/lib/server/oeuvre-prompt.ts: * the councillor's persona + retrieved memory. So this returns just the
src/lib/server/oeuvre-prompt.ts:  persona: string;
src/lib/server/oeuvre-prompt.ts:    i.persona.trim() ? `# Persona\n\n${i.persona.trim()}` : '',
src/lib/server/councillor-lock.test.ts:    expect(tryAcquire('leto', { kind: 'job', id: 'J1' })).toBe(true);
src/lib/server/councillor-lock.test.ts:    expect(current('leto')).toEqual({ kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    tryAcquire('leto', { kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    expect(tryAcquire('leto', { kind: 'meeting', id: 'M1' })).toBe(false);
src/lib/server/councillor-lock.test.ts:    expect(current('leto')).toEqual({ kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    tryAcquire('leto', { kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    release('leto', { kind: 'job', id: 'J2' });
src/lib/server/councillor-lock.test.ts:    expect(current('leto')).toEqual({ kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    release('leto', { kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    tryAcquire('a', { kind: 'meeting', id: 'M1' });
src/lib/server/councillor-lock.test.ts:    tryAcquire('b', { kind: 'meeting', id: 'M1' });
src/lib/server/councillor-lock.test.ts:    tryAcquire('c', { kind: 'job', id: 'J1' });
src/lib/server/councillor-lock.test.ts:    expect(listHeldBy({ kind: 'meeting', id: 'M1' }).sort()).toEqual(['a', 'b']);
src/lib/server/councillor-lock.test.ts:    const holder = { kind: 'remote-meeting' as const, id: 'm1', host: 'eng-council' };
src/lib/server/councillor-lock.test.ts:    expect(tryAcquire('leto', { kind: 'meeting', id: 'm2' })).toBe(false); // busy
src/lib/server/councillor-lock.test.ts:    release('leto', { kind: 'remote-meeting', id: 'm1', host: 'eng-council' });
src/lib/server/councillor-lock.test.ts:    const holder = { kind: 'remote-meeting' as const, id: 'm1', host: 'eng-council' };
src/lib/server/councillor-lock.test.ts:    release('leto', { kind: 'remote-meeting', id: 'm1', host: 'ops-council' });
src/lib/server/councillor-lock.test.ts:    release('leto', { kind: 'remote-meeting', id: 'm1', host: 'eng-council' });
src/lib/server/oeuvre-runner.ts:    persona: leader.persona,
src/lib/server/oeuvre-runner.ts:      // res.transcript carries the adapter's stderr (e.g. an auth/CLI error) — the
src/lib/server/oeuvre-runner.ts:      const tail = snippet(res.transcript || res.output);
src/lib/server/oeuvre-runner.ts:      .filter((t) => t.kind === 'turn')
src/lib/server/oeuvre-runner.ts:      persona: leader.persona,
src/lib/server/oeuvre-runner.ts:      kind: 'leader_pick',
src/lib/server/oeuvre-runner.ts:        kind: 'turn',
src/lib/server/oeuvre-runner.ts:        kind: 'turn_failed',
src/lib/server/reflection.test.ts:  it('includes transcript and output sections', () => {
src/lib/server/reflection.test.ts:      transcript: 'TRANSCRIPT_BODY',
src/lib/server/reflection.test.ts:      title: 't', brief: 'b', transcript: '', output: ''
src/lib/server/meetings.ts:const TRANSCRIPT_FILE = 'transcript.md';
src/lib/server/jobs.test.ts:  it('persists input, transcript, output', async () => {
src/lib/server/jobs.test.ts:    await appendTranscript(j.id, 'chunk-1\n');
src/lib/server/jobs.test.ts:    await appendTranscript(j.id, 'chunk-2\n');
src/lib/server/jobs.test.ts:    expect(await readTranscript(j.id)).toBe('chunk-1\nchunk-2\n');
src/lib/server/jobs.test.ts:  it('redacts the council root from transcript and output on write', async () => {
src/lib/server/jobs.test.ts:    const transcript = await readTranscript(j.id);
src/lib/server/jobs.test.ts:    expect(transcript).not.toContain(tmpRoot);
src/lib/server/jobs.test.ts:    expect(transcript).toBe('[stderr] workdir: .\n');
src/lib/server/schedules.test.ts:        kind: 'recurring',
src/lib/server/schedules.test.ts:    expect(s.kind).toBe('recurring');
src/lib/server/schedules.test.ts:        kind: 'once',
src/lib/server/schedules.test.ts:    expect(s.kind).toBe('once');
src/lib/server/schedules.test.ts:        kind: 'recurring',
src/lib/server/schedules.test.ts:        kind: 'once',
src/lib/server/schedules.test.ts:        kind: 'recurring',
src/lib/server/schedules.test.ts:        kind: 'recurring',
src/lib/server/schedules.test.ts:      { title: 'same', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'same', brief: 'b', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'same', brief: 'c', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'b', brief: 'b', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/schedules.test.ts:      { title: 'a', brief: 'a', councillor_slug: 'alice', kind: 'recurring', cron: '0 9 * * *', enabled: true },
src/lib/server/reconcile.ts:  // Oversize product files: skip embedding (and drop any prior chunks). The
src/lib/server/reconcile.ts:  // structured council kinds are bounded, so this only gates project_file.
src/lib/server/reconcile.ts:  if (src.kind === 'project_file') {
src/lib/server/reconcile.ts:      indexDelete(src.kind, refId);
src/lib/server/reconcile.ts:      indexDelete(src.kind, refId);
src/lib/server/reconcile.ts:    indexDelete(src.kind, refId);
src/lib/server/reconcile.ts:  indexDelete(src.kind, refId);
src/lib/server/reconcile.ts:  const chunks = src.buildChunks(text, rel, abs);
src/lib/server/reconcile.ts:  for (const c of chunks) {
src/lib/server/reconcile.ts:      kind: src.kind,
src/lib/server/reconcile.ts:      chunk_idx: c.chunk_idx,
src/lib/server/reconcile.ts:  indexDelete(src.kind, src.refId(rel));
src/lib/server/reflection.ts:import { createPrivateNote } from './memory_private';
src/lib/server/reflection.ts:  transcript: string;
src/lib/server/reflection.ts:    input.transcript.trim() || '(empty)',
src/lib/server/adapters/cli.test.ts:    for await (const _chunk of streams.chunks) {
src/lib/server/adapters/cli.test.ts:      void _chunk; // drain
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.skeptic.persona).toContain('# Persona — Skeptic');
src/lib/server/templates.writing-team.test.ts:    expect(bySlug.skeptic.persona).toContain('Assume the draft is wrong until proven right.');
src/lib/server/templates.writing-team.test.ts:  it('every councillor has the required persona/routing_hint/reflect fields', () => {
src/lib/server/templates.writing-team.test.ts:      expect(typeof c.persona).toBe('string');
src/lib/server/templates.writing-team.test.ts:      expect(c.persona.length).toBeGreaterThan(200);
src/lib/server/meeting-prompt.test.ts:  it('orders persona, memory, then the meeting block', () => {
src/lib/server/meeting-prompt.test.ts:      persona: 'You are Leto.',
src/lib/server/meeting-prompt.test.ts:  it('omits empty persona, memory, and summary sections', () => {
src/lib/server/meeting-prompt.test.ts:      persona: '',
src/lib/server/context.ts:import { listPrivateNotes } from './memory_private';
src/lib/server/context.ts:  const sharedHits = await indexSearch(brief, { kinds: ['memory'], k: MEMORY_TOPK_SHARED });
src/lib/server/context.ts:    kinds: ['memory_private'],
src/lib/server/context.ts:  const projectHits = await indexSearch(brief, { kinds: ['project_file'], k: PROJECT_TOPK });
src/lib/server/proposals.ts:    kind: 'job',
src/lib/server/councils.test.ts:  it('creates and reads a councillor with persona', async () => {
src/lib/server/councils.test.ts:      persona: '# CFO\nFocus on cashflow.'
src/lib/server/councils.test.ts:    expect(read.persona).toContain('Focus on cashflow');
src/lib/server/councils.test.ts:  it('updates a councillor persona without losing metadata', async () => {
src/lib/server/councils.test.ts:    await createCouncillor({ name: 'CFO', role: 'finance', persona: 'v1' });
src/lib/server/councils.test.ts:    const updated = await updateCouncillor('cfo', { persona: 'v2' });
src/lib/server/councils.test.ts:    expect(updated.persona).toBe('v2');
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:  it('once-kind schedule fires once, then disables itself with fired_at', async () => {
src/lib/server/scheduler.test.ts:        kind: 'once',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/scheduler.test.ts:  it('once-kind with fire_at in the past gets disabled (never fired)', async () => {
src/lib/server/scheduler.test.ts:        kind: 'once',
src/lib/server/scheduler.test.ts:        kind: 'recurring',
src/lib/server/adapters/index.ts:  kind: 'mock' | 'cli';
src/lib/server/adapters/index.ts:    return { id: m.id, kind: 'mock', run: m.run };
src/lib/server/adapters/index.ts:      kind: 'cli',
src/lib/server/oeuvres.test.ts:  await createCouncillor({ name: 'Leo', role: 'leader', routing_hint: '', adapter: 'mock:local', persona: 'p' });
src/lib/server/oeuvres.test.ts:  await createCouncillor({ name: 'Alice', role: 'maker', routing_hint: '', adapter: 'mock:local', persona: 'p' });
src/lib/server/oeuvres.test.ts:  await createCouncillor({ name: 'Bob', role: 'critic', routing_hint: '', adapter: 'mock:local', persona: 'p' });
src/lib/server/templates.test.ts:    { name: 'Mocky', role: 'echo', adapter: 'mock:local', persona: 'You are Mocky.' }
src/lib/server/templates.test.ts:    const bad = { ...validTemplate, councillors: [{ name: 'X', adapter: 'mock:local', persona: '' }] };
src/lib/server/templates.test.ts:        { slug: 'mock', name: 'Mocky', role: 'r', adapter: 'mock:local', persona: 'p' }
src/lib/server/templates.test.ts:        { slug: 'Not A Slug', name: 'Mocky', role: 'r', adapter: 'mock:local', persona: 'p' }
src/lib/server/templates.test.ts:        const chunk = new Uint8Array(1024 * 1024); // 1 MB
src/lib/server/templates.test.ts:        controller.enqueue(chunk);
src/lib/server/templates.test.ts:        controller.enqueue(chunk);
src/lib/server/templates.test.ts:        controller.enqueue(chunk); // 3 MB total
src/lib/server/templates.test.ts:    await createCouncillor({ name: 'Mocky', role: 'orig', adapter: 'mock:local', persona: 'orig' });
src/lib/server/templates.test.ts:    await createCouncillor({ name: 'Mocky', role: 'r', adapter: 'mock:local', persona: 'p' });
src/lib/server/templates.test.ts:        { slug: 'mock', name: 'Mocky', role: 'echo', adapter: 'mock:local', persona: 'p' }
src/lib/server/templates.test.ts:    expect(cs[0].persona).toBe('You are Mocky.');
src/lib/server/templates.test.ts:    await createCouncillor({ name: 'Mocky', role: 'orig', adapter: 'mock:local', persona: 'orig' });
src/lib/server/templates.test.ts:  it('replaces conflicting councillor persona when confirmed', async () => {
src/lib/server/templates.test.ts:    expect(c.persona).toBe('You are Mocky.');
src/lib/server/templates.test.ts:    await createCouncillor({ name: 'Mocky', role: 'r', adapter: 'mock:local', persona: 'p' });
src/lib/server/templates.test.ts:    await createCouncillor({ name: 'Polly', role: 'r2', adapter: 'mock:local', persona: 'p2' });
src/lib/server/meeting-prompt.ts:  persona: string;
src/lib/server/meeting-prompt.ts:  if (parts.persona.trim()) sections.push(`# Persona\n\n${parts.persona.trim()}`);
src/lib/server/embeddings.test.ts:import { closeIndex, deleteByRef, gzipDensity, openIndex, search, upsertChunk } from './embeddings';
src/lib/server/embeddings.test.ts:  it('upserts a chunk and finds it via search', () => {
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:    expect(hits[0].kind).toBe('memory');
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:      kind: 'memory' as const,
src/lib/server/embeddings.test.ts:    upsertChunk(idx, args);
src/lib/server/embeddings.test.ts:    upsertChunk(idx, args);
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:  it('deletes all chunks for a ref', () => {
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:  it('filters search by kind', async () => {
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'job_output',
src/lib/server/embeddings.test.ts:    const onlyJobs = search(idx, 'shared topic alpha', { kinds: ['job_output'] });
src/lib/server/embeddings.test.ts:    expect(onlyJobs[0].kind).toBe('job_output');
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/embeddings.test.ts:    upsertChunk(idx, {
src/lib/server/embeddings.test.ts:      kind: 'memory',
src/lib/server/meeting-runner-remote.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meeting-runner-remote.test.ts:  it('summons a remote attendee and appends its turn to the transcript', async () => {
src/lib/server/schedules.ts:  kind: ScheduleKind;
src/lib/server/schedules.ts:  kind?: ScheduleKind;
src/lib/server/schedules.ts:function computeNext(s: { kind: ScheduleKind; fire_at: string | null; cron: string | null }, after: Date): string | null {
src/lib/server/schedules.ts:  if (s.kind === 'once') return s.fire_at;
src/lib/server/schedules.ts:  if (input.kind === 'recurring') {
src/lib/server/schedules.ts:  } else if (input.kind === 'once') {
src/lib/server/schedules.ts:    throw new Error(`Unknown schedule kind: "${input.kind}".`);
src/lib/server/schedules.ts:    kind: input.kind,
src/lib/server/schedules.ts:    fire_at: input.kind === 'once' ? input.fire_at! : null,
src/lib/server/schedules.ts:    cron: input.kind === 'recurring' ? input.cron!.trim() : null,
src/lib/server/schedules.ts:    kind: patch.kind ?? current.kind,
src/lib/server/schedules.ts:  if (merged.kind === 'recurring') {
src/lib/server/adapters/mock.test.ts:  it('streams chunks then resolves with exit 0', async () => {
src/lib/server/adapters/mock.test.ts:    const { chunks, result } = a.run({ prompt: 'hello world', cwd: process.cwd() });
src/lib/server/adapters/mock.test.ts:    const collected = await collect(chunks);
src/lib/server/meeting-runner.ts:  const transcript = await readTx(meetingId);
src/lib/server/meeting-runner.ts:  const turns = parseTranscript(transcript);
src/lib/server/meeting-runner.ts:  const transcript = await readTx(meetingId);
src/lib/server/meeting-runner.ts:  const recent = lastKTurns(transcript, m.window_k)
src/lib/server/meeting-runner.ts:  if (councillor.persona.trim()) sections.push(`# Persona\n\n${councillor.persona.trim()}`);
src/lib/server/meeting-runner.ts:  const probe = { kind: 'meeting' as const, id: 'PROBE' };
src/lib/server/meeting-runner.ts:    tryAcquire(slug, { kind: 'meeting', id: meeting.id });
src/lib/server/meeting-runner.ts:    releaseLock(slug, { kind: 'meeting', id: meeting.id });
src/lib/server/meeting-runner.ts:      const transcript = await readTx(id);
src/lib/server/meeting-runner.ts:      const recent_turns = lastKTurns(transcript, after.window_k).map(
src/lib/server/meeting-runner.ts:  const transcript = await readTx(id);
src/lib/server/meeting-runner.ts:  const recent = lastKTurns(transcript, synthesizing.window_k)
src/lib/server/councillors.ts:const PERSONA_FILE = 'persona.md';
src/lib/server/councillors.ts:  persona?: string;
src/lib/server/councillors.ts:  persona?: string;
src/lib/server/councillors.ts:  const persona = await readFile(join(dir, PERSONA_FILE), 'utf8').catch(() => '');
src/lib/server/councillors.ts:    persona,
src/lib/server/councillors.ts:  const persona = input.persona ?? '';
src/lib/server/councillors.ts:  await writeFile(join(dir, PERSONA_FILE), persona, 'utf8');
src/lib/server/councillors.ts:  return { ...meta, persona, reflect: meta.reflect ?? true, routing_hint: meta.routing_hint ?? '' };
src/lib/server/councillors.ts:  const persona = input.persona ?? current.persona;
src/lib/server/councillors.ts:  await writeFile(join(dir, PERSONA_FILE), persona, 'utf8');
src/lib/server/councillors.ts:  return { ...meta, persona, reflect: meta.reflect ?? true, routing_hint: meta.routing_hint ?? '' };
src/lib/server/indexer.test.ts:    expect(hits[0].kind).toBe('memory');
src/lib/server/indexer.test.ts:    await reindexFile('.landsraad/memory/doomed.md'); // file gone → chunks removed
src/lib/server/indexer.test.ts:  it('indexes job input, transcript, output', async () => {
src/lib/server/indexer.test.ts:    const outHit = out.find((h) => h.kind === 'job_output');
src/lib/server/indexer.test.ts:  it('indexes and removes a councillor persona', async () => {
src/lib/server/indexer.test.ts:      persona: 'I am Polly, a uniquely-tokened oracle for risk forecasts.'
src/lib/server/indexer.test.ts:    await reindexFile('.landsraad/councillors/polly/persona.md');
src/lib/server/indexer.test.ts:    expect(hits[0]?.kind).toBe('persona');
src/lib/server/indexer.test.ts:    await reindexFile('.landsraad/councillors/polly/persona.md');
src/lib/server/indexer.test.ts:  it('updates persona index on update', async () => {
src/lib/server/indexer.test.ts:      persona: 'before-shape tokens-alpha'
src/lib/server/indexer.test.ts:    await reindexFile('.landsraad/councillors/mutable/persona.md');
src/lib/server/indexer.test.ts:    await updateCouncillor('mutable', { persona: 'after-shape tokens-beta' });
src/lib/server/indexer.test.ts:    await reindexFile('.landsraad/councillors/mutable/persona.md');
src/lib/server/indexer.ts:import type { ChunkKind, Embedder, IndexHandle } from './embeddings';
src/lib/server/indexer.ts:import { closeIndex, deleteByRef, listIndexedFiles, openIndex, searchAsync, upsertChunkAsync } from './embeddings';
src/lib/server/indexer.ts:  kind: ChunkKind;
src/lib/server/indexer.ts:  chunk_idx?: number;
src/lib/server/indexer.ts:    await upsertChunkAsync(h, args);
src/lib/server/indexer.ts:    console.warn(`[indexer] upsert ${args.kind}/${args.ref_id} failed:`, (err as Error).message);
src/lib/server/indexer.ts:export function indexDelete(kind: ChunkKind, ref_id: string): void {
src/lib/server/indexer.ts:    deleteByRef(h, kind, ref_id);
src/lib/server/indexer.ts:    console.warn(`[indexer] delete ${kind}/${ref_id} failed:`, (err as Error).message);
src/lib/server/councillor-lock.ts:  | { kind: 'job'; id: string }
src/lib/server/councillor-lock.ts:  | { kind: 'meeting'; id: string }
src/lib/server/councillor-lock.ts:  | { kind: 'remote-meeting'; id: string; host: string }
src/lib/server/councillor-lock.ts:  | { kind: 'oeuvre'; id: string };
src/lib/server/councillor-lock.ts:  if (a.kind !== b.kind || a.id !== b.id) return false;
src/lib/server/councillor-lock.ts:  if (a.kind === 'remote-meeting') return a.host === (b as { host: string }).host;
src/lib/server/index-sources.ts:import type { ChunkKind } from './embeddings';
src/lib/server/index-sources.ts:export interface IndexChunk {
src/lib/server/index-sources.ts:  chunk_idx: number;
src/lib/server/index-sources.ts:  kind: ChunkKind;
src/lib/server/index-sources.ts:  buildChunks(text: string, rel: string, absPath: string): IndexChunk[];
src/lib/server/index-sources.ts:function jobSource(file: string, kind: ChunkKind): IndexSource {
src/lib/server/index-sources.ts:    kind,
src/lib/server/index-sources.ts:    buildChunks: (text, _rel, abs) => {
src/lib/server/index-sources.ts:          chunk_idx: 0,
src/lib/server/index-sources.ts:function meetingWholeSource(file: string, kind: ChunkKind, titleSuffix: string, useChair: boolean): IndexSource {
src/lib/server/index-sources.ts:    kind,
src/lib/server/index-sources.ts:    buildChunks: (text, _rel, abs) => {
src/lib/server/index-sources.ts:          chunk_idx: 0,
src/lib/server/index-sources.ts:    kind: 'memory',
src/lib/server/index-sources.ts:    buildChunks: (text, rel) => [
src/lib/server/index-sources.ts:      { chunk_idx: 0, text, title: firstHeading(text, basename(norm(rel), '.md')), councillor_slug: null }
src/lib/server/index-sources.ts:    kind: 'memory_private',
src/lib/server/index-sources.ts:    buildChunks: (text, rel) => {
src/lib/server/index-sources.ts:      return [{ chunk_idx: 0, text, title: firstHeading(text, basename(p[3], '.md')), councillor_slug: p[1] }];
src/lib/server/index-sources.ts:    kind: 'persona',
src/lib/server/index-sources.ts:    test: (rel) => /^councillors\/[^/]+\/persona\.md$/.test(norm(rel)),
src/lib/server/index-sources.ts:    buildChunks: (text, rel, abs) => {
src/lib/server/index-sources.ts:      return [{ chunk_idx: 0, text, title: (meta?.name as string) ?? slug, councillor_slug: slug }];
src/lib/server/index-sources.ts:  jobSource('input\\.md', 'job_input'),
src/lib/server/index-sources.ts:  jobSource('output\\.md', 'job_output'),
src/lib/server/index-sources.ts:  jobSource('transcript\\.md', 'transcript'),
src/lib/server/index-sources.ts:    kind: 'meeting_turn',
src/lib/server/index-sources.ts:    test: (rel) => /^meetings\/[^/]+\/transcript\.md$/.test(norm(rel)),
src/lib/server/index-sources.ts:    buildChunks: (text, rel, abs) => {
src/lib/server/index-sources.ts:        chunk_idx: t.turnIndex,
src/lib/server/index-sources.ts:    kind: 'oeuvre_scratchpad',
src/lib/server/index-sources.ts:    buildChunks: (text, rel, abs) => {
src/lib/server/index-sources.ts:          chunk_idx: 0,
src/lib/server/index-sources.ts:    kind: src.kind,
src/lib/server/index-sources.ts:    buildChunks: (text, rel, absPath) => src.buildChunks(text, inner(rel), absPath)
src/lib/server/index-sources.ts: * council assembles. Whole-file, one chunk (matching every structured source);
src/lib/server/index-sources.ts:  kind: 'project_file',
src/lib/server/index-sources.ts:  buildChunks: (text, rel) => {
src/lib/server/index-sources.ts:        chunk_idx: 0,
src/lib/server/scheduler.ts:  if (s.kind === 'once') return null;
src/lib/server/scheduler.ts:  if (s.kind === 'once') return 1;
src/lib/server/scheduler.ts:  if (s.kind === 'recurring' && (!s.cron || !validateCron(s.cron))) {
src/lib/server/scheduler.ts:  if (s.kind === 'once') {
src/lib/server/scheduler.ts:    if (s.kind === 'once') {
src/lib/server/adapters/runAdapter.ts:  adapter: ResolvedAdapter | { run: (args: { prompt: string; cwd: string; signal?: AbortSignal }) => { chunks: AsyncIterable<{ stream: 'stdout' | 'stderr'; text: string }>; result: Promise<AdapterResult> } };
src/lib/server/adapters/runAdapter.ts:  onStdout?: (chunk: string) => void;
src/lib/server/adapters/runAdapter.ts:  onStderr?: (chunk: string) => void;
src/lib/server/adapters/runAdapter.ts:  transcript: string;
src/lib/server/adapters/runAdapter.ts:  let transcript = '';
src/lib/server/adapters/runAdapter.ts:    const streams = (opts.adapter as { run: (a: { prompt: string; cwd: string; signal?: AbortSignal }) => { chunks: AsyncIterable<{ stream: 'stdout' | 'stderr'; text: string }>; result: Promise<AdapterResult> } }).run({
src/lib/server/adapters/runAdapter.ts:    for await (const chunk of streams.chunks) {
src/lib/server/adapters/runAdapter.ts:      const prefix = chunk.stream === 'stderr' ? '[stderr] ' : '';
src/lib/server/adapters/runAdapter.ts:      transcript += prefix + chunk.text;
src/lib/server/adapters/runAdapter.ts:      if (chunk.stream === 'stdout') opts.onStdout?.(chunk.text);
src/lib/server/adapters/runAdapter.ts:      else opts.onStderr?.(chunk.text);
src/lib/server/adapters/runAdapter.ts:    if (result.stderr) transcript += `\n[stderr]\n${result.stderr}`;
src/lib/server/adapters/runAdapter.ts:      transcript,
src/lib/server/adapters/runAdapter.ts:      transcript: transcript || (err instanceof Error ? err.message : String(err)),
src/lib/server/watcher.test.ts:    expect(indexed.find((f) => f.ref_id === 'README.md')?.kind).toBe('project_file');
src/lib/server/watcher.test.ts:    expect((await indexSearch('unique-machine-mem'))[0].kind).toBe('memory');
src/lib/server/watcher.test.ts:  it('prunes orphan chunks for files deleted while stopped', async () => {
src/lib/server/watcher.test.ts:    // The manifest mtime matches fs mtime → skip should have fired, no new chunks embedded
src/lib/server/watcher.test.ts:    // File must still be searchable (chunks were not removed)
src/lib/server/meetings.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meetings.test.ts:    await createCouncillor({ name: 'Mocky', role: 'sidekick', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meetings.test.ts:  it('createMeeting persists meeting.json + topic.md + empty transcript/summary', async () => {
src/lib/server/meetings.test.ts:  it('appends transcript blocks and events', async () => {
src/lib/server/meetings.test.ts:  it('appendTranscriptBlock with remote-token speaker writes turn to transcript (councillor_slug=null path)', async () => {
src/lib/server/meetings.test.ts:  it('redacts the council root from transcript blocks and summaries on write', async () => {
src/lib/server/meetings.test.ts:    const transcript = await readTranscript(m.id);
src/lib/server/meetings.test.ts:    expect(transcript).not.toContain(root);
src/lib/server/meetings.test.ts:    expect(transcript).toContain('./src/lib/server/paths.ts');
src/lib/server/meetings.test.ts:    await createCouncillor({ name: 'Leto', role: 'duke', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/meetings.test.ts:    await createCouncillor({ name: 'Mocky', role: 'sidekick', routing_hint: '', adapter: 'mock:local', persona: '' });
src/lib/server/adapters/mock.ts:import type { Adapter, AdapterChunk, AdapterResult, AdapterRunStreams } from './types';
src/lib/server/adapters/mock.ts:    const chunks: AdapterChunk[] = [];
src/lib/server/adapters/mock.ts:    for (const line of lines) chunks.push({ stream: 'stdout', text: line + '\n' });
src/lib/server/adapters/mock.ts:      const stdout = chunks.map((c) => c.text).join('');
src/lib/server/adapters/mock.ts:    async function* iter(): AsyncIterable<AdapterChunk> {
src/lib/server/adapters/mock.ts:      for (const c of chunks) yield c;
src/lib/server/adapters/mock.ts:    return { chunks: iter(), result };
src/lib/server/roster.test.ts:      { slug: 'cfo', name: 'Vivian Park', role: 'finance', routing_hint: '', adapter: '', persona: '', reflect: true, created_at: '' },
src/lib/server/roster.test.ts:      { slug: 'cto', name: 'Rao Sato', role: 'engineering', routing_hint: '', adapter: '', persona: '', reflect: true, created_at: '' }
src/lib/server/roster.test.ts:      { slug: 'solo', name: 'Solo', role: 'all', routing_hint: '', adapter: '', persona: '', reflect: true, created_at: '' }
src/lib/server/roster.test.ts:      { slug: 'x', name: 'X', role: '', routing_hint: '', adapter: '', persona: '', reflect: true, created_at: '' }
src/lib/server/roster.test.ts:      { slug: 'a', name: 'A', role: 'impl', routing_hint: 'code + schema', adapter: '', persona: '', reflect: true, created_at: '' },
src/lib/server/roster.test.ts:      { slug: 'b', name: 'B', role: 'crit', routing_hint: '', adapter: '', persona: '', reflect: true, created_at: '' }
src/lib/server/adapters/types.ts:  invoke(args: AdapterInvocation): AsyncIterable<AdapterChunk> & PromiseLike<AdapterResult>;
src/lib/server/adapters/types.ts:export interface AdapterChunk {
src/lib/server/adapters/types.ts:  chunks: AsyncIterable<AdapterChunk>;
src/lib/server/adapters/cli.ts:import type { AdapterChunk, AdapterResult, AdapterRunStreams } from './types';
src/lib/server/adapters/cli.ts:  const pending: AdapterChunk[] = [];
src/lib/server/adapters/cli.ts:  let resolveNext: ((value: IteratorResult<AdapterChunk>) => void) | null = null;
src/lib/server/adapters/cli.ts:  function push(chunk: AdapterChunk) {
src/lib/server/adapters/cli.ts:      r({ value: chunk, done: false });
src/lib/server/adapters/cli.ts:      pending.push(chunk);
src/lib/server/adapters/cli.ts:        r({ value: undefined as unknown as AdapterChunk, done: true });
src/lib/server/adapters/cli.ts:        r({ value: undefined as unknown as AdapterChunk, done: true });
src/lib/server/adapters/cli.ts:  const chunks: AsyncIterable<AdapterChunk> = {
src/lib/server/adapters/cli.ts:        next(): Promise<IteratorResult<AdapterChunk>> {
src/lib/server/adapters/cli.ts:          if (done) return Promise.resolve({ value: undefined as unknown as AdapterChunk, done: true });
src/lib/server/adapters/cli.ts:          return new Promise<IteratorResult<AdapterChunk>>((r) => (resolveNext = r));
src/lib/server/adapters/cli.ts:  return { chunks, result };
src/lib/server/templates.ts:  persona: string;
src/lib/server/templates.ts:  const persona = requireString(raw, path, 'persona');
src/lib/server/templates.ts:  return { name, role, adapter, persona, slug, routing_hint, reflect };
src/lib/server/templates.ts:  const chunks: Uint8Array[] = [];
src/lib/server/templates.ts:      chunks.push(value);
src/lib/server/templates.ts:  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
src/lib/server/templates.ts:        persona: c.persona,
src/lib/server/templates.ts:        persona: c.persona,
src/lib/server/templates.ts:      persona: c.persona,
src/lib/server/adapters/runAdapter.test.ts:  it('runs the mock:local adapter and returns transcript + output + exit_code', async () => {
src/lib/server/adapters/runAdapter.test.ts:    expect(result.transcript.length).toBeGreaterThan(0);
src/lib/server/adapters/runAdapter.test.ts:  it('streams chunks via onStdout', async () => {
src/lib/server/templates.engineering.test.ts:  it('every councillor has the required persona/routing_hint/reflect fields', () => {
src/lib/server/templates.engineering.test.ts:      expect(typeof c.persona).toBe('string');
src/lib/server/templates.engineering.test.ts:      expect(c.persona.length).toBeGreaterThan(200);
src/lib/server/oeuvre-runner.test.ts:      kind: 'mock',
src/lib/server/oeuvre-runner.test.ts:        async function* chunks() {
src/lib/server/oeuvre-runner.test.ts:        return { chunks: chunks(), result };
src/lib/server/oeuvre-runner.test.ts:  await createCouncillor({ name: 'Leo', role: 'leader', routing_hint: '', adapter: 's-leo', persona: 'p' });
src/lib/server/oeuvre-runner.test.ts:  await createCouncillor({ name: 'Alice', role: 'maker', routing_hint: '', adapter: 's-alice', persona: 'p' });
src/lib/server/oeuvre-runner.test.ts:  await createCouncillor({ name: 'Bob', role: 'critic', routing_hint: '', adapter: 's-bob', persona: 'p' });
src/lib/server/oeuvre-runner.test.ts:  await createCouncillor({ name: 'Zed', role: 'flaky', routing_hint: '', adapter: 's-zed', persona: 'p' });
src/lib/server/oeuvre-runner.test.ts:        kind: 'mock',
src/lib/server/oeuvre-runner.test.ts:          async function* chunks() {
src/lib/server/oeuvre-runner.test.ts:          return { chunks: chunks(), result: Promise.resolve({ exit_code: 0, stdout: r.stdout, stderr: '' }) };
src/lib/server/oeuvre-index.test.ts:  it('resolves the scratchpad path to the oeuvre_scratchpad kind', () => {
src/lib/server/oeuvre-index.test.ts:    expect(src?.kind).toBe('oeuvre_scratchpad');
src/lib/server/context.test.ts:import { createPrivateNote } from './memory_private';
src/lib/server/jobs.ts:const TRANSCRIPT_FILE = 'transcript.md';
src/lib/server/embeddings.ts:export type ChunkKind =
src/lib/server/embeddings.ts:  | 'memory_private'
src/lib/server/embeddings.ts:  | 'job_input'
src/lib/server/embeddings.ts:  | 'job_output'
src/lib/server/embeddings.ts:  | 'transcript'
src/lib/server/embeddings.ts:  | 'persona'
src/lib/server/embeddings.ts:  | 'project_file';
src/lib/server/embeddings.ts:export interface UpsertChunkInput {
src/lib/server/embeddings.ts:  kind: ChunkKind;
src/lib/server/embeddings.ts:  chunk_idx?: number;
src/lib/server/embeddings.ts:  kinds?: ChunkKind[];
src/lib/server/embeddings.ts:  kind: ChunkKind;
src/lib/server/embeddings.ts:  chunk_idx: number;
src/lib/server/embeddings.ts:    CREATE TABLE IF NOT EXISTS chunks (
src/lib/server/embeddings.ts:      kind            TEXT NOT NULL,
src/lib/server/embeddings.ts:      chunk_idx       INTEGER NOT NULL DEFAULT 0,
src/lib/server/embeddings.ts:      UNIQUE(kind, ref_id, chunk_idx)
src/lib/server/embeddings.ts:    CREATE INDEX IF NOT EXISTS chunks_kind_ref ON chunks(kind, ref_id);
src/lib/server/embeddings.ts:    `CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
src/lib/server/embeddings.ts:       chunk_id INTEGER PRIMARY KEY,
src/lib/server/embeddings.ts:export function upsertChunk(h: IndexHandle, input: UpsertChunkInput): void {
src/lib/server/embeddings.ts:  const chunk_idx = input.chunk_idx ?? 0;
src/lib/server/embeddings.ts:      'SELECT id, text_hash FROM chunks WHERE kind = ? AND ref_id = ? AND chunk_idx = ?'
src/lib/server/embeddings.ts:    .get(input.kind, input.ref_id, chunk_idx) as { id: number; text_hash: string } | undefined;
src/lib/server/embeddings.ts:      .prepare('UPDATE chunks SET source_mtime = ? WHERE id = ?')
src/lib/server/embeddings.ts:    throw new Error('upsertChunk requires a synchronous embedder; use upsertChunkAsync for async');
src/lib/server/embeddings.ts:  writeChunk(h, input, chunk_idx, text_hash, vec, existing?.id);
src/lib/server/embeddings.ts:export async function upsertChunkAsync(h: IndexHandle, input: UpsertChunkInput): Promise<void> {
src/lib/server/embeddings.ts:  const chunk_idx = input.chunk_idx ?? 0;
src/lib/server/embeddings.ts:      'SELECT id, text_hash FROM chunks WHERE kind = ? AND ref_id = ? AND chunk_idx = ?'
src/lib/server/embeddings.ts:    .get(input.kind, input.ref_id, chunk_idx) as { id: number; text_hash: string } | undefined;
src/lib/server/embeddings.ts:      .prepare('UPDATE chunks SET source_mtime = ? WHERE id = ?')
src/lib/server/embeddings.ts:  writeChunk(h, input, chunk_idx, text_hash, vec, existing?.id);
src/lib/server/embeddings.ts:function writeChunk(
src/lib/server/embeddings.ts:  input: UpsertChunkInput,
src/lib/server/embeddings.ts:  chunk_idx: number,
src/lib/server/embeddings.ts:    let chunkId: number;
src/lib/server/embeddings.ts:          `UPDATE chunks
src/lib/server/embeddings.ts:      chunkId = existingId;
src/lib/server/embeddings.ts:      h.db.prepare('DELETE FROM vec_chunks WHERE chunk_id = ?').run(BigInt(chunkId));
src/lib/server/embeddings.ts:          `INSERT INTO chunks
src/lib/server/embeddings.ts:            (kind, ref_id, chunk_idx, text, text_hash, gzip_density, token_count,
src/lib/server/embeddings.ts:          input.kind,
src/lib/server/embeddings.ts:          chunk_idx,
src/lib/server/embeddings.ts:      chunkId = Number(info.lastInsertRowid);
src/lib/server/embeddings.ts:      .prepare('INSERT INTO vec_chunks(chunk_id, embedding) VALUES (?, ?)')
src/lib/server/embeddings.ts:      .run(BigInt(chunkId), vecLiteral(vec));
src/lib/server/embeddings.ts:export function deleteByRef(h: IndexHandle, kind: ChunkKind, ref_id: string): void {
src/lib/server/embeddings.ts:    .prepare('SELECT id FROM chunks WHERE kind = ? AND ref_id = ?')
src/lib/server/embeddings.ts:    .all(kind, ref_id) as { id: number }[];
src/lib/server/embeddings.ts:    const delVec = h.db.prepare('DELETE FROM vec_chunks WHERE chunk_id = ?');
src/lib/server/embeddings.ts:    h.db.prepare('DELETE FROM chunks WHERE kind = ? AND ref_id = ?').run(kind, ref_id);
src/lib/server/embeddings.ts:  kind: ChunkKind;
src/lib/server/embeddings.ts:    .prepare('SELECT DISTINCT source_path, kind, ref_id, source_mtime FROM chunks')
src/lib/server/embeddings.ts:  if (opts.kinds && opts.kinds.length) {
src/lib/server/embeddings.ts:    where.push(`c.kind IN (${opts.kinds.map(() => '?').join(',')})`);
src/lib/server/embeddings.ts:    params.push(...opts.kinds);
src/lib/server/embeddings.ts:    SELECT c.kind, c.ref_id, c.chunk_idx, c.title, c.text, c.source_path,
src/lib/server/embeddings.ts:    FROM vec_chunks v
src/lib/server/embeddings.ts:    JOIN chunks c ON c.id = v.chunk_id
src/lib/server/embeddings.ts:    kind: ChunkKind;
src/lib/server/embeddings.ts:    chunk_idx: number;
src/lib/server/embeddings.ts:    kind: r.kind,
src/lib/server/embeddings.ts:    chunk_idx: r.chunk_idx,

[stderr] exec
/bin/zsh -lc "sed -n '1,90p' src/lib/server/embeddings.ts" in .
exec
/bin/zsh -lc "sed -n '1,240p' src/lib/server/index-sources.ts" in .
 succeeded in 0ms:
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { indexDbPath, indexDirPath } from './paths';

export type ChunkKind =
  | 'memory'
  | 'memory_private'
  | 'job_input'
  | 'job_output'
  | 'transcript'
  | 'persona'
  | 'meeting_topic'
  | 'meeting_turn'
  | 'meeting_summary'
  | 'meeting_synthesis'
  | 'oeuvre_scratchpad'
  | 'project_file';

export interface Embedder {
  dim: number;
  embed(texts: string[]): Float32Array[] | Promise<Float32Array[]>;
}

export interface UpsertChunkInput {
  kind: ChunkKind;
  ref_id: string;
  chunk_idx?: number;
  text: string;
  source_path: string;
  source_mtime: string;
  title?: string | null;
  councillor_slug?: string | null;
}

export interface SearchOptions {
  k?: number;
  kinds?: ChunkKind[];
  councillor_slug?: string;
  min_density?: number;
}

export interface SearchHit {
  kind: ChunkKind;
  ref_id: string;
  chunk_idx: number;
  title: string | null;
  text: string;
  source_path: string;
  similarity: number;
  gzip_density: number;
  councillor_slug: string | null;
}

export interface IndexHandle {
  path: string;
  db: Database.Database;
  embedder: Embedder;
  dim: number;
}

export function gzipDensity(text: string): number {
  if (!text) return 0;
  const raw = Buffer.byteLength(text, 'utf8');
  if (raw === 0) return 0;
  return gzipSync(text).length / raw;
}

function tokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function vecLiteral(v: Float32Array): Buffer {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}

export function openIndex(embedder: Embedder): IndexHandle {
  mkdirSync(indexDirPath(), { recursive: true });
  const path = indexDbPath();
  const db = new Database(path);
  sqliteVec.load(db);

  db.exec(`

 succeeded in 0ms:
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
  meetingWholeSource('topic\\.md', 'meeting_topic', '', false),
  meetingWholeSource('summary\\.md', 'meeting_summary', ' · summary', true),
  meetingWholeSource('synthesis\\.md', 'meeting_synthesis', ' · synthesis', true),
  {
    kind: 'oeuvre_scratchpad',
    test: (rel) => /^oeuvres\/[^/]+\/scratchpad\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const o = readJson(sibling(abs, 'oeuvre.json'));
      const title = (o?.title as string) ?? norm(rel).split('/')[1];
      return [
        {
          chunk_idx: 0,
          text,
          title: `${title} · scratchpad`,
          councillor_slug: (o?.leader_slug as string) ?? null
        }
      ];
    }
  }
];

const DATA_PREFIX = '.landsraad/';

/**
 * Wrap a structured source so it sees the council-data-relative path (the
 * `.landsraad/` prefix peeled off), while reconcile keeps passing the full
 * `councilRoot()`-relative rel. This keeps every matcher regex and positional
 * `split('/')` index in SOURCES unchanged after the layout move.
 */
function stripPrefix(src: IndexSource): IndexSource {
  const inner = (rel: string) => norm(rel).slice(DATA_PREFIX.length);
  return {
    kind: src.kind,
    test: (rel) => src.test(inner(rel)),
    refId: (rel) => src.refId(inner(rel)),
    buildChunks: (text, rel, absPath) => src.buildChunks(text, inner(rel), absPath)
  };
}

/**
 * Product-tree prose (`.md`/`.txt`) outside `.landsraad/` — the workspace the
 * council assembles. Whole-file, one chunk (matching every structured source);
 * the ref id is the council-root-relative path. Code, CSV, and binaries are
 * deliberately excluded: the index is semantic memory, not a code search engine,
 * and adapters already see the tree via their own cwd + file tools.
 */
const PROJECT_SOURCE: IndexSource = {
  kind: 'project_file',
  test: (rel) => /\.(md|txt)$/i.test(norm(rel)),
  refId: (rel) => norm(rel),
  buildChunks: (text, rel) => {
    const name = basename(norm(rel));
    return [
      {
        chunk_idx: 0,
        text,
        title: /\.md$/i.test(name) ? firstHeading(text, name) : name,
        councillor_slug: null
      }
    ];
  }
};

export function resolveSource(rel: string): IndexSource | null {
  const n = norm(rel);
  if (n.startsWith(DATA_PREFIX)) {
    const inner = n.slice(DATA_PREFIX.length);
    const src = SOURCES.find((s) => s.test(inner));
    return src ? stripPrefix(src) : null;
  }
  // Product tree: index prose only (allowlist enforced here authoritatively).
  return PROJECT_SOURCE.test(n) ? PROJECT_SOURCE : null;
}

export const __sourcesForTest = SOURCES;

[stderr]  succeeded in 0ms:
docs/data-model.md:        memory/
docs/data-model.md:    memory/
docs/data-model.md:## Shared memory: `memory/<note-slug>.md`
docs/data-model.md:## Private memory: `councillors/<slug>/memory/<entry-slug>.md`
docs/data-model.md:One markdown file per private memory entry. Same format as shared notes. Created exclusively by reflection (`<<MEMORY>>` blocks parsed from a successful job's reflection output). Edit and delete via the UI; no manual-create form in v1.
docs/data-model.md:A `<<MEMORY scope="shared">>` block in the same reflection output routes the entry to `memory/<entry-slug>.md` (shared) instead of the councillor's private dir — so a single reflection pass may write to either tier depending on each block's `scope` attribute.
docs/data-model.md:- `memory_slugs` — slugs of private memory entries created by this job's reflection (omitted if none).
docs/data-model.md:- Slugs are unique within their namespace (`councillors/<slug>`, `memory/<slug>`, `councillors/<slug>/memory/<entry-slug>`).
SPECIFICATION.md:Status: v1 (council + councillor + jobs + shared & private memory + reflection + agent proposals + council templates + adapters + activity dashboard + schedules + meetings + oeuvres). High-level only. Implementation details live in `docs/` and in code.
SPECIFICATION.md:**One council per working directory.** When you run `npx landsraad`, the current working directory **is** the council root. The council's own state — `council.json`, `councillors/`, `memory/`, `jobs/`, `.index/`, … — lives in a single hidden **`.landsraad/`** directory at _cwd_. This keeps the working directory itself clear for the **product** the council assembles (your docs, CSVs, code): the council is the machine, not the product. Only `.env` and `.gitignore` sit at the root. Adapters still run with `cwd` = the council root, so councillors work directly in the product tree.
SPECIFICATION.md:- **Shared council memory** — `<council>/memory/*.md`. Visible to every councillor.
SPECIFICATION.md:- **Private per-councillor memory** — `<council>/councillors/<slug>/memory/*.md`. Visible only to that councillor at prompt-assembly time. Created exclusively by reflection (see below); edit and delete via the UI.
SPECIFICATION.md:- Moving a finished job's `output.md` into `.landsraad/councillors/<slug>/memory/`
SPECIFICATION.md:  therefore re-kinds it as private memory automatically.
SPECIFICATION.md:- **`<<MEMORY>>`** — applied directly. Defaults to the councillor's private memory dir (indexed under `memory_private`). `scope="shared"` writes to the council-wide `memory/` dir instead (indexed under `memory`). Title collisions in either scope get a `-2`, `-3` suffix. The block parser is regex-tolerant of leading whitespace and trailing prose; unrecognized tags are ignored (forward-compat). Cleanup/dedupe of repeated shared writes is a deferred follow-up.
SPECIFICATION.md:4. **Manage shared memory.** CRUD on `*.md` notes under `memory/`.
SPECIFICATION.md:6. **Reflection.** Successful jobs trigger one extra adapter call that may emit `<<MEMORY>>` (applied directly to private memory; `scope="shared"` routes to council-wide memory instead) and `<<JOB>>` blocks (proposals).
SPECIFICATION.md:        memory/                  # private per-councillor memory
SPECIFICATION.md:    memory/
SPECIFICATION.md:| `/councillors/[c-slug]` | View councillor + their jobs + private memory |
SPECIFICATION.md:| `/councillors/[c-slug]/memory/[note]` | View / edit private memory entry |
SPECIFICATION.md:| `/memory/new` | Add shared memory note |
SPECIFICATION.md:| `/memory/[note]` | View / edit shared memory note |

[stderr] exec
/bin/zsh -lc 'rg "memory_private|councillors/.*/memory|private memory|memory/" docs/data-model.md SPECIFICATION.md src/lib/server/memory_private.ts src/lib/server/paths.ts' in .
[stderr] exec
/bin/zsh -lc 'rg "parseNext|parseScratchpad|parseVote|invalid|re-asks|pause|scratchpad_version|finish" src/lib/server/oeuvre-runner.ts src/lib/server/oeuvre-blocks.test.ts src/lib/server/oeuvre-runner.test.ts' in .
[stderr]  succeeded in 0ms:
src/lib/server/oeuvre-blocks.test.ts:import { parseNext, parseScratchpad, parseVote } from './oeuvre-blocks';
src/lib/server/oeuvre-blocks.test.ts:describe('parseNext', () => {
src/lib/server/oeuvre-blocks.test.ts:    const n = parseNext('blah <<NEXT councillor="alice" say="focus on costs">> trailing');
src/lib/server/oeuvre-blocks.test.ts:    const n = parseNext('   <<NEXT   councillor="bob" >>\n');
src/lib/server/oeuvre-blocks.test.ts:    expect(parseNext('nothing here')).toBeNull();
src/lib/server/oeuvre-blocks.test.ts:    expect(parseNext('<<NEXT say="hi">>')).toEqual({ councillor: null, say: 'hi' });
src/lib/server/oeuvre-blocks.test.ts:describe('parseScratchpad', () => {
src/lib/server/oeuvre-blocks.test.ts:    const s = parseScratchpad('pre <<SCRATCHPAD>>\n# Plan\n- a\n<</SCRATCHPAD>> post');
src/lib/server/oeuvre-blocks.test.ts:    expect(parseScratchpad('no block, just a vote')).toBeNull();
src/lib/server/oeuvre-blocks.test.ts:describe('parseVote', () => {
src/lib/server/oeuvre-blocks.test.ts:  it('parses finish with attribute reason', () => {
src/lib/server/oeuvre-blocks.test.ts:    expect(parseVote('<<VOTE value="finish" reason="looks done">>')).toEqual({
src/lib/server/oeuvre-blocks.test.ts:      value: 'finish',
src/lib/server/oeuvre-blocks.test.ts:    expect(parseVote('<<VOTE value="continue">>still rough<</VOTE>>')).toEqual({
src/lib/server/oeuvre-blocks.test.ts:  it('defaults to continue when missing (never spuriously finishes)', () => {
src/lib/server/oeuvre-blocks.test.ts:    expect(parseVote('no vote at all').value).toBe('continue');
src/lib/server/oeuvre-blocks.test.ts:    expect(parseVote('<<VOTE value="maybe">>').value).toBe('continue');
src/lib/server/oeuvre-runner.ts:  pauseClock,
src/lib/server/oeuvre-runner.ts:import { parseNext, parseScratchpad, parseVote } from './oeuvre-blocks';
src/lib/server/oeuvre-runner.ts:  /** When `!ok`, a human-readable explanation surfaced in the pause reason + timeline. */
src/lib/server/oeuvre-runner.ts:    version: o.scratchpad_version,
src/lib/server/oeuvre-runner.ts:    participantsSummary: participantsSummary(o.participants, states, o.scratchpad_version),
src/lib/server/oeuvre-runner.ts:    const next = parseNext(res.output);
src/lib/server/oeuvre-runner.ts:    version: o.scratchpad_version
src/lib/server/oeuvre-runner.ts:  pauseClock(o, nowIso());
src/lib/server/oeuvre-runner.ts:  o.status = 'paused';
src/lib/server/oeuvre-runner.ts:  o.pause_reason = reason;
src/lib/server/oeuvre-runner.ts:  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: reason });
src/lib/server/oeuvre-runner.ts:    // 3. Convergence: every in-pool participant's latest vote is finish @ current version.
src/lib/server/oeuvre-runner.ts:      (s) => states[s]?.vote === 'finish' && states[s]?.scratchpad_version === o.scratchpad_version
src/lib/server/oeuvre-runner.ts:      await beginConcluding(id, 'converged', 'all participants voted finish');
src/lib/server/oeuvre-runner.ts:      // Record every failed attempt so the cause is visible even before the pause.
src/lib/server/oeuvre-runner.ts:      const edit = parseScratchpad(result.output);
src/lib/server/oeuvre-runner.ts:      let version = o2.scratchpad_version;
src/lib/server/oeuvre-runner.ts:        version = o2.scratchpad_version + 1;
src/lib/server/oeuvre-runner.ts:      const vote = parseVote(result.output);
src/lib/server/oeuvre-runner.ts:        scratchpad_version: version,
src/lib/server/oeuvre-runner.ts:      o2.scratchpad_version = version;
src/lib/server/oeuvre-runner.ts:        scratchpad_version: version,
src/lib/server/oeuvre-runner.ts:      await appendOeuvreEvent(id, { at: ts, type: 'turn_finished', message: pick.councillor });
src/lib/server/oeuvre-runner.ts:    // Only keep looping if the director hasn't paused/cancelled meanwhile.
src/lib/server/oeuvre-runner.ts:export async function pauseOeuvre(id: string): Promise<void> {
src/lib/server/oeuvre-runner.ts:  pauseClock(o, nowIso());
src/lib/server/oeuvre-runner.ts:  o.status = 'paused';
src/lib/server/oeuvre-runner.ts:  o.pause_reason = undefined;
src/lib/server/oeuvre-runner.ts:  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: 'director' });
src/lib/server/oeuvre-runner.ts:  if (o.status !== 'paused') return;
src/lib/server/oeuvre-runner.ts:  o.pause_reason = undefined;
src/lib/server/oeuvre-runner.ts:  o.pause_reason = undefined;
src/lib/server/oeuvre-runner.ts:    // state, not a real failure. Revive it to `paused` so the director can Resume.
src/lib/server/oeuvre-runner.ts:    if (o.status === 'failed' && (o.pause_reason ?? '').startsWith('crashed_during=')) {
src/lib/server/oeuvre-runner.ts:      o.status = 'paused';
src/lib/server/oeuvre-runner.ts:        message: 'recovered: failed→paused (resumable)'
src/lib/server/oeuvre-runner.ts:    // A deliberately director-paused oeuvre simply survives the restart as-is —
src/lib/server/oeuvre-runner.ts:    if (o.status === 'paused') continue;
src/lib/server/oeuvre-runner.ts:    // Park it as paused so the director can review and Resume from the durable
src/lib/server/oeuvre-runner.ts:    pauseClock(o, lastAliveIso);
src/lib/server/oeuvre-runner.ts:    o.status = 'paused';
src/lib/server/oeuvre-runner.ts:    o.pause_reason = `crashed_during=${priorStatus}`;
src/lib/server/oeuvre-runner.test.ts:  pauseOeuvre,
src/lib/server/oeuvre-runner.test.ts:  it('loops leader→worker until all in-pool votes are finish, then consolidates', async () => {
src/lib/server/oeuvre-runner.test.ts:          : { stdout: '<<VOTE value="finish" reason="good">>' },
src/lib/server/oeuvre-runner.test.ts:      's-bob': () => ({ stdout: '<<VOTE value="finish" reason="lgtm">>' })
src/lib/server/oeuvre-runner.test.ts:  it('an edit invalidates standing finish votes, so a re-ratify is required', async () => {
src/lib/server/oeuvre-runner.test.ts:          ? { stdout: '<<SCRATCHPAD>>\n# A\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="a">>' }
src/lib/server/oeuvre-runner.test.ts:          : { stdout: '<<VOTE value="finish" reason="a2">>' },
src/lib/server/oeuvre-runner.test.ts:      's-bob': () => ({ stdout: '<<SCRATCHPAD>>\n# B\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="b">>' })
src/lib/server/oeuvre-runner.test.ts:    // Alice(edit v1,finish) Bob(edit v2,finish→alice stale) Alice(ratify,finish v2) → converge.
src/lib/server/oeuvre-runner.test.ts:    // If stale finishes counted, this would conclude after 2 turns.
src/lib/server/oeuvre-runner.test.ts:    expect(final.scratchpad_version).toBe(2);
src/lib/server/oeuvre-runner.test.ts:  it('drops a repeatedly-failing councillor from the vote pool so the loop can still finish', async () => {
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<VOTE value="finish" reason="ok">>' })
src/lib/server/oeuvre-runner.test.ts:    expect(states.alice.vote).toBe('finish');
src/lib/server/oeuvre-runner.test.ts:  it('conclude-now works from paused too', async () => {
src/lib/server/oeuvre-runner.test.ts:    await pauseOeuvre(o.id);
src/lib/server/oeuvre-runner.test.ts:    expect((await readOeuvre(o.id)).status).toBe('paused');
src/lib/server/oeuvre-runner.test.ts:  it('parks a crashed (non-terminal) oeuvre as paused so the director can resume it', async () => {
src/lib/server/oeuvre-runner.test.ts:    expect(parked.status).toBe('paused');
src/lib/server/oeuvre-runner.test.ts:    expect(parked.pause_reason).toContain('crashed_during=active');
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<SCRATCHPAD>>\n# P\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="ok">>' })
src/lib/server/oeuvre-runner.test.ts:    expect((await readOeuvre(o.id)).status).toBe('paused');
src/lib/server/oeuvre-runner.test.ts:  it('heals a legacy crash-failed oeuvre (failed + crashed_during=) into a resumable paused state', async () => {
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<SCRATCHPAD>>\n# P\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="ok">>' })
src/lib/server/oeuvre-runner.test.ts:    // Reproduce the old build's mis-failure of a paused oeuvre.
src/lib/server/oeuvre-runner.test.ts:    broken.pause_reason = 'crashed_during=paused';
src/lib/server/oeuvre-runner.test.ts:    expect(healed.status).toBe('paused');
src/lib/server/oeuvre-runner.test.ts:    dead.pause_reason = undefined;
src/lib/server/oeuvre-runner.test.ts:  it('leaves a director-paused oeuvre paused on restart (not marked crashed)', async () => {
src/lib/server/oeuvre-runner.test.ts:    await pauseOeuvre(o.id);
src/lib/server/oeuvre-runner.test.ts:    expect(after.status).toBe('paused');
src/lib/server/oeuvre-runner.test.ts:    expect(after.pause_reason ?? '').not.toContain('crashed');
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<SCRATCHPAD>>\n# P\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="ok">>' })
src/lib/server/oeuvre-runner.test.ts:      if (o.status === 'paused') return o;
src/lib/server/oeuvre-runner.test.ts:    throw new Error('oeuvre did not pause in time');
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<VOTE value="finish" reason="x">>' })
src/lib/server/oeuvre-runner.test.ts:    const paused = await waitForPaused(o.id);
src/lib/server/oeuvre-runner.test.ts:    expect(paused.pause_reason).toMatch(/leader_unavailable/i);
src/lib/server/oeuvre-runner.test.ts:    expect(paused.pause_reason).toMatch(/NEXT/);
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<VOTE value="finish" reason="x">>' })
src/lib/server/oeuvre-runner.test.ts:    const paused = await waitForPaused(o.id);
src/lib/server/oeuvre-runner.test.ts:    expect(paused.pause_reason).toMatch(/exited 1/i);
src/lib/server/oeuvre-runner.test.ts:      's-alice': () => ({ stdout: '<<VOTE value="finish" reason="x">>' })
src/lib/server/oeuvre-runner.test.ts:    const paused = await waitForPaused(o.id);
src/lib/server/oeuvre-runner.test.ts:    expect(paused.pause_reason).toMatch(/not an active participant/i);
src/lib/server/oeuvre-runner.test.ts:    expect(paused.pause_reason).toMatch(/ghost/);

[stderr] exec
/bin/zsh -lc "sed -n '120,300p' src/lib/server/oeuvre-runner.ts" in .
exec
/bin/zsh -lc "sed -n '1,180p' src/lib/server/oeuvre-blocks.test.ts" in .
 succeeded in 0ms:
import { describe, it, expect } from 'vitest';
import { parseNext, parseScratchpad, parseVote } from './oeuvre-blocks';

describe('parseNext', () => {
  it('extracts councillor and say', () => {
    const n = parseNext('blah <<NEXT councillor="alice" say="focus on costs">> trailing');
    expect(n).toEqual({ councillor: 'alice', say: 'focus on costs' });
  });

  it('tolerates whitespace and missing say', () => {
    const n = parseNext('   <<NEXT   councillor="bob" >>\n');
    expect(n?.councillor).toBe('bob');
    expect(n?.say).toBe('');
  });

  it('returns null when no block', () => {
    expect(parseNext('nothing here')).toBeNull();
  });

  it('returns null councillor when omitted', () => {
    expect(parseNext('<<NEXT say="hi">>')).toEqual({ councillor: null, say: 'hi' });
  });
});

describe('parseScratchpad', () => {
  it('returns inner body trimmed of leading newline + trailing space', () => {
    const s = parseScratchpad('pre <<SCRATCHPAD>>\n# Plan\n- a\n<</SCRATCHPAD>> post');
    expect(s).toBe('# Plan\n- a');
  });

  it('returns null when absent', () => {
    expect(parseScratchpad('no block, just a vote')).toBeNull();
  });
});

describe('parseVote', () => {
  it('parses finish with attribute reason', () => {
    expect(parseVote('<<VOTE value="finish" reason="looks done">>')).toEqual({
      value: 'finish',
      reason: 'looks done'
    });
  });

  it('parses continue with body reason', () => {
    expect(parseVote('<<VOTE value="continue">>still rough<</VOTE>>')).toEqual({
      value: 'continue',
      reason: 'still rough'
    });
  });

  it('defaults to continue when missing (never spuriously finishes)', () => {
    expect(parseVote('no vote at all').value).toBe('continue');
  });

  it('defaults to continue when value is garbage', () => {
    expect(parseVote('<<VOTE value="maybe">>').value).toBe('continue');
  });
});

 succeeded in 0ms:
    scratchpad,
    version: o.scratchpad_version,
    participantsSummary: participantsSummary(o.participants, states, o.scratchpad_version),
    leaderSlug: o.leader_slug
  });

  const controller = new AbortController();
  directAborters.set(o.id, controller);
  let bytes = byteLen(prompt);
  try {
    const res = await runAdapter({
      adapter,
      prompt,
      cwd: councilRoot(),
      timeoutMs: OEUVRE_LEADER_PICK_TIMEOUT_MS,
      abortSignal: controller.signal
    });
    bytes += byteLen(res.output);
    if (res.timedOut) {
      return { ok: false, bytes, reason: `leader adapter "${leader.adapter}" timed out after ${OEUVRE_LEADER_PICK_TIMEOUT_MS}ms` };
    }
    if (res.exit_code !== 0) {
      // res.transcript carries the adapter's stderr (e.g. an auth/CLI error) — the
      // single most useful thing to show, and previously discarded entirely.
      const tail = snippet(res.transcript || res.output);
      return {
        ok: false,
        bytes,
        reason: `leader adapter "${leader.adapter}" exited ${res.exit_code}${tail ? ` — ${tail}` : ''}`
      };
    }
    const next = parseNext(res.output);
    if (!next || !next.councillor) {
      return {
        ok: false,
        bytes,
        reason: `leader emitted no <<NEXT councillor="…">> directive — output: ${snippet(res.output) || '(empty)'}`
      };
    }
    // The leader may not pick itself, a non-participant, or an out councillor.
    if (next.councillor === o.leader_slug) {
      return { ok: false, bytes, reason: `leader picked itself ("${next.councillor}"); the leader may not take a turn` };
    }
    if (!pool.includes(next.councillor)) {
      return {
        ok: false,
        bytes,
        reason: `leader picked "${next.councillor}", not an active participant (pool: ${pool.join(', ') || 'none'})`
      };
    }
    return { ok: true, councillor: next.councillor, say: next.say, bytes };
  } finally {
    directAborters.delete(o.id);
  }
}

interface TurnResult {
  status: 'succeeded' | 'failed' | 'deferred';
  output: string;
  bytes: number;
  jobId: string | null;
}

async function runWorkerTurn(
  o: Oeuvre,
  slug: string,
  say: string,
  turnIdx: number
): Promise<TurnResult> {
  // Defer if the councillor is busy with an unrelated job; the tick retries later.
  if (lockCurrent(slug)) return { status: 'deferred', output: '', bytes: 0, jobId: null };

  const councillor = await readCouncillor(slug);
  const adapter = resolveAdapterFn(councillor.adapter, OEUVRE_ADAPTER_OPTS);
  if (!adapter) {
    return { status: 'failed', output: '', bytes: 0, jobId: null };
  }

  const note = await readNote(o.id);
  const scratchpad = await readScratchpad(o.id);
  const brief = buildWorkerBrief({
    title: o.title,
    goal: o.goal,
    note,
    leaderSay: say,
    scratchpad,
    version: o.scratchpad_version
  });

  const job = await createJob({
    title: `${o.title} · turn ${turnIdx + 1} · ${slug}`,
    brief,
    councillor_slug: slug,
    oeuvre_id: o.id,
    oeuvre_turn_idx: turnIdx
  });
  activeWorkerJob.set(o.id, job.id);
  await appendOeuvreEvent(o.id, { at: nowIso(), type: 'turn_started', message: slug });

  try {
    const final = await runJobNow(job.id, {
      adapterOverride: adapter,
      skipReflection: true,
      timeoutMs: OEUVRE_TURN_TIMEOUT_MS
    }).catch(() => null);
    const output = await readOutput(job.id).catch(() => '');
    const input = await readInput(job.id).catch(() => '');
    const bytes = byteLen(input) + byteLen(output);
    const status = final?.status === 'succeeded' ? 'succeeded' : 'failed';
    return { status, output, bytes, jobId: job.id };
  } finally {
    activeWorkerJob.delete(o.id);
  }
}

async function setPaused(id: string, reason: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'active') return;
  pauseClock(o, nowIso());
  o.status = 'paused';
  o.pause_reason = reason;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: reason });
}

async function runConsolidation(o: Oeuvre): Promise<void> {
  try {
    const leader = await readCouncillor(o.leader_slug);
    const adapter = resolveAdapterFn(leader.adapter, OEUVRE_ADAPTER_OPTS);
    if (!adapter) {
      await appendOeuvreEvent(o.id, {
        at: nowIso(),
        type: 'consolidation_failed',
        message: `no adapter for leader ${o.leader_slug}`
      });
      return;
    }
    const context = await assembleContextFor(o.leader_slug, o.goal);
    const scratchpad = await readScratchpad(o.id);
    const turns = await readTurnLines(o.id);
    const workLog = turns
      .filter((t) => t.kind === 'turn')
      .map(
        (t) =>
          `- turn ${(t.turn_idx ?? 0) + 1}: ${t.councillor} — ${t.edited ? 'edited' : 'ratified'} — vote ${t.vote}: ${t.reason}`
      )
      .join('\n');
    const prompt = buildConsolidationPrompt({
      persona: leader.persona,
      context,
      title: o.title,
      goal: o.goal,
      scratchpad,
      workLog
    });
    const controller = new AbortController();
    directAborters.set(o.id + ':consolidate', controller);
    let res;
    try {
      res = await runAdapter({
        adapter,
        prompt,
        cwd: councilRoot(),
        timeoutMs: OEUVRE_CONSOLIDATE_TIMEOUT_MS,
        abortSignal: controller.signal
      });
    } finally {
      directAborters.delete(o.id + ':consolidate');
    }
    const fresh = await readOeuvre(o.id);
    fresh.text_bytes += byteLen(prompt) + byteLen(res.output);
    await writeOeuvre(fresh);
    if (res.timedOut || res.exit_code !== 0) {
      await appendOeuvreEvent(o.id, {
        at: nowIso(),
        type: 'consolidation_failed',
        message: res.timedOut ? 'consolidation timed out' : `exit ${res.exit_code}`
      });
      return;
    }
    const apply = await applyReflectionBlocks({

[stderr] exec
/bin/zsh -lc "sed -n '300,560p' src/lib/server/oeuvre-runner.ts" in .
[stderr]  succeeded in 0ms:
    const apply = await applyReflectionBlocks({
      text: res.output,
      sourceCouncillorSlug: o.leader_slug,
      sourceKind: 'oeuvre',
      sourceId: o.id
    });
    const withResults = await readOeuvre(o.id);
    withResults.memory_slugs = apply.memorySlugs;
    withResults.shared_memory_slugs = apply.sharedMemorySlugs;
    withResults.proposed_jobs = apply.proposalIds;
    await writeOeuvre(withResults);
    await appendOeuvreEvent(o.id, {
      at: nowIso(),
      type: 'consolidated',
      message: `mem=${apply.memorySlugs.length} shared=${apply.sharedMemorySlugs.length} proposals=${apply.proposalIds.length}`
    });
  } catch (err) {
    await appendOeuvreEvent(o.id, {
      at: nowIso(),
      type: 'consolidation_failed',
      message: err instanceof Error ? err.message : String(err)
    }).catch(() => {});
  }
}

async function beginConcluding(
  id: string,
  reasonType: OeuvreEventType | null,
  detail?: string
): Promise<void> {
  const fresh = await readOeuvre(id);
  if (isTerminal(fresh.status) || fresh.status === 'concluding') return;
  fresh.status = 'concluding';
  await writeOeuvre(fresh);
  if (reasonType) await appendOeuvreEvent(id, { at: nowIso(), type: reasonType, message: detail });
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluding', message: detail });
  await runConsolidation(fresh);
  const done = await readOeuvre(id);
  done.status = 'concluded';
  done.concluded_at = nowIso();
  await writeOeuvre(done);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluded' });
}

/**
 * One cycle of the loop: budget/pool/conclusion checks, then a leader pick + one
 * worker turn. Idempotent — a no-op while a cycle is in flight or the oeuvre is
 * not active. Re-triggers itself after a productive turn (event-driven advance).
 */
export async function advanceOeuvre(id: string): Promise<void> {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  let reschedule = false;
  try {
    const o = await readOeuvre(id).catch(() => null);
    if (!o || o.status !== 'active') return;

    // 1. Budget caps.
    if (o.total_turns >= o.policy.max_turns) {
      await beginConcluding(id, 'budget_exceeded', 'max_turns');
      return;
    }
    if (activeElapsedMs(o, Date.now()) >= o.policy.max_wall_ms) {
      await beginConcluding(id, 'budget_exceeded', 'max_wall_ms');
      return;
    }
    if (o.text_bytes >= o.policy.max_text_bytes) {
      await beginConcluding(id, 'budget_exceeded', 'max_text_bytes');
      return;
    }

    const states = await readParticipants(id);
    const pool = o.participants.filter((s) => !states[s]?.out);

    // 2. Pool exhausted (everyone dropped out on failures).
    if (pool.length === 0) {
      await beginConcluding(id, 'pool_exhausted', 'all participants out');
      return;
    }

    // 3. Convergence: every in-pool participant's latest vote is finish @ current version.
    const converged = pool.every(
      (s) => states[s]?.vote === 'finish' && states[s]?.scratchpad_version === o.scratchpad_version
    );
    if (converged) {
      await beginConcluding(id, 'converged', 'all participants voted finish');
      return;
    }

    // 4. Leader picks the next worker.
    const pick = await runLeaderPick(o, pool, states);
    if (!pick.ok) {
      o.leader_failures += 1;
      o.text_bytes += pick.bytes;
      const why = pick.reason ?? 'unknown reason';
      // Record every failed attempt so the cause is visible even before the pause.
      await appendOeuvreEvent(id, {
        at: nowIso(),
        type: 'note',
        message: `leader pick failed (${o.leader_failures}/${o.policy.max_consecutive_failures}): ${why}`
      });
      if (o.leader_failures >= o.policy.max_consecutive_failures) {
        await writeOeuvre(o);
        await setPaused(id, `leader_unavailable: ${why}`);
        return;
      }
      await writeOeuvre(o);
      // Re-ask on the next tick rather than tight-looping here.
      return;
    }
    o.leader_failures = 0;
    o.text_bytes += pick.bytes;
    await writeOeuvre(o);
    await appendTurnLine(id, {
      kind: 'leader_pick',
      leader: o.leader_slug,
      picked: pick.councillor,
      say: pick.say,
      ts: nowIso()
    });
    await appendOeuvreEvent(id, {
      at: nowIso(),
      type: 'leader_pick',
      message: `${o.leader_slug} → ${pick.councillor}`
    });

    // 5. Worker turn (a real job).
    const turnIdx = o.total_turns;
    const result = await runWorkerTurn(o, pick.councillor!, pick.say ?? '', turnIdx);
    if (result.status === 'deferred') {
      // Councillor busy; let the tick retry.
      return;
    }

    const states2 = await readParticipants(id);
    const o2 = await readOeuvre(id);
    const ts = nowIso();

    if (result.status === 'succeeded') {
      const edit = parseScratchpad(result.output);
      const currentScratch = (await readScratchpad(id)).trim();
      let version = o2.scratchpad_version;
      let edited = false;
      if (edit !== null && edit.trim() && edit.trim() !== currentScratch) {
        await writeScratchpad(id, edit.trim() + '\n');
        version = o2.scratchpad_version + 1;
        edited = true;
      }
      const vote = parseVote(result.output);
      states2[pick.councillor!] = {
        vote: vote.value,
        reason: vote.reason,
        scratchpad_version: version,
        turn_idx: turnIdx,
        failures: 0,
        out: false,
        ts
      };
      await writeParticipants(id, states2);

      o2.scratchpad_version = version;
      o2.total_turns += 1;
      o2.text_bytes += result.bytes;
      await writeOeuvre(o2);

      if (edited) {
        await appendOeuvreEvent(id, { at: ts, type: 'scratchpad_edited', message: `v${version}` });
      }
      await appendTurnLine(id, {
        kind: 'turn',
        councillor: pick.councillor,
        turn_idx: turnIdx,
        job_id: result.jobId ?? undefined,
        edited,
        scratchpad_version: version,
        vote: vote.value,
        reason: vote.reason,
        ts
      });
      await appendOeuvreEvent(id, {
        at: ts,
        type: 'vote',
        message: `${pick.councillor}: ${vote.value}`
      });
      await appendOeuvreEvent(id, { at: ts, type: 'turn_finished', message: pick.councillor });
    } else {
      // Failed turn — drop the councillor from the pool after enough failures so a
      // broken adapter can't deadlock the vote.
      const prev: ParticipantState = states2[pick.councillor!] ?? defaultParticipantState();
      const failures = prev.failures + 1;
      const out = failures >= o2.policy.max_consecutive_failures;
      states2[pick.councillor!] = { ...prev, failures, out, turn_idx: turnIdx, ts };
      await writeParticipants(id, states2);

      o2.total_turns += 1;
      o2.text_bytes += result.bytes;
      await writeOeuvre(o2);

      await appendTurnLine(id, {
        kind: 'turn_failed',
        councillor: pick.councillor,
        turn_idx: turnIdx,
        job_id: result.jobId ?? undefined,
        failures,
        out,
        ts
      });
      await appendOeuvreEvent(id, {
        at: ts,
        type: out ? 'participant_out' : 'turn_failed',
        message: pick.councillor
      });
    }

    // Only keep looping if the director hasn't paused/cancelled meanwhile.
    reschedule = o2.status === 'active';
  } catch (err) {
    await appendOeuvreEvent(id, {
      at: nowIso(),
      type: 'note',
      message: `advance error: ${err instanceof Error ? err.message : String(err)}`
    }).catch(() => {});
  } finally {
    inFlight.delete(id);
  }
  if (reschedule) void advanceOeuvre(id);
}

// ── Director controls ───────────────────────────────────────────────────────

export async function pauseOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'active') return;
  pauseClock(o, nowIso());
  o.status = 'paused';
  o.pause_reason = undefined;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: 'director' });
}

export async function resumeOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'paused') return;
  resumeClock(o, nowIso());
  o.status = 'active';
  o.pause_reason = undefined;
  o.leader_failures = 0;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'resumed' });
  void advanceOeuvre(id);
}

async function abortAndSettle(id: string): Promise<void> {
  const jid = activeWorkerJob.get(id);
  if (jid) await cancelJob(jid);
  directAborters.get(id)?.abort();
  for (let i = 0; i < 100 && inFlight.has(id); i++) await delay(20);
}

export async function concludeOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);

[stderr] exec
/bin/zsh -lc "sed -n '1,180p' SPECIFICATION.md" in .
[stderr]  succeeded in 0ms:
# Landsraad — Specification

Status: v1 (council + councillor + jobs + shared & private memory + reflection + agent proposals + council templates + adapters + activity dashboard + schedules + meetings + oeuvres). High-level only. Implementation details live in `docs/` and in code.

---

## What it is

Landsraad is a local-first **council** of AI agents working toward a common goal.
A council is a group of agents working with a human director (you).
The app is an `npx`-launchable Node.js + TypeScript application (SvelteKit) that lets the director configure councillors, **assign jobs to them, keep shared memory, and watch the council work**.

**One council per working directory.** When you run `npx landsraad`, the current working directory **is** the council root. The council's own state — `council.json`, `councillors/`, `memory/`, `jobs/`, `.index/`, … — lives in a single hidden **`.landsraad/`** directory at _cwd_. This keeps the working directory itself clear for the **product** the council assembles (your docs, CSVs, code): the council is the machine, not the product. Only `.env` and `.gitignore` sit at the root. Adapters still run with `cwd` = the council root, so councillors work directly in the product tree.
Want more than one council?
Use more than one directory.

---

## TBD
- No provider-native SDK code yet.  v1 invokes adapters as **subprocesses** (CLI tools).  SDK adapters land in a future spec.
- No remote provider permission/auth orchestration. If a CLI needs login, the user logs in once outside Landsraad.

---

## Target Users

### Solo Operator

A founder, investor, researcher, or independent professional who wants a small council of agents to help think, plan, research, and execute.

### Small Team

A team that wants repeatable AI-assisted workflows for operations, research, reporting, strategy, or project management, with one designated director and file sharing handled outside Landsraad.

### Technical Power User

A user comfortable editing markdown, JSON, and CSV files who wants a transparent local system instead of a black-box hosted agent product.

---

## Core Concepts

### Director

The human user.
The director creates councils, configures councillors, writes jobs, reviews outputs, edits shared memory, and handles real-world execution.
The director also performs all coordination work — there is no secretary agent.

### Council

A configured group of councillors plus the state that supports them: jobs, shared memory, run artifacts. A council **is** a directory on disk. The Landsraad app, when launched, operates against the council at its current working directory.

### Councillor

A named council member with a role, persona (markdown), and an **adapter** that says how to actually invoke them. Councillors own domain work in their area of responsibility. A councillor also carries a free-form `routing_hint` string used by the auto-generated council roster (see [Roster](#roster)) so other councillors can route follow-up jobs to them.

### Adapter

The bridge between a councillor and an actual model invocation. v1 supports two adapter kinds, identified by the councillor's `adapter` string:

| Adapter string | What it does |
|---|---|
| `mock:local` | Deterministic in-process stub. Echoes a structured response. Used for tests + offline demos + dogfooding without a real CLI installed. |
| `cli:claude` | Spawns `claude -p <prompt>` as a subprocess, captures stdout. |
| `cli:codex` | Spawns `codex exec <prompt>` as a subprocess, captures stdout. |
| `cli:gemini` | Spawns `gemini` (Gemini CLI) in headless mode, pipes the prompt via stdin, captures stdout. |
| `cli:grok` | Spawns `grok --prompt <prompt>` (xAI Grok CLI) in headless mode, captures stdout. |
| `cli:qwen` | Spawns `qwen` (Qwen Code, a gemini-cli fork) in headless mode, pipes the prompt via stdin, captures stdout. |
| `cli:vibe` | Spawns `vibe` (Mistral Vibe) in programmatic/auto-approve mode, pipes the prompt via stdin, captures stdout. |
| `cli:aider` | Spawns `aider --message <prompt> --yes --no-auto-commits`, processes the single reply, captures stdout. |
| `cli:warp` | Spawns `oz agent run --prompt <prompt>` (Warp's Oz CLI) headlessly, captures stdout. |
| *(empty)* | The councillor cannot be run. Jobs assigned to them stay queued until the adapter is set. |

CLI adapters inherit the user's environment (so auth set up outside Landsraad just works). They run with `cwd` set to the council directory so the CLI can read memory files relative to a known root.

A CLI adapter string may carry a `?query` suffix to tune the invocation per councillor. Currently `cli:claude?model=<id>` injects `--model <id>` into the `claude -p` call — letting a councillor run a lighter/cheaper model (e.g. `cli:claude?model=claude-haiku-4-5`) without changing its persona or memory. Unknown params are ignored, and the bare form (`cli:claude`) keeps the CLI's default model. This is the per-councillor lever for "use a lite model in meetings": give the meeting attendee a `?model=` adapter while job-running councillors keep the default. (Other CLI adapters parse the suffix but only `cli:claude` consumes `model` today.)

For a host-wide lever, `LANDSRAAD_MEETING_MODEL` (e.g. `haiku`) sets the model for **every** meeting LLM call a server runs — attendee turns, rolling chair summaries, and the closing synthesis — **and every oeuvre LLM call** — leader picks, worker turns, and consolidation — so an operator can run cheap/fast councillor collaboration without editing each councillor. A per-councillor `?model=` pin still wins (explicit beats the host default). It is per-process: each participating server reads its own value, so it also governs the turns that server serves as a remote peer. Standalone jobs/runs outside a meeting or oeuvre are unaffected. Empty (the default) leaves each adapter on its own default model. The companion `LANDSRAAD_MEETING_TURN_NUDGE` is likewise appended to oeuvre worker-turn briefs as well as meeting turns.

A council may carry a root `.env` file (`<councilRoot>/.env`) whose keys are loaded into the server environment at startup and inherited by adapter subprocesses — the in-app way to provide adapter API keys (`OPENAI_API_KEY`, `WARP_API_KEY`, …) and env-driven overrides. Edited at `/council`. The council `.env` is authoritative (it overrides inherited values), changes take effect on restart, and it is never indexed, exported, or served — `ensureCouncilGitignore` keeps it out of git too.

A future SDK adapter family (`sdk:anthropic`, `sdk:openai`) will use the same `Adapter` interface and slot in without breaking the job runner.

### Job

A unit of work the director gives to one councillor. A job has a brief (free-form markdown prompt from the director), an assigned councillor, and a status:

- `queued` — created, not yet running.
- `running` — adapter has been invoked.
- `succeeded` — adapter completed normally.
- `failed` — adapter exited non-zero or threw.
- `cancelled` — director cancelled before/during the run.

Jobs are one-shot. To repeat a job, the director clones it. Jobs are scoped to one council.

### Schedule

A declaration that a job should be created at a future time (`kind: "once"`) or on a cron expression (`kind: "recurring"`). Schedules spawn jobs on the in-process tick loop (30s resolution) and otherwise leave the job lifecycle unchanged. Cron expressions are 5-field, interpreted in the system local TZ. Schedules with `enabled: false` do not fire. On `kind: "once"` fire, the schedule auto-disables and records `fired_at` + `last_fire_job_id`.

If the app was down at a fire time, startup logs a single `missed_fires` event per stale schedule and advances `next_fire_at` to the next future occurrence — no replay. If a recurring fire is due but the prior spawned job is still `running` on the same councillor, the fire is skipped (`skipped_overlap` event) and `next_fire_at` advances.

### Memory

Two tiers, both markdown on disk:

- **Shared council memory** — `<council>/memory/*.md`. Visible to every councillor.
- **Private per-councillor memory** — `<council>/councillors/<slug>/memory/*.md`. Visible only to that councillor at prompt-assembly time. Created exclusively by reflection (see below); edit and delete via the UI.

Prompt assembly is top-K semantic retrieval against the sqlite-vec index — `MEMORY_TOPK_SHARED` shared hits + `MEMORY_TOPK_PRIVATE` private hits, capped by `MEMORY_CHAR_BUDGET` total characters (see `src/lib/server/config.ts`). If the index is empty or embedding fails, assembly falls back to "all shared notes verbatim." See [`docs/embeddings.md`](docs/embeddings.md) for chunk kinds and storage.

### Indexing model

The semantic index is **pull-based**: the filesystem under the council root is the
single source of truth. Writers only write files; they never call the indexer. A
chokidar watcher (`src/lib/server/watcher.ts`) re-derives index chunks from a
path→kind source registry (`src/lib/server/index-sources.ts`) on add/change/unlink.

**What gets indexed.** The watcher watches the whole council root and indexes two things:

1. **The council machine** — everything under `.landsraad/` (memory, personas, job
   `input`/`output`/`transcript`, meeting topics/turns/summaries/syntheses, oeuvre
   scratchpads). Always indexed, regardless of `.gitignore` — it is the council's own
   data. Its `.index/` db is never indexed.
2. **The product** — prose files in the working directory itself: `.md` and `.txt`
   only (kind `project_file`), so the council can retrieve over the docs it is
   assembling. This is **semantic memory**, not a code search engine: code, CSVs, and
   binaries are deliberately excluded (adapters already see the tree via their own
   cwd + tools). The product walk **respects the root `.gitignore`** (so secrets and
   build output stay out of the index) and skips dot-dirs and `node_modules`. Files
   over `LANDSRAAD_INDEX_MAX_FILE_BYTES` (default 512 KB) are skipped. The **root**
   `.gitignore` only is honored (nested `.gitignore` files are a follow-up), and it is
   read at watcher start — edits take effect on restart. Retrieval pulls
   `LANDSRAAD_PROJECT_TOPK` (default 6) project hits into a `Project context` prompt
   section, sharing the memory char budget.

- On startup the watcher loads a manifest (`source_path → source_mtime`) and skips
  files whose mtime is unchanged; files indexed for paths that no longer exist are
  pruned (orphan sweep on `ready`).
- Moving a finished job's `output.md` into `.landsraad/councillors/<slug>/memory/`
  therefore re-kinds it as private memory automatically.
- Set `LANDSRAAD_WATCH=0` to disable the watcher (e.g. to avoid two processes
  writing the same `.index/` in development).

### Reflection

After a job transitions to `succeeded`, the runner makes one extra adapter call to the same councillor with a fixed reflection prompt (`src/lib/server/reflection.ts`). The prompt includes the job's `transcript.md` + `output.md` and asks for zero or more agent → host blocks (see [Agent Proposals](#agent-proposals)). Reflection is opt-out per councillor (`councillor.json` `reflect: boolean`, default `true`). Failed/cancelled jobs skip reflection. Reflection failure is non-fatal; it appends a `reflection_failed` event and leaves the job `succeeded`.

Reflection runs while the job already reads `succeeded` but still holds the councillor lock, so the dashboard lane shows that councillor as **reflecting** (distinct from `busy`) until it finishes. The reflection call is time-bounded so a hung or slow model can't pin a councillor indefinitely; on timeout it logs `reflection_failed` ("reflection timed out…") and releases the lock. Override the budget with `LANDSRAAD_REFLECT_TIMEOUT_MS` (default `120000`).

### Agent Proposals

Reflection (and, eventually, any adapter response slot the host chooses to scan) parses fenced blocks of the form:

```
<<MEMORY title="...">>
body markdown
<</MEMORY>>

<<JOB title="..." councillor="optional-slug" priority="normal">>
brief markdown
<</JOB>>
```

- **`<<MEMORY>>`** — applied directly. Defaults to the councillor's private memory dir (indexed under `memory_private`). `scope="shared"` writes to the council-wide `memory/` dir instead (indexed under `memory`). Title collisions in either scope get a `-2`, `-3` suffix. The block parser is regex-tolerant of leading whitespace and trailing prose; unrecognized tags are ignored (forward-compat). Cleanup/dedupe of repeated shared writes is a deferred follow-up.
- **`<<JOB>>`** — lands as a *proposal*, not a direct mutation. The host writes `<council>/proposals/jobs/<timestamp>-<slug>.json` with `status: "pending"` and appends a `proposed_job` event to the source job. The director reviews at `/proposals` and approves (creating the job via the normal job-creation path) or rejects. Unknown `councillor` slugs are flagged in the review UI for reassignment before approval. The review-queue gate is the only loop-breaker; no automated cap in v1.

### Roster

A terse auto-generated roster of every councillor — one line per councillor of the form `<slug> — <name> — <role> — <routing_hint>` — is injected into each prompt between the persona and the memory sections. Source: `listCouncillors()`. Self is included; the header is emitted even for a one-councillor council so the format stays stable. This is what makes `<<JOB councillor="other-slug">>` land on real slugs.

### Council Template

A reusable, shareable definition of a council type — councillor roles, personas, default adapter expectations, and starter scaffolding. Single JSON file (`*.template.json`); see [`src/lib/server/templates.ts`](src/lib/server/templates.ts) for the schema. Templates must never contain user private data, operational history, business-specific facts, secrets, customer information, financial data, or other PII — the exporter enforces this through opt-in selection (councillors checked by default; memory and queued jobs unchecked).

- **Install** — `npx landsraad init <source>` (URL or local path) or the `/import` route. Loader fetches with a 10s timeout, ≤2MB, ≤3 redirects. Preview-then-confirm: `planApply` returns adds/overwrites/skips; `applyTemplate` requires `confirmedOverwrite: true` if any overwrite is planned (otherwise throws `TemplateNeedsConfirmation`). Sample jobs are queued only when the council's `jobs/` directory is empty (so templates never pollute history). Run artifacts and `.index/` are never touched. The installed council's `template` field is set to `"<template.name>@<template.version>"` for provenance. A template may also carry an optional `env` array (`{ key, value, comment? }`); on install these seed the council's `.env` via `writeCouncilEnv` (existing keys are replaced only under the same overwrite confirmation as councillors/memory; `comment` is template-only and not written). All bundled templates seed `LANDSRAAD_MEETING_MODEL=lite` and `LANDSRAAD_MEETING_TURN_NUDGE` so meetings start terse and cheap.
- **Export** — `npx landsraad export <out.json>` or the `/export` route. Picker selects councillors / memory notes / queued jobs. Job artifacts (`input.md`, `transcript.md`, `output.md`, `events.jsonl`) are never exported. Env export is opt-in per key — the `/export` picker lists the council's env keys (secret-named keys are never offered); any selected key whose name matches a secret pattern (`key`, `api`, `token`, `secret`, `password`, `passwd`, `credential`, `auth`, `private`) is refused with a named error so secrets never land in a shareable template.

`templates/dogfood.template.json` is the in-repo built-in (replaces the previous imperative `scripts/dogfood-init.ts` seeder).

### Meeting

[stderr] codex
I found the three docs/code mismatches the leader called out: the adapter examples omit `cli:vibe`/`cli:warp`, the chunk-kind list omits meeting and oeuvre kinds, and the oeuvre tag docs overstate byte-identical scratchpad comparison while underdocumenting `<<VOTE>>` body reasons. I’m updating the docs plus adding explicit council-root/machine/product frame terms now.
[stderr] apply patch
[stderr] patch: completed
./docs/GLOSSARY.md
./docs/TAGS.md
[stderr] diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab76b4a5319cdcbdb050c6a8c82c2e0b6a0..5e6a2e2b3046941c19ef7d5d81079d1b9e189957
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880af8608570f7ab9b5caa249736cc9c6f2d..8eb935a0daf21ea1441dbebd7b0d6176c01d2067
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab76b4a5319cdcbdb050c6a8c82c2e0b6a0..5e6a2e2b3046941c19ef7d5d81079d1b9e189957
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880af8608570f7ab9b5caa249736cc9c6f2d..8eb935a0daf21ea1441dbebd7b0d6176c01d2067
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] codex
The docs now reflect the code’s current parser and registry behavior. I’m doing a quick diff/readback pass, then I’ll emit the full updated scratchpad and vote.
[stderr] exec
/bin/zsh -lc "rg \"byte-identical|cli:vibe|cli:warp|meeting_topic|oeuvre_scratchpad|Council root|Council machine|Product tree|reason=\\\"|<</VOTE>>\" docs/GLOSSARY.md docs/TAGS.md" in .
 succeeded in 0ms:
docs/TAGS.md:<<VOTE value="finish" reason="both files are complete and accurate">>
docs/TAGS.md:- `reason` — one line, either as `reason="..."` or as the body of a paired
docs/TAGS.md:  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
docs/TAGS.md:  `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
docs/GLOSSARY.md:**Council root** — the current working directory when `npx landsraad` starts.
docs/GLOSSARY.md:**Council machine** — the council's own state under `.landsraad/`: `council.json`,
docs/GLOSSARY.md:**Product tree** — the director's actual project files in the council root,
docs/GLOSSARY.md:`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
docs/GLOSSARY.md:`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
docs/GLOSSARY.md:`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from

[stderr] exec
/bin/zsh -lc 'git diff -- docs/GLOSSARY.md docs/TAGS.md' in .
[stderr]  succeeded in 0ms:
diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab..5e6a2e2 100644
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@ coordination runs through the director** — councillors never command each othe
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@ synonyms; the product UI says "councillor".
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@ the **council machine** (state under `.landsraad/`) and the **product** (`.md` a
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880..8eb935a 100644
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@ role. (See [Oeuvres](GLOSSARY.md#oeuvres-asynchronous-work-loops).)
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@ role. (See [Oeuvres](GLOSSARY.md#oeuvres-asynchronous-work-loops).)
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] exec
/bin/zsh -lc 'git status --short' in .
 succeeded in 0ms:
 M docs/GLOSSARY.md
 M docs/TAGS.md
?? .landsraad/jobs/2026-06-06T13-54-04-860Z-documentation-upgrade-turn-3-fenring/

[stderr] diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab76b4a5319cdcbdb050c6a8c82c2e0b6a0..5e6a2e2b3046941c19ef7d5d81079d1b9e189957
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880af8608570f7ab9b5caa249736cc9c6f2d..8eb935a0daf21ea1441dbebd7b0d6176c01d2067
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] exec
/bin/zsh -lc "nl -ba docs/GLOSSARY.md | sed -n '15,115p'" in .
 succeeded in 0ms:
    15	reviews outputs, approves or rejects proposals, and edits shared memory. **All
    16	coordination runs through the director** — councillors never command each other.
    17	(Older docs may say "user" or "operator"; prefer "director".)
    18	
    19	**Council** — a group of councillors plus all of its state on disk. A council
    20	*is* a directory: one council per directory, no shared database.
    21	
    22	**Council root** — the current working directory when `npx landsraad` starts.
    23	Adapters run with this as `cwd`, so councillors can read and edit the product
    24	tree directly. To run more than one council, use more than one directory.
    25	
    26	**Council machine** — the council's own state under `.landsraad/`: `council.json`,
    27	`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
    28	related run artifacts. The machine is hidden so the root stays clear for product
    29	work.
    30	
    31	**Product tree** — the director's actual project files in the council root,
    32	outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
    33	helping assemble. Product prose (`.md` and `.txt`) may be indexed as
    34	`project_file`; code and binaries are not semantic-indexed.
    35	
    36	**Councillor** — a named AI member of a council. A councillor is the sum of three
    37	things: a **role** (what it's for), a **persona** (how it thinks and writes), and
    38	an **adapter** (how it's actually run). "Agent" and "council member" are informal
    39	synonyms; the product UI says "councillor".
    40	
    41	**Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
    42	(a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
    43	subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
    44	`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
    45	run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
    46	`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
    47	are future work and out of scope today.
    48	
    49	---
    50	
    51	## Doing work
    52	
    53	**Job** — one unit of work for one councillor. This is the core noun (not "task").
    54	A job runs once; to repeat it, clone it. Its status moves through
    55	`queued → running → succeeded` or `→ failed` or `→ cancelled`.
    56	
    57	**Brief** — the director's free-form markdown prompt for a job: what you want done.
    58	
    59	**Prompt** — the fully assembled `input.md` the adapter actually receives. The
    60	brief is only part of it; Landsraad prepends the councillor's persona, the council
    61	roster, shared memory, and that councillor's private memory.
    62	
    63	**Reflection** — an extra adapter call made *after* a job succeeds, with the same
    64	councillor, asking it to record what it learned. Reflection output may contain
    65	[`<<MEMORY>>`](TAGS.md) and [`<<JOB>>`](TAGS.md) blocks. It's skipped on failed or
    66	cancelled jobs, is non-fatal if it errors, and is time-bounded. A councillor can
    67	opt out with `reflect: false`. While reflecting, that councillor's lane shows
    68	**reflecting** (distinct from **busy**).
    69	
    70	**Proposal** — a job a councillor *suggests*, emitted as a [`<<JOB>>`](TAGS.md)
    71	block. A proposal never runs on its own: it waits at `/proposals` for the director
    72	to approve or reject. This review gate is what stops councillors from spawning
    73	work in a runaway loop.
    74	
    75	**Roster** — an auto-generated, one-line-per-councillor list
    76	(`slug — name — role — routing_hint`) injected into every prompt. It's how a
    77	councillor knows which slugs exist, so a `<<JOB councillor="slug">>` lands on a
    78	real teammate.
    79	
    80	**routing_hint** — a short self-description each councillor carries
    81	("implements SvelteKit code", "audits for gaps"). It appears in the roster so
    82	others can route follow-up jobs to the right councillor.
    83	
    84	**Schedule** — a standing instruction to create a job later. A schedule is either
    85	`once` (at a specific time) or `recurring` (a 5-field cron expression, in local
    86	time). A 30-second tick fires due schedules; missed fires are not replayed.
    87	
    88	---
    89	
    90	## Memory
    91	
    92	**Memory** — markdown notes stored on disk. Two tiers:
    93	
    94	- **Shared memory** — files under `memory/`, visible to every councillor in the
    95	  council.
    96	- **Private memory** — files under `councillors/<slug>/memory/`, visible only to
    97	  that one councillor. Private memory is created *only* by reflection.
    98	
    99	A reflection [`<<MEMORY>>`](TAGS.md) block writes to private memory by default;
   100	adding `scope="shared"` routes it to the shared tier instead. One reflection pass
   101	can write to both.
   102	
   103	**Index** — a pull-based semantic search layer (sqlite-vec). Files on disk are the
   104	source of truth; a watcher re-derives searchable chunks from them. It indexes both
   105	the **council machine** (state under `.landsraad/`) and the **product** (`.md` and
   106	`.txt` files in the working directory).
   107	
   108	**Chunk kind** — the type tag on an indexed or retrieved piece of text:
   109	`memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
   110	`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
   111	`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
   112	the product tree, as opposed to the council's own machine state.)
   113	
   114	---
   115	

[stderr] exec
/bin/zsh -lc "nl -ba docs/TAGS.md | sed -n '100,135p'" in .
[stderr]  succeeded in 0ms:
   100	
   101	**Participant only.** Replaces the shared scratchpad with the block's contents.
   102	
   103	```
   104	<<SCRATCHPAD>>
   105	...the full updated artifact, in markdown...
   106	<</SCRATCHPAD>>
   107	```
   108	
   109	- Present, non-empty, and **different** from the current scratchpad ⇒ a
   110	  **substantive edit**: it overwrites `scratchpad.md` and bumps
   111	  `scratchpad_version` (which invalidates standing `finish` votes).
   112	- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
   113	  ratification); the version is unchanged. Omit the block when you mean "leave it
   114	  as is".
   115	- Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
   116	
   117	## `<<VOTE>>`
   118	
   119	**Participant only.** Records this turn's vote on whether the goal is met.
   120	
   121	```
   122	<<VOTE value="finish" reason="both files are complete and accurate">>
   123	```
   124	
   125	- `value` — `finish` or `continue`.
   126	- `reason` — one line, either as `reason="..."` or as the body of a paired
   127	  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
   128	  wins. On a `continue` vote this is what the leader routes on next, so make it
   129	  actionable.
   130	- A missing or malformed `<<VOTE>>` is treated as `continue` with
   131	  `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   132	  loop.

[stderr] diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab76b4a5319cdcbdb050c6a8c82c2e0b6a0..5e6a2e2b3046941c19ef7d5d81079d1b9e189957
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880af8608570f7ab9b5caa249736cc9c6f2d..8eb935a0daf21ea1441dbebd7b0d6176c01d2067
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] codex
<<SCRATCHPAD>>
# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v3 — technical accuracy pass applied (fenring, turn 3).** Both files
exist on disk and now match the current parser/registry behavior checked against
code, not only specs.

- `docs/GLOSSARY.md` — written and revised. Added explicit frame terms for
  **Council root**, **Council machine**, and **Product tree** so the
  `.landsraad/` machine vs product-tree split is first-class
  (`docs/GLOSSARY.md:22`, `docs/GLOSSARY.md:26`, `docs/GLOSSARY.md:31`).
- `docs/GLOSSARY.md` — adapter list corrected to include all shipped known CLI
  adapters from `src/lib/server/adapters/index.ts` / `cli.ts`: `cli:claude`,
  `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`, `cli:vibe`, `cli:aider`,
  `cli:warp` (`docs/GLOSSARY.md:41`).
- `docs/GLOSSARY.md` — chunk-kind enum corrected to include meeting and oeuvre
  kinds from `src/lib/server/embeddings.ts`: `meeting_topic`, `meeting_turn`,
  `meeting_summary`, `meeting_synthesis`, `oeuvre_scratchpad`
  (`docs/GLOSSARY.md:108`).
- `docs/TAGS.md` — `<<SCRATCHPAD>>` parser behavior corrected: ratification is
  based on absence or equivalence after surrounding whitespace trimming, not
  byte-identical comparison (`docs/TAGS.md:112`).
- `docs/TAGS.md` — `<<VOTE>>` reason behavior corrected: reason can be an
  attribute or paired block body, and the body wins when both are present
  (`docs/TAGS.md:126`).

Verified against:
- `src/lib/server/oeuvre-blocks.ts` — `parseNext`, `parseScratchpad`, `parseVote`
- `src/lib/server/oeuvre-runner.ts` — invalid leader picks fail, re-ask via
  leader failure policy, pause after consecutive failures, edit bumps
  `scratchpad_version`, current-version `finish` votes converge
- `src/lib/server/adapters/cli.ts` and `src/lib/server/adapters/index.ts` —
  known adapter registry and `lite` / `medium` / `heavy` tier handling
- `src/lib/server/embeddings.ts` and `src/lib/server/index-sources.ts` —
  authoritative `ChunkKind` union and source registry
- `SPECIFICATION.md` / `docs/data-model.md` — council-root and `.landsraad/`
  storage framing

## What's left before this oeuvre should conclude
1. **Gap / mislead audit (→ vladimir).** One final newcomer-oriented pass:
   anything still confusing, any UI-copy contradiction, any load-bearing term still
   missing.
2. **README/INDEX wiring (→ shaddam).** Link `docs/GLOSSARY.md` and
   `docs/TAGS.md` from `README.md` and/or a docs index so the new references are
   discoverable. Decide whether `gzip_density` and the planned `AGENTS.md`
   council-guide deserve "(planned)" stubs.

## Decisions locked
- Audience: someone landing mid-system who needs word → mental-model fast.
- Canonical terms bold; retired synonyms named inline ("older docs may say…").
- We say **councillor** not "agent", **director** not "user/operator",
  **job** not "task", **turn** only ever means a structured meeting/oeuvre turn.
- TAGS.md leads with parsing guarantees so emitters trust fail-safe behavior.
- The council is the **machine** under `.landsraad/`; the director's project files
  are the **product tree** at the council root.
<</SCRATCHPAD>>

<<VOTE value="continue" reason="technical mismatches are closed; shaddam still needs to wire README/docs discoverability">>
[stderr] diff --git a/docs/GLOSSARY.md b/docs/GLOSSARY.md
index 9833fab76b4a5319cdcbdb050c6a8c82c2e0b6a0..5e6a2e2b3046941c19ef7d5d81079d1b9e189957
--- a/docs/GLOSSARY.md
+++ b/docs/GLOSSARY.md
@@ -19,6 +19,20 @@
 **Council** — a group of councillors plus all of its state on disk. A council
 *is* a directory: one council per directory, no shared database.
 
+**Council root** — the current working directory when `npx landsraad` starts.
+Adapters run with this as `cwd`, so councillors can read and edit the product
+tree directly. To run more than one council, use more than one directory.
+
+**Council machine** — the council's own state under `.landsraad/`: `council.json`,
+`councillors/`, `memory/`, `jobs/`, `meetings/`, `oeuvres/`, `.index/`, and
+related run artifacts. The machine is hidden so the root stays clear for product
+work.
+
+**Product tree** — the director's actual project files in the council root,
+outside `.landsraad/`: docs, code, notes, CSVs, and anything else the council is
+helping assemble. Product prose (`.md` and `.txt`) may be indexed as
+`project_file`; code and binaries are not semantic-indexed.
+
 **Councillor** — a named AI member of a council. A councillor is the sum of three
 things: a **role** (what it's for), a **persona** (how it thinks and writes), and
 an **adapter** (how it's actually run). "Agent" and "council member" are informal
@@ -26,10 +40,11 @@
 
 **Adapter** — how a councillor is invoked. Two forms ship today: `mock:local`
 (a deterministic stub for testing) and `cli:<tool>` (runs a local CLI as a
-subprocess — e.g. `claude`, `codex`, `gemini`, `grok`, `qwen`, `aider`). An empty
-adapter means the councillor can't run, so its jobs stay queued. A `?model=<id>`
-suffix pins a model; tier aliases `lite` / `medium` / `heavy` ask for a
-small / mid / large model. `sdk:*` adapters are future work and out of scope today.
+subprocess: `cli:claude`, `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`,
+`cli:vibe`, `cli:aider`, `cli:warp`). An empty adapter means the councillor can't
+run, so its jobs stay queued. A `?model=<id>` suffix pins a model; tier aliases
+`lite` / `medium` / `heavy` ask for a small / mid / large model. `sdk:*` adapters
+are future work and out of scope today.
 
 ---
 
@@ -92,8 +107,9 @@
 
 **Chunk kind** — the type tag on an indexed or retrieved piece of text:
 `memory`, `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
-and `project_file`. (`project_file` is a prose file from *your* project tree, as
-opposed to the council's own machine state.)
+`meeting_topic`, `meeting_turn`, `meeting_summary`, `meeting_synthesis`,
+`oeuvre_scratchpad`, and `project_file`. (`project_file` is a prose file from
+the product tree, as opposed to the council's own machine state.)
 
 ---
 
diff --git a/docs/TAGS.md b/docs/TAGS.md
index 1bee880af8608570f7ab9b5caa249736cc9c6f2d..8eb935a0daf21ea1441dbebd7b0d6176c01d2067
--- a/docs/TAGS.md
+++ b/docs/TAGS.md
@@ -109,8 +109,9 @@
 - Present, non-empty, and **different** from the current scratchpad ⇒ a
   **substantive edit**: it overwrites `scratchpad.md` and bumps
   `scratchpad_version` (which invalidates standing `finish` votes).
-- **Absent or byte-identical** ⇒ no edit (a ratification); the version is
-  unchanged. Omit the block when you mean "leave it as is".
+- **Absent or equivalent after surrounding whitespace is trimmed** ⇒ no edit (a
+  ratification); the version is unchanged. Omit the block when you mean "leave it
+  as is".
 - Emit the **whole** artifact, not a diff — the block is the new scratchpad in full.
 
 ## `<<VOTE>>`
@@ -122,8 +123,10 @@
 ```
 
 - `value` — `finish` or `continue`.
-- `reason` — one line. On a `continue` vote this is what the leader routes on next,
-  so make it actionable.
+- `reason` — one line, either as `reason="..."` or as the body of a paired
+  `<<VOTE value="continue">>...<</VOTE>>` block. If both are present, the body
+  wins. On a `continue` vote this is what the leader routes on next, so make it
+  actionable.
 - A missing or malformed `<<VOTE>>` is treated as `continue` with
   `reason="(no vote emitted)"` — a broken turn can never accidentally conclude the
   loop.

[stderr] tokens used
75,575
<<SCRATCHPAD>>
# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v3 — technical accuracy pass applied (fenring, turn 3).** Both files
exist on disk and now match the current parser/registry behavior checked against
code, not only specs.

- `docs/GLOSSARY.md` — written and revised. Added explicit frame terms for
  **Council root**, **Council machine**, and **Product tree** so the
  `.landsraad/` machine vs product-tree split is first-class
  (`docs/GLOSSARY.md:22`, `docs/GLOSSARY.md:26`, `docs/GLOSSARY.md:31`).
- `docs/GLOSSARY.md` — adapter list corrected to include all shipped known CLI
  adapters from `src/lib/server/adapters/index.ts` / `cli.ts`: `cli:claude`,
  `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`, `cli:vibe`, `cli:aider`,
  `cli:warp` (`docs/GLOSSARY.md:41`).
- `docs/GLOSSARY.md` — chunk-kind enum corrected to include meeting and oeuvre
  kinds from `src/lib/server/embeddings.ts`: `meeting_topic`, `meeting_turn`,
  `meeting_summary`, `meeting_synthesis`, `oeuvre_scratchpad`
  (`docs/GLOSSARY.md:108`).
- `docs/TAGS.md` — `<<SCRATCHPAD>>` parser behavior corrected: ratification is
  based on absence or equivalence after surrounding whitespace trimming, not
  byte-identical comparison (`docs/TAGS.md:112`).
- `docs/TAGS.md` — `<<VOTE>>` reason behavior corrected: reason can be an
  attribute or paired block body, and the body wins when both are present
  (`docs/TAGS.md:126`).

Verified against:
- `src/lib/server/oeuvre-blocks.ts` — `parseNext`, `parseScratchpad`, `parseVote`
- `src/lib/server/oeuvre-runner.ts` — invalid leader picks fail, re-ask via
  leader failure policy, pause after consecutive failures, edit bumps
  `scratchpad_version`, current-version `finish` votes converge
- `src/lib/server/adapters/cli.ts` and `src/lib/server/adapters/index.ts` —
  known adapter registry and `lite` / `medium` / `heavy` tier handling
- `src/lib/server/embeddings.ts` and `src/lib/server/index-sources.ts` —
  authoritative `ChunkKind` union and source registry
- `SPECIFICATION.md` / `docs/data-model.md` — council-root and `.landsraad/`
  storage framing

## What's left before this oeuvre should conclude
1. **Gap / mislead audit (→ vladimir).** One final newcomer-oriented pass:
   anything still confusing, any UI-copy contradiction, any load-bearing term still
   missing.
2. **README/INDEX wiring (→ shaddam).** Link `docs/GLOSSARY.md` and
   `docs/TAGS.md` from `README.md` and/or a docs index so the new references are
   discoverable. Decide whether `gzip_density` and the planned `AGENTS.md`
   council-guide deserve "(planned)" stubs.

## Decisions locked
- Audience: someone landing mid-system who needs word → mental-model fast.
- Canonical terms bold; retired synonyms named inline ("older docs may say…").
- We say **councillor** not "agent", **director** not "user/operator",
  **job** not "task", **turn** only ever means a structured meeting/oeuvre turn.
- TAGS.md leads with parsing guarantees so emitters trust fail-safe behavior.
- The council is the **machine** under `.landsraad/`; the director's project files
  are the **product tree** at the council root.
<</SCRATCHPAD>>

<<VOTE value="continue" reason="technical mismatches are closed; shaddam still needs to wire README/docs discoverability">>
