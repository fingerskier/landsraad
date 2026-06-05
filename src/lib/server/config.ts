export const MEMORY_TOPK_SHARED = 8;
export const MEMORY_TOPK_PRIVATE = 8;
export const MEMORY_CHAR_BUDGET = 12000;

// Workspace (product-tree) retrieval. `PROJECT_TOPK` is how many `project_file`
// hits to pull into a prompt's "Project context" section (sharing MEMORY_CHAR_BUDGET
// with the memory buckets). `INDEX_MAX_FILE_BYTES` is the per-file ceiling for
// indexing a product doc — a real byte count, to keep one huge text file from
// dominating the index. (Both read via envInt, hoisted below.)
export const PROJECT_TOPK = envInt('LANDSRAAD_PROJECT_TOPK', 6);
export const INDEX_MAX_FILE_BYTES = envInt('LANDSRAAD_INDEX_MAX_FILE_BYTES', 512_000);

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envStr(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() ? v : fallback;
}

export const MEETING_WINDOW_K_DEFAULT = envInt('LANDSRAAD_MEETING_WINDOW_K', 4);
export const MEETING_TURN_TIMEOUT_MS = envInt('LANDSRAAD_MEETING_TURN_TIMEOUT_MS', 300_000);
export const MEETING_SUMMARY_TIMEOUT_MS = envInt('LANDSRAAD_MEETING_SUMMARY_TIMEOUT_MS', 300_000);
export const PEER_DISCOVERY_TIMEOUT_MS = envInt('LANDSRAAD_PEER_DISCOVERY_TIMEOUT_MS', 2_000);

/**
 * Appended to every meeting turn's speaker instruction and every oeuvre worker
 * turn brief. Empty by default. Set e.g.
 * `LANDSRAAD_MEETING_TURN_NUDGE="Be terse — 1-3 sentences."` to ask councillors
 * for shorter responses during councillor collaboration. Chair-side only — one
 * knob governs the whole meeting (including remote peers) and the oeuvre loop.
 */
export const MEETING_TURN_NUDGE = envStr('LANDSRAAD_MEETING_TURN_NUDGE', '');

/**
 * Host-wide model override for meeting and oeuvre turns. Empty by default. When
 * set, every meeting LLM call this server runs — attendee turns, rolling summaries,
 * and the closing synthesis — plus every oeuvre LLM call — leader picks, worker
 * turns, and consolidation — uses this model instead of the CLI's default, letting
 * an operator run cheap/fast councillor collaboration without editing each
 * councillor. The value is
 * either a literal model id (`LANDSRAAD_MEETING_MODEL=haiku`) or a
 * service-agnostic tier (`lite`/`medium`/`heavy`) that each adapter maps to its
 * own model — so one tier means the same intent across a mixed fleet. A
 * per-councillor `?model=` pin in the adapter string still wins. Per-process:
 * each participating server reads its own value, so it also governs the turns it
 * serves as a remote peer.
 */
export const MEETING_MODEL = envStr('LANDSRAAD_MEETING_MODEL', '');

// ── Oeuvre (goal-driven work loop) ──────────────────────────────────────────
// Budgets are the governance that replaces the per-step proposal-approval gate:
// the loop runs autonomously between turns, so a turn count, a wall-clock cap,
// and a cumulative text-size cap (a real byte count, surfaced as "Text KB/MB" —
// never called tokens, since CLI adapters don't report token usage) bound the cost.
export const OEUVRE_MAX_TURNS_DEFAULT = envInt('LANDSRAAD_OEUVRE_MAX_TURNS', 30);
export const OEUVRE_MAX_WALL_MS_DEFAULT = envInt('LANDSRAAD_OEUVRE_MAX_WALL_MS', 3_600_000);
export const OEUVRE_MAX_TEXT_BYTES_DEFAULT = envInt('LANDSRAAD_OEUVRE_MAX_TEXT_BYTES', 2_000_000);
export const OEUVRE_MAX_CONSEC_FAILURES = envInt('LANDSRAAD_OEUVRE_MAX_CONSEC_FAILURES', 3);
export const OEUVRE_TURN_TIMEOUT_MS = envInt('LANDSRAAD_OEUVRE_TURN_TIMEOUT_MS', 300_000);
export const OEUVRE_LEADER_PICK_TIMEOUT_MS = envInt('LANDSRAAD_OEUVRE_LEADER_PICK_TIMEOUT_MS', 120_000);
export const OEUVRE_CONSOLIDATE_TIMEOUT_MS = envInt('LANDSRAAD_OEUVRE_CONSOLIDATE_TIMEOUT_MS', 120_000);
