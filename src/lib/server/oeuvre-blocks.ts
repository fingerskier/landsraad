// Parsers for the fenced blocks an oeuvre's leader and workers emit. Kept pure
// and whitespace-tolerant, mirroring the reflection block parser. Unknown tags
// are ignored (forward-compat).
import type { OeuvreVote } from '$lib/types';

const ATTR_COUNCILLOR_RE = /councillor="([^"]*)"/;
const ATTR_SAY_RE = /say="([^"]*)"/;
const ATTR_VALUE_RE = /value="([^"]*)"/;
const ATTR_REASON_RE = /reason="([^"]*)"/;

export interface ParsedNext {
  councillor: string | null;
  say: string;
}

const NEXT_RE = /<<NEXT\b([^>]*)>>/;

/** Parse the leader's routing directive. Returns the first `<<NEXT>>` found. */
export function parseNext(text: string): ParsedNext | null {
  const m = NEXT_RE.exec(text);
  if (!m) return null;
  const attrs = m[1] ?? '';
  const councillorRaw = ATTR_COUNCILLOR_RE.exec(attrs)?.[1]?.trim() ?? '';
  const say = ATTR_SAY_RE.exec(attrs)?.[1]?.trim() ?? '';
  return { councillor: councillorRaw === '' ? null : councillorRaw, say };
}

const SCRATCHPAD_RE = /<<SCRATCHPAD>>([\s\S]*?)<<\/SCRATCHPAD>>/;

/**
 * Parse a worker's scratchpad edit. Returns the inner body (trimmed of a single
 * leading newline + trailing whitespace), or null when no block is present.
 */
export function parseScratchpad(text: string): string | null {
  const m = SCRATCHPAD_RE.exec(text);
  if (!m) return null;
  return m[1].replace(/^\n/, '').replace(/\s+$/, '');
}

export interface ParsedVote {
  value: OeuvreVote;
  reason: string;
}

const VOTE_RE = /<<VOTE\b([^>]*)>>(?:([\s\S]*?)<<\/VOTE>>)?/;

/**
 * Parse a worker's vote. A missing or malformed vote defaults to `continue` so
 * a garbled turn can never spuriously conclude the loop. The reason comes from
 * a `<</VOTE>>` body when present, otherwise the `reason="..."` attribute.
 */
export function parseVote(text: string): ParsedVote {
  const m = VOTE_RE.exec(text);
  if (!m) return { value: 'continue', reason: '(no vote emitted)' };
  const attrs = m[1] ?? '';
  const valueRaw = ATTR_VALUE_RE.exec(attrs)?.[1]?.trim();
  const value: OeuvreVote = valueRaw === 'finish' ? 'finish' : 'continue';
  const body = m[2]?.replace(/^\n/, '').replace(/\s+$/, '') ?? '';
  const attrReason = ATTR_REASON_RE.exec(attrs)?.[1]?.trim() ?? '';
  const reason = body || attrReason || (value === 'finish' ? '(approved)' : '(no reason given)');
  return { value, reason };
}
