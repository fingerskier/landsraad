<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  function kb(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
</script>

<p><a href="/">&larr; Home</a></p>

<div class="head">
  <h1>Oeuvres</h1>
  <a class="btn primary" href="/oeuvres/new">+ New oeuvre</a>
</div>

<p class="lede">A goal-driven work loop: a leader picks who works each turn; participants revise a shared scratchpad and vote until they converge or a budget is hit.</p>

{#if data.rows.length === 0}
  <p class="empty">No oeuvres yet.</p>
{:else}
  <ul class="list">
    {#each data.rows as row (row.oeuvre.id)}
      {@const o = row.oeuvre}
      <li>
        <a class="card" href={`/oeuvres/${o.id}`}>
          <div class="card-title">{o.title}</div>
          <div class="card-meta">
            <span class="status status-{o.status}">{o.status}</span>
            <span class="sep">·</span>
            <span>leader {o.leader_slug}</span>
            <span class="sep">·</span>
            <span>{o.total_turns} turn{o.total_turns === 1 ? '' : 's'}</span>
            <span class="sep">·</span>
            <span>{row.finished}/{row.poolSize} finish</span>
            <span class="sep">·</span>
            <span>{kb(o.text_bytes)}</span>
            <span class="sep">·</span>
            <span>{new Date(o.started_at).toLocaleString()}</span>
          </div>
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
  h1 { margin: 0; }
  .lede { color: var(--muted); margin: 0 0 1.5rem; max-width: 60ch; }
  .empty { color: var(--muted); }
  .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
  .card {
    display: block; border: 1px solid var(--border); border-radius: 8px;
    padding: 0.8rem 1rem; text-decoration: none; color: var(--fg);
    background: rgba(255, 255, 255, 0.01);
  }
  .card:hover { border-color: var(--accent); }
  .card-title { font-weight: 600; margin-bottom: 0.3rem; }
  .card-meta { color: var(--muted); font-size: 0.85em; display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; }
  .sep { opacity: 0.4; }
  .status { font-weight: 500; }
  .status-active { color: #e0c060; }
  .status-paused { color: var(--accent); }
  .status-concluding { color: #e0c060; }
  .status-concluded { color: #8bb98b; }
  .status-failed { color: var(--danger, #d27272); }
  .status-cancelled { color: var(--muted); }
  .btn {
    display: inline-block; padding: 0.5rem 0.9rem; border-radius: 6px;
    border: 1px solid var(--border); text-decoration: none; color: var(--fg);
    background: transparent; cursor: pointer; white-space: nowrap;
  }
  .btn.primary { background: var(--accent); color: #0f1115; border-color: var(--accent); font-weight: 600; }
</style>
