I have everything I need. The plan doc (`HOUSE_RULES_ADD.md`) already drafted a canonical glossary, and the oeuvre spec gives me the full tag protocol including `<<NEXT>>`, `<<SCRATCHPAD>>`, `<<VOTE>>`. Let me seed a structured first-pass scratchpad.

Here is my contribution:

<<SCRATCHPAD>>
# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v1 first-pass seed (shaddam).** Structure + raw term/tag inventory
mined from `SPECIFICATION.md`, `docs/*.md`, and the oeuvre spec. Not yet split
into the two final files; not yet voice-edited for first-time readers. Provenance
in `(src: …)` tags is for drafters — strip before shipping.

---

## Part 1 — GLOSSARY.md (draft)

Audience: a councillor (or human) who lands mid-system and needs to map a word to
a mental model fast. One crisp sentence each, then a clause of nuance only where
it bites. Canonical term in **bold**; retired synonyms called out.

### The frame
- **Director** — the one human user. Creates councils, writes briefs, reviews
  outputs and proposals, edits shared memory, and **does all coordination**.
  Canonical; retire "user" / "operator". (Drop "secretary" entirely — vestigial.)
  (src: SPEC §Director; HOUSE_RULES_ADD glossary)
- **Council** — a group of councillors plus its on-disk state; a council *is* a
  directory. **One council per directory.** (src: SPEC §Council)
- **Councillor** — a named AI council member = role + persona + adapter. Canonical
  term; "agent" / "council member" are informal synonyms only. (src: SPEC §Councillor)
- **Adapter** — how a councillor is actually invoked: `mock:local` (stub) or
  `cli:<tool>` (subprocess — claude, codex, gemini, grok, qwen, vibe, aider, warp).
  Empty string ⇒ councillor can't run; jobs stay queued. A `?model=<id|tier>`
  suffix pins the model (tiers: `lite`/`medium`/`heavy`). `sdk:*` adapters are
  future/out-of-scope. (src: SPEC §Adapter; data-model councillor.json)

### Doing work
- **Job** — one unit of work for one councillor. Canonical noun (not "task").
  One-shot; clone to repeat. Status: `queued → running → succeeded | failed | cancelled`.
  (src: SPEC §Job)
- **Brief** — the director's free-form markdown prompt for a job. Distinct from…
- **Prompt** — the fully assembled `input.md` the adapter receives (persona +
  roster + shared memory + private memory + the brief). (src: architecture §Prompt assembly)
- **Reflection** — the post-success extra adapter call (same councillor) that may
  emit `<<MEMORY>>` / `<<JOB>>` blocks. Opt-out per councillor (`reflect:false`).
  Skipped on failed/cancelled; non-fatal; time-bounded. While it runs the lane
  shows **reflecting** (distinct from **busy**). (src: SPEC §Reflection)
- **Proposal** — a `<<JOB>>` suggestion queued for director approve/reject at
  `/proposals`. Never auto-runs — the review gate is the loop-breaker. (src: SPEC §Agent Proposals)
- **Roster** — auto-generated one-line-per-councillor list
  (`slug — name — role — routing_hint`) injected into every prompt so
  `<<JOB councillor="slug">>` lands on a real slug. (src: SPEC §Roster)
- **routing_hint** — terse self-description a councillor carries so others can
  route follow-up jobs to it via the roster. (src: data-model councillor.json)
- **Schedule** — a declaration to create a job later: `once` (at a time) or
  `recurring` (5-field cron, local TZ). Fires on a 30s tick; no replay of missed
  fires. (src: SPEC §Schedule)

### Memory & indexing
- **Memory** — markdown notes on disk, two tiers:
  - **Shared memory** — `memory/*.md`, visible to every councillor.
  - **Private memory** — `councillors/<slug>/memory/*.md`, visible only to that
    councillor; created exclusively by reflection. (src: SPEC §Memory)
- **Index / indexing model** — pull-based semantic index (sqlite-vec). Files are
  the source of truth; a watcher re-derives chunks. Indexes the **council machine**
  (under `.landsraad/`) and the **product** (`.md`/`.txt` in the working dir).
  (src: SPEC §Indexing model; embeddings.md)
