import { env } from 'node:process';
import { readCouncillor } from './councillors';
import { councilRoot } from './paths';
import { assembleContextFor } from './context';
import {
  appendEvent,
  appendTranscript,
  currentJobForCouncillor,
  readInput,
  readJob,
  readOutput,
  readTranscript,
  setStatus,
  writeInput,
  writeJob,
  writeOutput
} from './jobs';
import { resolveAdapter, type ResolvedAdapter } from './adapters';
import { runAdapter } from './adapters/runAdapter';
import { applyReflectionBlocks, buildReflectionPrompt } from './reflection';
import {
  tryAcquire,
  release as releaseLock,
  current as lockCurrent
} from './councillor-lock';
import type { Job } from '$lib/types';

type RunPhase = 'running' | 'reflecting';

interface ActiveRun {
  jobId: string;
  councillorSlug: string;
  controller: AbortController;
  phase: RunPhase;
}

// keyed by jobId (not councillor slug)
const runs = new Map<string, ActiveRun>();
const pendingCancels = new Set<string>();

export function currentRuns(): Array<{ councillor: string; jobId: string; phase: RunPhase }> {
  const out: Array<{ councillor: string; jobId: string; phase: RunPhase }> = [];
  for (const run of runs.values())
    out.push({ councillor: run.councillorSlug, jobId: run.jobId, phase: run.phase });
  return out;
}

/**
 * Reflection budget. Reflection runs after a job is already marked `succeeded`
 * but while the run still holds the councillor lock + `runs` entry (so the lane
 * reads busy/reflecting). A hung reflection must never pin a councillor forever,
 * so the reflection adapter call is bounded. Override via
 * `LANDSRAAD_REFLECT_TIMEOUT_MS`; defaults to 2 minutes.
 */
