/** Labels for visit details in the stats rankings: countries with flags, cities, devices, languages. */

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch {
  /* no ICU region data: fall back to the code */
}

export function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function countryName(code: string) {
  if (code === 'unknown') return 'Unknown';
  if (code === 'T1') return 'Tor network';
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function Country({ code }: { code: string }) {
  const emoji = flag(code);
  return (
    <>
      {emoji && (
        <span className="adm-flag" aria-hidden>
          {emoji}
        </span>
      )}
      {countryName(code)}
    </>
  );
}

/** cities are tallied as "city|region|country" so two Córdobas stay apart */
export function City({ value }: { value: string }) {
  const [city, region, country] = value.split('|');
  const where = [region !== city ? region : null, country ? countryName(country) : null].filter(Boolean).join(', ');
  return (
    <>
      {country && (
        <span className="adm-flag" aria-hidden>
          {flag(country)}
        </span>
      )}
      {city}
      {where && <small className="adm-muted"> {where}</small>}
    </>
  );
}

export const DEVICE_NAMES: Record<string, string> = { mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' };

let languageNames: Intl.DisplayNames | null = null;
try {
  languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
} catch {
  /* fall back to the code */
}
export function languageName(code: string) {
  try {
    return languageNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

