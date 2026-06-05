import type { Oeuvre, OeuvreEventType, OeuvreParticipants, ParticipantState } from '$lib/types';
import {
  activeElapsedMs,
  appendOeuvreEvent,
  appendTurnLine,
  createOeuvre,
  defaultParticipantState,
  isTerminal,
  listOeuvres,
  pauseClock,
  readNote,
  readOeuvre,
  readOeuvreEvents,
  readParticipants,
  readScratchpad,
  readTurnLines,
  resumeClock,
  writeOeuvre,
  writeParticipants,
  writeScratchpad,
  type NewOeuvreInput
} from './oeuvres';
import { readCouncillor } from './councillors';
import { councilRoot } from './paths';
import { assembleContextFor } from './context';
import { resolveAdapter, type ResolvedAdapter, type ResolveAdapterOpts } from './adapters';
import { runAdapter } from './adapters/runAdapter';
import { createJob, readOutput, readInput } from './jobs';
import { runJobNow, cancelJob } from './runner';
import { current as lockCurrent } from './councillor-lock';
import { applyReflectionBlocks } from './reflection';
import {
  buildConsolidationPrompt,
  buildLeaderPickPrompt,
  buildWorkerBrief,
  participantsSummary
} from './oeuvre-prompt';
import { parseNext, parseScratchpad, parseVote } from './oeuvre-blocks';
import {
  MEETING_MODEL,
  OEUVRE_CONSOLIDATE_TIMEOUT_MS,
  OEUVRE_LEADER_PICK_TIMEOUT_MS,
  OEUVRE_TURN_TIMEOUT_MS
} from './config';

// ── Dependency injection seam (tests script the leader/worker output) ────────
// Carries ResolveAdapterOpts so call sites can pass the host-wide meeting model
// override (LANDSRAAD_MEETING_MODEL) the same way meeting call sites do.
type AdapterResolver = (adapterId: string, opts?: ResolveAdapterOpts) => ResolvedAdapter | null;
let resolveAdapterFn: AdapterResolver = (id, opts) => resolveAdapter(id, opts);
export function _setAdapterResolverForTests(fn: AdapterResolver | null): void {
  resolveAdapterFn = fn ?? ((id, opts) => resolveAdapter(id, opts));
}

// Every oeuvre LLM call (leader pick, worker turn, consolidation) runs under the
// same host-wide model lever as meetings, so an operator gets one knob for all
// councillor collaboration. A per-councillor `?model=` pin still wins.
const OEUVRE_ADAPTER_OPTS: ResolveAdapterOpts = { modelDefault: MEETING_MODEL };

// In-flight guard, keyed by oeuvre id. Doubles as a mutex shared with
// conclude/cancel so they never race a cycle.
const inFlight = new Set<string>();
// The worker job currently running for an oeuvre (so cancel/conclude can abort it).
const activeWorkerJob = new Map<string, string>();
// AbortControllers for the direct leader-pick / consolidation adapter calls.
const directAborters = new Map<string, AbortController>();

function nowIso(): string {
  return new Date().toISOString();
}

