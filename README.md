# 🏛️ Landsraad

A local-first AI council chamber. Configure councillors, give them jobs, watch the council work.

Everything runs **on your own computer**. No account. No cloud. No tracking. The council files live in a folder you pick.

---

## 🚀 Getting started (the simple version)

You don't need to be a programmer. Three steps.

### 1. Install Node.js

Landsraad runs on **Node.js** (a free program for running JavaScript apps).

- Go to **[nodejs.org](https://nodejs.org)**
- Download the **LTS** version (the big green button) for your computer
- Run the installer, click *Next* through the defaults, and finish

> 💡 You only ever do this once. Need version **20 or newer** — the LTS download is always fine.

### 2. Open a terminal

This is the text window where you type commands.

- **Windows:** press the Start button, type `PowerShell`, press Enter.
- **Mac:** press `⌘ + Space`, type `Terminal`, press Enter.

### 3. Make a folder and start the council

Copy these lines into the terminal, one at a time, pressing Enter after each:

```bash
mkdir my-council
cd my-council
npx landsraad
```

What just happened:

- `mkdir my-council` 📁 — makes a new folder called *my-council*. **This folder is your council.** Everything the council remembers lives inside it.
- `cd my-council` 🚶 — steps into that folder.
- `npx landsraad` ▶️ — downloads and starts Landsraad. The first run takes a minute; later runs are quick.

When it's ready it prints a web address (like `http://localhost:10191`) and opens your browser. Fill in the setup form and you're off. 🎉

### Coming back later

Want a new council? Make a new folder and run `npx landsraad` inside it. Want to return to an old one? Open a terminal, `cd` into that folder, and run `npx landsraad` again. **One folder = one council.**

To stop the council, click the terminal window and press `Ctrl + C`.

---

## What's here

- A SvelteKit + TypeScript app you run locally.
- **One council per directory.** When you run `npx landsraad`, the current working directory **is** the council. Its state (`council.json`, `councillors/`, `memory/`, `jobs/`, `.index/`, …) lives in a hidden `.landsraad/` folder at cwd; the working directory itself stays clear for your work product. Only `.env` and `.gitignore` sit at the root.
- No accounts, no cloud, no telemetry. You are the only user. You are also the secretary.

---

# 🛠️ Technical reference

Everything below is for developers, tinkerers, and tooling. The simple instructions above are all most people need.

## Quickstart

Requires Node.js 20+.

```bash
mkdir my-council && cd my-council
npx landsraad
```

Open the URL it prints. The setup form creates the council under `.landsraad/` in the current directory.

## Development

Clone the repo and run the dev server straight from the source — no build step, no `npx`:

```bash
git clone <repo> && cd landsraad
npm install
npm run dev
```

Open the URL it prints (Vite picks a port, usually `http://localhost:5173`).

**`npm run dev` turns the cloned repo into a throwaway test council.** Because a council root is just `process.cwd()`, the dev server treats the repo checkout itself as the council. The first time you create councillors, jobs, or run a meeting, the app scaffolds the council machine under **`.landsraad/` right in your clone**:

```
.landsraad/
  council.json   councillors/   memory/   jobs/
  proposals/     meetings/      schedules/ oeuvres/   .index/
```

The `.landsraad/` snapshot committed to this repo is an **exemplar council** — a worked example (councillors, a meeting, a job) shipped for reference. Only the regenerable/transient bits are gitignored (`.landsraad/.index/`, `.landsraad/meetings-incoming.jsonl` — see [`.gitignore`](./.gitignore)); the rest is tracked on purpose. So when you `npm run dev` against the clone, your experiments **do** show up in `git status` against the exemplar — review diffs before committing, or point the dev server at a throwaway directory (see below) to hack freely without touching the tracked snapshot.

### Target a different council directory

```bash
LANDSRAAD_COUNCIL_ROOT=/path/to/council npm run dev
```

### Seed a richer dogfood council

```bash
npm run dogfood:init        # creates ./dogfood from templates/dogfood.template.json
cd dogfood && npx landsraad # or: LANDSRAAD_COUNCIL_ROOT=./dogfood npm run dev
```

### Wipe the test council

Scratch council got messy? Reset it:

```bash
npm run reset               # same as `landsraad reset`, uses repo source — no build/install needed
```

Honors `LANDSRAAD_COUNCIL_ROOT` (so `LANDSRAAD_COUNCIL_ROOT=./dogfood npm run reset` wipes the dogfood council instead of the repo-root one).

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `LANDSRAAD_COUNCIL_ROOT` | `process.cwd()` | The directory Landsraad treats as the council root. |
| `PORT` | `10191` | Starting port the production server (`npx landsraad`) listens on. If the port is already in use it scans up to 100 ports forward and binds the next free one — running multiple councils in parallel just works. |
| `LANDSRAAD_INSTANCES_FILE` | `~/.landsraad/instances.json` | Cross-instance registry. Each running `npx landsraad` writes its `{ pid, port, cwd, startedAt }` here on listen and removes it on shutdown; dead entries are pruned lazily on read. |
| `LANDSRAAD_MEETING_TURN_NUDGE` | _(empty)_ | Text appended to every meeting turn's speaker instruction. Set e.g. `"Be terse — 1-3 sentences."` to ask councillors for shorter responses in meetings. Read on the chair council, so one knob governs the whole meeting (local and remote attendees). Empty = no change. |
| `LANDSRAAD_MEETING_MODEL` | _(empty)_ | Model for every meeting LLM call this server runs — attendee turns, rolling summaries, and the closing synthesis. Accepts a literal model id (`haiku`) or a service-agnostic tier (`lite`/`medium`/`heavy`) that each adapter maps to its own model (claude → haiku/sonnet/opus), so one tier means the same intent across a mixed fleet. A tier no-ops for adapters with no mapping (they fall back to the CLI default). A per-councillor `?model=` pin in the adapter string still wins. Per-process: each participating server reads its own value, so it also governs the turns it serves as a remote peer. Empty = each adapter's default model. |
| `LANDSRAAD_REFLECT_TIMEOUT_MS` | `120000` | Time budget for the post-success reflection adapter call. Reflection runs while the job already reads `succeeded` but still holds the councillor lock (the lane shows `reflecting`); this cap stops a hung or slow model from pinning a councillor indefinitely. On timeout the job logs a `reflection_failed` event and the councillor is freed. |
| `LANDSRAAD_PROJECT_TOPK` | `6` | How many product-tree (`project_file`) hits to pull into a job's `Project context` prompt section. The index covers `.md`/`.txt` in the working directory (respecting the root `.gitignore`), so councillors can retrieve over the docs they are assembling. Shares the memory char budget. |
| `LANDSRAAD_INDEX_MAX_FILE_BYTES` | `512000` | Per-file size ceiling for indexing a product `.md`/`.txt`. Files larger than this are skipped (keeps one huge text file from dominating the index). Council artifacts under `.landsraad/` are unaffected. |
| `LANDSRAAD_OEUVRE_MAX_TURNS` | `30` | Default worker-turn cap for a new oeuvre (the goal-driven work loop). The loop auto-concludes when it hits this. Set per-oeuvre in the New Oeuvre form. |
| `LANDSRAAD_OEUVRE_MAX_WALL_MS` | `3600000` | Default wall-clock cap (ms) for a new oeuvre. |
| `LANDSRAAD_OEUVRE_MAX_TEXT_BYTES` | `2000000` | Default cumulative prompt+output byte cap for a new oeuvre, surfaced in the UI as "Text KB/MB". A real byte count — not tokens, which CLI adapters don't report. |
| `LANDSRAAD_OEUVRE_MAX_CONSEC_FAILURES` | `3` | Consecutive failed turns before a councillor is dropped from an oeuvre's vote pool (so a broken adapter can't deadlock the loop). |
| `LANDSRAAD_OEUVRE_TURN_TIMEOUT_MS` | `300000` | Per-turn adapter timeout for an oeuvre worker turn. |
| `LANDSRAAD_OEUVRE_LEADER_PICK_TIMEOUT_MS` | `120000` | Timeout for the leader's per-turn routing call. |
| `LANDSRAAD_OEUVRE_CONSOLIDATE_TIMEOUT_MS` | `120000` | Timeout for the leader-authored consolidation pass on conclusion. |

