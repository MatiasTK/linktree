/**
 * Small user-agent reader for short link stats: device class, browser, OS,
 * and whether the request comes from a bot (link previews, crawlers, scripts).
 * Rough on purpose; the order of the checks matters.
 */

const BOT =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|WhatsApp\/|TelegramBot|Slackbot|Discordbot|Twitterbot|LinkedInBot|SkypeUriPreview|Embedly|Iframely|preview|vkShare|Pinterest\/|redditbot|Applebot|Google-InspectionTool|HeadlessChrome|Lighthouse|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|Go-http-client|node-fetch|undici|axios\/|okhttp\/|Java\/|libwww|HTTPie|PostmanRuntime|insomnia/i;

export interface UserAgentInfo {
  isBot: boolean;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}

const BROWSERS: [RegExp, string][] = [
  [/Instagram/i, 'Instagram app'],
  [/FBAN|FBAV|FB_IAB/i, 'Facebook app'],
  [/LinkedInApp/i, 'LinkedIn app'],
  [/musical_ly|BytedanceWebview|TikTok/i, 'TikTok app'],
  [/Twitter/i, 'X app'],
  [/Telegram/i, 'Telegram app'],
  [/GSA\//, 'Google app'],
  [/SamsungBrowser/i, 'Samsung Internet'],
  [/EdgA?\/|Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Brave/i, 'Brave'],
  [/Vivaldi/i, 'Vivaldi'],
  [/YaBrowser/i, 'Yandex'],
  [/Firefox\/|FxiOS/, 'Firefox'],
  [/CriOS|Chrome\/|Chromium/, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

export function parseUserAgent(ua: string | null): UserAgentInfo {
  const value = ua ?? '';
  if (!value.trim()) return { isBot: true, device: 'desktop', browser: 'Unknown', os: 'Unknown' };

  const isBot = BOT.test(value);
  const browser = BROWSERS.find(([re]) => re.test(value))?.[1] ?? 'Other';
  const os = SYSTEMS.find(([re]) => re.test(value))?.[1] ?? 'Other';

  let device: UserAgentInfo['device'] = 'desktop';
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(value)) device = 'tablet';
  else if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(value)) device = 'mobile';

  return { isBot, device, browser, os };
}
