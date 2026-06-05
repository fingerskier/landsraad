# Oeuvre — Design

Status: spec / v0. Adds a new "oeuvre" surface: a goal-driven, leader-orchestrated work loop where councillors take turns advancing a shared scratchpad until they converge (by vote) or a budget is hit. References the canonical product spec at `SPECIFICATION.md`.

---

## Summary

An **oeuvre** is a continual, goal-directed work loop. The director sets a goal, writes an optional steering note, and picks one councillor to **lead**. Each cycle the leader reads the current state, optionally says its piece, and picks which **participant** (a non-leader councillor) takes the next turn; the chosen councillor revises a shared **scratchpad** and casts a **vote** on whether the goal is achieved. The loop ends when every *in-pool* participant's latest vote is `finish` against the current scratchpad version, or a turn/time/size budget is exceeded, or the director stops it. On conclusion a **consolidation pass** (authored by the leader) distills the scratchpad + work log into memories and optional follow-up job proposals via the existing reflection plumbing.

Where a **meeting** is a synchronous round-table that blocks on the director each round and produces talk, an **oeuvre** is an asynchronous work loop that the director steers from the side and that produces an artifact (the scratchpad) plus memories.

---

## Design Decisions (from brainstorm)

| # | Decision | Source |
|---|---|---|
| 1 | Director sets a goal, an optional editable note, and picks one **leader** councillor | brainstorm |
| 2 | Routing = **leader call per turn**: the leader reads state, optionally comments, and picks the next participant, then that participant runs (~2 adapter calls / cycle) | Q-routing |
| 3 | The **leader never takes a worker turn and never picks itself**; it orchestrates and may comment every cycle. It is **not a voter** | answer 2 |
| 4 | Termination = **rolling latest-vote**: conclude when every *in-pool* participant's latest vote is `finish` against the current `scratchpad_version` | Q-termination |
| 5 | A substantive scratchpad edit bumps `scratchpad_version`, invalidating standing finish votes (editing and voting are decoupled) | brainstorm (staleness fix) |
| 6 | A **failed/errored turn removes that councillor from the vote pool** (counts as out, not a blocker) so a broken adapter can't deadlock the loop — 3 finish + 1 errored-out of 4 ⇒ concludes | answer 1 |
| 7 | A `continue` vote carries a `reason`; that reason is what the leader routes on next | brainstorm |
| 8 | Also concludes on **budget** — turn count, wall-clock, or cumulative **text size** (a real byte count, surfaced as "Text KB/MB", never called tokens) | answer 3 |
| 9 | No convergence-thrash cap; a lone re-opening dissenter is bounded by the budget ("trust the budget") | answer 4 |
| 10 | On conclusion, a **consolidation pass** runs the scratchpad + work log through the existing `<<MEMORY>>` / `<<JOB>>` reflection plumbing | brainstorm |
| 11 | Each worker turn is a real **job** under the hood (full artifacts, busy-slot lock) | brainstorm |
| 12 | v0 allows **one active oeuvre** at a time per council (concurrency deferred) | brainstorm |

---

## Architecture

### Reused primitives (already in the tree)

Meetings already extracted everything the oeuvre runner needs — no new shared plumbing required:

- `src/lib/server/adapters/runAdapter.ts` — `runAdapter(opts): Promise<RunAdapterResult>` (streams, timeout, abort).
- `src/lib/server/councillor-lock.ts` — `tryAcquire / release / current / listHeldBy`, `LockHolder` union. **Extend the union** with `{ kind: 'oeuvre'; id: string }`.
- `src/lib/server/reflection.ts` — `applyReflectionBlocks({ text, sourceCouncillorSlug, sourceKind, sourceId })`. **Extend `sourceKind`** to include `'oeuvre'`.
- `src/lib/server/jobs.ts` — `createJob` / `runJobNow` / `startJobInBackground` / artifact I/O.
- `src/lib/server/context.ts` + `roster.ts` — `assembleContextFor`, `buildRosterSection`.

### New modules

```
src/lib/server/
  oeuvres.ts          # CRUD + filesystem layout for oeuvres/
  oeuvre-blocks.ts    # parse <<NEXT>> / <<SCRATCHPAD>> / <<VOTE>> (pure)
  oeuvre-prompt.ts    # pure prompt composers (leader-pick, worker-turn, consolidation)
  oeuvre-runner.ts    # leader→worker cycle, vote/pool tracking, conclusion, consolidation
```