When you run `npx landsraad`, the server opens your default browser to the council URL once it's listening. Set `PORT` to override the starting port.

### Per-council `.env` (Settings page)

A council can carry its own `.env` file at the council root for adapter API keys
(`OPENAI_API_KEY`, `WARP_API_KEY`, …) and other env overrides. Edit it in-app on
the **Settings** page (hamburger menu → Settings): key/value rows with masked
values. The key field autocompletes from a list of expected names — provider
API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, …) and
Landsraad's own behavior globals (`LANDSRAAD_MEETING_TURN_NUDGE`, …). Saving writes `<councilRoot>/.env` and adds `.env` to the council's
`.gitignore`. The file is loaded into the server environment at startup and
inherited by adapter subprocesses — **changes take effect after you restart
Landsraad.** The council `.env` is authoritative (it overrides any inherited
value) and is never indexed, exported, or served.

## Running instance registry

`GET /api/instances` returns the live set of running Landsraad processes on this machine:

```bash
curl http://localhost:10191/api/instances
# { "instances": [ { "pid": 12345, "port": 10191, "cwd": "...", "startedAt": "2026-..." }, ... ] }
```

The registry is shared via the file at `LANDSRAAD_INSTANCES_FILE`, so each instance sees the others. Crashed processes are pruned by PID liveness on every read.

### Cross-council meetings

Multiple councils running at once on the same machine can hold a **cross-council meeting**: when you create a meeting, the New Meeting page lists councillors from other running councils under "Remote councils". A remote attendee runs on its own council (its persona, memory, and adapter); your council orchestrates the meeting and owns the transcript. Summons are loopback-only — the server binds `127.0.0.1` and refuses cross-machine summon requests.

## API discovery

`GET /api/openapi.json` returns an OpenAPI 3.1 document describing the JSON `/api/*` surface — handy for tooling, codegen, or quick discovery:

```bash
curl http://localhost:10191/api/openapi.json | jq .paths
```

## Tests

```bash
npm test
```

Vitest covers the filesystem layer (`src/lib/server/`).

## Project layout

```
bin/landsraad.js           # npx entry (runs the built server in cwd)
src/
  lib/
    server/                # filesystem-backed council layer (paths, councils, councillors, memory, jobs, runner, indexer)
    types.ts               # shared types
  routes/                  # SvelteKit pages — flat: /, /council, /councillors/*, /memory/*, /jobs/*
scripts/
  dogfood-init.ts          # seed a council into ./dogfood (or a custom path)
  reindex.ts               # manual rebuild of the .landsraad/ index (council artifacts only;
                           #   product .md/.txt are indexed live by the watcher, not by this script)
SPECIFICATION.md           # what the product is supposed to be
docs/                      # architecture + data model + embeddings notes
```

## License

See [`LICENSE`](./LICENSE).
