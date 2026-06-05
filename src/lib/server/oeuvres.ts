import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Oeuvre,
  OeuvreEvent,
  OeuvreParticipants,
  OeuvrePolicy,
  OeuvreStatus,
  OeuvreTurnLine,
  ParticipantState
} from '$lib/types';
import { oeuvreDir, oeuvreIdFor, oeuvresDir } from './paths';
import { hasCouncil } from './councils';
import { readCouncillor } from './councillors';
import {
  OEUVRE_MAX_CONSEC_FAILURES,
  OEUVRE_MAX_TEXT_BYTES_DEFAULT,
  OEUVRE_MAX_TURNS_DEFAULT,
  OEUVRE_MAX_WALL_MS_DEFAULT
} from './config';

const OEUVRE_FILE = 'oeuvre.json';
const NOTE_FILE = 'note.md';
const SCRATCHPAD_FILE = 'scratchpad.md';
const PARTICIPANTS_FILE = 'participants.json';
const TURNS_FILE = 'turns.jsonl';
const EVENTS_FILE = 'events.jsonl';

const TERMINAL: OeuvreStatus[] = ['concluded', 'cancelled', 'failed'];

export function isTerminal(status: OeuvreStatus): boolean {
  return TERMINAL.includes(status);
}

export interface NewOeuvreInput {
  title: string;
  goal: string;
  leader_slug: string;
  participants: string[];
  note?: string;
  policy?: Partial<OeuvrePolicy>;
}

export function defaultParticipantState(): ParticipantState {
  return {
    vote: null,
    reason: '',
    scratchpad_version: 0,
    turn_idx: -1,
    failures: 0,
    out: false,
    ts: new Date(0).toISOString()
  };
}

function resolvePolicy(p?: Partial<OeuvrePolicy>): OeuvrePolicy {
  return {
    max_turns: p?.max_turns ?? OEUVRE_MAX_TURNS_DEFAULT,
    max_wall_ms: p?.max_wall_ms ?? OEUVRE_MAX_WALL_MS_DEFAULT,
    max_text_bytes: p?.max_text_bytes ?? OEUVRE_MAX_TEXT_BYTES_DEFAULT,
    max_consecutive_failures: p?.max_consecutive_failures ?? OEUVRE_MAX_CONSEC_FAILURES
  };
}

/** The single non-terminal oeuvre, if any (v0 allows one active at a time). */
export async function activeOeuvre(): Promise<Oeuvre | null> {
  const all = await listOeuvres();
  return all.find((o) => !isTerminal(o.status)) ?? null;
}

export async function createOeuvre(input: NewOeuvreInput, now: Date = new Date()): Promise<Oeuvre> {
  if (!hasCouncil()) throw new Error('No council exists in the current directory.');
  if (!input.title.trim()) throw new Error('Oeuvre title is required.');
  if (!input.goal.trim()) throw new Error('A goal is required.');
  if (!input.leader_slug.trim()) throw new Error('A leader councillor is required.');

  const participants = [...new Set(input.participants.map((s) => s.trim()).filter(Boolean))];
  if (participants.length === 0) throw new Error('At least one participant is required.');
  if (participants.includes(input.leader_slug)) {
    throw new Error('The leader cannot also be a participant — it orchestrates but never takes a turn.');
  }

  await readCouncillor(input.leader_slug).catch(() => {
    throw new Error(`Leader "${input.leader_slug}" is not a councillor.`);
  });
  for (const slug of participants) {
    await readCouncillor(slug).catch(() => {
      throw new Error(`Participant "${slug}" is not a councillor.`);
    });
  }

  const existing = await activeOeuvre();
  if (existing) {
    throw new Error(`An oeuvre is already active ("${existing.title}"). Conclude or cancel it first.`);
  }

  const id = oeuvreIdFor(input.title, now);
  const dir = oeuvreDir(id);
  if (existsSync(dir)) throw new Error(`Oeuvre "${id}" already exists.`);

  const oeuvre: Oeuvre = {
    id,
    title: input.title.trim(),
    goal: input.goal.trim(),
    leader_slug: input.leader_slug.trim(),
    participants,
    status: 'active',
    policy: resolvePolicy(input.policy),
    scratchpad_version: 0,
    total_turns: 0,
    text_bytes: 0,
    leader_failures: 0,
    started_at: now.toISOString(),
    concluded_at: null
  };

  const states: OeuvreParticipants = {};
  for (const slug of participants) states[slug] = defaultParticipantState();

  await mkdir(dir, { recursive: true });
  await writeOeuvre(oeuvre);
  await writeFile(join(dir, NOTE_FILE), input.note ?? '', 'utf8');
  await writeFile(join(dir, SCRATCHPAD_FILE), '', 'utf8');
  await writeParticipants(id, states);
  await appendOeuvreEvent(id, { at: now.toISOString(), type: 'created' });
  return oeuvre;
}

