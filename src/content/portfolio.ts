// Profile copy for /portfolio. It rarely changes, so it lives in code; projects live in D1.
// Every visible string has an English and a Spanish version.

export type Lang = 'en' | 'es';
type T = Record<Lang, string>;

export interface SpecRow {
  label: T;
  value: T;
}

export interface Experience {
  company: string;
  team: T;
  role: string;
  period: T;
  body: T;
  tags: string[];
}

export interface StackGroup {
  label: T;
  items: string[];
}

export interface Credential {
  name: string;
  issuer: string;
  date: T;
  /** public credential URL; leave undefined until there is one */
  url?: string;
}

export const profile = {
  name: 'Matías Vallejos',
  thesis: {
    en: 'I build products end to end, from backend services to the microfrontends people use.',
    es: 'Construyo productos de punta a punta, desde los servicios backend hasta los microfrontends que usa la gente.',
  } satisfies T,
  email: 'matiavallejo@gmail.com',
  linkedin: 'https://www.linkedin.com/in/matiasvallejosdev/',
  github: 'https://github.com/MatiasTK',
  // TODO(owner): add the CV URL once the updated CV is hosted; the CV key stays hidden while this is null.
  cvUrl: null as string | null,

  // the role, company and dates sit under the name; the sheet holds what I work with
  spec: [
    {
      label: { en: 'Frontend', es: 'Frontend' },
      value: { en: 'TypeScript, React, Next.js', es: 'TypeScript, React, Next.js' },
    },
    {
      label: { en: 'Backend', es: 'Backend' },
      value: { en: 'Node.js, Java, Go, Python', es: 'Node.js, Java, Go, Python' },
    },
    {
      label: { en: 'Data', es: 'Datos' },
      value: { en: 'PostgreSQL, MySQL, SQLite, Firestore', es: 'PostgreSQL, MySQL, SQLite, Firestore' },
    },
    {
      label: { en: 'Testing', es: 'Testing' },
      value: { en: 'Jest, Playwright, JUnit, Cucumber', es: 'Jest, Playwright, JUnit, Cucumber' },
    },
    {
      label: { en: 'Platforms', es: 'Plataformas' },
      value: {
        en: 'Cloudflare Workers, Firebase, Electron, Expo, Tauri',
        es: 'Cloudflare Workers, Firebase, Electron, Expo, Tauri',
      },
    },
    {
      label: { en: 'Languages', es: 'Idiomas' },
      value: { en: 'Spanish (native), English (C1)', es: 'Español (nativo), Inglés (C1)' },
    },
    {
      label: { en: 'Based in', es: 'Base' },
      value: { en: 'Buenos Aires · remote or hybrid', es: 'Buenos Aires · remoto o híbrido' },
    },
  ] satisfies SpecRow[],

  experience: [
    {
      company: 'Mercado Pago',
      team: { en: 'Benefits, core team', es: 'Beneficios, equipo core' },
      role: 'Software Developer',
      period: { en: 'Apr 2025 – Present', es: 'Abr. 2025 – Actualidad' },
      body: {
        en: 'I design and build the experiences and internal tooling used to load benefits, working across backend services and frontend, with a focus on microfrontend architecture.',
        es: 'Diseño y desarrollo las experiencias y herramientas internas para la carga de beneficios, trabajando tanto en servicios backend como en frontend, con foco en arquitectura de microfrontends.',
      },
      tags: ['Microfrontends', 'Backend services', 'Frontend'],
    },
  ] satisfies Experience[],

  howIWork: [
    {
      title: { en: 'End to end', es: 'De punta a punta' },
      body: {
        en: 'I am comfortable on both sides of a feature: the service and its data, and the interface people touch. Most of my work at Mercado Pago spans both.',
        es: 'Me muevo cómodo en los dos lados de una funcionalidad: el servicio y sus datos, y la interfaz que toca la gente. Casi todo mi trabajo en Mercado Pago cruza ambos.',
      },
    },
    {
      title: { en: 'AI in the loop', es: 'IA en el flujo' },
      body: {
        en: 'I use AI coding agents daily for exploration, scaffolding and review. The design decisions, the tests and every line that ships are mine.',
        es: 'Uso agentes de IA a diario para explorar, armar la base y revisar. Las decisiones de diseño, los tests y cada línea que sale a producción son mías.',
      },
    },
    {
      title: { en: 'Ship what I use', es: 'Uso lo que hago' },
      body: {
        en: 'Several of my side projects are tools I use myself, like Matilist, my daily task manager. Being my own first user keeps them maintained past the demo.',
        es: 'Varios de mis proyectos personales son herramientas que uso yo, como Matilist, mi gestor de tareas diario. Ser mi propio primer usuario los mantiene vivos más allá de la demo.',
      },
    },
  ] satisfies { title: T; body: T }[],

  stack: [
    {
      label: { en: 'Frontend', es: 'Frontend' },
      items: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Microfrontends', 'Tailwind CSS'],
    },
    { label: { en: 'Backend', es: 'Backend' }, items: ['Node.js', 'Java', 'Go', 'Python', 'Express'] },
    { label: { en: 'Data', es: 'Datos' }, items: ['PostgreSQL', 'MySQL', 'SQLite / D1', 'Firestore'] },
    { label: { en: 'Testing', es: 'Testing' }, items: ['Jest', 'Playwright', 'JUnit', 'Cucumber'] },
    {
      label: { en: 'Platforms', es: 'Plataformas' },
      items: ['Cloudflare Workers', 'Firebase', 'Electron', 'Expo', 'Tauri'],
    },
  ] satisfies StackGroup[],

  education: {
    name: { en: 'Computer Engineering coursework', es: 'Ingeniería en Informática (cursada)' } satisfies T,
    school: { en: 'University of Buenos Aires (FIUBA)', es: 'Universidad de Buenos Aires (FIUBA)' } satisfies T,
  },

  // TODO(owner): paste each public credential URL from LinkedIn into `url`.
  credentials: [
    { name: 'Back End Development and APIs', issuer: 'freeCodeCamp', date: { en: 'May 2022', es: 'May. 2022' } },
    { name: 'Front End Development Libraries', issuer: 'freeCodeCamp', date: { en: 'Apr 2022', es: 'Abr. 2022' } },
    { name: 'Responsive Web Design', issuer: 'freeCodeCamp', date: { en: 'Apr 2022', es: 'Abr. 2022' } },
    {
      name: 'JavaScript Algorithms and Data Structures',
      issuer: 'freeCodeCamp',
      date: { en: 'Mar 2022', es: 'Mar. 2022' },
    },
  ] as Credential[],
};

