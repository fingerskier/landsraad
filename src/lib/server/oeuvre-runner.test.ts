import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  _setAdapterResolverForTests,
  advanceOeuvre,
  cancelOeuvre,
  concludeOeuvre,
  pauseOeuvre,
  recoverOeuvres,
  resumeOeuvre,
  startOeuvre
} from './oeuvre-runner';
import { createOeuvre, readOeuvre, readParticipants, readScratchpad, readOeuvreEvents, writeNote } from './oeuvres';
import type { OeuvreStatus, OeuvreEventType } from '$lib/types';
import { _resetForTests as resetLock } from './councillor-lock';
import { createCouncil } from './councils';
import { createCouncillor } from './councillors';
import type { ResolvedAdapter, ResolveAdapterOpts } from './adapters';
import { MEETING_MODEL } from './config';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Script {
  (prompt: string): { stdout: string; exit?: number; delayMs?: number };
}

function installScripts(scripts: Record<string, Script>): void {
  _setAdapterResolverForTests((adapterId): ResolvedAdapter | null => {
    const fn = scripts[adapterId];
    if (!fn) return null;
    return {
      id: adapterId,
      kind: 'mock',
      run: ({ prompt, signal }) => {
        const r = fn(prompt);
        async function* chunks() {
          if (r.stdout) yield { stream: 'stdout' as const, text: r.stdout };
        }
        const result = (async () => {
          if (r.delayMs) {
            await new Promise<void>((res, rej) => {
              const t = setTimeout(res, r.delayMs);
              if (signal) {
                if (signal.aborted) {
                  clearTimeout(t);
                  rej(new Error('aborted'));
                } else {
                  signal.addEventListener('abort', () => {
                    clearTimeout(t);
                    rej(new Error('aborted'));
                  }, { once: true });
                }
              }
            }).catch(() => {});
          }
          if (signal?.aborted) return { exit_code: 130, stdout: '', stderr: 'aborted\n' };
          return { exit_code: r.exit ?? 0, stdout: r.stdout, stderr: r.exit ? 'err\n' : '' };
        })();
        return { chunks: chunks(), result };
      }
    };
  });
}

async function setup() {
  process.env.LANDSRAAD_COUNCIL_ROOT = mkdtempSync(join(tmpdir(), 'landsraad-or-'));
  resetLock();
  await createCouncil({ name: 'T', description: '' });
  await createCouncillor({ name: 'Leo', role: 'leader', routing_hint: '', adapter: 's-leo', persona: 'p' });
  await createCouncillor({ name: 'Alice', role: 'maker', routing_hint: '', adapter: 's-alice', persona: 'p' });
  await createCouncillor({ name: 'Bob', role: 'critic', routing_hint: '', adapter: 's-bob', persona: 'p' });
  await createCouncillor({ name: 'Zed', role: 'flaky', routing_hint: '', adapter: 's-zed', persona: 'p' });
}

afterEach(() => {
  _setAdapterResolverForTests(null);
});

async function waitForTerminal(id: string, ms = 3000): Promise<OeuvreStatus> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const o = await readOeuvre(id);
    if (['concluded', 'cancelled', 'failed'].includes(o.status)) return o.status;
    await delay(10);
  }
  throw new Error('oeuvre did not reach a terminal state in time');
}

function leaderPicker(seq: string[], consolidationOut = '<<MEMORY title="lesson" scope="shared">>we shipped<</MEMORY>>'): Script {
  let i = 0;
  return (prompt) =>
    /consolidation/i.test(prompt)
      ? { stdout: consolidationOut }
      : { stdout: `<<NEXT councillor="${seq[Math.min(i++, seq.length - 1)]}" say="go">>` };
}

async function eventTypes(id: string): Promise<OeuvreEventType[]> {
  return (await readOeuvreEvents(id)).map((e) => e.type);
}

