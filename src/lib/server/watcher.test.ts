import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { createHash } from 'node:crypto';

import { createCouncil } from './councils';
import type { Embedder } from './embeddings';
import { closeAll, indexSearch, setEmbedder } from './indexer';
import { reindexFile } from './reconcile';
import { startIndexWatcher, stopIndexWatcher } from './watcher';

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
  root = mkdtempSync(join(tmpdir(), 'landsraad-watcher-'));
  env.LANDSRAAD_COUNCIL_ROOT = root;
  setEmbedder(fakeEmbedder());
  await createCouncil({ name: 'Watcher Test' });
});

afterEach(async () => {
  await stopIndexWatcher();
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

function waitUntil(fn: () => Promise<boolean>, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = async () => {
      if (await fn()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

describe('index watcher', () => {
  it('indexes a file created after the watcher starts', async () => {
    startIndexWatcher(root);
    write('memory/live.md', '# Live\n\nunique-live indexed by watcher');
    await waitUntil(async () => (await indexSearch('unique-live')).length > 0);
    expect((await indexSearch('unique-live'))[0].ref_id).toBe('live');
  });

  it('removes a file on unlink', async () => {
    write('memory/temp.md', '# Temp\n\nunique-temp body');
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-temp')).length > 0);
    unlinkSync(join(root, 'memory/temp.md'));
    await waitUntil(async () => (await indexSearch('unique-temp')).length === 0);
    expect(await indexSearch('unique-temp')).toEqual([]);
  });

  it('prunes orphan chunks for files deleted while stopped', async () => {
    write('memory/orphan.md', '# Orphan\n\nunique-orphan body');
    await reindexFile('memory/orphan.md');
    expect((await indexSearch('unique-orphan')).length).toBe(1);
    // delete the file while no watcher is running, then start
    unlinkSync(join(root, 'memory/orphan.md'));
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-orphan')).length === 0);
    expect(await indexSearch('unique-orphan')).toEqual([]);
  });

  it('no-ops when no embedder is set', async () => {
    setEmbedder(null);
    expect(startIndexWatcher(root)).toBeNull();
  });
});
