# Oeuvre — Design

Status: spec / v0. Adds a new "oeuvre" surface: a goal-driven, leader-orchestrated work loop where councillors take turns advancing a shared scratchpad until they converge (by vote) or a budget is hit. References the canonical product spec at `SPECIFICATION.md`.

---

## Summary

An **oeuvre** is a continual, goal-directed work loop. The director sets a goal, writes an optional steering note, and picks one councillor to **lead**. Each cycle the leader reads the current state and picks who takes the next turn (adding its own guidance); the chosen councillor revises a shared **scratchpad** and casts a **vote** on whether the goal is achieved. The loop ends when every councillor's latest vote is `finish` against the current scratchpad version (the leader, who also votes, seals it), or when a turn/time budget is exceeded, or when the director stops it. On conclusion a **consolidation pass** distills the scratchpad + transcript into memories (and optional follow-up job proposals) via the existing reflection plumbing.

Where a **meeting** is a synchronous round-table that blocks on the director each round and produces talk, an **oeuvre** is an asynchronous work loop that the director steers from the side and that produces an artifact (the scratchpad) plus memories.

---

## Design Decisions (from brainstorm)

| # | Decision | Source |
|---|---|---|
| 1 | Director sets a goal, an optional editable note, and picks one **leader** councillor | brainstorm |
| 2 | Routing = **leader call per turn**: the leader reads state, picks the next councillor, and adds its 2¢, then that councillor runs (~2 adapter calls / cycle) | Q-routing = "Leader call per turn" |
| 3 | Termination = **rolling latest-vote**: track each councillor's most recent vote; conclude when all latest votes are `finish` against the current scratchpad version | Q-termination = "Rolling latest-vote" |
| 4 | A finish vote is only valid against the scratchpad version it was cast on; a substantive scratchpad edit invalidates other councillors' standing finish votes (editing and voting are decoupled) | brainstorm (staleness fix) |
| 5 | A `continue` vote carries a `reason`; that reason is what the leader routes on next | brainstorm |
| 6 | Also concludes on **budget** (`max_turns`, `max_wall_ms`) or director **stop** | brainstorm |
| 7 | The director's **note** is a single live-editable field, picked up at the top of each call | brainstorm |
| 8 | On conclusion, a **consolidation pass** runs the scratchpad + transcript through the existing `<<MEMORY>>` / `<<JOB>>` reflection plumbing | brainstorm |
| 9 | Each turn is a real **job** under the hood (full `input`/`transcript`/`output` artifacts, busy-slot lock) | brainstorm |
| 10 | v0 allows **one active oeuvre** at a time per council (concurrency deferred) | brainstorm |
| 11 | Token budget is **best-effort/estimated** (CLI subprocess adapters don't reliably report tokens); turn-count + wall-clock are the hard caps | brainstorm |

---

## Architecture

### Module layout

```
src/lib/server/
  oeuvres.ts          # CRUD + filesystem layout for oeuvres/
  oeuvre-runner.ts    # leader→worker cycle, vote tracking, conclusion, consolidation
  oeuvre-prompt.ts    # pure prompt composers (leader-pick prompt, worker-turn prompt)
  oeuvre-blocks.ts    # parse <<NEXT>> / <<VOTE>> fenced blocks (sibling to reflection block parser)
  councillor-lock.ts  # shared busy-slot lock (extracted for meetings; oeuvre reuses it)
  adapters/runAdapter.ts  # shared adapter-spawn helper (extracted for meetings; oeuvre reuses it)
  reflection.ts       # existing <<MEMORY>>/<<JOB>> apply step, reused for consolidation
```

The oeuvre runner depends on the same two primitives meetings extracted — `councillor-lock.ts` and `adapters/runAdapter.ts`. If meetings shipped first, these already exist; otherwise extract them here.

### Each turn is a job

A worker turn is created and run through the **existing job path** (`createJob` + `startJobInBackground`), so it inherits `input.md` / `transcript.md` / `output.md` / `events.jsonl`, the one-running-job-per-councillor lock, and timeouts. The oeuvre runner supplies the assembled brief and tags the job with `oeuvre_id` + `turn_idx` so the UI can link a turn back to its job. **Per-turn jobs do not run their own reflection pass** (reflection is opt-out via the job's councillor `reflect` flag; the runner suppresses it for oeuvre turns and runs one consolidation pass at the end instead — see below).

The **leader-pick** call is a lighter adapter call (it only emits a `<<NEXT>>` block + short guidance, not a scratchpad edit). It is run through `runAdapter` directly rather than as a full job, to avoid littering `jobs/` with routing-only artifacts; its output is logged to the oeuvre's `events.jsonl` and `turns.jsonl`.

### Tick model

The existing scheduler tick (30s) pokes `oeuvreRunner.advance(oeuvreId)` for the active oeuvre. Plus event-driven advance: a worker turn finishing immediately schedules the next cycle (no 30s wait between turns). `advance()` is idempotent and a no-op when a cycle is already in flight or the oeuvre is `paused | concluded | cancelled | failed`.

---

## Data model

### `oeuvres/<oeuvre-id>/oeuvre.json`

```ts
type OeuvreStatus =
  | 'active'         // loop running (a leader-pick or worker turn may be in flight)
  | 'paused'         // director paused, or circuit-breaker tripped; resumable
  | 'concluding'     // consolidation pass in flight
  | 'concluded'      // consolidation written, locks released
  | 'cancelled'      // director cancelled; no consolidation
  | 'failed';        // crashed while active/concluding

interface OeuvrePolicy {
  max_turns: number;          // hard cap on worker turns; default from config
  max_wall_ms: number;        // hard cap on wall-clock since start; default from config
  token_est_cap?: number;     // best-effort estimated-token ceiling; advisory
  max_consecutive_failures: number; // circuit-breaker; default 3
}

interface Oeuvre {
  id: string;                 // <UTC-ts>-<title-slug>
  title: string;
  goal: string;               // the objective (immutable after creation)
  leader_slug: string;        // the orchestrating councillor
  participants: string[];     // councillor slugs eligible to take turns (leader included)
  status: OeuvreStatus;
  policy: OeuvrePolicy;
  scratchpad_version: number; // bumped on every substantive scratchpad edit
  total_turns: number;        // worker turns taken
  started_at: string;
  concluded_at?: string;
  pause_reason?: string;      // e.g. "circuit_breaker: leto-cli failed 3x"
  consecutive_failures: number;
  est_tokens: number;         // running best-effort estimate
  memory_slugs?: string[];        // private memories from consolidation
  shared_memory_slugs?: string[]; // shared memories from consolidation
  proposed_jobs?: string[];       // proposal filenames from consolidation
}
```

### `oeuvres/<oeuvre-id>/votes.json`

The rolling latest-vote ledger — one entry per councillor, overwritten each time they vote:

```ts
interface Vote {
  value: 'finish' | 'continue';
  reason: string;             // why; a `continue` reason drives the next leader pick
  scratchpad_version: number; // the version this vote was cast against
  turn_idx: number;
  ts: string;
}

type Votes = Record<string /* councillor_slug */, Vote>;
```

**Freshness rule.** A `finish` vote counts toward conclusion only if `vote.scratchpad_version === oeuvre.scratchpad_version`. Any substantive scratchpad edit bumps `scratchpad_version`, which invalidates all standing `finish` votes cast against the older version (they don't change on disk, but they no longer count). Conclusion requires **every participant's latest vote to be `finish` at the current version**.

### Files in `oeuvres/<oeuvre-id>/`

```
oeuvre.json
note.md          # director's live steering note; editable any time; read at top of each call
scratchpad.md    # the baton — current best artifact; revised by worker turns
votes.json       # rolling latest-vote ledger
turns.jsonl      # append-only: one line per leader-pick and per worker turn
events.jsonl     # state-transition + progress log
```

`turns.jsonl` line shapes:

```json
{ "kind": "leader_pick", "leader": "atreides", "picked": "leto-cli", "note": "tighten the cost model", "ts": "..." }
{ "kind": "turn", "councillor": "leto-cli", "turn_idx": 7, "job_id": "2026-...-oeuvre-...-t7", "edited": true, "scratchpad_version": 8, "vote": "continue", "reason": "pricing section still hand-wavy", "ts": "..." }
```

### Per-call prompt assembly (in-memory, via `oeuvre-prompt.ts`)

**Leader-pick prompt** (leader councillor):

```
[persona: leader]
[roster header]            # so the leader knows who's available + routing hints
[shared memory top-K]
[private memory top-K: leader]
---
OEUVRE: <title>
GOAL: <goal>
DIRECTOR NOTE: <note.md>          # may be empty

CURRENT SCRATCHPAD (v<version>):
<scratchpad.md>

LATEST VOTES:
<one line per participant: slug → value (vN) — reason>

You are the leader. Choose who advances the work next and tell them what to focus on.
Emit exactly one:  <<NEXT councillor="<slug>" note="...">>
```

**Worker-turn prompt** (the picked councillor):

```
[persona: worker]
[roster header]
[shared memory top-K]
[private memory top-K: worker]
---
OEUVRE: <title>
GOAL: <goal>
DIRECTOR NOTE: <note.md>
LEADER GUIDANCE: <leader's <<NEXT>> note>

CURRENT SCRATCHPAD (v<version>):
<scratchpad.md>

Revise the scratchpad to advance the goal (return the full updated scratchpad), OR
ratify it as-is if you believe the goal is met. Then vote.
Emit your scratchpad edit between <<SCRATCHPAD>> … <</SCRATCHPAD>> (omit to make no edit).
Emit exactly one:  <<VOTE value="finish|continue" reason="...">>
```

Memory retrieval reuses the existing `MEMORY_TOPK_*` / `MEMORY_CHAR_BUDGET` config; the query is `goal + note + last scratchpad diff` concatenated.

### New fenced blocks (`oeuvre-blocks.ts`)

Parsed with the same whitespace-tolerant, unknown-tag-ignoring discipline as the reflection parser:

```
<<NEXT councillor="leto-cli" note="tighten the cost model">>

<<SCRATCHPAD>>
...full updated scratchpad markdown...
<</SCRATCHPAD>>

<<VOTE value="continue" reason="pricing section still hand-wavy">>
```

- **`<<NEXT>>`** — leader only. `councillor` must be a participant slug; an unknown/missing slug pauses the oeuvre (`pause_reason="bad_pick:<slug>"`) for director correction.
- **`<<SCRATCHPAD>>`** — worker only. Present + non-empty + differs from current ⇒ **substantive edit**: overwrite `scratchpad.md`, bump `scratchpad_version`. Absent or byte-identical ⇒ no edit (a ratification turn), version unchanged.
- **`<<VOTE>>`** — worker only. Missing/invalid vote ⇒ treated as `continue` with `reason="(no vote emitted)"` so a malformed turn can never spuriously conclude the loop.

The leader's own opinion of doneness is expressed by *which councillor it picks and what it says*; the leader also gets a vote like everyone else — its vote is recorded the next time the leader is picked to take a worker turn, OR via a dedicated leader ratification turn the runner triggers once all non-leader latest votes are `finish` (see lifecycle). This guarantees "the leader votes after the others finish."

---

## Lifecycle

### State diagram

```
        create
           │
           ▼
        active ──────────────► concluding ──► concluded
        │  ▲                      ▲    │
        │  │ resume               │    │ failure
        │  │                      │    ▼
        ▼  │                      │  failed
      paused                      │
        │                         │ (all latest votes finish @ current version)
        │ director "conclude now" ┘
        │
        ▼
   * Any state → cancelled via director "cancel"
     (abort in-flight turn, release locks, no consolidation).
   * Server restart: active|paused|concluding → failed, locks released.
```

### Transitions

- **create → active**: director submits `/oeuvres/new` (title, goal, leader, participants, optional note, policy). Reject creation if another oeuvre is already non-terminal (v0: one active oeuvre). Try to acquire the lock for the leader before the first leader-pick; participant locks are acquired per-turn (not all up front — unlike meetings — because only one councillor works at a time). `scratchpad.md` seeds empty (or from the director note if provided as a starting draft). Status → `active`; immediately `advance()`.

- **active cycle** (`advance()`):
  1. If a leader-pick or worker turn is already in flight → no-op.
  2. **Budget check** — if `total_turns >= max_turns` or `now - started_at >= max_wall_ms` → status → `concluding`, emit `budget_exceeded`. (`est_tokens >= token_est_cap` emits an advisory `token_cap_warning` event but does **not** force conclusion in v0.)
  3. **Conclusion check** — if every participant has a latest vote of `finish` at the current `scratchpad_version` → status → `concluding`, emit `converged`.
  4. **Leader ratification** — if every *non-leader* participant's latest vote is `finish` at the current version but the leader's is not, the runner forces a **leader worker-turn** next (the leader reviews and either ratifies → vote `finish` → converges, or edits → bumps version → reopens). This is the "leader votes last" mechanic.
  5. Otherwise run a **leader-pick** adapter call. Parse `<<NEXT>>`. Log `leader_pick`. On bad pick → `paused`.
  6. Create + run the **worker turn** as a job for the picked councillor (acquire its lock; if somehow held, retry next tick). On the job reaching `succeeded`: parse `<<SCRATCHPAD>>` + `<<VOTE>>`, apply scratchpad edit (maybe bump version), upsert the councillor's vote in `votes.json`, append `turns.jsonl`, `total_turns++`, add to `est_tokens`, reset `consecutive_failures` to 0, release lock, emit `turn_finished`, then immediately `advance()`.
  7. On worker-turn job `failed`/timeout: `consecutive_failures++`. If `>= max_consecutive_failures` → `paused` (`pause_reason="circuit_breaker:<slug>"`). Else emit `turn_failed` and `advance()` again (leader may route around the failing councillor).

- **active → paused**: director clicks "Pause", or a bad pick / circuit-breaker trips. In-flight turn is allowed to finish (or is abortable via cancel). Locks for the (now idle) loop are released. Resume returns to `active` and `advance()`s.

- **active|paused → concluding** ("Conclude now" or convergence or budget): see consolidation below.

- **concluding → concluded**: consolidation pass completes (or fails non-fatally — see below). Release any held lock. Emit `concluded`.

- **cancel**: status → `cancelled`. Abort an in-flight turn via the same `AbortController` path job-cancel uses (SIGTERM → SIGKILL in `runAdapter`). Release locks. No consolidation.

- **Server restart**: any `active | paused | concluding` oeuvre on boot → `failed` with `pause_reason="crashed_during=<status>"`. Locks reset on a fresh map. Same policy as orphaned jobs/meetings (no auto-resume in v0).

### Consolidation

On entry to `concluding`, the runner makes one adapter call to the **leader** (the natural author/owner of the body of work):

```
[persona: leader]
[roster header]
---
OEUVRE: <title>
GOAL: <goal>

FINAL SCRATCHPAD:
<scratchpad.md>

WORK LOG (turn summaries):
<compact list from turns.jsonl: who edited what, vote reasons>

Distill durable lessons and outcomes. Emit zero or more <<MEMORY>> blocks
(scope="shared" for council-wide knowledge) and zero or more <<JOB>> blocks
for follow-up work.
```

The output is run through the **existing** `applyReflectionBlocks` helper with `sourceKind: 'oeuvre'`, `sourceCouncilorSlug = leader_slug`, `sourceId = oeuvre.id`. Created memories carry `created_by: "oeuvre:<id>"`; proposals carry `source: { kind: "oeuvre", id: "<id>" }`. Consolidation failure is **non-fatal** (mirrors reflection): log `consolidation_failed`, still reach `concluded`. Time-bounded by `OEUVRE_CONSOLIDATE_TIMEOUT_MS`.

---

## Memory index integration

Oeuvre artifacts are embedded so future jobs can semantically retrieve from them. New chunk kinds (extends `docs/embeddings.md`):

| Kind | One chunk per | Logical key | `councillor_slug` | `title` |
|---|---|---|---|---|
| `oeuvre_goal` | oeuvre | `oeuvre_goal/<id>#0` | `null` | oeuvre title |
| `oeuvre_scratchpad` | oeuvre (final) | `oeuvre_scratchpad/<id>#0` | `leader_slug` | `<title> · scratchpad` |

The per-turn jobs are already embedded as `job_input` / `job_output` / `transcript` by the existing job hooks, so turn-level content is searchable without new kinds. Embed triggers:

| Source | Hook | Action |
|---|---|---|
| `createOeuvre` | after `oeuvre.json` write | upsert `oeuvre_goal/<id>#0` from `goal` |
| substantive scratchpad edit | after `scratchpad.md` write | upsert `oeuvre_scratchpad/<id>#0` (overwrite) |
| consolidation `<<MEMORY>>` | (existing) | memory note embedded by existing memory hooks |

`npm run reindex` extends its walk to `<council>/oeuvres/*/{ goal (from oeuvre.json), scratchpad.md }`. Idempotent.

---

## Config

Add to `src/lib/server/config.ts`:

```ts
OEUVRE_MAX_TURNS_DEFAULT: number       // env LANDSRAAD_OEUVRE_MAX_TURNS, default 30
OEUVRE_MAX_WALL_MS_DEFAULT: number     // env LANDSRAAD_OEUVRE_MAX_WALL_MS, default 3_600_000 (1h)
OEUVRE_MAX_CONSEC_FAILURES: number     // env LANDSRAAD_OEUVRE_MAX_CONSEC_FAILURES, default 3
OEUVRE_TURN_TIMEOUT_MS: number         // env LANDSRAAD_OEUVRE_TURN_TIMEOUT_MS, default 300_000
OEUVRE_LEADER_PICK_TIMEOUT_MS: number  // env LANDSRAAD_OEUVRE_LEADER_PICK_TIMEOUT_MS, default 120_000
OEUVRE_CONSOLIDATE_TIMEOUT_MS: number  // env LANDSRAAD_OEUVRE_CONSOLIDATE_TIMEOUT_MS, default 120_000
```

`LANDSRAAD_MEETING_MODEL` has a sibling here: a leader-pick call is routing-only and cheap, so it should honor the councillor's `?model=` pin and a future `LANDSRAAD_OEUVRE_PICK_MODEL` host override (deferred — v0 uses each councillor's default model for all calls).

---

## UI surfaces

### Routes

| Route | Purpose |
|---|---|
| `/oeuvres` | List oeuvres (active/paused on top, then concluded/cancelled/failed). Per-row: title, status badge, leader, turn count, vote tally (`n/m finish`), started_at. |
| `/oeuvres/new` | Form: title, goal (textarea), leader (select), participants (checkbox list — all checked by default, leader always checked + disabled), note (optional textarea → `note.md`), policy (`max_turns`, `max_wall_ms`, advisory `token_est_cap`). |
| `/oeuvres/[id]` | Live view. Auto-refresh while not in a terminal state. |

### Oeuvre detail layout

```
Header: title · status badge · leader · turn Y/max · vote tally (n/m finish @ vV)

Pause/budget banner (when paused or budget-exceeded)

Director controls:
  active   → [Pause]  [Conclude now]  [Cancel]
  paused   → [Resume] [Conclude now]  [Cancel]
  others   → (none)

Section: Goal (rendered, immutable)

Section: Director note
  editable textarea + [Save]   # save any time; picked up at top of next call

Section: Scratchpad (rendered scratchpad.md, with "v<version>" badge)

Section: Votes
  per-participant: slug · finish/continue chip · "(stale)" if cast against older version · reason

Section: Consolidation (only when concluded)
  Created memories: <links>   Proposed jobs: <links to /proposals>

Section: Transcript (scrolling, newest at top)
  per turn: councillor chip + timestamp + edited/ratified marker + vote chip + link to the turn's job
  interleaved leader-pick rows: "leader → picked <slug>: <note>"
  while a turn is in flight: "Working: <slug>…" placeholder
```

### Home (`/`) + header
- Add an **Oeuvre** card on `/` showing the active oeuvre (title + turn count + vote tally) or "none active", linking to `/oeuvres`.
- A councillor card shows an "in oeuvre: `<title>`" pill while its lock is held by an oeuvre turn.
- Header hamburger menu gains an **Oeuvres** link (near Meetings).

---

## Testing strategy (red/green TDD)

- `oeuvre-blocks.test.ts` — parse `<<NEXT>>` / `<<SCRATCHPAD>>` / `<<VOTE>>`; whitespace tolerance; missing-vote → `continue` default; bad `<<NEXT>>` slug surfaced.
- `oeuvres.test.ts` — CRUD + filesystem layout + status persistence + one-active-oeuvre guard.
- `oeuvre-runner.test.ts` (uses `mock:local`):
  - happy path: leader picks worker, worker edits + votes continue, version bumps, another turn ratifies, all `finish` → `concluding` → `concluded`; `scratchpad.md` reflects last edit.
  - **staleness**: councillor A votes `finish` @ v3; councillor B edits → v4; A's finish no longer counts; loop continues until A re-ratifies @ v4.
  - leader ratification: all non-leader votes `finish`; runner forces a leader worker-turn; leader ratifies → converges (leader votes last).
  - budget: `max_turns=2` → conclude after 2 worker turns regardless of votes.
  - wall-clock budget: stubbed clock past `max_wall_ms` → conclude.
  - circuit-breaker: worker exits non-zero `max_consecutive_failures` times → `paused` with reason; resume retries.
  - bad pick: leader emits `<<NEXT councillor="ghost">>` → `paused`.
  - director note hot-edit: edit `note.md` between turns → next assembled prompt contains the new text.
  - conclude-now from active and from paused → consolidation runs over partial scratchpad.
  - consolidation emits `<<MEMORY scope="shared">>` → council `memory/`; `<<JOB>>` → `proposals/jobs/`; consolidation failure is non-fatal (still `concluded`).
  - cancel mid-turn: abort path triggers, locks released, no consolidation.
- `oeuvre-server-restart.test.ts` — orphaned non-terminal oeuvre on boot → `failed`, locks released.
- `oeuvre-index.test.ts` — `createOeuvre` upserts `oeuvre_goal`; substantive edit upserts `oeuvre_scratchpad`; reindex walks `oeuvres/`.
- Route tests for `/oeuvres/new` (create + one-active guard) and `/oeuvres/[id]` (pause/resume/conclude/cancel/save-note actions).

---

## Spec updates

Adds a new **Oeuvre** section to `SPECIFICATION.md` under Core Concepts (after **Meeting**), an `oeuvres/<oeuvre-id>/...` block to the Storage Model, three routes to the UI Surfaces table, and an "Oeuvres" item to v1 Functionality. Updates the status line to include `oeuvre`.

---

## Out of scope (deferred)

- More than one concurrent oeuvre per council (and contention policy when two oeuvres want the same councillor).
- Smarter routing modes (relay nomination; blackboard/bid; phase state-machine).
- Hard token-budget enforcement (needs adapter-reported token counts; v0 is estimate-only/advisory).
- Per-oeuvre persona overrides / role-directives distinct from the councillor persona.
- Leader-can-conclude-unilaterally mode (v0 requires unanimous latest-vote finish).
- A stronger "interject now / redirect" lever distinct from editing the note.
- `<<SCHEDULE>>`-style recurring oeuvres, or schedules that fire oeuvres.
- Oeuvre export in council templates.
- Cross-council oeuvres (remote participants).
- A `kinds: ['oeuvre_scratchpad', ...]` retrieval filter for "canonical artifacts only".

## Open questions (deferred)

- Should a participant's stale `finish` vote auto-downgrade to `continue`, or just stop counting (current design: stop counting, keep the row for display)?
- Should the leader's leader-pick call and a leader worker-turn be merged when the leader picks itself (avoid a double call)?
- Token estimation method for CLI adapters — whitespace-token count of prompt+output, or skip entirely until an SDK adapter gives real counts?
- Should `note.md` edits be versioned/logged (audit of director steering) or just last-write-wins (current design)?
- Convergence thrash: a lone dissenter repeatedly re-opening the scratchpad — cap re-opens, or trust the budget to end it?
