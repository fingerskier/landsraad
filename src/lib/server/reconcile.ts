import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSource } from './index-sources';
import { indexDelete, indexUpsert } from './indexer';
import { councilRoot } from './paths';

export async function reindexFile(rel: string): Promise<void> {
  const src = resolveSource(rel);
  if (!src) return;
  const refId = src.refId(rel);
  const abs = join(councilRoot(), rel);

  let text: string;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    indexDelete(src.kind, refId);
    return;
  }

  indexDelete(src.kind, refId);
  if (!text.trim()) return;

  const mtime = statSync(abs).mtime.toISOString();
  const chunks = src.buildChunks(text, rel, abs);
  for (const c of chunks) {
    await indexUpsert({
      kind: src.kind,
      ref_id: refId,
      chunk_idx: c.chunk_idx,
      text: c.text,
      source_path: abs,
      source_mtime: mtime,
      title: c.title,
      councillor_slug: c.councillor_slug
    });
  }
}

export function removeFile(rel: string): void {
  const src = resolveSource(rel);
  if (!src) return;
  indexDelete(src.kind, src.refId(rel));
}
