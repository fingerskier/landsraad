import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  activeOeuvre,
  createOeuvre,
  listOeuvres,
  readOeuvre,
  readParticipants,
  writeOeuvre
} from './oeuvres';
import { createCouncil } from './councils';
import { createCouncillor } from './councillors';

async function setup() {
  process.env.LANDSRAAD_COUNCIL_ROOT = mkdtempSync(join(tmpdir(), 'landsraad-oeuvre-'));
  await createCouncil({ name: 'T', description: '' });
  await createCouncillor({ name: 'Leo', role: 'leader', routing_hint: '', adapter: 'mock:local', persona: 'p' });
  await createCouncillor({ name: 'Alice', role: 'maker', routing_hint: '', adapter: 'mock:local', persona: 'p' });
  await createCouncillor({ name: 'Bob', role: 'critic', routing_hint: '', adapter: 'mock:local', persona: 'p' });
}

describe('createOeuvre', () => {
  beforeEach(setup);

  it('creates an active oeuvre with seeded participant states', async () => {
    const o = await createOeuvre({
      title: 'Ship it',
      goal: 'Plan the launch',
      leader_slug: 'leo',
      participants: ['alice', 'bob'],
      note: 'be terse'
    });
    expect(o.status).toBe('active');
    expect(o.participants).toEqual(['alice', 'bob']);
    expect(o.scratchpad_version).toBe(0);
    const states = await readParticipants(o.id);
    expect(Object.keys(states).sort()).toEqual(['alice', 'bob']);
    expect(states.alice.vote).toBeNull();
    expect(states.alice.out).toBe(false);
    const persisted = await readOeuvre(o.id);
    expect(persisted.title).toBe('Ship it');
  });

  it('rejects the leader being a participant', async () => {
    await expect(
      createOeuvre({ title: 'X', goal: 'g', leader_slug: 'leo', participants: ['leo', 'alice'] })
    ).rejects.toThrow(/leader cannot also be a participant/i);
  });

  it('rejects empty participants', async () => {
    await expect(
      createOeuvre({ title: 'X', goal: 'g', leader_slug: 'leo', participants: [] })
    ).rejects.toThrow(/at least one participant/i);
  });

  it('rejects an unknown leader or participant', async () => {
    await expect(
      createOeuvre({ title: 'X', goal: 'g', leader_slug: 'ghost', participants: ['alice'] })
    ).rejects.toThrow(/not a councillor/i);
    await expect(
      createOeuvre({ title: 'X', goal: 'g', leader_slug: 'leo', participants: ['ghost'] })
    ).rejects.toThrow(/not a councillor/i);
  });

  it('enforces one active oeuvre at a time', async () => {
    await createOeuvre({ title: 'First', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    await expect(
      createOeuvre({ title: 'Second', goal: 'g', leader_slug: 'leo', participants: ['bob'] })
    ).rejects.toThrow(/already active/i);
  });

  it('allows a new oeuvre once the prior is terminal', async () => {
    const first = await createOeuvre({ title: 'First', goal: 'g', leader_slug: 'leo', participants: ['alice'] });
    const f = await readOeuvre(first.id);
    f.status = 'concluded';
    await writeOeuvre(f);
    expect(await activeOeuvre()).toBeNull();
    const second = await createOeuvre({ title: 'Second', goal: 'g', leader_slug: 'leo', participants: ['bob'] });
    expect(second.status).toBe('active');
    expect((await listOeuvres()).length).toBe(2);
  });
});
