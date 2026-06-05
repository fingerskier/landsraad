# Data model

Everything is on-disk under the **council root**, which is the Landsraad process's cwd (override with `LANDSRAAD_COUNCIL_ROOT`). One council per directory.

## Layout

```
<council-root>/
  council.json
  councillors/
    <councillor-slug>/
      councillor.json
      persona.md
      memory/
        <entry-slug>.md       # private per-councillor memory (reflection-created)
  memory/
    <note-slug>.md             # shared memory
  jobs/
    <job-id>/
      job.json
      input.md
      transcript.md
      output.md
      events.jsonl
  proposals/
    jobs/
      <timestamp>-<slug>.json  # <<JOB>> proposals
  schedules/
    <schedule-id>.json         # one declaration per file
    <schedule-id>.events.jsonl # fire / skip / error log
  .index/
    embeddings.db
```

Councillor, note, and private-memory entry slugs are derived from titles/names via the shared `slugify()` in `src/lib/server/paths.ts`: lowercased, non-alphanumerics collapsed to `-`, capped at 64 chars. Slugs never change after creation — renames update the JSON file's `name` but keep the slug stable. On slug collision during reflection or template install, a `-2`, `-3`, … suffix is appended.

## `council.json`

```json
{
  "slug": "c-suite",
  "name": "C-Suite",
  "description": "Run the business.",
  "template": "c-suite@0.1.0",
  "created_at": "2026-05-21T13:00:00.000Z"
}
```

- `slug` — directory name. Read-only after creation.
- `name` — display name. Editable.
- `description` — free text. Editable.
- `template` — `"<template.name>@<template.version>"` if the council was installed from a template; `null` otherwise.
- `created_at` — ISO 8601 timestamp.

## `councillor.json`

```json
{
  "slug": "cfo",
  "name": "CFO",
  "role": "Chief Financial Officer",
  "routing_hint": "budgets, cash runway, pricing, vendor contracts",
  "adapter": "cli:claude",
  "reflect": true,
  "created_at": "2026-05-21T13:01:00.000Z"
}
```

- `adapter` — free-form string. Conventions: `cli:<name>` (subprocess) or `sdk:<name>` (in-process API client). Empty string means "not configured yet." A `?model=<id>` suffix pins the model for this councillor's turns, e.g. `cli:claude?model=claude-haiku-4-5`; the pin wins over the host-wide `LANDSRAAD_MEETING_MODEL` env override, which in turn beats the CLI's own default. The value (in either the suffix or the env override) may be a literal model id or a service-agnostic tier — `lite`/`medium`/`heavy` — which each adapter maps to its own model (`cli:claude` → haiku/sonnet/opus). A tier no-ops for adapters with no mapping.
- `routing_hint` — terse description used in the auto-generated council roster injected into each prompt. Lets other councillors route `<<JOB councillor="...">>` proposals correctly.
- `reflect` — opt-out flag for the post-job reflection pass. Default `true`. When `false`, the runner skips reflection entirely after this councillor's jobs succeed.

## `persona.md`

The councillor's persona — free-form markdown. The application treats it as opaque text; rendering is deferred to whichever adapter eventually consumes it. The first `# heading` line is treated as the title in indexed chunks.

## Shared memory: `memory/<note-slug>.md`

One markdown file per shared note. First `# heading` is the title; rest is the body. The director (and, later, councillors via promotion) creates/edits/deletes these via the UI.

## Private memory: `councillors/<slug>/memory/<entry-slug>.md`

