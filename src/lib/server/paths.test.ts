import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { env } from 'node:process';
import {
  councilRoot,
  councilDataRoot,
  councilFile,
  councilEnvFile,
  councillorsRoot,
  memoryDir,
  jobsDir,
  indexDirPath,
  proposalsDir,
  schedulesDir,
  meetingsDir,
  meetingsIncomingFile,
  oeuvresDir,
  redactRoot
} from './paths';

const ROOT = join('/tmp', 'landsraad-paths-fixture');
let prev: string | undefined;

beforeEach(() => {
  prev = env.LANDSRAAD_COUNCIL_ROOT;
  env.LANDSRAAD_COUNCIL_ROOT = ROOT;
});
afterEach(() => {
  if (prev === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prev;
});

describe('paths — .landsraad/ layout', () => {
  it('councilDataRoot nests under councilRoot', () => {
    expect(councilRoot()).toBe(ROOT);
    expect(councilDataRoot()).toBe(join(ROOT, '.landsraad'));
  });

  it('every machine helper resolves under .landsraad/', () => {
    const data = councilDataRoot();
    for (const p of [
      councilFile(),
      councillorsRoot(),
      memoryDir(),
      jobsDir(),
      indexDirPath(),
      proposalsDir(),
      schedulesDir(),
      meetingsDir(),
      meetingsIncomingFile(),
      oeuvresDir()
    ]) {
      expect(p.startsWith(data)).toBe(true);
    }
  });

  it('keeps .env at the product root (not under .landsraad/)', () => {
    expect(councilEnvFile()).toBe(join(ROOT, '.env'));
    expect(councilEnvFile().startsWith(councilDataRoot())).toBe(false);
  });
});

describe('redactRoot — strip machine-identifying absolute paths', () => {
  it('replaces a bare council root with "."', () => {
    expect(redactRoot(`workdir: ${ROOT}`)).toBe('workdir: .');
  });

  it('rewrites a council-root path prefix to a relative path, keeping the slash', () => {
    expect(redactRoot(`[x](${ROOT}/src/lib/server/paths.ts:12)`)).toBe(
      '[x](./src/lib/server/paths.ts:12)'
    );
  });

  it('replaces the home directory with "~" when it appears outside the council root', () => {
    expect(redactRoot(`config at ${homedir()}/.landsraad/instances.json`)).toBe(
      'config at ~/.landsraad/instances.json'
    );
  });

  it('leaves text with no machine paths untouched', () => {
    const text = 'Renamed the `factcheck` role to `skeptic` in example/writing-team.template.json.';
    expect(redactRoot(text)).toBe(text);
  });

  it('does not mangle a sibling directory that merely shares the root prefix', () => {
    const text = `${ROOT}-backup/notes.md`;
    expect(redactRoot(text)).toBe(`${ROOT}-backup/notes.md`);
  });
});