function byteLen(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Convenience wrapper: thin pass-through so routes have one entry point. */
export async function startOeuvre(input: NewOeuvreInput, now: Date = new Date()): Promise<Oeuvre> {
  const o = await createOeuvre(input, now);
  void advanceOeuvre(o.id);
  return o;
}

interface LeaderPick {
  ok: boolean;
  councillor?: string;
  say?: string;
  bytes: number;
}

async function runLeaderPick(o: Oeuvre, pool: string[], states: OeuvreParticipants): Promise<LeaderPick> {
  const leader = await readCouncillor(o.leader_slug);
  const adapter = resolveAdapterFn(leader.adapter, OEUVRE_ADAPTER_OPTS);
  if (!adapter) return { ok: false, bytes: 0 };

  const context = await assembleContextFor(o.leader_slug, o.goal);
  const note = await readNote(o.id);
  const scratchpad = await readScratchpad(o.id);
  const prompt = buildLeaderPickPrompt({
    persona: leader.persona,
    context,
    title: o.title,
    goal: o.goal,
    note,
    scratchpad,
    version: o.scratchpad_version,
    participantsSummary: participantsSummary(o.participants, states, o.scratchpad_version),
    leaderSlug: o.leader_slug
  });

  const controller = new AbortController();
  directAborters.set(o.id, controller);
  let bytes = byteLen(prompt);
  try {
    const res = await runAdapter({
      adapter,
      prompt,
      cwd: councilRoot(),
      timeoutMs: OEUVRE_LEADER_PICK_TIMEOUT_MS,
      abortSignal: controller.signal
    });
    bytes += byteLen(res.output);
    if (res.timedOut || res.exit_code !== 0) return { ok: false, bytes };
    const next = parseNext(res.output);
    if (!next || !next.councillor) return { ok: false, bytes };
    // The leader may not pick itself, a non-participant, or an out councillor.
    if (next.councillor === o.leader_slug) return { ok: false, bytes };
    if (!pool.includes(next.councillor)) return { ok: false, bytes };
    return { ok: true, councillor: next.councillor, say: next.say, bytes };
  } finally {
    directAborters.delete(o.id);
  }
}

interface TurnResult {
  status: 'succeeded' | 'failed' | 'deferred';
  output: string;
  bytes: number;
  jobId: string | null;
}

async function runWorkerTurn(
  o: Oeuvre,
  slug: string,
  say: string,
  turnIdx: number
): Promise<TurnResult> {
  // Defer if the councillor is busy with an unrelated job; the tick retries later.
  if (lockCurrent(slug)) return { status: 'deferred', output: '', bytes: 0, jobId: null };

  const councillor = await readCouncillor(slug);
  const adapter = resolveAdapterFn(councillor.adapter, OEUVRE_ADAPTER_OPTS);
  if (!adapter) {
    return { status: 'failed', output: '', bytes: 0, jobId: null };
  }

  const note = await readNote(o.id);
  const scratchpad = await readScratchpad(o.id);
  const brief = buildWorkerBrief({
    title: o.title,
    goal: o.goal,
    note,
    leaderSay: say,
    scratchpad,
    version: o.scratchpad_version
  });

  const job = await createJob({
    title: `${o.title} · turn ${turnIdx + 1} · ${slug}`,
    brief,
    councillor_slug: slug,
    oeuvre_id: o.id,
    oeuvre_turn_idx: turnIdx
  });
  activeWorkerJob.set(o.id, job.id);
  await appendOeuvreEvent(o.id, { at: nowIso(), type: 'turn_started', message: slug });

  try {
    const final = await runJobNow(job.id, {
      adapterOverride: adapter,
      skipReflection: true,
      timeoutMs: OEUVRE_TURN_TIMEOUT_MS
    }).catch(() => null);
    const output = await readOutput(job.id).catch(() => '');
    const input = await readInput(job.id).catch(() => '');
    const bytes = byteLen(input) + byteLen(output);
    const status = final?.status === 'succeeded' ? 'succeeded' : 'failed';
    return { status, output, bytes, jobId: job.id };
  } finally {
    activeWorkerJob.delete(o.id);
  }
}

async function setPaused(id: string, reason: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'active') return;
  pauseClock(o, nowIso());
  o.status = 'paused';
  o.pause_reason = reason;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: reason });
}