- **Chunk kind** — what a retrieved/indexed piece is: `memory`, `memory_private`,
  `job_input`, `job_output`, `transcript`, `persona`, `project_file`
  (+ planned `oeuvre_scratchpad`, `agents_doc`). (src: embeddings.md schema)
- **project_file** — an indexed prose file from the **product tree** (your docs),
  as opposed to the council's own machine state. (src: embeddings.md)

### Round-tables
- **Meeting** — synchronous round-table; the director participates each round.
  Holds the busy-slot for every attendee. (src: SPEC §Meeting)
  - **Round** — one full pass: director speaks (or skips), then each attendee
    speaks once (randomized order).
  - **Turn (meeting)** — one councillor speaking once within a round.
  - **Chair** — the councillor who writes the rolling **summary** and the closing
    **synthesis** (synthesis is scanned for `<<MEMORY>>`/`<<JOB>>`).

### Cross-council
- **Host** — the council that convenes and owns a cross-council meeting (transcript,
  chair, synthesis, reflection).
- **Peer** — another Landsraad council running on the same machine.
- **Remote attendee** — a councillor on a peer, summoned for a turn over a
  loopback-only HTTP API. (src: SPEC §Meeting / cross-council endpoints)

### Work loops
- **Oeuvre** — asynchronous, goal-driven **work loop** that produces an artifact.
  A leader orchestrates; participants take turns on a shared scratchpad and vote;
  concludes when every in-pool participant's **latest** vote is `finish` at the
  current scratchpad version (or on budget / director stop). One active oeuvre
  per council. (src: SPEC §Oeuvre; oeuvre-design spec)
  - **Leader** — orchestrates and comments; **never** takes a turn, picks itself,
    or votes.
  - **Participant** — a non-leader councillor who takes turns and votes.
  - **Turn (oeuvre)** — one participant taking the baton: revise scratchpad + vote.
    **Each oeuvre turn is a real Job under the hood** (reflection suppressed).
  - **Scratchpad** — the shared evolving artifact (the "baton"); a substantive
    edit bumps `scratchpad_version` and invalidates standing finish votes.
  - **Vote** — `finish` | `continue`, cast against the current scratchpad version.
  - **Pool / out** — a participant that fails too many turns goes **out** (dropped
    from routing + the vote pool) so a broken adapter can't deadlock the loop.
  - **Consolidation** — the leader-authored end pass that distills the
    scratchpad + work log into memories (and optional `<<JOB>>` proposals).
- **Turn (the gotcha)** — *always* a structured contribution inside a meeting
  round or an oeuvre loop. **Never** a chat message or a free-running session.
  Retire loose use of "cycle". (src: HOUSE_RULES_ADD glossary)

### Packaging & dogfood
- **Template** — a reusable, shareable council definition (`*.template.json`):
  councillor roles, personas, optional seed memory/jobs/env. Never contains
  secrets or PII. (src: SPEC §Council Template)
- **Dogfood council** — built-in test council (`npm run dogfood:init`) of
  `mock:local` councillors, for exercising Landsraad without real-CLI tokens.
  (src: SPEC §Dogfood Council)

### Terms still to place / confirm (next turn)
- `gzip_density` — relevant to a councillor? Probably reference-only, skip in GLOSSARY.
- **Council guide / `AGENTS.md`** — planned (HOUSE_RULES_ADD), not shipped. Hold
  out of GLOSSARY until built, or mark "(planned)".
- **Council root vs `.landsraad/`** — "the machine vs the product" framing is a
  key mental model; decide whether it's a glossary entry or a GLOSSARY preamble.

---

## Part 2 — TAGS.md (draft)

Audience: a councillor that needs to *emit* a tag correctly, or a reader decoding
one in a transcript. Frame: these are **fenced control blocks** an agent writes in
its output; the host parses them and acts. Parsing is whitespace-tolerant, unknown
tags are ignored (forward-compat), and a malformed control tag fails *safe*.

