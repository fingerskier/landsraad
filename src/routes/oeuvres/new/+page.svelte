<script lang="ts">
  import type { PageData } from './$types';
  let { data, form }: { data: PageData; form: { error?: string } | null } = $props();

  let leader = $state(data.councillors[0]?.slug ?? '');
  // Participants exclude whoever is currently selected as leader.
  const participantChoices = $derived(data.councillors.filter((c) => c.slug !== leader));
</script>

<p><a href="/oeuvres">&larr; Oeuvres</a></p>
<h1>New oeuvre</h1>

{#if form?.error}<p class="error">{form.error}</p>{/if}

{#if data.councillors.length < 2}
  <p class="error">An oeuvre needs at least two councillors: one leader plus one participant. Add more on the council page first.</p>
{/if}

<form method="POST">
  <label>
    Title
    <input name="title" required placeholder="e.g. Draft the launch plan" />
  </label>

  <label>
    Goal
    <textarea name="goal" rows="3" required placeholder="What should the council achieve?"></textarea>
  </label>

  <label>
    Leader
    <select name="leader" bind:value={leader}>
      {#each data.councillors as c (c.slug)}
        <option value={c.slug}>{c.name} ({c.slug})</option>
      {/each}
    </select>
    <small>Orchestrates the loop — picks who works each turn and comments. Never takes a turn or votes.</small>
  </label>

  <fieldset>
    <legend>Participants</legend>
    <small>The working/voting pool. The leader is excluded.</small>
    {#each participantChoices as c (c.slug)}
      <label class="check">
        <input type="checkbox" name="participants" value={c.slug} checked />
        {c.name} ({c.slug})
      </label>
    {/each}
  </fieldset>

  <label>
    Director note <span class="muted">(optional, editable later)</span>
    <textarea name="note" rows="2" placeholder="Steering for every turn — e.g. 'keep it terse, focus on cost'"></textarea>
  </label>

  <fieldset>
    <legend>Budget</legend>
    <small>The loop runs autonomously between turns; these caps bound the cost.</small>
    <div class="budget">
      <label>Max turns<input type="number" name="max_turns" min="1" value={data.defaults.max_turns} /></label>
      <label>Max minutes<input type="number" name="max_wall_min" min="1" value={data.defaults.max_wall_min} /></label>
      <label>Max text (KB)<input type="number" name="max_text_kb" min="1" value={data.defaults.max_text_kb} /></label>
    </div>
  </fieldset>

  <button class="btn primary" type="submit" disabled={data.councillors.length < 2}>Start oeuvre</button>
</form>

<style>
  h1 { margin: 0 0 1rem; }
  .error { color: var(--danger, #d27272); }
  .muted { color: var(--muted); font-weight: normal; }
  form { display: grid; gap: 1.1rem; max-width: 44rem; }
  label { display: grid; gap: 0.35rem; font-weight: 600; }
  input, textarea, select {
    font: inherit; padding: 0.5rem 0.6rem; border-radius: 6px;
    border: 1px solid var(--border); background: var(--bg, #0f1115); color: var(--fg);
  }
  small { color: var(--muted); font-weight: normal; }
  fieldset { border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem 1rem; display: grid; gap: 0.4rem; }
  legend { font-weight: 600; padding: 0 0.4rem; }
  .check { display: flex; flex-direction: row; align-items: center; gap: 0.5rem; font-weight: normal; }
  .check input { width: auto; }
  .budget { display: flex; gap: 1rem; flex-wrap: wrap; }
  .budget label { font-weight: normal; }
  .budget input { width: 7rem; }
  .btn { display: inline-block; padding: 0.55rem 1rem; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: transparent; color: var(--fg); }
  .btn.primary { background: var(--accent); color: #0f1115; border-color: var(--accent); font-weight: 600; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
