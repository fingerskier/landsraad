I now have everything verified against source. Two corrections to the draft: the leader re-ask behavior was wrong (it's "pause only after `max_consecutive_failures`", not "re-ask once then pause"), and `<<PROMOTE>>` is missing from the unimplemented-tags list. The TAGS.md section was also truncated mid-block. Here's my turn — a complete, source-verified scratchpad with both files now ship-ready:

<<SCRATCHPAD>>
# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v2 — both files complete and source-verified (shaddam, turn 2).**
TAGS.md is no longer truncated; every claim re-checked against `SPECIFICATION.md`,
`src/lib/server/oeuvre-blocks.ts`, and `oeuvre-runner.ts`. Each file below is
presented as **final, ship-ready content** between `=== FILE ===` markers — a
closing turn can write them to disk verbatim. Provenance `(src: …)` tags are
stripped from file content; drafting notes live in §Drafting log at the bottom.

Remaining before finish: (1) one first-time-reader voice pass (shaddam owns);
(2) vladimir gap-audit for missing terms / wrong claims; (3) split into the two
real files on disk. Content itself is believed complete.

---

=== FILE: docs/GLOSSARY.md ===

# Glossary

Landsraad-specific terms. If a word means something special inside a council —
**turn**, **councillor**, **oeuvre** — it's defined here. One sentence each, with
a clause of nuance only where it bites. The canonical term is in **bold**; retired
synonyms are called out so we all say the same thing.

> **The one mental model to hold first:** a council is a *machine*, not the
> *product*. The machine — councillors, memory, jobs, runs — lives entirely under
> a hidden `.landsraad/` directory. The working directory around it is the
> **product** the council is assembling (your docs, CSVs, code). One council per
> directory.

## The frame

- **Director** — the one human. Creates councils, writes briefs, reviews outputs
  and proposals, edits shared memory, and does *all* coordination. There is no
  secretary agent. (Say "director", not "user" or "operator".)
- **Council** — a group of councillors plus its on-disk state. A council **is** a
  directory. One council per directory; want another, use another directory.
- **Councillor** — a named AI council member = role + persona + adapter. This is
  the canonical word; "agent" and "council member" are informal synonyms only.
- **Adapter** — how a councillor is actually invoked. Either `mock:local` (an
  in-process deterministic stub for tests and offline demos) or `cli:<tool>` (runs
  a real CLI as a subprocess — `claude`, `codex`, `gemini`, `grok`, `qwen`,
  `vibe`, `aider`, `warp`). An empty adapter means the councillor can't run; its
  jobs stay `queued`. A `?model=<id>` suffix pins a specific model for that
  councillor (e.g. `cli:claude?model=claude-haiku-4-5`). `sdk:*` adapters are
  future/out-of-scope.
- **Role** — a councillor's short job title (e.g. "Implementer", "Critic"). Shown
  in the roster; shapes what work routes to them.
- **routing_hint** — a terse self-description a councillor carries so others know
  when to hand it a follow-up job. Surfaced in the roster.
- **Roster** — the auto-generated `slug — name — role — routing_hint` list (one
  line per councillor) injected into every prompt. It's what lets a
  `<<JOB councillor="slug">>` land on a real councillor.

## Doing work

- **Job** — one unit of work for one councillor. The canonical noun (not "task").
  Jobs are one-shot — clone to repeat — and move through
  `queued → running → succeeded | failed | cancelled`.
- **Brief** — the director's free-form markdown prompt for a job: *what you ask
  for*. Distinct from the prompt.
- **Prompt** — the fully assembled `input.md` the adapter actually receives:
  persona + roster + retrieved shared & private memory + project context + the
  brief. The brief is your ask; the prompt is everything the councillor sees.
- **Reflection** — an extra adapter call the runner makes to the *same* councillor
  right after a job succeeds. It can emit `<<MEMORY>>` and `<<JOB>>` blocks. It's
  opt-out per councillor (`reflect: false`), skipped on failed/cancelled jobs, and
  non-fatal. While it runs, the councillor's lane shows **reflecting** (distinct
  from **busy**).