describe('oeuvre-runner happy path', () => {
  beforeEach(setup);

  it('loops leader→worker until all in-pool votes are finish, then consolidates', async () => {
    let aliceN = 0;
    installScripts({
      's-leo': leaderPicker(['alice', 'bob', 'alice']),
      's-alice': () =>
        aliceN++ === 0
          ? { stdout: '<<SCRATCHPAD>>\n# Plan\n- step\n<</SCRATCHPAD>>\n<<VOTE value="continue" reason="draft">>' }
          : { stdout: '<<VOTE value="finish" reason="good">>' },
      's-bob': () => ({ stdout: '<<VOTE value="finish" reason="lgtm">>' })
    });

    const o = await startOeuvre({ title: 'Launch', goal: 'Plan the launch', leader_slug: 'leo', participants: ['alice', 'bob'] });
    const status = await waitForTerminal(o.id);

    expect(status).toBe('concluded');
    const final = await readOeuvre(o.id);
    expect(final.total_turns).toBe(3);
    expect(await readScratchpad(o.id)).toContain('# Plan');
    expect(final.shared_memory_slugs?.length).toBe(1);
    expect(await eventTypes(o.id)).toContain('converged');
    expect(await eventTypes(o.id)).toContain('consolidated');
  });
});

describe('oeuvre-runner rolling-vote freshness (staleness)', () => {
  beforeEach(setup);

  it('an edit invalidates standing finish votes, so a re-ratify is required', async () => {
    let aliceN = 0;
    installScripts({
      's-leo': leaderPicker(['alice', 'bob', 'alice']),
      's-alice': () =>
        aliceN++ === 0
          ? { stdout: '<<SCRATCHPAD>>\n# A\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="a">>' }
          : { stdout: '<<VOTE value="finish" reason="a2">>' },
      's-bob': () => ({ stdout: '<<SCRATCHPAD>>\n# B\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="b">>' })
    });

    const o = await startOeuvre({ title: 'Freshness', goal: 'g', leader_slug: 'leo', participants: ['alice', 'bob'] });
    expect(await waitForTerminal(o.id)).toBe('concluded');
    const final = await readOeuvre(o.id);
    // Alice(edit v1,finish) Bob(edit v2,finish→alice stale) Alice(ratify,finish v2) → converge.
    // If stale finishes counted, this would conclude after 2 turns.
    expect(final.total_turns).toBe(3);
    expect(final.scratchpad_version).toBe(2);
    expect(await readScratchpad(o.id)).toContain('# B');
  });
});

describe('oeuvre-runner error-out', () => {
  beforeEach(setup);

  it('drops a repeatedly-failing councillor from the vote pool so the loop can still finish', async () => {
    installScripts({
      's-leo': leaderPicker(['zed', 'zed', 'alice']),
      's-zed': () => ({ stdout: '', exit: 1 }),
      's-alice': () => ({ stdout: '<<VOTE value="finish" reason="ok">>' })
    });

    const o = await startOeuvre({
      title: 'Resilient',
      goal: 'g',
      leader_slug: 'leo',
      participants: ['alice', 'zed'],
      policy: { max_consecutive_failures: 2 }
    });
    expect(await waitForTerminal(o.id)).toBe('concluded');
    const states = await readParticipants(o.id);
    expect(states.zed.out).toBe(true);
    expect(states.alice.vote).toBe('finish');
    expect(await eventTypes(o.id)).toContain('participant_out');
  });
});

