import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { fileURLToPath } from 'node:url';

import { load } from './+page.server';
import { createCouncil } from '$lib/server/councils';
import { createCouncillor, updateCouncillor } from '$lib/server/councillors';
import { createJob } from '$lib/server/jobs';

let tmpRoot: string;
let prevEnv: string | undefined;

type SetupHomeData = {
  hasCouncil: false;
  cwd: string;
};

type CouncilHomeData = {
  hasCouncil: true;
  onboarding: {
    councillors: boolean;
    adapter: boolean;
    jobs: boolean;
    firstCouncillorSlug: string | null;
  };
} & Record<string, unknown>;

type HomeData = SetupHomeData | CouncilHomeData;

beforeEach(() => {
  prevEnv = env.LANDSRAAD_COUNCIL_ROOT;
  tmpRoot = mkdtempSync(join(tmpdir(), 'landsraad-home-'));
  env.LANDSRAAD_COUNCIL_ROOT = tmpRoot;
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
  if (prevEnv === undefined) delete env.LANDSRAAD_COUNCIL_ROOT;
  else env.LANDSRAAD_COUNCIL_ROOT = prevEnv;
});

async function loadHome(): Promise<HomeData> {
  return await (load as () => Promise<HomeData>)();
}

function homePageSource(): string {
  return readFileSync(fileURLToPath(new URL('./+page.svelte', import.meta.url)), 'utf8');
}

describe('/ home route', () => {
  it('loads the pre-council setup path', async () => {
    const data = await loadHome();

    expect(data).toEqual({ hasCouncil: false, cwd: tmpRoot });
  });

  it('computes onboarding from councillors, adapters, and jobs', async () => {
    await createCouncil({ name: 'Dogfood', description: '' });

    const empty = await loadHome();
    if (!empty.hasCouncil) throw new Error('expected council home');
    expect(empty.onboarding).toEqual({
      councillors: false,
      adapter: false,
      jobs: false,
      firstCouncillorSlug: null
    });

    const councillor = await createCouncillor({
      name: 'Fenring',
      role: 'Implementer',
      routing_hint: '',
      adapter: '',
      persona: ''
    });

    const withoutAdapter = await loadHome();
    if (!withoutAdapter.hasCouncil) throw new Error('expected council home');
    expect(withoutAdapter.onboarding).toEqual({
      councillors: true,
      adapter: false,
      jobs: false,
      firstCouncillorSlug: councillor.slug
    });

    await updateCouncillor(councillor.slug, { adapter: 'mock:local' });

    const withAdapter = await loadHome();
    if (!withAdapter.hasCouncil) throw new Error('expected council home');
    expect(withAdapter.onboarding).toEqual({
      councillors: true,
      adapter: true,
      jobs: false,
      firstCouncillorSlug: councillor.slug
    });

    await createJob({ title: 'First job', brief: 'Do the thing.', councillor_slug: councillor.slug });

    const withJob = await loadHome();
    if (!withJob.hasCouncil) throw new Error('expected council home');
    expect(withJob.onboarding).toEqual({
      councillors: true,
      adapter: true,
      jobs: true,
      firstCouncillorSlug: councillor.slug
    });
  });

  it('keeps the home setup and empty-state copy action-oriented', () => {
    const source = homePageSource();

    expect(source).toContain('<h1>Create a council</h1>');
    expect(source).toContain('A council will be created in');
    expect(source).toContain('Install from template');
    expect(source).toContain('Councillors are the AI workers in this council. Add one before creating jobs.');
    expect(source).toContain('Shared memory is included in future jobs and meetings when relevant.');
    expect(source).toContain('No jobs yet.');
  });
});
