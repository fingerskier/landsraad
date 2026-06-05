import { describe, it, expect } from 'vitest';
import { buildWorkerBrief } from './oeuvre-prompt';

const base = { title: 'T', goal: 'Ship it', note: '', leaderSay: '', scratchpad: '', version: 0 };

describe('buildWorkerBrief — meeting turn nudge', () => {
  it('appends the brevity nudge to the worker brief when one is set', () => {
    const brief = buildWorkerBrief(base, 'Be terse — 1-3 sentences.');
    expect(brief).toContain('Be terse — 1-3 sentences.');
  });

  it('omits the nudge when it is empty', () => {
    const brief = buildWorkerBrief(base, '');
    expect(brief).not.toContain('Be terse');
    // A non-empty nudge is the only difference, so the empty form must not carry it.
    expect(brief).not.toContain('PLACEHOLDER_NUDGE');
    expect(buildWorkerBrief(base, 'PLACEHOLDER_NUDGE')).toContain('PLACEHOLDER_NUDGE');
  });
});
