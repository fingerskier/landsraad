<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { Button } from '$lib/components';
  let { children } = $props();

  let title = $derived(page.data?.councilName ? `${page.data.councilName} — Landsraad` : 'Landsraad');
  const hasCouncil = $derived(page.data?.hasCouncil ?? false);
  const nav = $derived(page.data?.nav ?? { proposals: 0, meetings: 0, running: 0, failed: 0 });

  type Item = { href: string; label: string; count?: number };
  const items = $derived<Item[]>([
    { href: '/', label: 'Home' },
    { href: '/jobs', label: 'Activity', count: nav.running },
    { href: '/meetings', label: 'Meetings', count: nav.meetings },
    { href: '/schedules', label: 'Schedules' },
    { href: '/memory', label: 'Memory' },
    { href: '/proposals', label: 'Proposals', count: nav.proposals },
    { href: '/council', label: 'Council' }
  ]);

  // Glanceable status, shown only when non-zero. Navigation lives in the menu;
  // this cluster is a pure attention signal (failures/proposals first), so a
  // power user knows what needs them without opening anything.
  type Att = { n: number; label: string; tone: 'fail' | 'prop' | 'run' | 'meet' };
  const attention = $derived<Att[]>(
    (
      [
        { n: nav.failed, label: 'failed', tone: 'fail' },
        { n: nav.proposals, label: nav.proposals === 1 ? 'proposal' : 'proposals', tone: 'prop' },
        { n: nav.running, label: 'running', tone: 'run' },
        { n: nav.meetings, label: nav.meetings === 1 ? 'meeting' : 'meetings', tone: 'meet' }
      ] as Att[]
    ).filter((a) => a.n > 0)
  );

  let menuOpen = $state(false);
  afterNavigate(() => { menuOpen = false; });
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<header>
  <a href="/" class="brand">Landsraad</a>

  {#if hasCouncil && attention.length}
    <div class="attention" aria-label="Needs attention">
      {#each attention as a (a.label)}
        <span class="att {a.tone}">{a.n}&nbsp;{a.label}</span>
      {/each}
    </div>
  {/if}

  <div class="right">
    {#if hasCouncil}
      <div class="new-job"><Button href="/jobs/new" variant="primary">+ New job</Button></div>
    {/if}
    <div class="menu">
      <button
        type="button"
        class="hamburger"
        aria-label="More"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <span></span><span></span><span></span>
      </button>
      {#if menuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="backdrop" onclick={() => (menuOpen = false)}></div>
        <nav class="links" aria-label="Utilities">
          {#if hasCouncil}
            <span class="links-group">Navigate</span>
            {#each items.slice(1) as item (item.href)}
              <a href={item.href}>{item.label}{#if item.count} ({item.count}){/if}</a>
            {/each}
            <span class="links-group">Council</span>
            <a href="/import">Install template</a>
            <a href="/export">Export…</a>
          {/if}
          <a href="/help">Help</a>
        </nav>
      {/if}
    </div>
  </div>
</header>

<main>
  {@render children?.()}
</main>

<style>
  header {
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  .brand {
    color: var(--fg);
    text-decoration: none;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .attention {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex: 1;
    justify-content: flex-end;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .att {
    display: inline-flex;
    align-items: center;
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--muted);
  }
  .att::before {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    margin-right: 0.35rem;
    background: currentColor;
  }
  .att.fail { color: var(--danger); }
  .att.prop { color: var(--accent); }
  .att.run { color: var(--info); }
  .att.meet { color: var(--muted); }

  .right { display: flex; align-items: center; gap: 0.6rem; margin-left: auto; flex-shrink: 0; }

  .menu { position: relative; }
  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
  }
  .hamburger span {
    display: block;
    width: 1.05rem;
    height: 2px;
    margin: 0 auto;
    background: var(--muted);
    border-radius: 1px;
  }
  .hamburger:hover { border-color: var(--accent); }
  .hamburger:hover span { background: var(--accent); }
  .backdrop { position: fixed; inset: 0; z-index: 10; }
  .links {
    position: absolute;
    right: 0;
    top: calc(100% + 0.5rem);
    z-index: 11;
    display: flex;
    flex-direction: column;
    min-width: 12rem;
    padding: 0.4rem;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-pop);
  }
  .links-group {
    color: var(--faint);
    font-size: 0.72em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.5rem 0.7rem 0.2rem;
  }
  .links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.9em;
    padding: 0.45rem 0.7rem;
    border-radius: 5px;
  }
  .links a:hover { color: var(--accent); background: var(--accent-soft); }

  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }

  /* Hide the New job button on narrow viewports; the hamburger covers nav. */
  @media (max-width: 820px) {
    .new-job { display: none; }
  }
</style>