/** UI strings for the portfolio pages. */
export const ui = {
  getInTouch: { en: 'Get in touch', es: 'Escribime' },
  downloadCv: { en: 'Download CV', es: 'Descargar CV' },
  specSheet: { en: 'Spec sheet', es: 'Ficha técnica' },
  sections: { en: 'Sections', es: 'Secciones' },
  backToTop: { en: 'back to top', es: 'volver arriba' },
  stackAndEducation: { en: 'Stack & education', es: 'Stack y formación' },
  selectedWork: { en: 'Selected work', es: 'Proyectos destacados' },
  experience: { en: 'Experience', es: 'Experiencia' },
  projects: { en: 'Projects', es: 'Proyectos' },
  howIWork: { en: 'How I work', es: 'Cómo trabajo' },
  stack: { en: 'Stack', es: 'Stack' },
  education: { en: 'Education', es: 'Formación' },
  contactTitle: { en: 'Let’s talk', es: 'Hablemos' },
  contactBody: {
    en: 'Happy to talk about frontend architecture, full-stack product work or anything you saw here.',
    es: 'Con gusto hablamos de arquitectura frontend, desarrollo de producto full-stack o de cualquier cosa que viste acá.',
  },
  caseStudy: { en: 'Read the case', es: 'Ver el caso' },
  visit: { en: 'Visit', es: 'Visitar' },
  code: { en: 'Code', es: 'Código' },
  stackLabel: { en: 'Stack', es: 'Stack' },
  year: { en: 'Year', es: 'Año' },
  type: { en: 'Type', es: 'Tipo' },
  links: { en: 'Links', es: 'Links' },
  backToPortfolio: { en: 'Back to portfolio', es: 'Volver al portfolio' },
  nextProject: { en: 'Next project', es: 'Siguiente proyecto' },
  noProjects: {
    en: 'No projects yet. Add them in the admin panel.',
    es: 'Todavía no hay proyectos. Cargalos desde el panel de admin.',
  },
  openNewTab: { en: '(opens in a new tab)', es: '(se abre en otra pestaña)' },
  switchLang: { en: 'Leer en español', es: 'Read in English' },
  credentialPending: { en: 'credential', es: 'credencial' },
  pressHint: {
    en: 'press a number to open a project, esc to go home',
    es: 'apretá un número para abrir un proyecto, esc para volver',
  },
} satisfies Record<string, T>;

export function langFrom(param: string | string[] | undefined, acceptLanguage: string | null): Lang {
  const value = Array.isArray(param) ? param[0] : param;
  if (value === 'es' || value === 'en') return value;
  return acceptLanguage?.trim().toLowerCase().startsWith('es') ? 'es' : 'en';
}

type Localized = Record<`${'kind' | 'summary' | 'body'}_${Lang}`, string>;

/** A project's text in `lang`, falling back to the other language when that one is empty. */
export function projectText(project: Localized, field: 'kind' | 'summary' | 'body', lang: Lang): string {
  const own = project[`${field}_${lang}`];
  return own.trim() ? own : project[`${field}_${lang === 'en' ? 'es' : 'en'}`];
}
