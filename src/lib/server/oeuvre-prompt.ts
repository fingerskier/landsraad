// Pure prompt composers for the oeuvre loop. The runner assembles persona +
// memory context and passes it in; these functions only shape the oeuvre-specific
// framing so they stay easy to unit-test.
import type { OeuvreParticipants } from '$lib/types';
import { MEETING_TURN_NUDGE } from './config';

function joinSections(parts: Array<string | undefined | null>): string {
  return parts.filter((p) => p && p.trim()).join('\n\n') + '\n';
}

export function participantsSummary(
  participants: string[],
  states: OeuvreParticipants,
  currentVersion: number
): string {
  if (participants.length === 0) return '(no participants)';
  return participants
    .map((slug) => {
      const s = states[slug];
      if (!s) return `- ${slug} — not yet spoken`;
      if (s.out) return `- ${slug} — [out: dropped after repeated failures]`;
      const vote = s.vote ?? 'not yet voted';
      const stale = s.vote === 'finish' && s.scratchpad_version !== currentVersion ? ' (stale)' : '';
      const reason = s.reason ? ` — ${s.reason}` : '';
      return `- ${slug} — ${vote}${stale} (v${s.scratchpad_version})${reason}`;
    })
    .join('\n');
}

export interface LeaderPickPromptInput {
  persona: string;
  context: string; // roster + retrieved memory, from assembleContextFor
  title: string;
  goal: string;
  note: string;
  scratchpad: string;
  version: number;
  participantsSummary: string;
  leaderSlug: string;
}

export function buildLeaderPickPrompt(i: LeaderPickPromptInput): string {
  return joinSections([
    i.persona.trim() ? `# Persona\n\n${i.persona.trim()}` : '',
    i.context,
    [
      `# Oeuvre: ${i.title}`,
      '',
      `## Goal`,
      '',
      i.goal.trim(),
      '',
      i.note.trim() ? `## Director note\n\n${i.note.trim()}\n` : '',
      `## Current scratchpad (v${i.version})`,
      '',
      i.scratchpad.trim() || '(empty — nothing written yet)',
      '',
      `## Participants & latest votes`,
      '',
      i.participantsSummary,
      '',
      `You are the leader (${i.leaderSlug}). You orchestrate but never take a turn yourself,`,
      `never pick yourself, and do not vote. Optionally say a sentence to steer the work,`,
      `then choose exactly ONE participant above (not yourself, not an [out] one) to work next.`,
      '',
      `Emit exactly one directive:`,
      '',
      `<<NEXT councillor="<participant-slug>" say="optional one-line steer">>`
    ].join('\n')
  ]);
}

export interface WorkerBriefInput {
  title: string;
  goal: string;
  note: string;
  leaderSay: string;
  scratchpad: string;
  version: number;
}

/**
 * The worker turn runs through the normal job path, which wraps this brief with
 * the councillor's persona + retrieved memory. So this returns just the
 * oeuvre-specific instruction body.
 */
export function buildWorkerBrief(i: WorkerBriefInput, nudge: string = MEETING_TURN_NUDGE): string {
  return [
    `You are advancing a shared work loop ("oeuvre") toward a goal.`,
    '',
    `## Goal`,
    '',
    i.goal.trim(),
    '',
    i.note.trim() ? `## Director note\n\n${i.note.trim()}\n` : '',
    i.leaderSay.trim() ? `## Leader says\n\n${i.leaderSay.trim()}\n` : '',
    `## Current scratchpad (v${i.version})`,
    '',
    i.scratchpad.trim() || '(empty — nothing written yet)',
    '',
    `## Your task`,
    '',
    `Revise the scratchpad to move the goal forward, OR ratify it unchanged if you`,
    `believe the goal is met. If you edit, return the FULL updated scratchpad between`,
    `the fences (omit the block entirely to make no change):`,
    '',
    `<<SCRATCHPAD>>`,
    `...full updated scratchpad markdown...`,
    `<</SCRATCHPAD>>`,
    '',
    `Then vote on whether the goal is achieved. Emit exactly one:`,
    '',
    `<<VOTE value="finish|continue" reason="one line: why">>`,
    // Same host-wide brevity lever as meeting turns (LANDSRAAD_MEETING_TURN_NUDGE);
    // empty by default, so this line vanishes unless an operator sets it.
    nudge.trim() ? `\n${nudge.trim()}` : '',
    ''
  ].join('\n');
}

export interface ConsolidationPromptInput {
  persona: string;
  context: string;
  title: string;
  goal: string;
  scratchpad: string;
  workLog: string;
}

export function buildConsolidationPrompt(i: ConsolidationPromptInput): string {
  return joinSections([
    i.persona.trim() ? `# Persona\n\n${i.persona.trim()}` : '',
    i.context,
    [
      `# Oeuvre consolidation: ${i.title}`,
      '',
      `The work loop below has concluded. Distill durable lessons and outcomes for`,
      `future work. Emit zero or more memory blocks (use scope="shared" for`,
      `council-wide knowledge) and zero or more follow-up job proposals.`,
      '',
      `<<MEMORY title="short slug-friendly title">>`,
      `body — include *why* this is worth remembering`,
      `<</MEMORY>>`,
      '',
      `<<JOB title="short title" councillor="optional-slug" priority="normal">>`,
      `brief — a clear, scoped follow-up`,
      `<</JOB>>`,
      '',
      `## Goal`,
      '',
      i.goal.trim(),
      '',
      `## Final scratchpad`,
      '',
      i.scratchpad.trim() || '(empty)',
      '',
      `## Work log`,
      '',
      i.workLog.trim() || '(no turns)',
      ''
    ].join('\n')
  ]);
}