async function runConsolidation(o: Oeuvre): Promise<void> {
  try {
    const leader = await readCouncillor(o.leader_slug);
    const adapter = resolveAdapterFn(leader.adapter, OEUVRE_ADAPTER_OPTS);
    if (!adapter) {
      await appendOeuvreEvent(o.id, {
        at: nowIso(),
        type: 'consolidation_failed',
        message: `no adapter for leader ${o.leader_slug}`
      });
      return;
    }
    const context = await assembleContextFor(o.leader_slug, o.goal);
    const scratchpad = await readScratchpad(o.id);
    const turns = await readTurnLines(o.id);
    const workLog = turns
      .filter((t) => t.kind === 'turn')
      .map(
        (t) =>
          `- turn ${(t.turn_idx ?? 0) + 1}: ${t.councillor} — ${t.edited ? 'edited' : 'ratified'} — vote ${t.vote}: ${t.reason}`
      )
      .join('\n');
    const prompt = buildConsolidationPrompt({
      persona: leader.persona,
      context,
      title: o.title,
      goal: o.goal,
      scratchpad,
      workLog
    });
    const controller = new AbortController();
    directAborters.set(o.id + ':consolidate', controller);
    let res;
    try {
      res = await runAdapter({
        adapter,
        prompt,
        cwd: councilRoot(),
        timeoutMs: OEUVRE_CONSOLIDATE_TIMEOUT_MS,
        abortSignal: controller.signal
      });
    } finally {
      directAborters.delete(o.id + ':consolidate');
    }
    const fresh = await readOeuvre(o.id);
    fresh.text_bytes += byteLen(prompt) + byteLen(res.output);
    await writeOeuvre(fresh);
    if (res.timedOut || res.exit_code !== 0) {
      await appendOeuvreEvent(o.id, {
        at: nowIso(),
        type: 'consolidation_failed',
        message: res.timedOut ? 'consolidation timed out' : `exit ${res.exit_code}`
      });
      return;
    }
    const apply = await applyReflectionBlocks({
      text: res.output,
      sourceCouncillorSlug: o.leader_slug,
      sourceKind: 'oeuvre',
      sourceId: o.id
    });
    const withResults = await readOeuvre(o.id);
    withResults.memory_slugs = apply.memorySlugs;
    withResults.shared_memory_slugs = apply.sharedMemorySlugs;
    withResults.proposed_jobs = apply.proposalIds;
    await writeOeuvre(withResults);
    await appendOeuvreEvent(o.id, {
      at: nowIso(),
      type: 'consolidated',
      message: `mem=${apply.memorySlugs.length} shared=${apply.sharedMemorySlugs.length} proposals=${apply.proposalIds.length}`
    });
  } catch (err) {
    await appendOeuvreEvent(o.id, {
      at: nowIso(),
      type: 'consolidation_failed',
      message: err instanceof Error ? err.message : String(err)
    }).catch(() => {});
  }
}

async function beginConcluding(
  id: string,
  reasonType: OeuvreEventType | null,
  detail?: string
): Promise<void> {
  const fresh = await readOeuvre(id);
  if (isTerminal(fresh.status) || fresh.status === 'concluding') return;
  fresh.status = 'concluding';
  await writeOeuvre(fresh);
  if (reasonType) await appendOeuvreEvent(id, { at: nowIso(), type: reasonType, message: detail });
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluding', message: detail });
  await runConsolidation(fresh);
  const done = await readOeuvre(id);
  done.status = 'concluded';
  done.concluded_at = nowIso();
  await writeOeuvre(done);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluded' });
}

/**
 * One cycle of the loop: budget/pool/conclusion checks, then a leader pick + one
 * worker turn. Idempotent — a no-op while a cycle is in flight or the oeuvre is
 * not active. Re-triggers itself after a productive turn (event-driven advance).
 */
