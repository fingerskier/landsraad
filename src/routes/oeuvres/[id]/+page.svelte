<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { Markdown } from '$lib/components';
  import type { PageData } from './$types';

  let { data, form }: { data: PageData; form: { error?: string; saved?: boolean } | null } = $props();
  const o = $derived(data.oeuvre);
  const terminal = $derived(['concluded', 'cancelled', 'failed'].includes(o.status));

  // Live-refresh while the loop is running.
  let autoRefresh: ReturnType<typeof setInterval> | undefined;
  $effect(() => {
    if (!terminal) {
      autoRefresh = setInterval(() => void invalidateAll(), 2000);
      return () => clearInterval(autoRefresh);
    }
  });

  let noteDraft = $state(data.note);

  function kb(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const poolFinished = $derived(
    o.participants.filter(
      (s) =>
        !data.participants[s]?.out &&
        data.participants[s]?.vote === 'finish' &&
        data.participants[s]?.scratchpad_version === o.scratchpad_version
    ).length
  );
  const poolSize = $derived(o.participants.filter((s) => !data.participants[s]?.out).length);

  // Newest-first transcript from turns.jsonl (leader picks interleaved).
  const timeline = $derived([...data.turns].reverse());
</script>

<p><a href="/oeuvres">&larr; Oeuvres</a></p>

<div class="head">
  <h1>{o.title}</h1>
  <span class="status status-{o.status}">{o.status}</span>
</div>
<div class="meta">
  <span>leader <strong>{o.leader_slug}</strong></span>
  <span class="sep">·</span>
  <span>turn {o.total_turns}/{o.policy.max_turns}</span>
  <span class="sep">·</span>
  <span>{poolFinished}/{poolSize} finish @v{o.scratchpad_version}</span>
  <span class="sep">·</span>
  <span>{kb(o.text_bytes)} / {kb(o.policy.max_text_bytes)}</span>
</div>

{#if o.pause_reason}<p class="banner">{o.pause_reason}</p>{/if}
{#if form?.error}<p class="error">{form.error}</p>{/if}

<div class="actions">
  {#if o.status === 'active'}
    <form method="POST" action="?/pause"><button class="btn">Pause</button></form>
    <form method="POST" action="?/conclude"><button class="btn">Conclude now</button></form>
    <form method="POST" action="?/cancel"><button class="btn danger">Cancel</button></form>
  {:else if o.status === 'paused'}
    <form method="POST" action="?/resume"><button class="btn primary">Resume</button></form>
    <form method="POST" action="?/conclude"><button class="btn">Conclude now</button></form>
    <form method="POST" action="?/cancel"><button class="btn danger">Cancel</button></form>
  {/if}
</div>

<section>
  <h2>Goal</h2>
  <Markdown source={o.goal} />
</section>

<section>
  <h2>Director note</h2>
  {#if terminal}
    <p class="muted">{data.note || '(none)'}</p>
  {:else}
    <form method="POST" action="?/saveNote" class="note-form">
      <textarea name="note" rows="2" bind:value={noteDraft} placeholder="Steering picked up at the top of each turn…"></textarea>
      <button class="btn">Save note</button>
      {#if form?.saved}<span class="saved">saved</span>{/if}
    </form>
  {/if}
</section>

<section>
  <h2>Scratchpad <span class="ver">v{o.scratchpad_version}</span></h2>
  {#if data.scratchpad.trim()}
    <div class="scratch"><Markdown source={data.scratchpad} /></div>
  {:else}
    <p class="muted">(empty — nothing written yet)</p>
  {/if}
</section>

<section>
  <h2>Participants</h2>
  <ul class="votes">
    {#each o.participants as slug (slug)}
      {@const p = data.participants[slug]}
      <li>
        <span class="who">{slug}</span>
        {#if p?.out}
          <span class="vote out">out</span>
        {:else if !p || p.vote === null}
          <span class="vote none">—</span>
        {:else}
          <span class="vote {p.vote}">{p.vote}</span>
          {#if p.vote === 'finish' && p.scratchpad_version !== o.scratchpad_version}
            <span class="stale">(stale)</span>
          {/if}
        {/if}
        {#if p?.reason}<span class="reason">{p.reason}</span>{/if}
      </li>
    {/each}
  </ul>
</section>

{#if terminal && (o.shared_memory_slugs?.length || o.memory_slugs?.length || o.proposed_jobs?.length)}
  <section>
    <h2>Consolidation</h2>
    {#if (o.shared_memory_slugs?.length ?? 0) + (o.memory_slugs?.length ?? 0) > 0}
      <p>Memories: {[...(o.shared_memory_slugs ?? []), ...(o.memory_slugs ?? [])].join(', ')}</p>
    {/if}
    {#if o.proposed_jobs?.length}
      <p><a href="/proposals">{o.proposed_jobs.length} proposed job{o.proposed_jobs.length === 1 ? '' : 's'} →</a></p>
    {/if}
  </section>
{/if}

<section>
  <h2>Transcript</h2>
  {#if timeline.length === 0}
    <p class="muted">No turns yet.</p>
  {:else}
    <ul class="timeline">
      {#each timeline as t, i (i)}
        {#if t.kind === 'leader_pick'}
          <li class="pick">
            <span class="chip leader">{t.leader}</span> → <span class="chip">{t.picked}</span>
            {#if t.say}<span class="say">“{t.say}”</span>{/if}
          </li>
        {:else if t.kind === 'turn'}
          <li class="turn">
            <span class="chip">{t.councillor}</span>
            <span class="tag">{t.edited ? 'edited' : 'ratified'}</span>
            <span class="vote {t.vote}">{t.vote}</span>
            {#if t.reason}<span class="reason">{t.reason}</span>{/if}
            {#if t.job_id}<a class="joblink" href={`/jobs/${t.job_id}`}>job</a>{/if}
          </li>
        {:else}
          <li class="turn failed">
            <span class="chip">{t.councillor}</span>
            <span class="tag fail">failed{t.out ? ' → out' : ''}</span>
            {#if t.job_id}<a class="joblink" href={`/jobs/${t.job_id}`}>job</a>{/if}
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</section>

<style>
  .head { display: flex; align-items: baseline; gap: 0.8rem; }
  h1 { margin: 0; }
  h2 { margin: 0 0 0.5rem; font-size: 1.05rem; }
  section { margin-top: 1.6rem; }
  .meta { color: var(--muted); font-size: 0.85em; display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.3rem; }
  .sep { opacity: 0.4; }
  .banner { background: rgba(210, 114, 114, 0.12); border: 1px solid var(--danger, #d27272); border-radius: 6px; padding: 0.5rem 0.8rem; }
  .error { color: var(--danger, #d27272); }
  .muted { color: var(--muted); }
  .ver { color: var(--muted); font-weight: normal; font-size: 0.85rem; }
  .actions { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
  .actions form { margin: 0; }
  .btn { padding: 0.45rem 0.85rem; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: transparent; color: var(--fg); font: inherit; }
  .btn.primary { background: var(--accent); color: #0f1115; border-color: var(--accent); font-weight: 600; }
  .btn.danger { border-color: var(--danger, #d27272); color: var(--danger, #d27272); }
  .note-form { display: flex; gap: 0.5rem; align-items: flex-start; }
  .note-form textarea { flex: 1; font: inherit; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg, #0f1115); color: var(--fg); }
  .saved { color: #8bb98b; align-self: center; font-size: 0.85em; }
  .scratch { border: 1px solid var(--border); border-radius: 8px; padding: 0.4rem 1rem; }
  .votes, .timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.45rem; }
  .votes li { display: flex; gap: 0.6rem; align-items: baseline; flex-wrap: wrap; }
  .who { font-weight: 600; min-width: 6rem; }
  .vote { font-size: 0.8em; padding: 0.05rem 0.45rem; border-radius: 999px; border: 1px solid var(--border); }
  .vote.finish { color: #8bb98b; border-color: #8bb98b; }
  .vote.continue { color: #e0c060; border-color: #e0c060; }
  .vote.out { color: var(--muted); }
  .vote.none { color: var(--muted); }
  .stale { color: var(--muted); font-size: 0.8em; }
  .reason { color: var(--muted); font-size: 0.88em; }
  .timeline li { display: flex; gap: 0.5rem; align-items: baseline; flex-wrap: wrap; padding: 0.3rem 0; border-bottom: 1px solid var(--border); }
  .pick { color: var(--muted); font-size: 0.9em; }
  .chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 0.05rem 0.4rem; font-weight: 600; }
  .chip.leader { background: rgba(96,160,224,0.15); }
  .say { font-style: italic; color: var(--muted); }
  .tag { font-size: 0.8em; color: var(--muted); }
  .tag.fail { color: var(--danger, #d27272); }
  .joblink { font-size: 0.8em; }
  .status { font-weight: 600; }
  .status-active { color: #e0c060; }
  .status-paused { color: var(--accent); }
  .status-concluding { color: #e0c060; }
  .status-concluded { color: #8bb98b; }
  .status-failed { color: var(--danger, #d27272); }
  .status-cancelled { color: var(--muted); }
</style>
