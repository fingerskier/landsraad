import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
  readOeuvre,
  readNote,
  readScratchpad,
  readParticipants,
  readTurnLines,
  writeNote
} from '$lib/server/oeuvres';
import {
  pauseOeuvre,
  resumeOeuvre,
  concludeOeuvre,
  cancelOeuvre
} from '$lib/server/oeuvre-runner';

export const load: PageServerLoad = async ({ params }) => {
  const oeuvre = await readOeuvre(params.id).catch(() => null);
  if (!oeuvre) throw error(404, 'Oeuvre not found');
  return {
    oeuvre,
    note: await readNote(params.id),
    scratchpad: await readScratchpad(params.id),
    participants: await readParticipants(params.id),
    turns: await readTurnLines(params.id)
  };
};

function failFrom(err: unknown) {
  return fail(400, { error: err instanceof Error ? err.message : String(err) });
}

export const actions: Actions = {
  saveNote: async ({ request, params }) => {
    const form = await request.formData();
    try {
      await writeNote(params.id!, String(form.get('note') ?? ''));
    } catch (err) {
      return failFrom(err);
    }
    return { ok: true, saved: true };
  },
  pause: async ({ params }) => {
    try {
      await pauseOeuvre(params.id!);
    } catch (err) {
      return failFrom(err);
    }
    return { ok: true };
  },
  resume: async ({ params }) => {
    try {
      await resumeOeuvre(params.id!);
    } catch (err) {
      return failFrom(err);
    }
    return { ok: true };
  },
  conclude: async ({ params }) => {
    try {
      await concludeOeuvre(params.id!);
    } catch (err) {
      return failFrom(err);
    }
    return { ok: true };
  },
  cancel: async ({ params }) => {
    try {
      await cancelOeuvre(params.id!);
    } catch (err) {
      return failFrom(err);
    }
    return { ok: true };
  }
};