### Each worker turn is a job

A worker turn is created and run through the **existing job path** (`createJob` + `runJobNow`/`startJobInBackground`), inheriting `input.md` / `transcript.md` / `output.md` / `events.jsonl`, the one-running-job-per-councillor lock, and timeouts. The runner supplies the assembled brief and tags the job with `oeuvre_id` + `oeuvre_turn_idx` so the UI can link a turn back to its job. **Per-turn jobs suppress their own reflection pass** (the runner passes a `skipReflection` flag); the oeuvre runs one consolidation pass at the end instead.

The **leader-pick** call is a lighter routing-only adapter call run through `runAdapter` directly (not a full job, to avoid littering `jobs/`); its text is logged to the oeuvre's `events.jsonl` + `turns.jsonl`.

### Tick model

The scheduler's 30s `setInterval` gains a `tickOeuvres()` call (parallel to `tickMeetings()`) that pokes `advanceOeuvre(id)` for the active oeuvre. Plus event-driven advance: a worker turn finishing immediately calls `advance()` again (no 30s wait). `advance()` is idempotent and a no-op when a cycle is in flight or the oeuvre is terminal/paused.

---

## Data model

### `oeuvres/<oeuvre-id>/oeuvre.json`

```ts
type OeuvreStatus =
  | 'active'         // loop running (a leader-pick or worker turn may be in flight)
  | 'paused'         // director paused, leader unavailable, or crash-parked on restart; resumable
  | 'concluding'     // consolidation pass in flight
  | 'concluded'      // consolidation written, locks released
  | 'cancelled'      // director cancelled; no consolidation
  | 'failed';        // reserved terminal (crashes now park as `paused`, not `failed`)

interface OeuvrePolicy {
  max_turns: number;          // hard cap on worker turns
  max_wall_ms: number;        // hard cap on ACTIVE wall-clock (excludes paused/crashed downtime)
  max_text_bytes: number;     // hard cap on cumulative prompt+output bytes ("Text KB/MB")
  max_consecutive_failures: number; // per-councillor: trips → that councillor goes `out`
}

interface Oeuvre {
  id: string;                 // <UTC-ts>-<title-slug>
  title: string;
  goal: string;               // the objective (immutable after creation)
  leader_slug: string;        // orchestrator; never a worker, never a voter
  participants: string[];     // voting/working pool; MUST NOT include the leader
  status: OeuvreStatus;
  policy: OeuvrePolicy;
  scratchpad_version: number; // bumped on every substantive scratchpad edit
  total_turns: number;        // worker turns taken
  text_bytes: number;         // running cumulative prompt+output byte count
  leader_failures: number;    // consecutive leader-pick failures (→ pause)
  started_at: string;
  active_ms?: number;         // accumulated ACTIVE wall time (excludes paused spans)
  active_since?: string | null; // start of the current active span; null while paused
  concluded_at?: string;
  pause_reason?: string;
  memory_slugs?: string[];        // private memories from consolidation
  shared_memory_slugs?: string[]; // shared memories from consolidation
  proposed_jobs?: string[];       // proposal ids from consolidation
}
```

### `oeuvres/<oeuvre-id>/participants.json`

Per-participant state — vote ledger plus pool/health. One entry per participant slug, overwritten as the loop runs:

```ts
interface ParticipantState {
  vote: 'finish' | 'continue' | null; // null = hasn't spoken yet (blocks conclusion)
  reason: string;
  scratchpad_version: number;         // version this vote was cast against
  turn_idx: number;                   // last worker turn this councillor took
  failures: number;                   // consecutive failed turns
  out: boolean;                       // removed from routing + vote pool (decision 6)
  ts: string;
}

type Participants = Record<string /* councillor_slug */, ParticipantState>;
```

**Conclusion rule.** Let `pool = participants where !out`. Conclude (→ `concluding`, event `converged`) when `pool` is non-empty **and** every member has `vote === 'finish'` **and** `scratchpad_version === oeuvre.scratchpad_version`. A `null` vote (never spoke) blocks conclusion, so no participant is skipped on its way in. If `pool` becomes **empty** (all out) → `concluding` with event `pool_exhausted`.