function reflectTimeoutMs(): number {
  const raw = Number(env.LANDSRAAD_REFLECT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 120_000;
}

export function isRunning(councillorSlug: string): boolean {
  const h = lockCurrent(councillorSlug);
  return h?.kind === 'job';
}

export async function cancelJob(jobId: string): Promise<void> {
  const run = runs.get(jobId);
  if (run) {
    run.controller.abort();
    return;
  }
  // Job not yet registered (setup awaits still pending) — mark for cancellation on start.
  pendingCancels.add(jobId);
}

export interface RunOptions {
  adapterOverride?: ResolvedAdapter;
  /**
   * Skip the post-success reflection pass. Oeuvre worker turns set this — the
   * oeuvre runs a single consolidation pass on conclusion instead of reflecting
   * per turn.
   */
  skipReflection?: boolean;
  /**
   * Adapter timeout in ms. Defaults to -1 (no timeout) to preserve job
   * semantics; oeuvre turns pass a bounded value.
   */
  timeoutMs?: number;
}

async function reflectAfterSuccess(
  job: Job,
  councillor: { slug: string; reflect: boolean },
  adapter: ResolvedAdapter,
  signal: AbortSignal
): Promise<void> {
  if (!councillor.reflect) return;
  const transcript = await readTranscript(job.id).catch(() => '');
  const output = await readOutput(job.id).catch(() => '');
  const prompt = buildReflectionPrompt({
    title: job.title,
    brief: job.brief,
    transcript,
    output
  });

  // Bounded so a hung/slow reflection can't keep the councillor pinned busy after
  // the job already succeeded. runAdapter aborts the adapter on timeout and never
  // throws — it reports the outcome via timedOut/exit_code.
  const timeoutMs = reflectTimeoutMs();
  let stderrAccum = '';
  const res = await runAdapter({
    adapter,
    prompt,
    cwd: councilRoot(),
    timeoutMs,
    abortSignal: signal,
    onStderr: (text) => {
      stderrAccum += text;
    }
  });
  if (res.timedOut) {
    await appendEvent(job.id, {
      at: new Date().toISOString(),
      type: 'reflection_failed',
      message: `reflection timed out after ${timeoutMs}ms`
    });
    return;
  }
  if (res.exit_code !== 0) {
    await appendEvent(job.id, {
      at: new Date().toISOString(),
      type: 'reflection_failed',
      message: stderrAccum.trim() || `exit ${res.exit_code}`
    });
    return;
  }
  const reflectionOut = res.output;

  const apply = await applyReflectionBlocks({
    text: reflectionOut,
    sourceCouncillorSlug: councillor.slug,
    sourceKind: 'job',
    sourceId: job.id
  });
  for (const msg of apply.errors) {
    await appendEvent(job.id, {
      at: new Date().toISOString(),
      type: 'reflection_failed',
      message: msg
    });
  }
  const persisted = await readJob(job.id);
  await writeJob({
    ...persisted,
    memory_slugs: apply.memorySlugs,
    shared_memory_slugs: apply.sharedMemorySlugs
  });
  const totalWritten = apply.memorySlugs.length + apply.sharedMemorySlugs.length;
  await appendEvent(job.id, {
    at: new Date().toISOString(),
    type: 'reflected',
    message: `wrote ${totalWritten} memor${totalWritten === 1 ? 'y' : 'ies'}`
  });
  for (const pid of apply.proposalIds) {
    await appendEvent(job.id, {
      at: new Date().toISOString(),
      type: 'proposed_job',
      message: `proposal ${pid}`
    });
  }
}

async function buildPrompt(job: Job, personaBody: string): Promise<string> {
  const memCtx = await assembleContextFor(job.councillor_slug, job.brief);
  const sections: string[] = [];
  if (personaBody.trim()) sections.push(`# Persona\n\n${personaBody.trim()}`);
  if (memCtx) sections.push(memCtx);
  sections.push(`# Task: ${job.title}\n\n${job.brief.trim()}`);
  return sections.join('\n\n') + '\n';
}

export async function runJobNow(jobId: string, opts: RunOptions = {}): Promise<Job> {
  const job = await readJob(jobId);
  if (job.status !== 'queued') {
    throw new Error(`Job ${jobId} is not queued (status: ${job.status}).`);
  }

  const councillor = await readCouncillor(job.councillor_slug);
  if (!tryAcquire(councillor.slug, { kind: 'job', id: jobId })) {
    throw new Error(`Councillor "${councillor.slug}" already has an active job.`);
  }

  const adapter = opts.adapterOverride ?? resolveAdapter(councillor.adapter);
  if (!adapter) {
    const err = `Unknown adapter "${councillor.adapter}" for councillor "${councillor.slug}".`;
    releaseLock(councillor.slug, { kind: 'job', id: jobId });
    await setStatus(jobId, 'failed', {
      finished_at: new Date().toISOString(),
      error: err
    });
    throw new Error(err);
  }

  const controller = new AbortController();
  if (pendingCancels.delete(jobId)) {
    controller.abort();
  }
  // Register the run BEFORE any further awaits. buildPrompt/writeInput below take
  // real time (memory IO + file write); if registration waited until after them,
  // a cancelJob() arriving in that window would land in pendingCancels — which has
  // already been consumed above and is never re-checked — and the abort would be lost,
  // letting the job run to 'succeeded'. No awaits between consuming pendingCancels
  // and runs.set() means there is no dead window.
  runs.set(jobId, { jobId, councillorSlug: councillor.slug, controller, phase: 'running' });

  const promise = (async (): Promise<Job> => {
    try {
      // Prompt assembly + input write live inside the try so the finally below
      // always releases the lock and clears the runs entry, even if they throw.
      const prompt = await buildPrompt(job, councillor.persona);
      await writeInput(jobId, prompt);

      await setStatus(jobId, 'running', {
        started_at: new Date().toISOString()
      });

      // stderrAccum collects streamed stderr chunks (for adapters that stream stderr).
      // Note: some adapters (e.g. mock with failWith) only provide stderr in result.stderr,
      // not as streamed chunks — those will be captured from adapterResult.transcript below.
      let stderrAccum = '';
      const adapterResult = await runAdapter({
        adapter,
        prompt,
        cwd: councilRoot(),
        timeoutMs: opts.timeoutMs ?? -1, // no timeout for jobs in v0; oeuvre turns bound it
        abortSignal: controller.signal,
        onStdout: (text) => { void appendTranscript(jobId, text); },
        onStderr: (text) => {
          stderrAccum += text;
          void appendTranscript(jobId, '[stderr] ' + text);
        }
      });

      // If onStderr received nothing but the transcript has a final stderr block
      // (appended by runAdapter from result.stderr), extract it for the error field.
      if (!stderrAccum) {
        const sep = '\n[stderr]\n';
        const idx = adapterResult.transcript.lastIndexOf(sep);
        if (idx !== -1) stderrAccum = adapterResult.transcript.slice(idx + sep.length);
      }

      if (controller.signal.aborted) {
        return await setStatus(jobId, 'cancelled', {
          finished_at: new Date().toISOString(),
          exit_code: adapterResult.exit_code,
          error: 'cancelled by user'
        });
      }

      await writeOutput(jobId, adapterResult.output);
      // runAdapter already appended final stderr via the onStderr callback line-by-line,
      // and also appended "\n[stderr]\n<stderr>" to its internal transcript field.
      // The original runner appended a final "\n[stderr]\n<stderr>" block to the transcript
      // file when result.stderr was non-empty. To preserve that behavior, we replicate it here
      // using the same data runAdapter read from result.stderr (exposed via adapterResult).
      // However, since onStderr already streamed those lines, we omit the duplicate to keep
      // the transcript consistent with what tests expect (streamed lines only, no double-append).

      if (adapterResult.exit_code === 0) {
        const succeeded = await setStatus(jobId, 'succeeded', {
          finished_at: new Date().toISOString(),
          exit_code: 0
        });
        // Job is done; the lingering busy window is now reflection. Surface it as a
        // distinct phase so the lane can read "reflecting" rather than a bare "busy"
        // that contradicts the Succeeded status.
        const active = runs.get(jobId);
        if (active) active.phase = 'reflecting';
        try {
          if (!opts.skipReflection) {
            await reflectAfterSuccess(succeeded, councillor, adapter, controller.signal);
          }
        } catch (err) {
          await appendEvent(jobId, {
            at: new Date().toISOString(),
            type: 'reflection_failed',
            message: err instanceof Error ? err.message : String(err)
          });
        }
        return await readJob(jobId);
      }
      return await setStatus(jobId, 'failed', {
        finished_at: new Date().toISOString(),
        exit_code: adapterResult.exit_code,
        error: stderrAccum || `exit ${adapterResult.exit_code}`
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await appendEvent(jobId, {
        at: new Date().toISOString(),
        type: 'stderr',
        message
      });
      return await setStatus(jobId, 'failed', {
        finished_at: new Date().toISOString(),
        error: message
      });
    } finally {
      releaseLock(councillor.slug, { kind: 'job', id: jobId });
      runs.delete(jobId);
      pendingCancels.delete(jobId);
    }
  })();

  return promise;
}

export function startJobInBackground(jobId: string, opts: RunOptions = {}): void {
  runJobNow(jobId, opts).catch(() => {
    // errors already captured in job state
  });
}

export async function kickScheduler(): Promise<void> {
  const { listCouncillors } = await import('./councillors');
  const councillors = await listCouncillors();
  for (const c of councillors) {
    if (isRunning(c.slug)) continue;
    const next = await currentJobForCouncillor(c.slug);
    if (next && next.status === 'queued') {
      startJobInBackground(next.id);
    }
  }
}

export { readInput };
