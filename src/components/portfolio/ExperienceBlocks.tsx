import { type Lang, type PortfolioProfile, ui } from '@/content/portfolio';

type Props = { lang: Lang; profile: PortfolioProfile };

/** The spec sheet beside the name: what I work with. */
export function SpecSheet({ lang, profile }: Props) {
  return (
    <aside className="board pf-spec" aria-labelledby="pf-spec-title">
      <div className="pf-sheet">
        <div className="pf-sheet__head">
          <h2 id="pf-spec-title">{ui.specSheet[lang]}</h2>
          <span>{profile.name}</span>
        </div>
        <dl>
          {profile.spec.map((row) => (
            <div key={row.label.en} className="pf-sheet__row">
              <dt>{row.label[lang]}</dt>
              <dd>{row.value[lang]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

/** The current role as the hero's second line, right under the name. */
export function NowLine({ lang, profile }: Props) {
  const job = profile.experience[0];
  if (!job) return null;
  return (
    <p className="pf-now">
      <span className="pf-now__role">
        {job.role} {lang === 'en' ? 'at' : 'en'} <strong>{job.company}</strong>
      </span>
      <span className="pf-now__meta">
        {job.team[lang]} · {job.period[lang]}
      </span>
    </p>
  );
}

/** The experience in full, first section after the opening screen. */
export function ExperienceSection({ lang, profile }: Props) {
  return (
    <section id="experience" tabIndex={-1} className="pf-section" aria-labelledby="pf-exp">
      <h2 id="pf-exp" className="pf-h2">
        {ui.experience[lang]}
      </h2>
      <ol className="pf-xlist">
        {profile.experience.map((j) => (
          <li key={j.company} className="pf-xlist__item">
            <p className="pf-role__when">{j.period[lang]}</p>
            <div>
              <h3 className="pf-role__company">{j.company}</h3>
              <p className="pf-role__title">
                {j.role} · {j.team[lang]}
              </p>
              <p className="pf-role__body pf-xlist__body">{j.body[lang]}</p>
              <ul className="pf-chips" aria-label={ui.stackLabel[lang]}>
                {j.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