**Freshness.** A `finish` vote only counts at the current version. A substantive edit bumps the version; stale finish votes simply stop counting (the row is kept for display, not downgraded on disk).

### Files in `oeuvres/<oeuvre-id>/`

```
oeuvre.json
note.md          # director's live steering note; editable any time; read at top of each call
scratchpad.md    # the baton — current best artifact; revised by worker turns
participants.json# per-participant vote + pool/health ledger
turns.jsonl      # append-only: one line per leader-pick and per worker turn
events.jsonl     # state-transition + progress log
```

`turns.jsonl` line shapes:

```json
{ "kind": "leader_pick", "leader": "atreides", "picked": "leto-cli", "say": "tighten the cost model", "ts": "..." }
{ "kind": "turn", "councillor": "leto-cli", "turn_idx": 7, "job_id": "2026-...-t7", "edited": true, "scratchpad_version": 8, "vote": "continue", "reason": "pricing still hand-wavy", "ts": "..." }
{ "kind": "turn_failed", "councillor": "leto-cli", "turn_idx": 7, "failures": 2, "out": false, "ts": "..." }
```

### Per-call prompt assembly (`oeuvre-prompt.ts`, pure)

**Leader-pick prompt** (leader councillor):

```
[persona: leader]              ← from assembleContextFor(leader, goal+note)
[roster header]                ← so the leader knows who's available
[shared memory top-K]
[private memory top-K: leader]
---
OEUVRE: <title>
GOAL: <goal>
DIRECTOR NOTE: <note.md>            # may be empty

CURRENT SCRATCHPAD (v<version>):
<scratchpad.md>

PARTICIPANTS & LATEST VOTES (you are NOT one of them; do not pick yourself):
<one line per in-pool participant: slug → vote (vN) — reason>   # out participants marked [out]

You lead. Optionally say a sentence to steer, then choose ONE participant to work next.
Emit exactly one:  <<NEXT councillor="<slug>" say="...">>
```

**Worker-turn prompt** (the picked participant):

```
[persona: worker]
[roster header]
[shared memory top-K]
[private memory top-K: worker]
---
OEUVRE: <title>
GOAL: <goal>
DIRECTOR NOTE: <note.md>
LEADER SAYS: <leader's say>

CURRENT SCRATCHPAD (v<version>):
<scratchpad.md>

Revise the scratchpad to advance the goal (return the FULL updated scratchpad), OR
ratify it unchanged if you believe the goal is met. Then vote.
Edit between  <<SCRATCHPAD>> … <</SCRATCHPAD>>  (omit to make no edit).
Emit exactly one:  <<VOTE value="finish|continue" reason="...">>
```

Memory retrieval reuses `assembleContextFor` (existing `MEMORY_TOPK_*` / `MEMORY_CHAR_BUDGET`); the query is `goal + note` (+ last scratchpad for the worker).

### New fenced blocks (`oeuvre-blocks.ts`)

Parsed with the same whitespace-tolerant, unknown-tag-ignoring discipline as the reflection parser:

- **`<<NEXT councillor="slug" say="...">>`** — leader only. `councillor` must be an **in-pool participant that is not the leader**; an unknown / out / self / missing slug ⇒ invalid pick (runner re-asks once, then pauses — see lifecycle). `say` is optional commentary.
- **`<<SCRATCHPAD>> … <</SCRATCHPAD>>`** — worker only. Present + non-empty + differs from current ⇒ **substantive edit** (overwrite `scratchpad.md`, bump `scratchpad_version`). Absent or byte-identical ⇒ no edit (ratification), version unchanged.
- **`<<VOTE value="finish|continue" reason="...">>`** — worker only. Missing / invalid ⇒ treated as `continue` with `reason="(no vote emitted)"`, so a malformed turn can never spuriously conclude the loop.

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
        ▼  │                      │    ▼
      paused                      │  failed
        │ director "conclude now" │
        └─────────────────────────┘
   * pool empty (all out) → concluding (pool_exhausted)
   * budget exceeded (turns | wall | text) → concluding (budget_exceeded)
   * convergence (all in-pool latest votes finish @ current version) → concluding (converged)
   * Any state → cancelled via director "cancel" (abort in-flight turn, release locks, no consolidation)
   * Server restart: active|concluding → paused (crash-parked, pause_reason=`crashed_during=<status>`, resumable); paused stays paused; locks released. The one in-flight worker turn is lost — its job is flipped to failed by job recovery, and the turn was never recorded, so Resume just re-picks.
