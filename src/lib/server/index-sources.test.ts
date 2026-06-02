import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSource } from './index-sources';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'landsraad-sources-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(rel: string, body: string): string {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body, 'utf8');
  return abs;
}

describe('resolveSource — whole-file kinds', () => {
  it('maps a shared memory note', () => {
    const rel = 'memory/capital-allocation.md';
    const abs = write(rel, '# Capital Allocation\n\nReserve runway.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory');
    expect(src.refId(rel)).toBe('capital-allocation');
    const [c] = src.buildChunks('# Capital Allocation\n\nReserve runway.', rel, abs);
    expect(c).toMatchObject({ chunk_idx: 0, title: 'Capital Allocation', councillor_slug: null });
  });

  it('maps a private memory note with councillor slug', () => {
    const rel = 'councillors/quant/memory/hedging.md';
    const abs = write(rel, '# Hedging\n\nbody');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory_private');
    expect(src.refId(rel)).toBe('quant/hedging');
    const [c] = src.buildChunks('# Hedging\n\nbody', rel, abs);
    expect(c).toMatchObject({ title: 'Hedging', councillor_slug: 'quant' });
  });

  it('maps a persona, title from sibling councillor.json', () => {
    write('councillors/quant/councillor.json', JSON.stringify({ name: 'Quant', slug: 'quant' }));
    const rel = 'councillors/quant/persona.md';
    const abs = write(rel, 'I am the quant.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('persona');
    expect(src.refId(rel)).toBe('quant');
    const [c] = src.buildChunks('I am the quant.', rel, abs);
    expect(c).toMatchObject({ title: 'Quant', councillor_slug: 'quant' });
  });

  it('maps job input/output/transcript from sibling job.json', () => {
    write('jobs/2026-job-x/job.json', JSON.stringify({ title: 'Job X', councillor_slug: 'quant' }));
    for (const [file, kind] of [
      ['input.md', 'job_input'],
      ['output.md', 'job_output'],
      ['transcript.md', 'transcript']
    ] as const) {
      const rel = `jobs/2026-job-x/${file}`;
      const abs = write(rel, 'content here');
      const src = resolveSource(rel)!;
      expect(src.kind).toBe(kind);
      expect(src.refId(rel)).toBe('2026-job-x');
      const [c] = src.buildChunks('content here', rel, abs);
      expect(c).toMatchObject({ title: 'Job X', councillor_slug: 'quant' });
    }
  });

  it('maps meeting topic/summary/synthesis from sibling meeting.json', () => {
    write('meetings/2026-m1/meeting.json', JSON.stringify({ title: 'M1', chair_slug: 'quant' }));
    const topic = resolveSource('meetings/2026-m1/topic.md')!;
    expect(topic.kind).toBe('meeting_topic');
    expect(topic.buildChunks('t', 'meetings/2026-m1/topic.md', join(root, 'meetings/2026-m1/topic.md'))[0])
      .toMatchObject({ title: 'M1', councillor_slug: null });
    const summary = resolveSource('meetings/2026-m1/summary.md')!;
    expect(summary.kind).toBe('meeting_summary');
    expect(summary.buildChunks('s', 'meetings/2026-m1/summary.md', join(root, 'meetings/2026-m1/summary.md'))[0])
      .toMatchObject({ title: 'M1 · summary', councillor_slug: 'quant' });
    const synth = resolveSource('meetings/2026-m1/synthesis.md')!;
    expect(synth.kind).toBe('meeting_synthesis');
    expect(synth.buildChunks('s', 'meetings/2026-m1/synthesis.md', join(root, 'meetings/2026-m1/synthesis.md'))[0])
      .toMatchObject({ title: 'M1 · synthesis', councillor_slug: 'quant' });
  });

  it('returns null for unclaimed paths', () => {
    expect(resolveSource('jobs/2026-job-x/job.json')).toBeNull();
    expect(resolveSource('jobs/2026-job-x/events.jsonl')).toBeNull();
    expect(resolveSource('.index/embeddings.db')).toBeNull();
  });
});
