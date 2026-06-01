import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { load } from './+page.server';
import { POST } from './download/+server';
import { createCouncil } from '$lib/server/councils';
import { writeCouncilEnv } from '$lib/server/env-file';

let tmpRoot: string;
let prevEnv: string | undefined;

beforeEach(() => {
  prevEnv = env.LANDSRAAD_COUNCIL_ROOT;
  tmpRoot = mkdtempSync(join(tmpdir(), 'landsraad-export-'));
  env.LANDSRAAD_COUNCIL_ROOT = tmpRoot;
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
  if (prevEnv === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prevEnv;
});

function post(fields: Record<string, string[]>) {
  const fd = new FormData();
  for (const [k, values] of Object.entries(fields)) for (const v of values) fd.append(k, v);
  return {
    request: new Request('http://x/export/download', { method: 'POST', body: fd })
  } as Parameters<typeof POST>[0];
}

describe('/export route', () => {
  it('load surfaces non-secret env keys and hides secret-named ones', async () => {
    await createCouncil({ name: 'C' });
    await writeCouncilEnv([
      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
      { key: 'OPENAI_API_KEY', value: 'sk-x' }
    ]);
    const data = (await (load as () => Promise<{ envKeys: string[] }>)());
    expect(data.envKeys).toEqual(['LANDSRAAD_MEETING_MODEL']);
  });

  it('POST exports selected env keys with their values', async () => {
    await createCouncil({ name: 'C' });
    await writeCouncilEnv([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
    const res = await POST(
      post({ name: ['T'], version: ['0.1.0'], env_keys: ['LANDSRAAD_MEETING_MODEL'] })
    );
    const body = JSON.parse(await res.text());
    expect(body.env).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
  });

  it('POST returns 400 when a secret-named env key is requested', async () => {
    await createCouncil({ name: 'C' });
    await writeCouncilEnv([{ key: 'OPENAI_API_KEY', value: 'sk-x' }]);
    const res = await POST(post({ name: ['T'], version: ['0.1.0'], env_keys: ['OPENAI_API_KEY'] }));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/OPENAI_API_KEY/);
  });
});
