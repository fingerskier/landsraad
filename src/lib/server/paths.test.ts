import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
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
  oeuvresDir
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
