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
