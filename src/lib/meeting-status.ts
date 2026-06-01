import type { MeetingEvent } from './types';

export type AttendeeRoundStatus = 'spoke' | 'pending' | 'error';

// Per-attendee status for the LATEST round, derived from the meeting event log:
//   - 'spoke'   (green):  their most recent turn this round finished
//   - 'error'   (red):    their most recent turn this round failed
//   - 'pending' (yellow): they have not taken a turn yet this round
//
// We slice the log to the current round — everything after the last
// `round_started`, or the whole log if none has fired yet (round 1). This is why
// we read the events rather than `remaining_this_round`: a councillor whose turn
// failed gets re-queued into `remaining_this_round` (it retries on resume), so it
// would otherwise look identical to one that simply hasn't spoken. The
// `turn_failed` event is what distinguishes red from yellow.
export function attendeeRoundStatuses(
  events: MeetingEvent[],
  attendees: string[]
): Map<string, AttendeeRoundStatus> {
  let start = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'round_started') {
      start = i + 1;
      break;
    }
  }
  const roundEvents = events.slice(start);

  const status = new Map<string, AttendeeRoundStatus>();
  for (const a of attendees) status.set(a, 'pending');

  // In-order scan: the last finished/failed event for a speaker wins, so a
  // successful retry after a failure correctly lands on 'spoke'.
  for (const e of roundEvents) {
    if (!e.speaker || !status.has(e.speaker)) continue; // skip director / non-attendees
    if (e.type === 'turn_finished') status.set(e.speaker, 'spoke');
    else if (e.type === 'turn_failed') status.set(e.speaker, 'error');
  }
  return status;
}