- **Proposal** — a `<<JOB>>` block a councillor emitted, parked for the director to
  approve or reject at `/proposals`. A proposal **never auto-runs** — that review
  gate is the system's loop-breaker.
- **Schedule** — a declaration that a job should be created later: `once` (at a
  time) or `recurring` (5-field cron, local timezone). Fires on a 30-second tick;
  missed fires are logged, not replayed.

## Memory & retrieval

- **Memory** — markdown notes on disk, in two tiers:
  - **Shared memory** — `memory/*.md`, visible to every councillor.
  - **Private memory** — `councillors/<slug>/memory/*.md`, visible only to that
    one councillor, and created *only* by its reflection.
- **Index / indexing model** — a pull-based semantic index (sqlite-vec). The
  files on disk are the source of truth; a watcher re-derives the index when they
  change. It indexes both the **council machine** (under `.landsraad/`) and the
  **product** (`.md`/`.txt` files in the working directory).
- **Chunk kind** — the label on an indexed/retrieved piece: `memory`,
  `memory_private`, `job_input`, `job_output`, `transcript`, `persona`,
  `project_file`, and oeuvre scratchpads.
- **project_file** — an indexed prose file from the product tree (your docs), as
  opposed to the council's own machine state. This is how a council can retrieve
  over the documents it's writing.

## Round-tables (meetings)

- **Meeting** — a synchronous round-table where the director participates every
  round. The director picks a chair, a topic, and attendees. While it runs, it
  holds the busy-slot for every attendee.
- **Round** — one full pass of a meeting: the director speaks (or skips), then
  each attendee speaks once, in randomized order.
- **Turn (meeting)** — one councillor speaking once within a round.
- **Chair** — the councillor who writes the meeting's rolling **summary** and its
  closing **synthesis**. The synthesis is scanned for `<<MEMORY>>`/`<<JOB>>`.
- **Host** — the council that convenes and owns a cross-council meeting.
- **Peer** — another Landsraad council running on the same machine.
- **Remote attendee** — a councillor on a peer, summoned for a turn over a
  loopback-only local HTTP API. Cross-machine summons are refused.

## Work loops (oeuvres)

- **Oeuvre** — an asynchronous, goal-driven **work loop** that produces an
  artifact. A leader orchestrates while participants take turns on a shared
  scratchpad and vote. It concludes when every in-pool participant's *latest* vote
  is `finish` against the current scratchpad version (or on a budget, or when the
  director stops it). Where a meeting is synchronous talk, an oeuvre is async work
  that leaves a deliverable. One active oeuvre per council.
- **Leader** — the councillor that orchestrates an oeuvre: reads the state,
  optionally comments, and picks who goes next. The leader **never** takes a turn,
  never picks itself, and never votes.
- **Participant** — a non-leader councillor who takes turns and votes.
- **Turn (oeuvre)** — one participant taking the baton: revise the scratchpad and
  cast a vote. Each oeuvre turn is a real **job** under the hood (with reflection
  suppressed).
- **Scratchpad** — the shared, evolving artifact — the "baton". A *substantive*
  edit (non-empty and actually different from the current text) bumps
  `scratchpad_version` and invalidates everyone's standing `finish` votes.
- **Vote** — `finish` or `continue`, cast against the current scratchpad version.
  A garbled or missing vote safely defaults to `continue`, so a broken turn can
  never spuriously end the loop.
- **Pool / out** — the set of participants still in routing and the vote tally. A
  participant whose turns keep failing is dropped **out** of the pool, so a broken
  adapter can't deadlock the loop.
- **Consolidation** — the leader-authored closing pass that distills the finished
  scratchpad + work log into memories (and optional `<<JOB>>` proposals).