```

### Transitions

- **create → active**: director submits `/oeuvres/new` (title, goal, leader, participants, optional note, policy). Reject creation if another oeuvre is non-terminal (v0 single-active), if the leader is in `participants`, or if `participants` is empty. Seed `scratchpad.md` empty; `participants.json` with every participant `{ vote: null, out: false, failures: 0, scratchpad_version: 0, turn_idx: -1 }`. Status → `active`; immediately `advance()`.

- **active cycle** (`advance()`), in order:
  1. If a leader-pick or worker turn is in flight → no-op.
  2. **Budget check** — `total_turns >= max_turns` OR `activeElapsedMs(o, now) >= max_wall_ms` (active wall time, excluding paused/crashed downtime) OR `text_bytes >= max_text_bytes` ⇒ `concluding`, event `budget_exceeded`.
  3. **Pool check** — if every participant is `out` ⇒ `concluding`, event `pool_exhausted`.
  4. **Conclusion check** — if every in-pool participant has `vote==='finish'` at the current `scratchpad_version` ⇒ `concluding`, event `converged`.
  5. Otherwise run a **leader-pick** call (`runAdapter`, `OEUVRE_LEADER_PICK_TIMEOUT_MS`). Parse `<<NEXT>>`:
     - valid pick → reset `leader_failures = 0`, log `leader_pick`, proceed to the worker turn.
     - invalid pick or leader-call failure → `leader_failures++`; if `>= max_consecutive_failures` ⇒ `paused` (`pause_reason="leader_unavailable"`); else `advance()` again (one re-ask).
  6. **Worker turn** — create a job for the picked councillor tagged `oeuvre_id`/`oeuvre_turn_idx`, `skipReflection: true`; acquire its lock (retry next tick if held); run via the job path with `OEUVRE_TURN_TIMEOUT_MS`.
     - **succeeded**: add prompt+output bytes to `text_bytes`. Parse `<<SCRATCHPAD>>` + `<<VOTE>>`. Apply edit (maybe bump version). Upsert this councillor's `ParticipantState` (vote, reason, scratchpad_version, turn_idx, `failures=0`). Append `turns.jsonl`, `total_turns++`, release lock, event `turn_finished`, then `advance()`.
     - **failed/timeout**: `participant.failures++`; if `>= max_consecutive_failures` ⇒ `out = true`, event `participant_out` (decision 6 — they leave the vote pool, loop continues). Else event `turn_failed`. Either way release lock and `advance()` (leader routes around them).

- **active → paused**: director "Pause", or `leader_unavailable`. In-flight turn finishes or is cancelled. Resume → `active`, `advance()`.

- **active|paused → concluding**: director "Conclude now", or convergence / budget / pool-exhausted. Run consolidation (below).

- **concluding → concluded**: consolidation completes (or fails non-fatally). Release locks. Event `concluded`.

- **cancel**: status → `cancelled`. Abort any in-flight turn (same `AbortController` path as job cancel). Release locks. No consolidation.

- **Server restart**: an `active|concluding` oeuvre on boot is **crash-parked** → `paused` (`pause_reason="crashed_during=<status>"`), locks reset, wall-clock folded up to the last recorded event so downtime doesn't burn the budget. A `paused` oeuvre stays paused. No *auto*-resume (a wedged adapter mustn't thrash on boot), but unlike jobs/meetings the durable scratchpad/votes/turns let the director **Resume** the loop from where it stopped. **Migration:** an oeuvre left `failed` by an earlier build's crash-recovery (the only producer of `failed`, always stamped `crashed_during=`) is healed back to `paused` on boot so it becomes resumable again.

### Consolidation

On entry to `concluding`, one `runAdapter` call to the **leader** (the owner of the body of work):

```
[persona: leader] [roster]
---
OEUVRE: <title>
GOAL: <goal>

FINAL SCRATCHPAD:
<scratchpad.md>

WORK LOG:
<compact list from turns.jsonl: who edited, vote reasons>

