import { describe, it, expect } from 'vitest';
import { resolveSource } from './index-sources';

describe('oeuvre index source', () => {
  it('resolves the scratchpad path to the oeuvre_scratchpad kind', () => {
    const src = resolveSource('.landsraad/oeuvres/2026-06-05T00-00-00-000Z-x/scratchpad.md');
    expect(src?.kind).toBe('oeuvre_scratchpad');
    expect(src?.refId('.landsraad/oeuvres/2026-06-05T00-00-00-000Z-x/scratchpad.md')).toBe(
      '2026-06-05T00-00-00-000Z-x'
    );
  });

  it('does not match note.md or participants.json', () => {
    expect(resolveSource('.landsraad/oeuvres/x/note.md')).toBeNull();
    expect(resolveSource('.landsraad/oeuvres/x/participants.json')).toBeNull();
  });
});
