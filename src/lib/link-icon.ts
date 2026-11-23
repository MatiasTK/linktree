/** What a link shows as its icon: a named glyph, or the destination's favicon. */
export type LinkIconSource = { kind: 'glyph'; name: string } | { kind: 'favicon'; src: string };

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function linkIcon(iconType: string, url: string): LinkIconSource {
  if (iconType && iconType !== 'auto') return { kind: 'glyph', name: iconType };
  if (url.startsWith('mailto:')) return { kind: 'glyph', name: 'mail' };
  if (url.startsWith('tel:')) return { kind: 'glyph', name: 'phone' };
  try {
    const { hostname } = new URL(url);
    if (hostname) return { kind: 'favicon', src: `/api/favicon/${encodeURIComponent(hostname.toLowerCase())}` };
  } catch {
    /* fall through */
  }
  return { kind: 'glyph', name: 'link' };
}
