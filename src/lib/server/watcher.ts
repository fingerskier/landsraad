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

/**
 * Decide which paths the watcher ignores. The watch root is `councilRoot()` (the
 * product tree), but Phase 1 only indexes the council machine under `.landsraad/`.
 * A plain dot-dir ignore would swallow `.landsraad/` itself, so this is a function
 * matcher: descend into `.landsraad/`, skip its `.index` db (and any dotfile), skip
 * `node_modules`, and ignore everything else in the product tree for now. Phase 2
 * relaxes the product-tree branch to index `.md`/`.txt`, respecting `.gitignore`.
 */
function makeIgnored(root: string): (abs: string) => boolean {
  return (abs: string): boolean => {
    const r = rel(root, abs);
    if (r === '') return false; // the watch root itself — must descend
    const parts = r.split('/');
    if (parts.includes('node_modules')) return true;
    if (r !== '.landsraad' && !r.startsWith('.landsraad/')) return true;
    // Inside .landsraad/: skip dot-children (.index, stray dotfiles).
    if (parts.slice(1).some((p) => p.startsWith('.'))) return true;
    return false;
  };
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
    ignored: makeIgnored(root),
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
