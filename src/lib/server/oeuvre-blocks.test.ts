import { describe, it, expect } from 'vitest';
import { parseNext, parseScratchpad, parseVote } from './oeuvre-blocks';

describe('parseNext', () => {
  it('extracts councillor and say', () => {
    const n = parseNext('blah <<NEXT councillor="alice" say="focus on costs">> trailing');
    expect(n).toEqual({ councillor: 'alice', say: 'focus on costs' });
  });

  it('tolerates whitespace and missing say', () => {
    const n = parseNext('   <<NEXT   councillor="bob" >>\n');
    expect(n?.councillor).toBe('bob');
    expect(n?.say).toBe('');
  });

  it('returns null when no block', () => {
    expect(parseNext('nothing here')).toBeNull();
  });

  it('returns null councillor when omitted', () => {
    expect(parseNext('<<NEXT say="hi">>')).toEqual({ councillor: null, say: 'hi' });
  });
});

describe('parseScratchpad', () => {
  it('returns inner body trimmed of leading newline + trailing space', () => {
    const s = parseScratchpad('pre <<SCRATCHPAD>>\n# Plan\n- a\n<</SCRATCHPAD>> post');
    expect(s).toBe('# Plan\n- a');
  });

  it('returns null when absent', () => {
    expect(parseScratchpad('no block, just a vote')).toBeNull();
  });
});

describe('parseVote', () => {
  it('parses finish with attribute reason', () => {
    expect(parseVote('<<VOTE value="finish" reason="looks done">>')).toEqual({
      value: 'finish',
      reason: 'looks done'
    });
  });

  it('parses continue with body reason', () => {
    expect(parseVote('<<VOTE value="continue">>still rough<</VOTE>>')).toEqual({
      value: 'continue',
      reason: 'still rough'
    });
  });

  it('defaults to continue when missing (never spuriously finishes)', () => {
    expect(parseVote('no vote at all').value).toBe('continue');
  });

  it('defaults to continue when value is garbage', () => {
    expect(parseVote('<<VOTE value="maybe">>').value).toBe('continue');
  });
});
