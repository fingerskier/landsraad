import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, unlinkSync, utimesSync } from 'node:fs';
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
let embedCount = 0;

function fakeEmbedder(): Embedder {
  return {
    dim: DIM,
    embed(texts) {
      embedCount += texts.length;
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

function settle(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let root: string;
let prev: string | undefined;

beforeEach(async () => {
  embedCount = 0;
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
    write('.landsraad/memory/live.md', '# Live\n\nunique-live indexed by watcher');
    await waitUntil(async () => (await indexSearch('unique-live')).length > 0);
    expect((await indexSearch('unique-live'))[0].ref_id).toBe('live');
  });

  it('does not index files outside .landsraad/ (the product tree)', async () => {
    startIndexWatcher(root);
    // A code file in the working directory is the machine's product, not its
    // memory — the Phase 1 watcher only indexes .landsraad/.
    write('src/app.ts', 'const token = "unique-product-code";');
    write('README.md', '# Readme\n\nunique-product-doc body');
    await settle(700);
    expect(await indexSearch('unique-product-code')).toEqual([]);
    expect(await indexSearch('unique-product-doc')).toEqual([]);
  });

  it('removes a file on unlink', async () => {
    write('.landsraad/memory/temp.md', '# Temp\n\nunique-temp body');
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-temp')).length > 0);
    unlinkSync(join(root, '.landsraad/memory/temp.md'));
    await waitUntil(async () => (await indexSearch('unique-temp')).length === 0);
    expect(await indexSearch('unique-temp')).toEqual([]);
  });

  it('prunes orphan chunks for files deleted while stopped', async () => {
    write('.landsraad/memory/orphan.md', '# Orphan\n\nunique-orphan body');
    await reindexFile('.landsraad/memory/orphan.md');
    expect((await indexSearch('unique-orphan')).length).toBe(1);
    // delete the file while no watcher is running, then start
    unlinkSync(join(root, '.landsraad/memory/orphan.md'));
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-orphan')).length === 0);
    expect(await indexSearch('unique-orphan')).toEqual([]);
  });

  it('no-ops when no embedder is set', async () => {
    setEmbedder(null);
    expect(startIndexWatcher(root)).toBeNull();
  });

  it('skips re-embedding an unchanged file on watcher restart', async () => {
    // Index the file with a live watcher so source_mtime is recorded
    write('.landsraad/memory/keep.md', '# Keep\n\nunique-keep body');
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-keep')).length > 0);
    await stopIndexWatcher();

    // Record embed count after initial indexing — file is now in the manifest
    const baseline = embedCount;

    // Restart watcher over the same root without touching the file
    startIndexWatcher(root);
    // Wait for the startup scan to settle (awaitWriteFinish stabilityThreshold is 200ms)
    await settle(600);

    // The manifest mtime matches fs mtime → skip should have fired, no new chunks embedded
    expect(embedCount).toBe(baseline);
    // File must still be searchable (chunks were not removed)
    expect((await indexSearch('unique-keep')).length).toBeGreaterThan(0);
  });

  it('re-embeds a file whose mtime changed while stopped', async () => {
    // Index the file with a live watcher
    write('.landsraad/memory/change.md', '# Change\n\nunique-change-v1 body');
    startIndexWatcher(root);
    await waitUntil(async () => (await indexSearch('unique-change-v1')).length > 0);
    await stopIndexWatcher();

    const baseline = embedCount;

    // Mutate the file AND force a future mtime so it differs from the manifest value
    const abs = join(root, '.landsraad/memory/change.md');
    writeFileSync(abs, '# Change\n\nunique-change-v2 body', 'utf8');
    const futureMtime = new Date(Date.now() + 2000);
    utimesSync(abs, futureMtime, futureMtime);

    // Restart watcher — onUpsert should detect mtime mismatch and re-embed
    startIndexWatcher(root);
    await waitUntil(async () => {
      const hits = await indexSearch('unique-change-v2');
      return hits.some((h) => h.text.includes('unique-change-v2'));
    });

    expect(embedCount).toBeGreaterThan(baseline);
    const hits = await indexSearch('unique-change-v2');
    expect(hits.some((h) => h.text.includes('unique-change-v2'))).toBe(true);
  });
});
