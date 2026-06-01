import { describe, expect, it } from 'vitest';
import { listBundledTemplates } from './templates';

describe('listBundledTemplates', () => {
  it('returns the templates from example/', async () => {
    const list = await listBundledTemplates();
    const slugs = list.map((t) => t.slug).sort();
    expect(slugs).toEqual(
      ['c-suite', 'engineering', 'hedge-fund', 'landsraad', 'writing-team'].sort()
    );
    const hedge = list.find((t) => t.slug === 'hedge-fund');
    expect(hedge).toBeDefined();
    expect(hedge!.name).toBe('Hedge Fund');
    expect(hedge!.source).toMatch(/[\\/]example[\\/]hedge-fund\.template\.json$/);
  });

  it('every bundled template seeds the meeting defaults', async () => {
    const { listBundledTemplates, loadTemplate } = await import('./templates');
    const bundled = await listBundledTemplates();
    expect(bundled.length).toBeGreaterThan(0);
    for (const b of bundled) {
      const t = await loadTemplate(b.source);
      const byKey = new Map((t.env ?? []).map((e) => [e.key, e.value]));
      expect(byKey.get('LANDSRAAD_MEETING_MODEL')).toBe('lite');
      expect(byKey.get('LANDSRAAD_MEETING_TURN_NUDGE')).toBe('Be terse — 1-3 sentences.');
    }
  });
});