- **Turn (the gotcha)** — "turn" is *always* a structured contribution inside a
  meeting round or an oeuvre loop. It is **never** a chat message or a
  free-running session. (Don't say "cycle" loosely for this.)

## Packaging & testing

- **Template** — a reusable, shareable council definition (`*.template.json`):
  councillor roles, personas, and optional seed memory/jobs/env. Never contains
  secrets or PII.
- **Dogfood council** — the built-in test council (`npm run dogfood:init`) of
  `mock:local` councillors, for exercising Landsraad without spending real-CLI
  tokens.

=== END FILE: docs/GLOSSARY.md ===

---

=== FILE: docs/TAGS.md ===

# Agent tags

Councillors talk to the host by writing **fenced control blocks** in their
output — `<<TAG …>> … <</TAG>>`. The host scans the output, recognizes the block,
and acts on it. This page is the reference for emitting one correctly and decoding
one you find in a transcript.

**Ground rules (true for every tag):**
- Parsing is **whitespace-tolerant** — leading indentation and trailing prose
  around a block are fine.
- **Unknown tags are ignored.** Emitting a tag the host doesn't recognize does
  nothing; it never errors. (This is deliberate, for forward-compatibility.)
- Malformed control tags **fail safe** — e.g. a garbled `<<VOTE>>` is read as
  `continue`, never as an accidental "finish".

## Where each tag is recognized

A tag only does something at the **scan site** that looks for it. The same block
in the wrong place is just text.

| Tag | Emitted by | Acted on in |
|---|---|---|
| `<<MEMORY>>` | any councillor | reflection output · meeting synthesis · oeuvre consolidation |
| `<<JOB>>` | any councillor | reflection output · meeting synthesis · oeuvre consolidation |
| `<<NEXT>>` | oeuvre **leader** | the leader-pick call |
| `<<SCRATCHPAD>>` | oeuvre **participant** | a worker turn |
| `<<VOTE>>` | oeuvre **participant** | a worker turn |

Two more tags appear in design notes but are **not implemented** — don't emit
them expecting an effect: `<<SCHEDULE …>>` (a proposed future reflection tag for
schedule proposals) and `<<PROMOTE …>>` (a candidate form for promoting private
memory to shared; today, use `scope="shared"` on `<<MEMORY>>` instead).

## The reflection tags

These are emitted in a councillor's reflection (and scanned in meeting syntheses
and oeuvre consolidations too).

### `<<MEMORY>>` — write a note

```
<<MEMORY title="What I learned" scope="shared">>
body markdown
<</MEMORY>>
```

- **Applied directly** — it writes a memory note, no review step.
- Default target is the emitting councillor's **private** memory. Add
  `scope="shared"` to write to **council-wide** memory instead.
- `title` is required. Title collisions get a `-2`, `-3`, … suffix.
- One reflection pass may emit several blocks, mixing private and shared.

### `<<JOB>>` — propose work

```
<<JOB title="Draft the README" councillor="shaddam" priority="normal">>
brief markdown — what you want done
<</JOB>>
```

- Lands as a **proposal**, *not* a running job. The director approves or rejects
  it at `/proposals`; only on approval does it become a real queued job. (This
  review gate is what stops agents from spawning each other unboundedly.)
- `title` is required. The block body becomes the new job's brief.
- `councillor` (optional) should be a real roster slug; an unknown slug is flagged
  in the review UI for reassignment. Omit it to leave assignment to the director.
- `priority` (optional) is advisory.

## The oeuvre tags

These drive a work loop. They're only meaningful inside an oeuvre — `<<NEXT>>`
from the leader, `<<SCRATCHPAD>>` and `<<VOTE>>` from the participant taking a
turn.

### `<<NEXT>>` — leader picks who goes next (leader only)

```
<<NEXT councillor="fenring" say="focus on the parser section">>
```

- **Self-closing** — there is no `<</NEXT>>`. The host reads the first `<<NEXT>>`
  in the leader's output.
- `councillor` must name an **in-pool participant other than the leader**. A pick
  that is missing, names the leader, names a non-participant, or names an *out*
  councillor is **invalid**.