Distill durable lessons + outcomes. Emit zero or more <<MEMORY>> blocks
(scope="shared" for council-wide knowledge) and zero or more <<JOB>> blocks for follow-ups.
```

Run the output through `applyReflectionBlocks({ sourceKind: 'oeuvre', sourceCouncillorSlug: leader_slug, sourceId: id })`. Created memories carry `created_by: "oeuvre:<id>"`; proposals carry `source: { kind: "oeuvre", id }`. Failure is **non-fatal** (log `consolidation_failed`, still reach `concluded`). Time-bounded by `OEUVRE_CONSOLIDATE_TIMEOUT_MS`.

---

## Memory index integration

New chunk kinds (extends `docs/embeddings.md`):

| Kind | One chunk per | Logical key | `councillor_slug` | `title` |
|---|---|---|---|---|
| `oeuvre_goal` | oeuvre | `oeuvre_goal/<id>#0` | `null` | oeuvre title |
| `oeuvre_scratchpad` | oeuvre (current) | `oeuvre_scratchpad/<id>#0` | `leader_slug` | `<title> · scratchpad` |

Per-turn content is already searchable via the existing `job_input`/`job_output`/`transcript` hooks on the worker jobs — no new per-turn kind. Triggers: `createOeuvre` upserts `oeuvre_goal`; a substantive scratchpad edit upserts `oeuvre_scratchpad` (overwrite). `npm run reindex` extends its walk to `<council>/oeuvres/*/` (goal from `oeuvre.json`, `scratchpad.md`). Idempotent.

---

## Config

Add to `src/lib/server/config.ts` (env-backed, `envInt` pattern):

```ts
OEUVRE_MAX_TURNS_DEFAULT          // LANDSRAAD_OEUVRE_MAX_TURNS,          default 30
OEUVRE_MAX_WALL_MS_DEFAULT        // LANDSRAAD_OEUVRE_MAX_WALL_MS,        default 3_600_000 (1h)
OEUVRE_MAX_TEXT_BYTES_DEFAULT     // LANDSRAAD_OEUVRE_MAX_TEXT_BYTES,     default 2_000_000 (~2 MB)
OEUVRE_MAX_CONSEC_FAILURES        // LANDSRAAD_OEUVRE_MAX_CONSEC_FAILURES,default 3
OEUVRE_TURN_TIMEOUT_MS            // LANDSRAAD_OEUVRE_TURN_TIMEOUT_MS,    default 300_000
OEUVRE_LEADER_PICK_TIMEOUT_MS     // LANDSRAAD_OEUVRE_LEADER_PICK_TIMEOUT_MS, default 120_000
OEUVRE_CONSOLIDATE_TIMEOUT_MS     // LANDSRAAD_OEUVRE_CONSOLIDATE_TIMEOUT_MS, default 120_000
```

---

## UI surfaces

### Routes

| Route | Purpose |
|---|---|
| `/oeuvres` | List oeuvres (active/paused first, then concluded/cancelled/failed). Per-row: title, status badge, leader, turn count, vote tally (`n/m finish`, m = in-pool size), text size, started_at. |
| `/oeuvres/new` | Form: title, goal (textarea), leader (select), participants (checkbox list — leader excluded; ≥1 required), note (optional textarea → `note.md`), policy (`max_turns`, `max_wall_ms`, `max_text_bytes`). |
| `/oeuvres/[id]` | Live view. Auto-refresh while not terminal. |

### Oeuvre detail layout

```
Header: title · status badge · leader · turn Y/max · vote tally (n/m finish @ vV) · text KB/MB

Pause/budget banner (when paused or budget/pool-exhausted)

Director controls:
  active → [Pause] [Conclude now] [Cancel]
  paused → [Resume] [Conclude now] [Cancel]
  else   → (none)

Section: Goal (rendered, immutable)
Section: Director note — editable textarea + [Save] (picked up next call)
Section: Scratchpad — rendered scratchpad.md with "v<version>" badge
Section: Participants — per-participant: slug · finish/continue/— chip · "(stale)" if older version · "(out)" if dropped · reason
Section: Consolidation (when concluded) — created memories + proposed jobs links
Section: Transcript (scrolling, newest first) — per turn: councillor chip + ts + edited/ratified + vote chip + link to the turn's job; interleaved "leader → picked <slug>: <say>"; in-flight "Working: <slug>…"
```

