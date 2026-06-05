import { hasEmbedder, indexSearch } from './indexer';
import { listNotes } from './memory';
import { listPrivateNotes } from './memory_private';
import { buildRosterSection } from './roster';
import { MEMORY_CHAR_BUDGET, MEMORY_TOPK_PRIVATE, MEMORY_TOPK_SHARED, PROJECT_TOPK } from './config';

interface Entry {
  title: string;
  slug: string;
  body: string;
  similarity: number;
}

function formatSection(header: string, entries: Entry[]): string {
  if (entries.length === 0) return '';
  const blocks = entries.map((e) => `### ${e.title} (${e.slug})\n\n${e.body.trim()}`);
  return [`# ${header}`, ...blocks].join('\n\n');
}

/**
 * Evict the globally least-relevant entries (lowest cosine similarity, at each
 * bucket's tail since hits arrive sorted desc) until the combined size fits the
 * budget. Ties prefer evicting from earlier buckets (shared before private before
 * project). Generalized over N buckets so memory and project context share one budget.
 */
function applyBudget(buckets: Entry[][], budget: number): Entry[][] {
  const lists = buckets.map((b) => [...b]);
  const size = (e: Entry) => e.title.length + e.body.length + 16;
  const total = () => lists.reduce((a, l) => a + l.reduce((s, e) => s + size(e), 0), 0);
  while (total() > budget) {
    let worst = -1;
    let worstSim = Infinity;
    for (let i = 0; i < lists.length; i++) {
      const l = lists[i];
      if (l.length && l[l.length - 1].similarity < worstSim) {
        worstSim = l[l.length - 1].similarity;
        worst = i;
      }
    }
    if (worst === -1) break; // all empty
    lists[worst].pop();
  }
  return lists;
}

async function fallback(councillorSlug: string): Promise<string> {
  const shared = await listNotes();
  const priv = await listPrivateNotes(councillorSlug);
  const sharedEntries: Entry[] = shared.map((n) => ({
    title: n.title,
    slug: n.slug,
    body: n.body,
    similarity: 0
  }));
  const privEntries: Entry[] = priv.map((n) => ({
    title: n.title,
    slug: n.slug,
    body: n.body,
    similarity: 0
  }));
  const parts = [
    formatSection('Shared council memory', sharedEntries),
    formatSection('Your memory', privEntries)
  ].filter(Boolean);
  return parts.join('\n\n');
}

export async function assembleContextFor(councillorSlug: string, brief: string): Promise<string> {
  const roster = await buildRosterSection();

  if (!hasEmbedder()) {
    const body = await fallback(councillorSlug);
    return [roster, body].filter(Boolean).join('\n\n');
  }

  const sharedHits = await indexSearch(brief, { kinds: ['memory'], k: MEMORY_TOPK_SHARED });
  const privateHits = await indexSearch(brief, {
    kinds: ['memory_private'],
    k: MEMORY_TOPK_PRIVATE,
    councillor_slug: councillorSlug
  });
  const projectHits = await indexSearch(brief, { kinds: ['project_file'], k: PROJECT_TOPK });

  const sharedEntries: Entry[] = sharedHits.map((h) => ({
    title: h.title ?? h.ref_id,
    slug: h.ref_id,
    body: h.text,
    similarity: h.similarity
  }));
  const privEntries: Entry[] = privateHits.map((h) => ({
    title: h.title ?? h.ref_id,
    slug: h.ref_id.includes('/') ? h.ref_id.split('/')[1] : h.ref_id,
    body: h.text,
    similarity: h.similarity
  }));
  // Project hits keep the full relative path as their slug — it's the useful citation.
  const projectEntries: Entry[] = projectHits.map((h) => ({
    title: h.title ?? h.ref_id,
    slug: h.ref_id,
    body: h.text,
    similarity: h.similarity
  }));

  if (sharedEntries.length === 0 && privEntries.length === 0 && projectEntries.length === 0) {
    const body = await fallback(councillorSlug);
    return [roster, body].filter(Boolean).join('\n\n');
  }

  const [shared, priv, project] = applyBudget(
    [sharedEntries, privEntries, projectEntries],
    MEMORY_CHAR_BUDGET
  );
  const parts = [
    roster,
    formatSection('Shared council memory', shared),
    formatSection('Your memory', priv),
    formatSection('Project context', project)
  ].filter(Boolean);
  return parts.join('\n\n');
}
