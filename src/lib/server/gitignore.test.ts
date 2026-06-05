import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { isIgnored, reloadGitignore } from './gitignore';

let root: string;
let prev: string | undefined;

beforeEach(() => {
  prev = env.LANDSRAAD_COUNCIL_ROOT;
  root = mkdtempSync(join(tmpdir(), 'landsraad-gitignore-'));
  env.LANDSRAAD_COUNCIL_ROOT = root;
  reloadGitignore();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  if (prev === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prev;
  reloadGitignore();
});

function gitignore(body: string): void {
  writeFileSync(join(root, '.gitignore'), body, 'utf8');
  reloadGitignore();
}

describe('gitignore matcher', () => {
  it('ignores paths matched by the root .gitignore', () => {
    gitignore('build/\nsecret.txt\n*.log\n');
    expect(isIgnored('build/out.js')).toBe(true);
    expect(isIgnored('secret.txt')).toBe(true);
    expect(isIgnored('app.log')).toBe(true);
    expect(isIgnored('docs/plan.md')).toBe(false);
  });

  it('treats everything as un-ignored when no .gitignore exists', () => {
    expect(isIgnored('anything/at/all.md')).toBe(false);
  });

  it('does not throw on edge-case inputs', () => {
    gitignore('build/\n');
    expect(isIgnored('')).toBe(false);
    expect(isIgnored('.')).toBe(false);
  });

  it('reflects an edited .gitignore after reload', () => {
    gitignore('# nothing yet\n');
    expect(isIgnored('drafts/x.md')).toBe(false);
    gitignore('drafts/\n');
    expect(isIgnored('drafts/x.md')).toBe(true);
  });

  it('works without a .git directory (uses the ignore package, not git)', () => {
    gitignore('vendor/\n');
    expect(isIgnored('vendor/lib.md')).toBe(true);
  });
});
