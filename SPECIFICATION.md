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

For a host-wide lever, `LANDSRAAD_MEETING_MODEL` (e.g. `haiku`) sets the model for **every** meeting LLM call a server runs — attendee turns, rolling chair summaries, and the closing synthesis — so an operator can run cheap/fast meetings without editing each councillor. A per-councillor `?model=` pin still wins (explicit beats the host default). It is per-process: each participating server reads its own value, so it also governs the turns that server serves as a remote peer. Jobs and runs are unaffected — the override applies only at meeting call sites. Empty (the default) leaves each adapter on its own default model.

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

A multi-turn round-table among councillors with the director participating each round. The director picks a chair, a topic, and attendees. Each round the director speaks first (or skips), then attending councillors speak in randomized order. When the director ends the meeting, the chair writes a synthesis that is scanned for `<<MEMORY>>` / `<<JOB>>` blocks via the existing reflection plumbing. Topic, per-turn transcript, rolling summary, and synthesis are embedded into the memory index so future jobs can retrieve them. While running, the meeting holds the busy-slot for every attendee; jobs assigned to in-meeting councillors stay `queued` until the meeting ends.

A meeting may include **remote attendees** — councillors belonging to other councils running on the same machine. When a remote attendee's turn comes up, the host summons it over a loopback-only HTTP API (`POST /api/meeting/turn`); the peer runs that councillor with its own persona, memory, adapter, and cwd, and returns the turn text. The host owns the transcript, chair, synthesis, and reflection; the peer only logs participation. Discovery uses the running-instance registry (`/api/instances` → `/api/council` → `/api/peers`). Servers bind `127.0.0.1` and the summon endpoint rejects non-loopback callers, so cross-machine summons are refused.

#### Cross-council API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/council` | Returns `{ slug, name, councillors: [{slug, label, adapter, busy}] }` — this council's identity and live roster. |
| `GET` | `/api/peers` | Returns `{ peers: Peer[] }` where each `Peer = {council_slug, name, cwd, port, councillors: [{slug, label, adapter, busy}]}`. Discovered via the instance registry; self excluded; unreachable instances dropped. |
| `POST` | `/api/meeting/turn` | **Loopback-only** (non-loopback callers receive 403). Body `{ meeting_id, host_council, councillor_slug, context: {title, topic, summary, recent_turns, speaker_instruction} }`. Runs one councillor turn locally and returns `{ ok:true, text, duration_ms }` or `{ ok:false, exit_code, detail }`. Returns 409 if the councillor is busy, 400 on bad/oversized/path-traversal identifiers, 404 if the councillor doesn't exist. |

### Oeuvre

A goal-directed, leader-orchestrated **work loop**. The director sets a goal, writes an optional steering note, and picks one councillor to **lead**. Each cycle the leader reads the current state, optionally says its piece, and picks which **participant** (a non-leader councillor) takes the next turn; the chosen councillor revises a shared **scratchpad** and casts a **vote** on whether the goal is achieved. The leader orchestrates and comments but never takes a turn, never picks itself, and never votes. Termination is **rolling latest-vote**: the runner tracks each participant's most recent vote and concludes when every *in-pool* participant's latest vote is `finish` against the current scratchpad version — a substantive scratchpad edit bumps the version and invalidates standing finish votes, so convergence means "the work went quiet and everyone signs off on the same draft." A councillor whose turn keeps failing is dropped from the vote pool (it counts as out, not a blocker) so a broken adapter can't deadlock the loop. An oeuvre also concludes on a budget — turn count, wall-clock, or cumulative text size — or when the director stops it.

Each turn is a real **job** under the hood (full `input`/`transcript`/`output` artifacts, one-running-job-per-councillor lock); the leader-pick is a lighter routing-only adapter call. The director steers from the side: the **note** is live-editable and picked up at the top of each call, and the director can pause / resume / conclude-now / cancel at any time. On conclusion a **consolidation pass** (authored by the leader) distills the scratchpad + work log into memories (and optional follow-up `<<JOB>>` proposals) via the existing reflection plumbing. Where a meeting is synchronous talk that blocks on the director each round, an oeuvre is an asynchronous work loop that produces an artifact. v1 runs **one active oeuvre at a time** per council. See [`docs/superpowers/specs/2026-06-05-oeuvre-design.md`](docs/superpowers/specs/2026-06-05-oeuvre-design.md).

### Dogfood Council

A built-in council for testing Landsraad itself. The CLI command `npm run dogfood:init [path]` seeds the target directory (default `./dogfood`) with two `mock:local` councillors, one shared memory note, and one sample job. From there, `cd dogfood && npx landsraad` (or `LANDSRAAD_COUNCIL_ROOT=./dogfood npm run dev` from the repo) operates against it. This is what the director uses to exercise the app without burning real-CLI tokens.

## v1 Functionality

