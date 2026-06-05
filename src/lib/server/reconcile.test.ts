import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { createHash } from 'node:crypto';

import { createCouncil } from './councils';
import type { Embedder } from './embeddings';
import { closeAll, indexSearch, indexListFiles, setEmbedder } from './indexer';
import { reindexFile, removeFile } from './reconcile';

const DIM = 384;

function fakeEmbedder(): Embedder {
  return {
    dim: DIM,
    embed(texts) {
      return texts.map((text) => {
        const v = new Float32Array(DIM);
        for (const t of text.toLowerCase().split(/\s+/).filter(Boolean)) {
          const h = createHash('sha1').update(t).digest();
          v[h.readUInt16BE(0) % DIM] += 1;
        }
        let n = 0;
        for (let i = 0; i < DIM; i++) n += v[i] * v[i];
        n = Math.sqrt(n) || 1;
        for (let i = 0; i < DIM; i++) v[i] /= n;
        return v;
      });
    }
  };
}

let root: string;
let prev: string | undefined;

beforeEach(async () => {
  prev = env.LANDSRAAD_COUNCIL_ROOT;
  root = mkdtempSync(join(tmpdir(), 'landsraad-reconcile-'));
  env.LANDSRAAD_COUNCIL_ROOT = root;
  setEmbedder(fakeEmbedder());
  await createCouncil({ name: 'Reconcile Test' });
});

afterEach(() => {
  closeAll();
  setEmbedder(null);
  rmSync(root, { recursive: true, force: true });
  if (prev === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prev;
});

function write(rel: string, body: string): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body, 'utf8');
}

describe('reconcile', () => {
  it('reindexFile makes a memory note searchable', async () => {
    write('.landsraad/memory/runway.md', '# Runway\n\nReserve thirty percent unique-token.');
    await reindexFile('.landsraad/memory/runway.md');
    const hits = await indexSearch('unique-token reserve');
    expect(hits[0].kind).toBe('memory');
    expect(hits[0].ref_id).toBe('runway');
  });

  it('removeFile deletes the chunks', async () => {
    write('.landsraad/memory/doomed.md', '# Doomed\n\nunique-token-doomed body');
    await reindexFile('.landsraad/memory/doomed.md');
    expect((await indexSearch('unique-token-doomed')).length).toBe(1);
    removeFile('.landsraad/memory/doomed.md');
    expect(await indexSearch('unique-token-doomed')).toEqual([]);
  });

  it('reindexFile re-embeds changed content and drops old text', async () => {
    write('.landsraad/memory/doc.md', '# Doc\n\nfirst draft pancakes');
    await reindexFile('.landsraad/memory/doc.md');
    write('.landsraad/memory/doc.md', '# Doc\n\nsecond draft waffles');
    await reindexFile('.landsraad/memory/doc.md');
    const hits = await indexSearch('waffles');
    expect(hits[0].text).toContain('waffles');
    expect(hits[0].text).not.toContain('pancakes');
  });

  it('records source_mtime equal to the file mtime', async () => {
    write('.landsraad/memory/stamp.md', '# Stamp\n\nbody');
    await reindexFile('.landsraad/memory/stamp.md');
    const { statSync } = await import('node:fs');
    const mtime = statSync(join(root, '.landsraad/memory/stamp.md')).mtime.toISOString();
    const row = indexListFiles().find((r) => r.ref_id === 'stamp');
    expect(row?.source_mtime).toBe(mtime);
  });

  it('reindexFile on a missing file removes existing chunks', async () => {
    write('.landsraad/memory/gone.md', '# Gone\n\nunique-gone body');
    await reindexFile('.landsraad/memory/gone.md');
    rmSync(join(root, '.landsraad/memory/gone.md'));
    await reindexFile('.landsraad/memory/gone.md');
    expect(await indexSearch('unique-gone')).toEqual([]);
  });

  it('indexes a product .md (outside .landsraad/) as project_file', async () => {
    write('docs/small.md', '# Small\n\nunique-small-token body');
    await reindexFile('docs/small.md');
    const hits = await indexSearch('unique-small-token');
    expect(hits[0].kind).toBe('project_file');
    expect(hits[0].ref_id).toBe('docs/small.md');
  });

  it('skips a product file larger than the size cap', async () => {
    const big = 'lorem ipsum '.repeat(60_000); // ~720 KB > 512 KB default cap
    write('docs/huge.md', '# Huge\n\n' + big + ' unique-huge-token');
    await reindexFile('docs/huge.md');
    expect(await indexSearch('unique-huge-token')).toEqual([]);
  });
});
