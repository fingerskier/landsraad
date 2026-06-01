import { describe, it, expect } from 'vitest';
import { attendeeRoundStatuses } from './meeting-status';
import type { MeetingEvent } from './types';

const ev = (type: MeetingEvent['type'], speaker?: string): MeetingEvent => ({
  at: '2026-01-01T00:00:00.000Z',
  type,
  ...(speaker ? { speaker } : {})
});

describe('attendeeRoundStatuses', () => {
  it('marks everyone pending when no turns have happened', () => {
    const s = attendeeRoundStatuses([ev('created'), ev('awaiting_director')], ['leto', 'jessica']);
    expect(s.get('leto')).toBe('pending');
    expect(s.get('jessica')).toBe('pending');
  });

  it('marks a councillor who finished a turn this round as spoke', () => {
    const s = attendeeRoundStatuses(
      [ev('director_turn', 'director'), ev('turn_started', 'leto'), ev('turn_finished', 'leto')],
      ['leto', 'jessica']
    );
    expect(s.get('leto')).toBe('spoke');
    expect(s.get('jessica')).toBe('pending');
  });

  it('marks a councillor whose turn failed as error (even though it is re-queued)', () => {
    const s = attendeeRoundStatuses(
      [ev('turn_started', 'leto'), ev('turn_failed', 'leto'), ev('paused')],
      ['leto', 'jessica']
    );
    expect(s.get('leto')).toBe('error');
  });

  it('only counts the latest round (resets at round_started)', () => {
    const s = attendeeRoundStatuses(
      [
        ev('turn_finished', 'leto'), // round 1: spoke
        ev('round_started'), // round 2 begins
        ev('director_turn', 'director')
        // leto has not spoken yet in round 2
      ],
      ['leto', 'jessica']
    );
    expect(s.get('leto')).toBe('pending');
    expect(s.get('jessica')).toBe('pending');
  });

  it('lets a successful retry override an earlier failure in the same round', () => {
    const s = attendeeRoundStatuses(
      [ev('turn_failed', 'leto'), ev('paused'), ev('resumed'), ev('turn_finished', 'leto')],
      ['leto']
    );
    expect(s.get('leto')).toBe('spoke');
  });

  it('ignores director and non-attendee speakers', () => {
    const s = attendeeRoundStatuses(
      [ev('director_turn', 'director'), ev('turn_finished', 'ghost')],
      ['leto']
    );
    expect(s.has('director')).toBe(false);
    expect(s.has('ghost')).toBe(false);
    expect(s.get('leto')).toBe('pending');
  });

  it('handles remote attendee tokens (council:councillor)', () => {
    const s = attendeeRoundStatuses(
      [ev('turn_finished', 'ops:gurney')],
      ['leto', 'ops:gurney']
    );
    expect(s.get('ops:gurney')).toBe('spoke');
    expect(s.get('leto')).toBe('pending');
  });
});