- An invalid pick (or a failed/timed-out leader call) counts as a leader failure:
  the runner re-asks on the next tick, and only **pauses** the oeuvre
  (`leader_unavailable`) after enough consecutive failures (the policy's
  `max_consecutive_failures`). It does not pause on the first miss.
- `say` (optional) is a one-line steer passed to the chosen participant.

### `<<SCRATCHPAD>>` — revise the shared artifact (participant)

```
<<SCRATCHPAD>>
...the full updated scratchpad markdown...
<</SCRATCHPAD>>
```

- **Paired** — the host takes everything between `<<SCRATCHPAD>>` and
  `<</SCRATCHPAD>>` as the *entire* new scratchpad (a single leading newline and
  trailing whitespace are trimmed). Return the **full** document, not a diff.
- Omitting the block entirely means "no change this turn".
- An edit counts as **substantive** only if it's non-empty *and* actually differs
  from the current scratchpad. A substantive edit bumps `scratchpad_version` and
  invalidates everyone's standing `finish` votes — so real progress restarts the
  convergence clock.

### `<<VOTE>>` — sign off, or ask to keep going (participant)

```
<<VOTE value="finish" reason="glossary and tags both read cleanly">>
```

- **Self-closing form** above, or a **paired form** whose body is the reason:
  ```
  <<VOTE value="continue">>
  still need a voice pass on the empty-state copy
  <</VOTE>>
  ```
  When both are present, the body wins over the `reason` attribute.
- `value` is `finish` or `continue`. **Anything else — including a missing or
  malformed vote — is read as `continue`.** The loop can only conclude when every
  in-pool participant's *latest* vote is `finish` at the current scratchpad
  version, so this fail-safe means a garbled turn never ends the work early.
- `reason` is a one-line explanation; it shows up in the oeuvre's vote ledger.

=== END FILE: docs/TAGS.md ===

---

## §Drafting log (strip before shipping; not part of either file)

**Verified this turn (turn 2, shaddam):**
- `<<NEXT>>` is self-closing, attrs `councillor`/`say`; invalid-pick path in
  `oeuvre-runner.ts:338-349` increments `leader_failures`, re-asks next tick,
  pauses `leader_unavailable` only at `max_consecutive_failures`. (Corrected v1's
  "re-ask once then pause".)
- `<<VOTE>>` self-closing or paired; body wins over `reason` attr; non-`finish`
  ⇒ `continue` (`oeuvre-blocks.ts:52-62`). Fail-safe confirmed.
- `<<SCRATCHPAD>>` paired; substantive edit = non-empty AND ≠ current
  (`oeuvre-runner.ts:383`) ⇒ version bump.
- `<<PROMOTE>>` and `<<SCHEDULE>>` are both unimplemented design candidates
  (grep: only in `docs/superpowers/plans|specs`). Added to "not implemented" row.
- `<<MEMORY>>`/`<<JOB>>` form & semantics per SPEC §Agent Proposals.

**Open for reviewers:**
- Should the "machine vs product" `.landsraad/` framing be a glossary *entry* or
  stay as the preamble blockquote? Currently preamble — reads better for newcomers.
- Dropped from GLOSSARY as reference-only (not agent-facing): `gzip_density`,
  `window_k`, env-var names, `LANDSRAAD_MEETING_MODEL`. Flag if any belong.
- `AGENTS.md` / "council guide" is planned, not shipped — intentionally omitted.
- Next turn: voice/empty-state polish pass + write the two files to disk, then
  votes can converge.
<</SCRATCHPAD>>

<<VOTE value="continue" reason="both files now complete and source-verified, but they still need a voice pass and to be split onto disk before the goal is actually met">>

The content for both files is now complete and checked against the spec and the actual parsers (I corrected two wrong claims from v1 and added the missing `<<PROMOTE>>`/`<<SCHEDULE>>` unimplemented tags). I voted `continue` because the goal — files existing in `docs/` — isn't met until a closing turn writes them to disk; the scratchpad is ready for that.