One markdown file per private memory entry. Same format as shared notes. Created exclusively by reflection (`<<MEMORY>>` blocks parsed from a successful job's reflection output). Edit and delete via the UI; no manual-create form in v1.

A `<<MEMORY scope="shared">>` block in the same reflection output routes the entry to `memory/<entry-slug>.md` (shared) instead of the councillor's private dir — so a single reflection pass may write to either tier depending on each block's `scope` attribute.

## `jobs/<job-id>/job.json`

```json
{
  "id": "2026-05-22T14-30-00Z-q1-summary",
  "title": "Q1 summary",
  "brief": "...",
  "councillor_slug": "cfo",
  "status": "succeeded",
  "created_at": "...",
  "started_at": "...",
  "finished_at": "...",
  "exit_code": 0,
  "error": null,
  "memory_slugs": ["q1-fcf-watchlist", "vendor-renegotiation-window"],
  "shared_memory_slugs": ["q1-board-update"],
  "reflection_error": null
}
```

- `memory_slugs` — slugs of private memory entries created by this job's reflection (omitted if none).
- `shared_memory_slugs` — slugs of shared council memory entries created by this job's reflection from `<<MEMORY scope="shared">>` blocks (omitted if none).
- `reflection_error` — short message if reflection itself failed (the job still counts as `succeeded`).

`events.jsonl` event types include `created`, `started`, `stdout`, `stderr`, `succeeded`, `failed`, `cancelled`, `note`, `reflected`, `reflection_failed`, and `proposed_job`.

## `proposals/jobs/<timestamp>-<slug>.json`

```json
{
  "id": "2026-05-25T15-16-17-796Z-followup-on-x",
  "kind": "job",
  "proposed_by": "analyst",
  "source_job_id": "2026-05-25T15-08-...",
  "title": "Followup on X",
  "brief": "...",
  "target_councillor": "pm",
  "priority": "normal",
  "status": "pending",
  "created_at": "2026-05-25T15:16:17.796Z"
}
```

`target_councillor` is `null` (unassigned), a councillor slug, or the literal `"all"` for a broadcast. `status` is `pending | approved | rejected`. Approved proposals add `decided_at`, `decided_by`, and `resulting_job_ids`. Rejected proposals add `decided_at`, `decided_by`, and an optional `reason`. Approved/rejected files stay on disk for audit; the review UI hides them from the pending view.

## `schedules/<schedule-id>.json`

```json
{
  "id": "2026-05-26T08-00-00Z-weekly-news",
  "title": "Weekly news",
  "brief": "...",
  "councillor_slug": "analyst",
  "kind": "recurring",
  "fire_at": null,
  "cron": "0 9 * * MON",
  "enabled": true,
  "next_fire_at": "2026-06-01T09:00:00.000Z",
  "last_fire_job_id": null,
  "fire_count": 0,
  "fired_at": null,
  "created_at": "2026-05-26T08:00:00.000Z"
}
```

- `kind` — `"once"` (a single fire at `fire_at`) or `"recurring"` (5-field `cron`, system local TZ).
- `enabled` — false suppresses firing and clears `next_fire_at`.
- `next_fire_at` — recomputed after each fire, on enable/edit, and at startup catch-up.
- `last_fire_job_id` / `fire_count` — bookkeeping for the most recent spawned job.
- `fired_at` — set when a `kind: "once"` schedule auto-disables on its fire.

Schedule IDs are `<UTC-timestamp>-<title-slug>` (mirrors job IDs). Side-channel: `<schedule-id>.events.jsonl` records `created | enabled | disabled | edited | fired | skipped_overlap | missed_fires | fire_error` lines as the schedule runs.

## `meetings/<meeting-id>/meeting.json` — attendee representation

Local and remote councillors are stored separately:

- `attendees: string[]` — slugs of councillors **on this council** (local speakers).
- `remote_attendees: RemoteAttendee[]` — councillors from other councils. Back-compat: a `meeting.json` with no `remote_attendees` field loads as `[]`.
- `remaining_this_round: string[]` — speaker tokens for the current round. A local token is a bare councillor slug (e.g. `"cfo"`). A remote token is `"<council_slug>:<councillor_slug>"` (contains `:`), e.g. `"alpha:analyst"`.

`RemoteAttendee` shape:

```json
{
  "council_slug": "alpha",
  "councillor_slug": "analyst",
  "cwd": "/home/user/councils/alpha",
  "label": "Analyst (alpha)"
}
```

- `council_slug` — slug of the peer council.
- `councillor_slug` — slug of the councillor on that peer council.
- `cwd` — filesystem path to the peer council root (used to resolve the live port via the instance registry).
- `label` — display name shown in the transcript and meeting UI.

Failure pause reasons recorded in `events.jsonl` for remote-turn failures:

| Reason token | Meaning |
|---|---|
| `remote_unreachable:<council>` | Peer instance not found or HTTP call failed |
| `remote_busy:<council>:<councillor>` | Peer returned 409 (councillor busy) |
| `remote_turn_failed:<council>:<councillor>` | Peer returned a non-ok turn result |

## `meetings-incoming.jsonl`

Peer audit log written at the **council root** (not inside a meeting directory). One line per summoned turn served:

```json
{ "ts": "2026-05-30T12:00:00.000Z", "host_council": "beta", "meeting_id": "2026-...", "councillor_slug": "cfo", "duration_ms": 1234, "exit_code": 0 }
```

- `ts` — ISO-8601 UTC timestamp of the turn completion.
- `host_council` — slug of the council that summoned this turn.
- `meeting_id` — meeting ID on the host council.
- `councillor_slug` — which local councillor was summoned.
- `duration_ms` — wall-clock time for the adapter call.
- `exit_code` — adapter exit code (0 = success).

## `oeuvres/<oeuvre-id>/oeuvre.json`

A goal-driven, leader-orchestrated work loop. See [`superpowers/specs/2026-06-05-oeuvre-design.md`](superpowers/specs/2026-06-05-oeuvre-design.md).

```json
{
  "id": "2026-06-05T12-00-00-000Z-draft-the-launch-plan",
  "title": "Draft the launch plan",
  "goal": "Produce a launch plan the team can execute.",
  "leader_slug": "lead",
  "participants": ["planner", "critic"],
  "status": "active",
  "policy": { "max_turns": 30, "max_wall_ms": 3600000, "max_text_bytes": 2000000, "max_consecutive_failures": 3 },
  "scratchpad_version": 4,
  "total_turns": 7,
  "text_bytes": 48211,
  "leader_failures": 0,
  "started_at": "...",
  "concluded_at": null
}
```

- `leader_slug` — orchestrates the loop; never takes a turn, never picks itself, never votes. `participants` must **not** include it.
- `status` — `active | paused | concluding | concluded | cancelled | failed`. v1 allows one non-terminal oeuvre at a time per council.
- `scratchpad_version` — bumped on every substantive scratchpad edit; a finish vote only counts at the current version (stale finishes stop counting).
- `policy` — budget caps. `max_text_bytes` is a raw prompt+output byte count surfaced in the UI as "Text KB/MB" (not tokens — CLI adapters don't report token usage).
- On conclusion: `memory_slugs`, `shared_memory_slugs`, `proposed_jobs` from the leader-authored consolidation pass (via the existing `<<MEMORY>>` / `<<JOB>>` reflection plumbing).

Sibling files in `oeuvres/<oeuvre-id>/`:

- `note.md` — director's live, editable steering note; read at the top of each leader and worker call.
- `scratchpad.md` — the baton; the current best artifact, revised by worker turns. Indexed as `oeuvre_scratchpad`.
- `participants.json` — per-participant ledger: `{ vote: "finish"|"continue"|null, reason, scratchpad_version, turn_idx, failures, out, ts }`. A councillor that fails `max_consecutive_failures` turns goes `out` (dropped from routing + the vote pool, so a broken adapter can't deadlock the loop).
- `turns.jsonl` — one line per leader pick and per worker turn (each `turn` line links the turn's `job_id`).
- `events.jsonl` — state-transition + progress log (`created | leader_pick | turn_started | turn_finished | turn_failed | participant_out | scratchpad_edited | vote | converged | budget_exceeded | pool_exhausted | paused | resumed | concluding | concluded | consolidated | consolidation_failed | cancelled | crashed`).

Each worker turn is a real job under `jobs/`, tagged with `oeuvre_id` + `oeuvre_turn_idx`, run with reflection suppressed (the oeuvre consolidates once at the end instead).

## `*.template.json` schema

Top-level fields of a council template file:

- `format_version` — must be `1`.
- `name` — machine-readable template identifier (used in provenance string).
- `version` — semver string.
- `description?` — human-readable summary.
- `author?` — attribution string.
- `license?` — SPDX identifier or short license name.
- `council` — `{ name, description? }` — default council name/description applied on install.
- `councillors` — array of `{ slug?, name, role, routing_hint?, adapter, persona, reflect? }`. At least one required.
- `memory?` — array of `{ title, body }` shared memory notes seeded on install.
- `sample_jobs?` — array of `{ title, brief, councillor_slug }` queued only when the council's `jobs/` directory is empty.
- `env?` — array of `{ key, value, comment? }`. Optional default environment variables seeded into the council `.env` on install. Keys must be valid env identifiers (`^[A-Za-z_][A-Za-z0-9_]*$`); values are single-line. `comment` documents the key in the template only (not written to `.env`). Export refuses secret-named keys (`key`, `api`, `token`, `secret`, `password`, `passwd`, `credential`, `auth`, `private`).

## Invariants

- One council per process. The Landsraad app runs against `cwd` (or `LANDSRAAD_COUNCIL_ROOT`).
- Slugs are unique within their namespace (`councillors/<slug>`, `memory/<slug>`, `councillors/<slug>/memory/<entry-slug>`).
- The app never writes outside the council root.
- Template install never touches `jobs/` run artifacts or `.index/`; sample jobs are queued only when `jobs/` is empty.
- Files are written atomically enough for this single-user case (JSON is replaced wholesale on every update); no file locking.