export async function advanceOeuvre(id: string): Promise<void> {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  let reschedule = false;
  try {
    const o = await readOeuvre(id).catch(() => null);
    if (!o || o.status !== 'active') return;

    // 1. Budget caps.
    if (o.total_turns >= o.policy.max_turns) {
      await beginConcluding(id, 'budget_exceeded', 'max_turns');
      return;
    }
    if (activeElapsedMs(o, Date.now()) >= o.policy.max_wall_ms) {
      await beginConcluding(id, 'budget_exceeded', 'max_wall_ms');
      return;
    }
    if (o.text_bytes >= o.policy.max_text_bytes) {
      await beginConcluding(id, 'budget_exceeded', 'max_text_bytes');
      return;
    }

    const states = await readParticipants(id);
    const pool = o.participants.filter((s) => !states[s]?.out);

    // 2. Pool exhausted (everyone dropped out on failures).
    if (pool.length === 0) {
      await beginConcluding(id, 'pool_exhausted', 'all participants out');
      return;
    }

    // 3. Convergence: every in-pool participant's latest vote is finish @ current version.
    const converged = pool.every(
      (s) => states[s]?.vote === 'finish' && states[s]?.scratchpad_version === o.scratchpad_version
    );
    if (converged) {
      await beginConcluding(id, 'converged', 'all participants voted finish');
      return;
    }

    // 4. Leader picks the next worker.
    const pick = await runLeaderPick(o, pool, states);
    if (!pick.ok) {
      o.leader_failures += 1;
      o.text_bytes += pick.bytes;
      if (o.leader_failures >= o.policy.max_consecutive_failures) {
        await writeOeuvre(o);
        await setPaused(id, 'leader_unavailable');
        return;
      }
      await writeOeuvre(o);
      // Re-ask on the next tick rather than tight-looping here.
      return;
    }
    o.leader_failures = 0;
    o.text_bytes += pick.bytes;
    await writeOeuvre(o);
    await appendTurnLine(id, {
      kind: 'leader_pick',
      leader: o.leader_slug,
      picked: pick.councillor,
      say: pick.say,
      ts: nowIso()
    });
    await appendOeuvreEvent(id, {
      at: nowIso(),
      type: 'leader_pick',
      message: `${o.leader_slug} → ${pick.councillor}`
    });

    // 5. Worker turn (a real job).
    const turnIdx = o.total_turns;
    const result = await runWorkerTurn(o, pick.councillor!, pick.say ?? '', turnIdx);
    if (result.status === 'deferred') {
      // Councillor busy; let the tick retry.
      return;
    }

    const states2 = await readParticipants(id);
    const o2 = await readOeuvre(id);
    const ts = nowIso();

    if (result.status === 'succeeded') {
      const edit = parseScratchpad(result.output);
      const currentScratch = (await readScratchpad(id)).trim();
      let version = o2.scratchpad_version;
      let edited = false;
      if (edit !== null && edit.trim() && edit.trim() !== currentScratch) {
        await writeScratchpad(id, edit.trim() + '\n');
        version = o2.scratchpad_version + 1;
        edited = true;
      }
      const vote = parseVote(result.output);
      states2[pick.councillor!] = {
        vote: vote.value,
        reason: vote.reason,
        scratchpad_version: version,
        turn_idx: turnIdx,
        failures: 0,
        out: false,
        ts
      };
      await writeParticipants(id, states2);

      o2.scratchpad_version = version;
      o2.total_turns += 1;
      o2.text_bytes += result.bytes;
      await writeOeuvre(o2);

      if (edited) {
        await appendOeuvreEvent(id, { at: ts, type: 'scratchpad_edited', message: `v${version}` });
      }
      await appendTurnLine(id, {
        kind: 'turn',
        councillor: pick.councillor,
        turn_idx: turnIdx,
        job_id: result.jobId ?? undefined,
        edited,
        scratchpad_version: version,
        vote: vote.value,
        reason: vote.reason,
        ts
      });
      await appendOeuvreEvent(id, {
        at: ts,
        type: 'vote',
        message: `${pick.councillor}: ${vote.value}`
      });
      await appendOeuvreEvent(id, { at: ts, type: 'turn_finished', message: pick.councillor });
    } else {
      // Failed turn — drop the councillor from the pool after enough failures so a
      // broken adapter can't deadlock the vote.
      const prev: ParticipantState = states2[pick.councillor!] ?? defaultParticipantState();
      const failures = prev.failures + 1;
      const out = failures >= o2.policy.max_consecutive_failures;
      states2[pick.councillor!] = { ...prev, failures, out, turn_idx: turnIdx, ts };
      await writeParticipants(id, states2);

      o2.total_turns += 1;
      o2.text_bytes += result.bytes;
      await writeOeuvre(o2);

      await appendTurnLine(id, {
        kind: 'turn_failed',
        councillor: pick.councillor,
        turn_idx: turnIdx,
        job_id: result.jobId ?? undefined,
        failures,
        out,
        ts
      });
      await appendOeuvreEvent(id, {
        at: ts,
        type: out ? 'participant_out' : 'turn_failed',
        message: pick.councillor
      });
    }

    // Only keep looping if the director hasn't paused/cancelled meanwhile.
    reschedule = o2.status === 'active';
  } catch (err) {
    await appendOeuvreEvent(id, {
      at: nowIso(),
      type: 'note',
      message: `advance error: ${err instanceof Error ? err.message : String(err)}`
    }).catch(() => {});
  } finally {
    inFlight.delete(id);
  }
  if (reschedule) void advanceOeuvre(id);
}

