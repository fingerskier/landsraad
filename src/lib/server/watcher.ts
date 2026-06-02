import { statSync } from 'node:fs';
import { relative } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { councilRoot } from './paths';
import { hasEmbedder, indexListFiles } from './indexer';
import { reindexFile, removeFile } from './reconcile';

let watcher: FSWatcher | null = null;

function rel(root: string, abs: string): string {
  return relative(root, abs).replace(/\\/g, '/');
}

export function startIndexWatcher(root: string = councilRoot()): FSWatcher | null {
  if (!hasEmbedder()) return null;
  if (watcher) return watcher;

  // manifest: normalized-rel -> source_mtime, for startup skip + orphan prune
  const manifest = new Map<string, string>();
  for (const row of indexListFiles()) {
    manifest.set(rel(root, row.source_path), row.source_mtime);
  }
  const seen = new Set<string>();

  const queue: string[] = [];
  let processing = false;
  async function drain(): Promise<void> {
    if (processing) return;
    processing = true;
    while (queue.length) {
      const r = queue.shift() as string;
      try {
        await reindexFile(r);
      } catch (err) {
        console.warn(`[indexer] watch reindex ${r} failed:`, (err as Error).message);
      }
    }
    processing = false;
  }
  function enqueue(r: string): void {
    if (!queue.includes(r)) queue.push(r);
    void drain();
  }

  function onUpsert(abs: string): void {
    const r = rel(root, abs);
    seen.add(r);
    const known = manifest.get(r);
    if (known) {
      try {
        if (statSync(abs).mtime.toISOString() === known) return; // unchanged → skip
      } catch {
        // fall through to reindex
      }
    }
    enqueue(r);
  }

  watcher = chokidar.watch(root, {
    ignored: ['**/.index/**', '**/node_modules/**', '**/.git/**', /(^|[/\\])\../],
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  });

  watcher
    .on('add', onUpsert)
    .on('change', onUpsert)
    .on('unlink', (abs) => removeFile(rel(root, abs)))
    .on('ready', () => {
      for (const [r] of manifest) {
        if (!seen.has(r)) removeFile(r);
      }
    });

  return watcher;
}

export async function stopIndexWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
}
