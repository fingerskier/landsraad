import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { meetingsIncomingFile } from './paths';

export interface IncomingParticipation {
  ts: string;
  host_council: string;
  meeting_id: string;
  councillor_slug: string;
  duration_ms: number;
  exit_code: number;
}

/** Append one summon audit record to <council-root>/.landsraad/meetings-incoming.jsonl. */
export async function appendIncomingParticipation(rec: IncomingParticipation): Promise<void> {
  const file = meetingsIncomingFile();
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(rec) + '\n', 'utf8');
}

export async function readIncomingParticipation(): Promise<IncomingParticipation[]> {
  const file = meetingsIncomingFile();
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as IncomingParticipation);
}
