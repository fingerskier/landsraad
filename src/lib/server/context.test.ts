import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { createHash } from 'node:crypto';

import { createCouncil } from './councils';
import { createCouncillor } from './councillors';
import { createNote } from './memory';
import { createPrivateNote } from './memory_private';
import type { Embedder } from './embeddings';
import { closeAll, setEmbedder } from './indexer';
import { reindexFile } from './reconcile';
import { assembleContextFor } from './context';

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

let tmpRoot: string;
let prevEnv: string | undefined;

beforeEach(async () => {
  prevEnv = env.LANDSRAAD_COUNCIL_ROOT;
  tmpRoot = mkdtempSync(join(tmpdir(), 'landsraad-ctx-'));
  env.LANDSRAAD_COUNCIL_ROOT = tmpRoot;
  await createCouncil({ name: 'Ctx Test' });
  await createCouncillor({ name: 'Alice', role: 'cto' });
  setEmbedder(null); // no embedder → fallback path
});

afterEach(() => {
  closeAll();
  setEmbedder(null);
  rmSync(tmpRoot, { recursive: true, force: true });
  if (prevEnv === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prevEnv;
});

describe('assembleContextFor (no embedder fallback)', () => {
  it('returns only the roster when no memories exist', async () => {
    const ctx = await assembleContextFor('alice', 'any brief');
    expect(ctx).toContain('# Council roster');
    expect(ctx).toContain('alice — Alice — cto');
    expect(ctx).not.toContain('# Shared council memory');
    expect(ctx).not.toContain('# Your memory');
  });

  it('includes shared memory verbatim in fallback', async () => {
    await createNote({ title: 'Shared One', body: 'shared body' });
    const ctx = await assembleContextFor('alice', 'any brief');
    expect(ctx).toContain('# Shared council memory');
    expect(ctx).toContain('Shared One');
    expect(ctx).toContain('shared body');
  });

  it('does not leak another councillors private memory in fallback', async () => {
    await createCouncillor({ name: 'Bob', role: 'cfo' });
    await createPrivateNote('bob', { title: 'Bobs Secret', body: 'do not show' });
    const ctx = await assembleContextFor('alice', 'any brief');
    expect(ctx).not.toContain('Bobs Secret');
    expect(ctx).not.toContain('do not show');
  });

  it('includes councillors own private memory section in fallback', async () => {
    await createPrivateNote('alice', { title: 'Alice Note', body: 'private body' });
    const ctx = await assembleContextFor('alice', 'any brief');
    expect(ctx).toContain('# Your memory');
    expect(ctx).toContain('Alice Note');
    expect(ctx).toContain('private body');
  });
});

describe('assembleContextFor — roster injection', () => {
  it('prepends roster section above memory sections', async () => {
    await createCouncillor({ name: 'Bob', role: 'cfo' });
    await createNote({ title: 'Shared One', body: 'shared body' });
    await createPrivateNote('alice', { title: 'Alice Note', body: 'private body' });
    const ctx = await assembleContextFor('alice', 'any brief');
    const rosterIdx = ctx.indexOf('# Council roster');
    const sharedIdx = ctx.indexOf('# Shared council memory');
    const privIdx = ctx.indexOf('# Your memory');
    expect(rosterIdx).toBeGreaterThanOrEqual(0);
    expect(rosterIdx).toBeLessThan(sharedIdx);
    expect(rosterIdx).toBeLessThan(privIdx);
  });

  it('roster lists every councillor (including self)', async () => {
    await createCouncillor({ name: 'Bob', role: 'cfo' });
    const ctx = await assembleContextFor('alice', 'any brief');
    expect(ctx).toContain('alice — Alice — cto');
    expect(ctx).toContain('bob — Bob — cfo');
  });
});

describe('assembleContextFor — project context (workspace indexing)', () => {
  it('includes a Project context section from indexed product docs', async () => {
    setEmbedder(fakeEmbedder());
    mkdirSync(join(tmpRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(tmpRoot, 'docs/launch.md'),
      '# Launch Plan\n\nship the unique-proj-token release',
      'utf8'
    );
    await reindexFile('docs/launch.md');
    const ctx = await assembleContextFor('alice', 'unique-proj-token release');
    expect(ctx).toContain('# Project context');
    expect(ctx).toContain('Launch Plan');
    expect(ctx).toContain('unique-proj-token');
  });

  it('omits Project context in the no-embedder fallback', async () => {
    setEmbedder(null);
    await createNote({ title: 'Shared', body: 'shared body' });
    const ctx = await assembleContextFor('alice', 'anything');
    expect(ctx).not.toContain('# Project context');
  });
});
