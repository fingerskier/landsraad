import { join } from 'node:path';
import { cwd, env } from 'node:process';

export function councilRoot(): string {
  return env.LANDSRAAD_COUNCIL_ROOT || cwd();
}

/**
 * The council's machine state lives under `<councilRoot>/.landsraad/`, keeping it
 * out of the way of the working directory (the product the agents assemble). The
 * council root itself stays the process cwd — and the adapter cwd — so agents run
 * in the product tree. Only `.env` and `.gitignore` stay at the root.
 */
export function councilDataRoot(): string {
  return join(councilRoot(), '.landsraad');
}

export function pkgRoot(): string {
  return env.LANDSRAAD_PKG_ROOT || cwd();
}

export function bundledTemplatesDir(): string {
  return join(pkgRoot(), 'example');
}

export function councilFile(): string {
  return join(councilDataRoot(), 'council.json');
}

export function councilEnvFile(): string {
  return join(councilRoot(), '.env');
}

export function councillorsRoot(): string {
  return join(councilDataRoot(), 'councillors');
}

export function councillorDir(councillorSlug: string): string {
  return join(councillorsRoot(), councillorSlug);
}

export function councillorMemoryDir(councillorSlug: string): string {
  return join(councillorDir(councillorSlug), 'memory');
}

export function memoryDir(): string {
  return join(councilDataRoot(), 'memory');
}

export function jobsDir(): string {
  return join(councilDataRoot(), 'jobs');
}

export function jobDir(jobId: string): string {
  return join(jobsDir(), jobId);
}

export function indexDirPath(): string {
  return join(councilDataRoot(), '.index');
}

export function indexDbPath(): string {
  return join(indexDirPath(), 'embeddings.db');
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  if (!slug) throw new Error('Name must contain at least one alphanumeric character.');
  return slug;
}

export function jobIdFor(title: string, now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const titleSlug = slugify(title);
  return `${ts}-${titleSlug}`;
}

export function proposalsDir(): string {
  return join(councilDataRoot(), 'proposals');
}

export function jobProposalsDir(): string {
  return join(proposalsDir(), 'jobs');
}

export function schedulesDir(): string {
  return join(councilDataRoot(), 'schedules');
}

export function scheduleFile(scheduleId: string): string {
  return join(schedulesDir(), `${scheduleId}.json`);
}

export function scheduleEventsFile(scheduleId: string): string {
  return join(schedulesDir(), `${scheduleId}.events.jsonl`);
}

export function scheduleIdFor(title: string, now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const titleSlug = slugify(title);
  return `${ts}-${titleSlug}`;
}

export function meetingsDir(): string {
  return join(councilDataRoot(), 'meetings');
}

export function meetingDir(meetingId: string): string {
  return join(meetingsDir(), meetingId);
}

export function meetingIdFor(title: string, now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[:.]/g, '-');
  return `${ts}-${slugify(title)}`;
}

export function meetingsIncomingFile(): string {
  return join(councilDataRoot(), 'meetings-incoming.jsonl');
}

export function oeuvresDir(): string {
  return join(councilDataRoot(), 'oeuvres');
}

export function oeuvreDir(oeuvreId: string): string {
  return join(oeuvresDir(), oeuvreId);
}

export function oeuvreIdFor(title: string, now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[:.]/g, '-');
  return `${ts}-${slugify(title)}`;
}
