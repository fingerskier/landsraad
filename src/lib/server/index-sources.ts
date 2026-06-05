import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { ChunkKind } from './embeddings';
import { parseTranscript } from './meetings';

export interface IndexChunk {
  chunk_idx: number;
  text: string;
  title: string | null;
  councillor_slug: string | null;
}

export interface IndexSource {
  kind: ChunkKind;
  test(rel: string): boolean;
  refId(rel: string): string;
  buildChunks(text: string, rel: string, absPath: string): IndexChunk[];
}

function norm(rel: string): string {
  return rel.replace(/\\/g, '/');
}

function firstHeading(body: string, fallback: string): string {
  const line = body.split('\n').find((l) => l.trim()) ?? '';
  const h = line.replace(/^#+\s*/, '').trim();
  return h || fallback;
}

function readJson(absPath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(absPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sibling(absPath: string, name: string): string {
  return join(dirname(absPath), name);
}

function jobSource(file: string, kind: ChunkKind): IndexSource {
  return {
    kind,
    test: (rel) => new RegExp(`^jobs/[^/]+/${file}$`).test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, _rel, abs) => {
      const job = readJson(sibling(abs, 'job.json'));
      return [
        {
          chunk_idx: 0,
          text,
          title: (job?.title as string) ?? null,
          councillor_slug: (job?.councillor_slug as string) ?? null
        }
      ];
    }
  };
}

function meetingWholeSource(file: string, kind: ChunkKind, titleSuffix: string, useChair: boolean): IndexSource {
  return {
    kind,
    test: (rel) => new RegExp(`^meetings/[^/]+/${file}$`).test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, _rel, abs) => {
      const m = readJson(sibling(abs, 'meeting.json'));
      const title = (m?.title as string) ?? norm(_rel).split('/')[1];
      return [
        {
          chunk_idx: 0,
          text,
          title: titleSuffix ? `${title}${titleSuffix}` : title,
          councillor_slug: useChair ? ((m?.chair_slug as string) ?? null) : null
        }
      ];
    }
  };
}

const SOURCES: IndexSource[] = [
  {
    kind: 'memory',
    test: (rel) => /^memory\/[^/]+\.md$/.test(norm(rel)),
    refId: (rel) => basename(norm(rel), '.md'),
    buildChunks: (text, rel) => [
      { chunk_idx: 0, text, title: firstHeading(text, basename(norm(rel), '.md')), councillor_slug: null }
    ]
  },
  {
    kind: 'memory_private',
    test: (rel) => /^councillors\/[^/]+\/memory\/[^/]+\.md$/.test(norm(rel)),
    refId: (rel) => {
      const p = norm(rel).split('/');
      return `${p[1]}/${basename(p[3], '.md')}`;
    },
    buildChunks: (text, rel) => {
      const p = norm(rel).split('/');
      return [{ chunk_idx: 0, text, title: firstHeading(text, basename(p[3], '.md')), councillor_slug: p[1] }];
    }
  },
  {
    kind: 'persona',
    test: (rel) => /^councillors\/[^/]+\/persona\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const slug = norm(rel).split('/')[1];
      const meta = readJson(sibling(abs, 'councillor.json'));
      return [{ chunk_idx: 0, text, title: (meta?.name as string) ?? slug, councillor_slug: slug }];
    }
  },
  jobSource('input\\.md', 'job_input'),
  jobSource('output\\.md', 'job_output'),
  jobSource('transcript\\.md', 'transcript'),
  {
    kind: 'meeting_turn',
    test: (rel) => /^meetings\/[^/]+\/transcript\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const m = readJson(sibling(abs, 'meeting.json'));
      const title = (m?.title as string) ?? norm(rel).split('/')[1];
      return parseTranscript(text).map((t) => ({
        chunk_idx: t.turnIndex,
        text: t.body,
        title: `${title} · turn ${t.turnIndex} · ${t.speaker}`,
        councillor_slug: t.speaker === 'director' || t.speaker.includes(':') ? null : t.speaker
      }));
    }
  },
  meetingWholeSource('topic\\.md', 'meeting_topic', '', false),
  meetingWholeSource('summary\\.md', 'meeting_summary', ' · summary', true),
  meetingWholeSource('synthesis\\.md', 'meeting_synthesis', ' · synthesis', true),
  {
    kind: 'oeuvre_scratchpad',
    test: (rel) => /^oeuvres\/[^/]+\/scratchpad\.md$/.test(norm(rel)),
    refId: (rel) => norm(rel).split('/')[1],
    buildChunks: (text, rel, abs) => {
      const o = readJson(sibling(abs, 'oeuvre.json'));
      const title = (o?.title as string) ?? norm(rel).split('/')[1];
      return [
        {
          chunk_idx: 0,
          text,
          title: `${title} · scratchpad`,
          councillor_slug: (o?.leader_slug as string) ?? null
        }
      ];
    }
  }
];

const DATA_PREFIX = '.landsraad/';

/**
 * Wrap a structured source so it sees the council-data-relative path (the
 * `.landsraad/` prefix peeled off), while reconcile keeps passing the full
 * `councilRoot()`-relative rel. This keeps every matcher regex and positional
 * `split('/')` index in SOURCES unchanged after the layout move.
 */
function stripPrefix(src: IndexSource): IndexSource {
  const inner = (rel: string) => norm(rel).slice(DATA_PREFIX.length);
  return {
    kind: src.kind,
    test: (rel) => src.test(inner(rel)),
    refId: (rel) => src.refId(inner(rel)),
    buildChunks: (text, rel, absPath) => src.buildChunks(text, inner(rel), absPath)
  };
}

/**
 * Product-tree prose (`.md`/`.txt`) outside `.landsraad/` — the workspace the
 * council assembles. Whole-file, one chunk (matching every structured source);
 * the ref id is the council-root-relative path. Code, CSV, and binaries are
 * deliberately excluded: the index is semantic memory, not a code search engine,
 * and adapters already see the tree via their own cwd + file tools.
 */
const PROJECT_SOURCE: IndexSource = {
  kind: 'project_file',
  test: (rel) => /\.(md|txt)$/i.test(norm(rel)),
  refId: (rel) => norm(rel),
  buildChunks: (text, rel) => {
    const name = basename(norm(rel));
    return [
      {
        chunk_idx: 0,
        text,
        title: /\.md$/i.test(name) ? firstHeading(text, name) : name,
        councillor_slug: null
      }
    ];
  }
};

export function resolveSource(rel: string): IndexSource | null {
  const n = norm(rel);
  if (n.startsWith(DATA_PREFIX)) {
    const inner = n.slice(DATA_PREFIX.length);
    const src = SOURCES.find((s) => s.test(inner));
    return src ? stripPrefix(src) : null;
  }
  // Product tree: index prose only (allowlist enforced here authoritatively).
  return PROJECT_SOURCE.test(n) ? PROJECT_SOURCE : null;
}

export const __sourcesForTest = SOURCES;
