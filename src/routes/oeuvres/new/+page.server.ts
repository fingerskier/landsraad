import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { listCouncillors } from '$lib/server/councillors';
import { startOeuvre } from '$lib/server/oeuvre-runner';
import {
  OEUVRE_MAX_TURNS_DEFAULT,
  OEUVRE_MAX_WALL_MS_DEFAULT,
  OEUVRE_MAX_TEXT_BYTES_DEFAULT
} from '$lib/server/config';

export const load: PageServerLoad = async () => {
  return {
    councillors: await listCouncillors(),
    defaults: {
      max_turns: OEUVRE_MAX_TURNS_DEFAULT,
      max_wall_min: Math.round(OEUVRE_MAX_WALL_MS_DEFAULT / 60_000),
      max_text_kb: Math.round(OEUVRE_MAX_TEXT_BYTES_DEFAULT / 1024)
    }
  };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const goal = String(form.get('goal') ?? '').trim();
    const leader = String(form.get('leader') ?? '').trim();
    const note = String(form.get('note') ?? '');
    const participants = form.getAll('participants').map(String).filter((s) => s && s !== leader);

    const maxTurns = Number.parseInt(String(form.get('max_turns') ?? ''), 10);
    const maxWallMin = Number.parseInt(String(form.get('max_wall_min') ?? ''), 10);
    const maxTextKb = Number.parseInt(String(form.get('max_text_kb') ?? ''), 10);

    if (!title) return fail(400, { error: 'Title is required.' });
    if (!goal) return fail(400, { error: 'A goal is required.' });
    if (!leader) return fail(400, { error: 'A leader is required.' });
    if (participants.length === 0) {
      return fail(400, { error: 'Pick at least one participant (other than the leader).' });
    }

    const policy: Record<string, number> = {};
    if (Number.isFinite(maxTurns) && maxTurns > 0) policy.max_turns = maxTurns;
    if (Number.isFinite(maxWallMin) && maxWallMin > 0) policy.max_wall_ms = maxWallMin * 60_000;
    if (Number.isFinite(maxTextKb) && maxTextKb > 0) policy.max_text_bytes = maxTextKb * 1024;

    let id: string;
    try {
      const o = await startOeuvre({ title, goal, leader_slug: leader, participants, note, policy });
      id = o.id;
    } catch (err) {
      return fail(400, { error: err instanceof Error ? err.message : String(err) });
    }

    throw redirect(303, `/oeuvres/${id}`);
  }
};
