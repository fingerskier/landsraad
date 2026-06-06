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