### Where tags are recognized (scan sites)
| Tag | Emitted by | Scanned in |
|---|---|---|
| `<<MEMORY>>` | any councillor (typically in reflection) | reflection output; meeting synthesis; oeuvre consolidation |
| `<<JOB>>` | same | same |
| `<<NEXT>>` | oeuvre **leader** | leader-pick adapter call |
| `<<SCRATCHPAD>>` | oeuvre **participant** | worker-turn output |
| `<<VOTE>>` | oeuvre **participant** | worker-turn output |
| `<<SCHEDULE>>` | — | **not implemented** (out of scope; future reflection tag) |

### The blocks

**`<<MEMORY title="…" [scope="shared"]>> … <</MEMORY>>`**
- Writes a memory note **directly** (not reviewed).
- Default ⇒ the emitting councillor's **private** memory (`memory_private`).
  `scope="shared"` ⇒ council-wide `memory/` (`memory`).
- Title collisions get `-2`, `-3`, … One reflection pass may mix private + shared.
- (src: SPEC §Agent Proposals; architecture; memory_private)

**`<<JOB title="…" [councillor="slug"] [priority="normal"]>> … <</JOB>>`**
- Lands as a **proposal**, *not* a direct job — `proposals/jobs/…json`, status
  `pending`; director approves/rejects at `/proposals`.
- `councillor` should be a real roster slug; unknown slugs flagged for reassignment.
  Body = the brief. (src: SPEC §Agent Proposals; proposals.ts)

**`<<NEXT councillor="slug" [say="…"]>>` (oeuvre leader only)**
- Picks who works next. `councillor` must be an **in-pool participant ≠ leader**;
  unknown / out / self / missing ⇒ invalid (runner re-asks once, then pauses).
  `say` is optional steer commentary. (src: oeuvre-design §blocks)

**`<<SCRATCHPAD>> … <</SCRATCHPAD>>` (oeuvre participant only)**
- The full revised scratchpad. Present + non-empty + differs ⇒ substantive edit
  (overwrite + bump version). Absent or byte-identical ⇒ ratification (no edit).
  (src: oeuvre-design §blocks)

**`<<VOTE value="finish|continue" [reason="…"]>>` (oeuvre participant only)**
- Exactly one. Missing/invalid ⇒ treated as `continue` ("(no vote emitted)") so a
  malformed turn can never spuriously conclude the loop. (src: oeuvre-design §blocks)

### Cross-cutting parsing rules (call out once)
- Leading whitespace + trailing prose tolerated; unrecognized tags ignored.
- Control tags (`NEXT`/`VOTE`) fail safe: ambiguity never advances/concludes.
- (Optional appendix) the planned `<!-- LANDSRAAD:BEGIN … END -->` *managed block*
  is an HTML-comment marker for the council guide file, **not** an agent-emitted
  `<<…>>` tag — mention only to disambiguate; it's unbuilt.

### Open questions for next turns
- Should TAGS.md show a full worked example (a reflection output emitting one
  MEMORY + one JOB) and an oeuvre turn (SCRATCHPAD + VOTE)? Likely yes — examples
  beat prose for "easy to get wrong."
- Confirm `priority` accepted values (`normal` seen; others?). → fenring/vladimir.
- Voice pass: define "councillor" vs "agent" usage rule for these docs and link
  GLOSSARY ↔ TAGS. → shaddam next turn.

---

## Work log
- t1 (shaddam): read SPEC + all docs/*.md + oeuvre-design spec; seeded structured
  first-pass GLOSSARY (terms grouped by frame/work/memory/round-tables/loops) and
  TAGS inventory (6 tags incl. unbuilt SCHEDULE) with scan-site table, per-block
  semantics, parsing rules, and open questions. Not split into final files yet;
  needs an editorial/voice pass and worked examples.
<</SCRATCHPAD>>

The scratchpad now holds a structured first-pass of both deliverables. It still needs splitting into the two final files, worked examples in TAGS, a voice pass for first-time readers, and a few confirmations (priority values, planned-vs-shipped terms) — so the goal is not yet met.

<<VOTE value="continue" reason="First-pass inventory seeded; still needs file split, worked examples, voice pass, and term-status confirmations.">>
