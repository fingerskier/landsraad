import { describe, it, expect } from 'vitest';
import { shouldGoBackInHistory } from './back-nav';

const base = {
  canGoBack: true,
  inBrowser: true,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false
};

describe('shouldGoBackInHistory', () => {
  it('intercepts a plain left-click when there is in-app history', () => {
    expect(shouldGoBackInHistory(base)).toBe(true);
  });

  it('falls through to the href when there is no in-app history (cold load)', () => {
    expect(shouldGoBackInHistory({ ...base, canGoBack: false })).toBe(false);
  });

  it('falls through during SSR (not in the browser)', () => {
    expect(shouldGoBackInHistory({ ...base, inBrowser: false })).toBe(false);
  });

  it('does not intercept modifier-clicks (open in new tab/window)', () => {
    expect(shouldGoBackInHistory({ ...base, metaKey: true })).toBe(false);
    expect(shouldGoBackInHistory({ ...base, ctrlKey: true })).toBe(false);
    expect(shouldGoBackInHistory({ ...base, shiftKey: true })).toBe(false);
    expect(shouldGoBackInHistory({ ...base, altKey: true })).toBe(false);
  });

  it('does not intercept non-primary mouse buttons (middle/right click)', () => {
    expect(shouldGoBackInHistory({ ...base, button: 1 })).toBe(false);
    expect(shouldGoBackInHistory({ ...base, button: 2 })).toBe(false);
  });
});