describe('oeuvre-runner budgets', () => {
  beforeEach(setup);

  it('concludes on the turn-count budget', async () => {
    installScripts({
      's-leo': leaderPicker(['alice', 'alice', 'alice']),
      's-alice': () => ({ stdout: '<<VOTE value="continue" reason="more">>' })
    });
    const o = await startOeuvre({
      title: 'Capped',
      goal: 'g',
      leader_slug: 'leo',
      participants: ['alice'],
      policy: { max_turns: 2 }
    });
    expect(await waitForTerminal(o.id)).toBe('concluded');
    const final = await readOeuvre(o.id);
    expect(final.total_turns).toBe(2);
    const msgs = (await readOeuvreEvents(o.id)).filter((e) => e.type === 'budget_exceeded');
    expect(msgs[0]?.message).toBe('max_turns');
  });

  it('concludes on the text-size budget', async () => {
    installScripts({
      's-leo': leaderPicker(['alice']),
      's-alice': () => ({ stdout: '<<VOTE value="continue" reason="more">>' })
    });
    const o = await startOeuvre({
      title: 'TextCap',
      goal: 'g',
      leader_slug: 'leo',
      participants: ['alice'],
      policy: { max_text_bytes: 5 }
    });
    expect(await waitForTerminal(o.id)).toBe('concluded');
    const msgs = (await readOeuvreEvents(o.id)).filter((e) => e.type === 'budget_exceeded');
    expect(msgs[0]?.message).toBe('max_text_bytes');
  });

  it('concludes when the whole pool drops out', async () => {
    installScripts({
      's-leo': leaderPicker(['zed']),
      's-zed': () => ({ stdout: '', exit: 1 })
    });
    const o = await startOeuvre({
      title: 'Exhausted',
      goal: 'g',
      leader_slug: 'leo',
      participants: ['zed'],
      policy: { max_consecutive_failures: 1 }
    });
    expect(await waitForTerminal(o.id)).toBe('concluded');
    expect(await eventTypes(o.id)).toContain('pool_exhausted');
  });
});