// ── Director controls ───────────────────────────────────────────────────────

export async function pauseOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'active') return;
  pauseClock(o, nowIso());
  o.status = 'paused';
  o.pause_reason = undefined;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'paused', message: 'director' });
}

export async function resumeOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);
  if (o.status !== 'paused') return;
  resumeClock(o, nowIso());
  o.status = 'active';
  o.pause_reason = undefined;
  o.leader_failures = 0;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'resumed' });
  void advanceOeuvre(id);
}

async function abortAndSettle(id: string): Promise<void> {
  const jid = activeWorkerJob.get(id);
  if (jid) await cancelJob(jid);
  directAborters.get(id)?.abort();
  for (let i = 0; i < 100 && inFlight.has(id); i++) await delay(20);
}

export async function concludeOeuvre(id: string): Promise<void> {
  const o = await readOeuvre(id);
  if (isTerminal(o.status) || o.status === 'concluding') return;
  // Mark concluding up front so any in-flight/rescheduled cycle sees a non-active
  // status and bails instead of starting another turn.
  o.status = 'concluding';
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluding', message: 'director' });
  await abortAndSettle(id);
  await runConsolidation(await readOeuvre(id));
  const done = await readOeuvre(id);
  done.status = 'concluded';
  done.concluded_at = nowIso();
  await writeOeuvre(done);
  await appendOeuvreEvent(id, { at: nowIso(), type: 'concluded' });
}

export async function cancelOeuvre(id: string, now: Date = new Date()): Promise<void> {
  const o = await readOeuvre(id);
  if (isTerminal(o.status)) return;
  // Mark cancelled up front (same reasoning as conclude) so the loop stops.
  o.status = 'cancelled';
  o.concluded_at = now.toISOString();
  o.pause_reason = undefined;
  await writeOeuvre(o);
  await appendOeuvreEvent(id, { at: now.toISOString(), type: 'cancelled' });
  await abortAndSettle(id);
}

export async function recoverOeuvres(now: Date = new Date()): Promise<void> {
  const all = await listOeuvres();
  for (const o of all) {
    // Heal oeuvres a PRIOR build's crash-recovery wrongly marked terminal-`failed`.
    // That code was the only producer of `failed`, and always stamped a
    // `crashed_during=` reason — so such an oeuvre is a crash victim with durable
    // state, not a real failure. Revive it to `paused` so the director can Resume.
    if (o.status === 'failed' && (o.pause_reason ?? '').startsWith('crashed_during=')) {
      o.status = 'paused';
      o.concluded_at = null;
      await writeOeuvre(o);
      await appendOeuvreEvent(o.id, {
        at: now.toISOString(),
        type: 'note',
        message: 'recovered: failed→paused (resumable)'
      });
      continue;
    }
    if (isTerminal(o.status)) continue;
    // A deliberately director-paused oeuvre simply survives the restart as-is —
    // it didn't crash, so don't relabel or stop its (already-stopped) clock.
    if (o.status === 'paused') continue;
    const priorStatus = o.status;
    // Park it as paused so the director can review and Resume from the durable
    // scratchpad/votes/turns — losing a long loop's progress to one restart is far
    // costlier than the single in-flight turn that's lost (its worker job is flipped
    // to failed by job recovery; the turn was never recorded, so resume just re-picks).
    // Fold active time only up to the last recorded activity, so the crash→restart
    // downtime never counts against the wall budget.
    const events = await readOeuvreEvents(o.id).catch(() => []);
    const lastAliveIso = events.length ? events[events.length - 1].at : (o.active_since ?? o.started_at);
    pauseClock(o, lastAliveIso);
    o.status = 'paused';
    o.pause_reason = `crashed_during=${priorStatus}`;
    await writeOeuvre(o);
    await appendOeuvreEvent(o.id, {
      at: now.toISOString(),
      type: 'crashed',
      message: `crashed_during=${priorStatus}`
    });
  }
}

/** Poke the active oeuvre forward; called from the scheduler tick. */
export async function tickOeuvres(): Promise<void> {
  const active = await listOeuvres({ status: 'active' });
  for (const o of active) void advanceOeuvre(o.id);
}