export async function readOeuvre(id: string): Promise<Oeuvre> {
  const raw = await readFile(join(oeuvreDir(id), OEUVRE_FILE), 'utf8');
  return JSON.parse(raw) as Oeuvre;
}

export async function writeOeuvre(o: Oeuvre): Promise<void> {
  await writeFile(join(oeuvreDir(o.id), OEUVRE_FILE), JSON.stringify(o, null, 2) + '\n', 'utf8');
}

export async function listOeuvres(filter?: {
  status?: OeuvreStatus | OeuvreStatus[];
}): Promise<Oeuvre[]> {
  const dir = oeuvresDir();
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Oeuvre[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const o = await readOeuvre(e.name).catch(() => null);
    if (!o) continue;
    if (filter?.status) {
      const set = Array.isArray(filter.status) ? new Set(filter.status) : new Set([filter.status]);
      if (!set.has(o.status)) continue;
    }
    out.push(o);
  }
  out.sort((a, b) => b.id.localeCompare(a.id));
  return out;
}

export async function readNote(id: string): Promise<string> {
  return readFile(join(oeuvreDir(id), NOTE_FILE), 'utf8').catch(() => '');
}

export async function writeNote(id: string, body: string): Promise<void> {
  await writeFile(join(oeuvreDir(id), NOTE_FILE), body, 'utf8');
}

export async function readScratchpad(id: string): Promise<string> {
  return readFile(join(oeuvreDir(id), SCRATCHPAD_FILE), 'utf8').catch(() => '');
}

export async function writeScratchpad(id: string, body: string): Promise<void> {
  await writeFile(join(oeuvreDir(id), SCRATCHPAD_FILE), body, 'utf8');
}

export async function readParticipants(id: string): Promise<OeuvreParticipants> {
  const raw = await readFile(join(oeuvreDir(id), PARTICIPANTS_FILE), 'utf8').catch(() => '{}');
  return JSON.parse(raw) as OeuvreParticipants;
}

export async function writeParticipants(id: string, states: OeuvreParticipants): Promise<void> {
  await writeFile(
    join(oeuvreDir(id), PARTICIPANTS_FILE),
    JSON.stringify(states, null, 2) + '\n',
    'utf8'
  );
}

export async function appendOeuvreEvent(id: string, event: OeuvreEvent): Promise<void> {
  await appendFile(join(oeuvreDir(id), EVENTS_FILE), JSON.stringify(event) + '\n', 'utf8');
}

export async function readOeuvreEvents(id: string): Promise<OeuvreEvent[]> {
  const file = join(oeuvreDir(id), EVENTS_FILE);
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as OeuvreEvent);
}

export async function appendTurnLine(id: string, line: OeuvreTurnLine): Promise<void> {
  await appendFile(join(oeuvreDir(id), TURNS_FILE), JSON.stringify(line) + '\n', 'utf8');
}

export async function readTurnLines(id: string): Promise<OeuvreTurnLine[]> {
  const file = join(oeuvreDir(id), TURNS_FILE);
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as OeuvreTurnLine);
}
