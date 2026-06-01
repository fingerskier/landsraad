<script lang="ts">
  import type { Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { shouldGoBackInHistory } from '$lib/back-nav';

  // Consistent page top: optional back link, title, subtitle, right-aligned actions.
  let {
    title,
    back = undefined,
    backLabel = 'Back',
    sticky = false,
    subtitle,
    actions
  }: {
    title: string;
    back?: string;
    backLabel?: string;
    sticky?: boolean;
    subtitle?: Snippet;
    actions?: Snippet;
  } = $props();

  // The `back` href is a fallback target; when we got here via an in-app
  // navigation, "← Back" should return to wherever you actually came from
  // rather than jump to that hardcoded href.
  let canGoBack = $state(false);
  afterNavigate((nav) => {
    canGoBack = nav.from != null;
  });

  function onBack(e: MouseEvent) {
    if (
      shouldGoBackInHistory({
        canGoBack,
        inBrowser: browser,
        button: e.button,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey
      })
    ) {
      e.preventDefault();
      history.back();
    }
  }
</script>

<header class="page-header" class:sticky>
  <div class="lead">
    {#if back}<a class="back" href={back} onclick={onBack}>← {backLabel}</a>{/if}
    <h1>{title}</h1>
    {#if subtitle}<div class="subtitle">{@render subtitle()}</div>{/if}
  </div>
  {#if actions}<div class="actions">{@render actions()}</div>{/if}
</header>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .sticky {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: 1rem 0;
    margin-bottom: 1rem;
    background: linear-gradient(var(--bg) 70%, transparent);
    backdrop-filter: blur(2px);
  }
  .lead { min-width: 0; }
  .back {
    display: inline-block;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.85em;
    margin-bottom: 0.35rem;
  }
  .back:hover { color: var(--accent); }
  h1 { margin: 0; font-size: 1.5rem; line-height: 1.2; }
  .subtitle { color: var(--muted); font-size: 0.9em; margin-top: 0.4rem; }
  .actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
</style>