describe('oeuvre-runner steering + director controls', () => {
  beforeEach(setup);

  it('picks up a director note edited after creation', async () => {
    const seen: string[] = [];
    installScripts({
      's-leo': (p) => {
        seen.push(p);
        return /consolidation/i.test(p) ? { stdout: '' } : { stdout: '<<NEXT councillor="alice">>' };
      },
      's-alice': () => ({ stdout: '<<VOTE value="continue" reason="more">>' })
    });
    // createOeuvre (not startOeuvre) so we can edit the note before the first cycle.
    const o = await createOeuvre({
      title: 'Steered',
      goal: 'g',
      leader_slug: 'leo',
      participants: ['alice'],
      policy: { max_turns: 1 }
    });
    await writeNote(o.id, 'FOCUS-XYZ-MARKER');
    await advanceOeuvre(o.id);
    await waitForTerminal(o.id);
    expect(seen.some((p) => p.includes('FOCUS-XYZ-MARKER'))).toBe(true);
  });

  it('conclude-now from active runs consolidation immediately', async () => {
    installScripts({ 's-leo': leaderPicker(['alice']), 's-alice': () => ({ stdout: '' }) });
    const o = await createOeuvre({ title: 'Done', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await concludeOeuvre(o.id);
    const final = await readOeuvre(o.id);
    expect(final.status).toBe('concluded');
    expect(final.shared_memory_slugs?.length).toBe(1);
    const concluding = (await readOeuvreEvents(o.id)).find((e) => e.type === 'concluding');
    expect(concluding?.message).toBe('director');
  });

  it('conclude-now works from paused too', async () => {
    installScripts({ 's-leo': leaderPicker(['alice']), 's-alice': () => ({ stdout: '' }) });
    const o = await createOeuvre({ title: 'Paused', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await pauseOeuvre(o.id);
    expect((await readOeuvre(o.id)).status).toBe('paused');
    await concludeOeuvre(o.id);
    expect((await readOeuvre(o.id)).status).toBe('concluded');
  });

  it('a failed consolidation is non-fatal — still reaches concluded', async () => {
    installScripts({ 's-leo': (p) => (/consolidation/i.test(p) ? { stdout: '', exit: 1 } : { stdout: '<<NEXT councillor="alice">>' }) });
    const o = await createOeuvre({ title: 'BadConsolidate', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await concludeOeuvre(o.id);
    const final = await readOeuvre(o.id);
    expect(final.status).toBe('concluded');
    expect(await eventTypes(o.id)).toContain('consolidation_failed');
  });

  it('cancel mid-turn aborts the loop without consolidating', async () => {
    installScripts({
      's-leo': leaderPicker(['alice']),
      's-alice': () => ({ stdout: '<<VOTE value="continue" reason="slow">>', delayMs: 250 })
    });
    const o = await startOeuvre({ title: 'Cancelled', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await delay(60);
    await cancelOeuvre(o.id);
    expect((await readOeuvre(o.id)).status).toBe('cancelled');
    const types = await eventTypes(o.id);
    expect(types).toContain('cancelled');
    expect(types).not.toContain('concluded');
    expect(types).not.toContain('consolidated');
  });
});

describe('oeuvre-runner crash recovery', () => {
  beforeEach(setup);

  it('parks a crashed (non-terminal) oeuvre as paused so the director can resume it', async () => {
    installScripts({ 's-leo': leaderPicker(['alice']), 's-alice': () => ({ stdout: '' }) });
    const o = await createOeuvre({ title: 'Crash', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await recoverOeuvres();
    const parked = await readOeuvre(o.id);
    expect(parked.status).toBe('paused');
    expect(parked.pause_reason).toContain('crashed_during=active');
    // The wall-clock was stopped so post-crash downtime can't burn the budget.
    expect(parked.active_since == null).toBe(true);
    expect(typeof parked.active_ms).toBe('number');
    expect(await eventTypes(o.id)).toContain('crashed');
  });

  it('resumes a crash-parked oeuvre and drives it to completion', async () => {
    installScripts({
      's-leo': leaderPicker(['alice']),
      's-alice': () => ({ stdout: '<<SCRATCHPAD>>\n# P\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="ok">>' })
    });
    const o = await createOeuvre({ title: 'CrashResume', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await recoverOeuvres();
    expect((await readOeuvre(o.id)).status).toBe('paused');

    await resumeOeuvre(o.id);
    expect(await waitForTerminal(o.id)).toBe('concluded');
    expect((await readScratchpad(o.id))).toContain('# P');
  });

  it('leaves a director-paused oeuvre paused on restart (not marked crashed)', async () => {
    installScripts({ 's-leo': leaderPicker(['alice']), 's-alice': () => ({ stdout: '<<VOTE value="continue" reason="x">>' }) });
    const o = await createOeuvre({ title: 'Parked', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await pauseOeuvre(o.id);
    await recoverOeuvres();
    const after = await readOeuvre(o.id);
    expect(after.status).toBe('paused');
    expect(after.pause_reason ?? '').not.toContain('crashed');
  });
});

describe('oeuvre-runner applies LANDSRAAD_MEETING_MODEL', () => {
  beforeEach(setup);

  it('resolves every oeuvre LLM call (leader pick, worker turn, consolidation) with the meeting model as modelDefault', async () => {
    const seenOpts: Array<ResolveAdapterOpts | undefined> = [];
    const scripts: Record<string, Script> = {
      's-leo': leaderPicker(['alice']),
      's-alice': () => ({ stdout: '<<SCRATCHPAD>>\n# P\n<</SCRATCHPAD>>\n<<VOTE value="finish" reason="ok">>' })
    };
    _setAdapterResolverForTests((adapterId, opts): ResolvedAdapter | null => {
      seenOpts.push(opts);
      const fn = scripts[adapterId];
      if (!fn) return null;
      return {
        id: adapterId,
        kind: 'mock',
        run: ({ prompt }) => {
          const r = fn(prompt);
          async function* chunks() {
            if (r.stdout) yield { stream: 'stdout' as const, text: r.stdout };
          }
          return { chunks: chunks(), result: Promise.resolve({ exit_code: 0, stdout: r.stdout, stderr: '' }) };
        }
      };
    });

    const o = await startOeuvre({ title: 'Model', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await waitForTerminal(o.id);

    // At minimum: one leader pick + one worker turn + one consolidation call.
    expect(seenOpts.length).toBeGreaterThanOrEqual(3);
    // Every resolve carries the host-wide meeting model (default '' in tests), proving
    // the wiring — an unwired call site would pass `undefined` and fail this.
    expect(seenOpts.every((opts) => opts?.modelDefault === MEETING_MODEL)).toBe(true);
  });
});
