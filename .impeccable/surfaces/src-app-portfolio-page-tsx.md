---
version: 1
slug: "src-app-portfolio-page-tsx"
primary_target: "src/app/portfolio/page.tsx"
related_targets: ["src/app/portfolio/[slug]/page.tsx","src/app/admin/portfolio/page.tsx"]
---

# Portfolio (/portfolio)

Mode: Experience (portfolio), read by people deciding whether to reach out.
Audience: recruiters and companies first, plus developers who contact the owner directly and read technically. Desktop from LinkedIn/email, phone from social bios.
Job: in seconds, know who Matías is (Software Developer, Mercado Pago, Benefits), what he works on, and how to reach him; then go deeper into experience, four featured projects (own case page each), how he works, stack, education.
Owner answers: ES + EN (toggle); featured projects Matilist, WizAPP, Dividimos Cuentas, WordleES; images on the owner's own hosting (URL per project, optional); profile copy lives in code (rarely changes), projects in D1 with an admin section; CV is a TODO (hidden until a URL exists); FIUBA shown as coursework, never "in progress"; AI is framed as a reviewed, test-backed workflow, never as a productivity boast.
Constraints: inherit the Desk Keyboard world untouched; 'portfolio' becomes a reserved slug; no invented claims or metrics.

## Direction contract

THESIS: The developer presented as a keyboard's spec sheet: hard facts in labelled rows instead of adjectives. It refuses the avatar-plus-tagline hero and the bento of equal cards.

OWN-WORLD: Same case, plate and cap neutrals. The spec sheet is a recessed sheet on a plate (label in mono, value in Bricolage). Actions are real keycaps with skirts: one orange "Get in touch", charcoal LinkedIn, plain GitHub. Projects are wide keys; their captures sit in recessed wells.

STORY: Read the name and role, scan the sheet (role, company, since, scope, stack, workflow, base), press Get in touch or keep scrolling: experience, the four projects as plates with case pages, how I work, stack groups, education, a closing contact board.

FIRST VIEWPORT: Desktop 1440: sticky top bar (esc, path, section links with an orange underline on the current one, ES/EN, sound, theme); left column name at display size, the current role as its second line ("Software Developer at Mercado Pago", company underlined in orange) with team and dates in mono, the thesis, three action keys; right column the spec sheet (frontend, backend, data, testing, platforms, languages, base; education and the AI workflow live further down, where they have context). The opening screen leaves a band at the bottom where the Experience heading and its first entry show whole; the bar path scrolls back to the top. Experience is the first section below, then Selected work (newest year first). Phone 390: name, role line, thesis, actions, sheet.

FORM: Ficha técnica, 3rd on my ordered list of 7; seed:32b7a898327a70e1. Signature interaction: number keys 1–4 press the project keys and open the case; esc goes home; every key answers with the switch sound. Motion grammar: the existing single key-settle on load, nothing else.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
