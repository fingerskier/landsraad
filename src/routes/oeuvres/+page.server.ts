import type { PageServerLoad } from './$types';
import { listOeuvres, readParticipants } from '$lib/server/oeuvres';

export const load: PageServerLoad = async () => {
  const oeuvres = await listOeuvres();
  const rows = await Promise.all(
    oeuvres.map(async (o) => {
      const states = await readParticipants(o.id);
      const pool = o.participants.filter((s) => !states[s]?.out);
      const finished = pool.filter(
        (s) => states[s]?.vote === 'finish' && states[s]?.scratchpad_version === o.scratchpad_version
      ).length;
      return { oeuvre: o, poolSize: pool.length, finished };
    })
  );
  return { rows };
};
