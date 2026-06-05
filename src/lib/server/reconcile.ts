import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSource } from './index-sources';
import { indexDelete, indexUpsert } from './indexer';
import { councilRoot } from './paths';
import { INDEX_MAX_FILE_BYTES } from './config';

export async function reindexFile(rel: string): Promise<void> {
  const src = resolveSource(rel);
  if (!src) return;
  const refId = src.refId(rel);
  const abs = join(councilRoot(), rel);

  // Oversize product files: skip embedding (and drop any prior chunks). The
  // structured council kinds are bounded, so this only gates project_file.
  if (src.kind === 'project_file') {
    let size: number;
    try {
      size = statSync(abs).size;
    } catch {
      indexDelete(src.kind, refId);
      return;
    }
    if (size > INDEX_MAX_FILE_BYTES) {
      indexDelete(src.kind, refId);
      return;
    }
  }

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
