// A `PageHeader` back link renders a real `<a href>` (so it has a sensible
// fallback target on cold load, middle-click, etc.) but, when the page was
// reached by an in-app navigation, the arrow should "actually go back" instead
// of jumping to that hardcoded href — otherwise it's misleading (e.g. /import
// reached from Settings would send you Home). This decides whether to intercept
// a click and call history.back() rather than follow the href.
export function shouldGoBackInHistory(opts: {
  canGoBack: boolean;
  inBrowser: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  if (!opts.inBrowser || !opts.canGoBack) return false;
  if (opts.button !== 0) return false; // middle/right click — let the browser handle it
  if (opts.metaKey || opts.ctrlKey || opts.shiftKey || opts.altKey) return false; // open-in-new-tab
  return true;
}
