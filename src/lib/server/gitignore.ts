import ignore from 'ignore';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { councilRoot } from './paths';

type Ignore = ReturnType<typeof ignore>;

let cached: Ignore | null = null;
let cachedRoot: string | null = null;

function load(): Ignore {
  const ig = ignore();
  const f = join(councilRoot(), '.gitignore');
  if (existsSync(f)) {
    try {
      ig.add(readFileSync(f, 'utf8'));
    } catch {
      // Unreadable .gitignore → treat as empty (ignore nothing).
    }
  }
  return ig;
}

/**
 * Reload the root `.gitignore` matcher. Called at watcher start so each session
 * reflects the current council root, and exposed for tests. A `.gitignore` edited
 * mid-session otherwise takes effect on the next restart.
 */
export function reloadGitignore(): void {
  cached = load();
  cachedRoot = councilRoot();
}

function matcher(): Ignore {
  const root = councilRoot();
  if (cached && cachedRoot === root) return cached;
  cached = load();
  cachedRoot = root;
  return cached;
}

/**
 * True if a `councilRoot()`-relative path is excluded by the root `.gitignore`.
 * Only consulted for the product tree — the council machine under `.landsraad/` is
 * always indexed regardless of whether the user gitignores it.
 */
export function isIgnored(rel: string): boolean {
  const r = rel.replace(/\\/g, '/');
  if (!r || r === '.' || r === '..' || r.startsWith('../')) return false;
  return matcher().ignores(r);
}