1. **Launch the app.** `npx landsraad` from the council directory (or `npm run dev` from the repo for development).
2. **Create or edit the council.** If `council.json` is missing, `/` shows a setup form with a blank-create option *and* an "Install from template" option. Otherwise it's the council home.
3. **Manage councillors.** CRUD on a councillor's name, role, routing_hint, persona, adapter string, and `reflect` opt-out flag.
4. **Manage shared memory.** CRUD on `*.md` notes under `memory/`.
5. **Create and run jobs.** Pick a councillor, write a brief, submit. The runner picks up queued jobs and invokes the councillor's adapter. Status updates land on disk; the UI polls for live updates while a job is running.
6. **Reflection.** Successful jobs trigger one extra adapter call that may emit `<<MEMORY>>` (applied directly to private memory; `scope="shared"` routes to council-wide memory instead) and `<<JOB>>` blocks (proposals).
7. **Review proposals.** `/proposals` lists pending `<<JOB>>` proposals with approve / reject actions; approval routes through the same job-creation path as the UI.
8. **Activity view.** The council page shows each councillor's recent jobs with status badges and timestamps.
9. **Per-job artifacts.** Each run leaves `input.md` (the assembled prompt), `transcript.md` (raw adapter output), `output.md` (final response or summary), `events.jsonl` (state transitions), and `job.json` (metadata, including `memory_slugs` and `shared_memory_slugs` for reflection-created entries).
10. **Install / export templates.** `npx landsraad init <source>` and `npx landsraad export <out.json>` (or `/import` and `/export` in the UI). `npm run dogfood:init` installs `templates/dogfood.template.json` into `./dogfood`.
11. **Schedules.** Declare future or recurring work via `/schedules` (or "Save as schedule" on `/jobs/new`). The in-process scheduler ticks every 30s, spawning jobs on the configured councillor.
12. **Meetings.** Convene a round-table at `/meetings/new`. Director participates each round; councillors speak in random order; chair writes a synthesis on end that is parsed for `<<MEMORY>>` / `<<JOB>>` blocks. Topic, transcript, summary, and synthesis are embedded into the memory index.
13. **Oeuvres.** Start a goal-driven work loop at `/oeuvres/new`. A leader councillor picks who takes each turn; the picked councillor revises a shared scratchpad and votes; the loop concludes when all latest votes are `finish` (against the current scratchpad version), a budget is hit, or the director stops it. The director steers via a live-editable note and can pause / resume / conclude / cancel. On conclusion a consolidation pass distills the work into memories and follow-up proposals.

## Storage Model

The council root is the current working directory of the Landsraad process. Override with `LANDSRAAD_COUNCIL_ROOT=<path>` for tests or to point a dev server at a non-cwd council. **All of the council's own state lives under `<council-root>/.landsraad/`** — the machine, kept out of the way of the working directory (the product). Only `.env` and `.gitignore` sit at the root, and the adapter `cwd` stays the council root so councillors see the product directly.

```
<council-root>/                  # = process.cwd() (or LANDSRAAD_COUNCIL_ROOT) — the product
  .env                           # adapter API keys etc. — never indexed, never committed
  .gitignore                     # the user's; governs the working directory
  <your product files>           # docs, CSVs, code — the deliverables the council assembles
  .landsraad/                    # the council machine — everything below lives here
    council.json                 # slug, name, description, template, created_at
    councillors/
      <councillor-slug>/
        councillor.json          # slug, name, role, routing_hint, adapter, reflect, created_at
        persona.md
        memory/                  # private per-councillor memory
          <entry-slug>.md
    memory/
      <note-slug>.md             # shared notes
    jobs/
      <job-id>/                  # job-id is timestamped + slugged
        job.json                 # id, title, councillor_slug, status, *_at, exit_code?, memory_slugs?, shared_memory_slugs?
        input.md                 # assembled prompt sent to the adapter
        transcript.md            # raw stdout (and stderr) from the adapter
        output.md                # final response (often === transcript.md, possibly trimmed)
        events.jsonl             # one line per state transition or progress event
    proposals/
      jobs/
        <timestamp>-<slug>.json  # <<JOB>> proposals; status pending|approved|rejected
    schedules/
      <schedule-id>.json         # one declaration per file
      <schedule-id>.events.jsonl # fire / skip / error log
    meetings/
      <meeting-id>/              # meeting-id is timestamped + slugged
        meeting.json             # id, title, chair_slug, attendees, status, window_k, *_at, memory_slugs?, shared_memory_slugs?, proposed_jobs?
        topic.md                 # director's brief for the round-table
        transcript.md            # per-turn blocks appended as the meeting progresses
        summary.md               # chair-written rolling summary of displaced turns
        synthesis.md             # chair-written closing synthesis (scanned for <<MEMORY>>/<<JOB>>)
        events.jsonl             # one line per state transition or turn event
    meetings-incoming.jsonl      # peer-summon audit log (cross-council meetings)
    oeuvres/
      <oeuvre-id>/               # oeuvre-id is timestamped + slugged
        oeuvre.json              # id, title, goal, leader_slug, participants, status, policy, scratchpad_version, text_bytes, *_at, memory bookkeeping
        note.md                  # director's live, editable steering note
        scratchpad.md            # the baton — current best artifact, revised by worker turns
        participants.json        # per-participant vote + pool/health ledger (vote, out, failures)
        turns.jsonl              # one line per leader-pick and per worker turn (links the turn's job)
        events.jsonl             # one line per state transition or progress event
    .index/
      embeddings.db              # sqlite-vec index; regenerable
```

