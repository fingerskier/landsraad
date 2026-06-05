import { statSync, type Stats } from 'node:fs';
import { relative } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { councilRoot } from './paths';
import { hasEmbedder, indexListFiles } from './indexer';
import { reindexFile, removeFile } from './reconcile';
import { isIgnored, reloadGitignore } from './gitignore';

let watcher: FSWatcher | null = null;

function rel(root: string, abs: string): string {
  return relative(root, abs).replace(/\\/g, '/');
}

/**
 * Decide which paths the watcher ignores. The watch root is `councilRoot()`.
 *
 * - `.landsraad/` (the council machine) is **always** indexed — its own data,
 *   regardless of `.gitignore` — minus its `.index` db (and any dotfile).
 * - The product tree is indexed for prose only: dot entries (`.git`, `.svelte-kit`,
 *   `.env`, `.gitignore`, …), `node_modules`, and anything matched by the root
 *   `.gitignore` are skipped; non-`.md`/`.txt` files are pruned for efficiency.
 *   (`resolveSource` is the authoritative allowlist; this is a cheap pre-filter, so
 *   when chokidar omits `stats` a file is let through and reconcile no-ops on it.)
 */
function makeIgnored(root: string): (abs: string, stats?: Stats) => boolean {
  return (abs: string, stats?: Stats): boolean => {
    const r = rel(root, abs);
    if (r === '') return false; // the watch root itself — must descend
    const parts = r.split('/');
    if (parts.includes('node_modules')) return true;

    if (r === '.landsraad' || r.startsWith('.landsraad/')) {
      // The council machine: always indexed; skip only its dot-children (.index).
      return parts.slice(1).some((p) => p.startsWith('.'));
    }

    // Product tree.
    if (parts.some((p) => p.startsWith('.'))) return true; // .git, .svelte-kit, .env, .gitignore…
    if (isIgnored(r)) return true; // root .gitignore (never consulted for .landsraad/)
    if (stats?.isFile() && !/\.(md|txt)$/i.test(r)) return true; // allowlist (perf)
    return false;
  };
}

export function startIndexWatcher(root: string = councilRoot()): FSWatcher | null {
  if (!hasEmbedder()) return null;
  if (watcher) return watcher;

  // Load the root .gitignore once for this session (changes take effect on restart).
  reloadGitignore();

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
