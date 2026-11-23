/**
 * Turn a click into a short traffic source name for the dashboard.
 *
 * The public page sends the referrer the visitor arrived with (kept for the
 * whole visit, so a click on a section page still credits Instagram). In-app
 * browsers often send no referrer at all, so their user agent is the fallback.
 */

const HOST_ALIASES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
  [/(^|\.)(t\.me|telegram\.org)$/, 'telegram'],
  [/(^|\.)discord(app)?\.com$/, 'discord'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
];

const USER_AGENT_HINTS: [RegExp, string][] = [
  [/Instagram/i, 'instagram'],
  [/FBAN|FBAV|FB_IAB/i, 'facebook'],
  [/LinkedInApp/i, 'linkedin'],
  [/musical_ly|BytedanceWebview|TikTok/i, 'tiktok'],
  [/Twitter/i, 'x'],
  [/WhatsApp/i, 'whatsapp'],
  [/Telegram/i, 'telegram'],
  [/Discord/i, 'discord'],
];

export function clickSource(referrer: string | null | undefined, userAgent: string | null, ownHost: string): string {
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
      if (host && host !== ownHost.replace(/^www\./, '')) {
        for (const [pattern, name] of HOST_ALIASES) {
          if (pattern.test(host)) return name;
        }
        return host.slice(0, 80);
      }
    } catch {
      /* not a URL: fall through */
    }
  }

  if (userAgent) {
    for (const [pattern, name] of USER_AGENT_HINTS) {
      if (pattern.test(userAgent)) return name;
    }
  }

  return 'direct';
}