Job IDs are `<UTC-timestamp>-<title-slug>` (e.g. `2026-05-22T14-30-00Z-q1-summary`) — sortable, human-readable, unique enough for one-director scale.

The app never writes outside the council root. It never writes secrets to disk. Subprocess environment is inherited unchanged.

## Runner semantics (v1)

- One in-process scheduler inside the SvelteKit server. No separate worker process.
- At most one running job per councillor. Multiple councillors in the same council can run in parallel.
- Newly created jobs trigger a pickup tick. Crashed/orphaned `running` jobs at server start are not auto-resumed; they are flipped to `failed` with a note (no resume in v1).
- The runner spawns the adapter with `cwd` = the council directory and `env` = the SvelteKit server's env. stdout/stderr stream into `transcript.md`. On exit, the runner writes `output.md`, sets status, appends a final event.
- Cancellation: form action sends SIGTERM. After a short grace window, SIGKILL.

## UI Surfaces (v1)

| Route | Purpose |
|---|---|
| `/` | Setup form (no `council.json`, blank-create or install-template) or council home (metadata · councillors · activity · jobs · memory · pending-proposal badge) |
| `/council` | Council administration: rename/template, councillors (add / edit / delete), `.env` editor, export, delete-council |
| `/councillors/new` | Add councillor |
| `/councillors/[c-slug]` | View councillor + their jobs + private memory |
| `/councillors/[c-slug]/edit` | Edit councillor |
| `/councillors/[c-slug]/memory/[note]` | View / edit private memory entry |
| `/memory/new` | Add shared memory note |
| `/memory/[note]` | View / edit shared memory note |
| `/jobs/new` | Create job |
| `/jobs/[jid]` | Job detail: brief, transcript, output, status, reflection-created memories, emitted proposals. Auto-refreshes while `running`. |
| `/proposals` | Pending `<<JOB>>` proposals — approve / reject |
| `/import` | Install a council template (URL, local path, or file upload) — preview then confirm |
| `/export` | Export the current council to a `*.template.json` |
| `/schedules` | List schedules; enable / disable; delete |
| `/schedules/new` | Create a schedule |
| `/schedules/[id]` | Schedule detail: definition, next-N fires, recent events, spawned job links |
| `/schedules/[id]/edit` | Edit a schedule |
| `/meetings` | List meetings with status + round + turn count |
| `/meetings/new` | Convene a meeting: title, topic, chair, attendees, window_k |
| `/meetings/[id]` | Meeting detail: live transcript, director speak/skip, end / cancel / resume |
| `/oeuvres` | List oeuvres with status, leader, turn count, and vote tally |
| `/oeuvres/new` | Start an oeuvre: title, goal, leader, participants, optional note, budget policy |
| `/oeuvres/[id]` | Oeuvre detail: live scratchpad + scrolling transcript, editable note, vote ledger; pause / resume / conclude / cancel |

A persistent header links back to `/` via the brand; the system links (Meetings, Schedules, Install template, Export, Council, Help) live in a hamburger menu. The council home is the working surface.

## Out of Scope (will be specified later)

- SDK adapters (`sdk:anthropic`, `sdk:openai`, …)
- Per-schedule TZ; sub-minute resolution
- Schedule proposals from reflection (`<<SCHEDULE …>>`)
- Schedule export/import in council templates
- Projects (a layer above jobs that group related work)
- Memory TTL / decay / consolidation (sleep/dream)
- Promote-existing-private → shared (only emission-time `scope="shared"` ships); auto-approval / per-councillor trust tiers; mid-job proposals; cross-council proposal sharing
- Per-councillor reflection-prompt overrides
- Memory-budget UI; per-job opt-out of memory inclusion
- Authenticated template fetch, template registry / marketplace, single-action "publish to gist"
- Permissions / audit log for risky tool use
- Multi-user, auth, remote hosting

## Open Questions

- How big is too big for memory before retrieval starts dropping signal? Tune `MEMORY_TOPK_*` and `MEMORY_CHAR_BUDGET` empirically; expose UI if needed.
- How should we surface CLI auth failures (e.g., `claude` returns "not logged in") so the director knows what to fix?
- Should reflection ever run on `failed` or `cancelled` jobs (e.g., to capture "what went wrong" memories)?
- Dedupe of repeated `<<JOB>>` proposals on the same `(title, source_councillor)`?

These are flagged here so they aren't lost.
