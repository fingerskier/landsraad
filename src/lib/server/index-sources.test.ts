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
    const rel = '.landsraad/memory/capital-allocation.md';
    const abs = write(rel, '# Capital Allocation\n\nReserve runway.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory');
    expect(src.refId(rel)).toBe('capital-allocation');
    const [c] = src.buildChunks('# Capital Allocation\n\nReserve runway.', rel, abs);
    expect(c).toMatchObject({ chunk_idx: 0, title: 'Capital Allocation', councillor_slug: null });
  });

  it('maps a private memory note with councillor slug', () => {
    const rel = '.landsraad/councillors/quant/memory/hedging.md';
    const abs = write(rel, '# Hedging\n\nbody');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('memory_private');
    expect(src.refId(rel)).toBe('quant/hedging');
    const [c] = src.buildChunks('# Hedging\n\nbody', rel, abs);
    expect(c).toMatchObject({ title: 'Hedging', councillor_slug: 'quant' });
  });

  it('maps a persona, title from sibling councillor.json', () => {
    write('.landsraad/councillors/quant/councillor.json', JSON.stringify({ name: 'Quant', slug: 'quant' }));
    const rel = '.landsraad/councillors/quant/persona.md';
    const abs = write(rel, 'I am the quant.');
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('persona');
    expect(src.refId(rel)).toBe('quant');
    const [c] = src.buildChunks('I am the quant.', rel, abs);
    expect(c).toMatchObject({ title: 'Quant', councillor_slug: 'quant' });
  });

  it('maps job input/output/transcript from sibling job.json', () => {
    write('.landsraad/jobs/2026-job-x/job.json', JSON.stringify({ title: 'Job X', councillor_slug: 'quant' }));
    for (const [file, kind] of [
      ['input.md', 'job_input'],
      ['output.md', 'job_output'],
      ['transcript.md', 'transcript']
    ] as const) {
      const rel = `.landsraad/jobs/2026-job-x/${file}`;
      const abs = write(rel, 'content here');
      const src = resolveSource(rel)!;
      expect(src.kind).toBe(kind);
      expect(src.refId(rel)).toBe('2026-job-x');
      const [c] = src.buildChunks('content here', rel, abs);
      expect(c).toMatchObject({ title: 'Job X', councillor_slug: 'quant' });
    }
  });

  it('maps meeting topic/summary/synthesis from sibling meeting.json', () => {
    write('.landsraad/meetings/2026-m1/meeting.json', JSON.stringify({ title: 'M1', chair_slug: 'quant' }));
    const topic = resolveSource('.landsraad/meetings/2026-m1/topic.md')!;
    expect(topic.kind).toBe('meeting_topic');
    expect(topic.buildChunks('t', '.landsraad/meetings/2026-m1/topic.md', join(root, '.landsraad/meetings/2026-m1/topic.md'))[0])
      .toMatchObject({ title: 'M1', councillor_slug: null });
    const summary = resolveSource('.landsraad/meetings/2026-m1/summary.md')!;
    expect(summary.kind).toBe('meeting_summary');
    expect(summary.buildChunks('s', '.landsraad/meetings/2026-m1/summary.md', join(root, '.landsraad/meetings/2026-m1/summary.md'))[0])
      .toMatchObject({ title: 'M1 · summary', councillor_slug: 'quant' });
    const synth = resolveSource('.landsraad/meetings/2026-m1/synthesis.md')!;
    expect(synth.kind).toBe('meeting_synthesis');
    expect(synth.buildChunks('s', '.landsraad/meetings/2026-m1/synthesis.md', join(root, '.landsraad/meetings/2026-m1/synthesis.md'))[0])
      .toMatchObject({ title: 'M1 · synthesis', councillor_slug: 'quant' });
  });

  it('returns null for unclaimed paths', () => {
    expect(resolveSource('.landsraad/jobs/2026-job-x/job.json')).toBeNull();
    expect(resolveSource('.landsraad/jobs/2026-job-x/events.jsonl')).toBeNull();
    expect(resolveSource('.landsraad/.index/embeddings.db')).toBeNull();
    expect(resolveSource('.landsraad/council.json')).toBeNull();
    // Product-tree code/data is never a structured source (and not indexed at all in Phase 1).
    expect(resolveSource('src/app.ts')).toBeNull();
    expect(resolveSource('docs/data.csv')).toBeNull();
  });

  it('maps a meeting transcript into one chunk per turn', () => {
    write('.landsraad/meetings/2026-m1/meeting.json', JSON.stringify({ title: 'M1', chair_slug: 'quant' }));
    const body =
      '\n## Turn 1 — quant — 2026-06-02T00:00:00Z\n\nHello from quant.\n' +
      '\n## Turn 2 — director — 2026-06-02T00:01:00Z\n\nDirector speaks.\n';
    const rel = '.landsraad/meetings/2026-m1/transcript.md';
    const abs = write(rel, body);
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('meeting_turn');
    expect(src.refId(rel)).toBe('2026-m1');
    const chunks = src.buildChunks(body, rel, abs);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({ chunk_idx: 1, councillor_slug: 'quant', text: 'Hello from quant.' });
    expect(chunks[0].title).toBe('M1 · turn 1 · quant');
    expect(chunks[1]).toMatchObject({ chunk_idx: 2, councillor_slug: null });
    expect(chunks[1].title).toBe('M1 · turn 2 · director');
  });
});

describe('resolveSource — project files (workspace)', () => {
  it('maps a product .md to project_file, title from first heading', () => {
    const rel = 'docs/launch-plan.md';
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('project_file');
    expect(src.refId(rel)).toBe('docs/launch-plan.md');
    const [c] = src.buildChunks('# Launch Plan\n\nShip it.', rel, join(root, rel));
    expect(c).toMatchObject({ chunk_idx: 0, title: 'Launch Plan', councillor_slug: null });
  });

  it('maps a product .txt to project_file, title from basename', () => {
    const rel = 'notes/raw.txt';
    const src = resolveSource(rel)!;
    expect(src.kind).toBe('project_file');
    expect(src.refId(rel)).toBe('notes/raw.txt');
    const [c] = src.buildChunks('plain text body', rel, join(root, rel));
    expect(c.title).toBe('raw.txt');
  });

  it('does not claim non-prose product files', () => {
    expect(resolveSource('src/app.ts')).toBeNull();
    expect(resolveSource('data/table.csv')).toBeNull();
    expect(resolveSource('img/logo.png')).toBeNull();
  });

  it('routes .landsraad/ prose to the structured kind, not project_file', () => {
    expect(resolveSource('.landsraad/memory/x.md')!.kind).toBe('memory');
    expect(resolveSource('.landsraad/councillors/q/persona.md')!.kind).toBe('persona');
  });
});