### Home (`/`) + header
- An **Oeuvre** card on `/` showing the active oeuvre (title · turns · vote tally) or "none active".
- A councillor card shows an "in oeuvre: `<title>`" pill while its lock is held by an oeuvre turn.
- Header hamburger gains an **Oeuvres** link (near Meetings).

---

## Testing strategy (red/green TDD)

- `oeuvre-blocks.test.ts` — parse `<<NEXT>>` / `<<SCRATCHPAD>>` / `<<VOTE>>`; whitespace tolerance; missing vote → `continue` default; self/unknown/out `<<NEXT>>` flagged invalid.
- `oeuvres.test.ts` — CRUD + filesystem layout + status persistence; one-active guard; reject leader-in-participants and empty participants.
- `oeuvre-runner.test.ts` (uses `mock:local`, `_resetForTests()` on the lock in `beforeEach`):
  - happy path: leader picks worker, worker edits + votes continue (version bumps), another participant ratifies, all in-pool `finish` → `concluding` → `concluded`; scratchpad reflects last edit.
  - **staleness**: A votes finish @v3; B edits → v4; A's finish stops counting; loop continues until A re-ratifies @v4.
  - **error-out (decision 6)**: 4 participants; one fails `max_consecutive_failures` times → `out`; remaining 3 vote finish → concludes (the errored one doesn't block).
  - leader never self-picks: `<<NEXT councillor="<leader>">>` is invalid; re-ask then pause.
  - budgets: `max_turns=2` concludes after 2 turns; stubbed clock past `max_wall_ms` concludes; `max_text_bytes` tiny concludes.
  - pool exhausted: all participants out → `concluding` (pool_exhausted).
  - director note hot-edit: editing `note.md` between turns appears in the next assembled prompt.
  - conclude-now from active and paused → consolidation over partial scratchpad.
  - consolidation emits `<<MEMORY scope="shared">>` → council `memory/`; `<<JOB>>` → `proposals/jobs/`; consolidation failure non-fatal (still `concluded`).
  - cancel mid-turn: abort path, locks released, no consolidation.
- `oeuvre-runner.test.ts` (crash recovery) — orphaned `active|concluding` oeuvre on boot → crash-parked `paused` (resumable to completion); a director-`paused` oeuvre stays paused; wall-clock excludes paused/crashed downtime.
- `oeuvre-index.test.ts` — `createOeuvre` upserts `oeuvre_goal`; substantive edit upserts `oeuvre_scratchpad`; reindex walks `oeuvres/`.
- Route tests for `/oeuvres/new` (create + one-active guard + leader-in-participants rejection) and `/oeuvres/[id]` (pause/resume/conclude/cancel/save-note).

---

## Spec updates

Adds an **Oeuvre** section to `SPECIFICATION.md` Core Concepts (after **Meeting**), an `oeuvres/<oeuvre-id>/...` Storage block, three UI routes, a v1 Functionality item, and the status line.

---

## Out of scope (deferred)

- More than one concurrent oeuvre per council (and councillor-contention policy across oeuvres).
- Smarter routing modes (relay nomination; blackboard/bid; phase state-machine).
- Per-oeuvre persona overrides / role-directives distinct from the councillor persona.
- A stronger "interject now / redirect" lever distinct from editing the note.
- Recurring oeuvres, or schedules that fire oeuvres.
- Oeuvre export in council templates.
- Cross-council oeuvres (remote participants).
- A `kinds: ['oeuvre_scratchpad', ...]` retrieval filter for "canonical artifacts only".
- Auto-readmission of an `out` councillor after a cooldown.

## Open questions (resolved in this pass)

- ~~Stale finish auto-downgrade vs. stop counting~~ → **stop counting**, keep the row for display (decision 4/5).
- ~~Leader picking itself / leader ratification turn~~ → **leader never works or votes**; it comments + routes only (decision 3); no ratification turn.
- ~~Token estimation for CLI adapters~~ → **raw byte count of prompt+output**, surfaced as "Text KB/MB" (decision 8); never called tokens.
- ~~Convergence thrash cap~~ → **none; trust the budget** (decision 9).
- ~~note.md edit audit~~ → last-write-wins (versioning deferred).
