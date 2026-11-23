---
name: MatiasTK Links
description: A self-hosted link page built as a mechanical keyboard; every section and link is a keycap you press.
colors:
  case: "#ecebe7"
  plate: "#d6d3cc"
  plate-hi: "#e2dfd8"
  plate-lo: "#cbc7bf"
  ink: "#1c1c1e"
  key-hi: "#ffffff"
  key-face: "#f7f6f3"
  key-lo: "#eceae5"
  key-skirt: "#bdb8ae"
  key-legend: "#6e6b64"
  mod-face: "#2b2b2e"
  mod-hi: "#3c3c40"
  mod-skirt: "#111113"
  mod-ink: "#f3f2ee"
  mod-legend: "#a8a59e"
  accent-face: "#ff5a1f"
  accent-hi: "#ff7d4d"
  accent-lo: "#f24e14"
  accent-skirt: "#b83a0b"
  accent-ink: "#1c1206"
  accent-legend: "#4a1d08"
  primary-ink: "#b23a0c"
  border: "#d3cfc7"
  destructive: "#c62a1c"
  night-case: "#1c1c1e"
  night-plate: "#29292c"
  night-key-face: "#303034"
  night-key-skirt: "#151517"
  night-ink: "#f1efea"
  night-mod-face: "#161618"
  night-mod-skirt: "#050506"
  night-accent-face: "#ff6a30"
  night-accent-skirt: "#a8390c"
  night-primary-ink: "#ff9466"
  night-border: "#3a3a3e"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(4.5rem, 18.5vw, 8rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.4vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  title-link:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1rem + 0.9vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  body-lead:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.2vw + 0.8rem, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "tnum"
  legend:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  keycap-sm: "8px"
  icon: "10px"
  control: "12px"
  radius: "14px"
  key: "18px"
  key-lg: "22px"
  board: "28px"
  board-lg: "34px"
spacing:
  board-gap: "12px"
  board-gap-lg: "20px"
  board-pad: "14px"
  board-pad-lg: "30px"
  cap-pad: "14px 18px"
  cap-pad-md: "22px 24px"
  cap-pad-lg: "26px 28px"
  deck-gap: "28px"
  gutter: "16px"
components:
  key-plain:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "{spacing.cap-pad}"
    height: "84px"
  key-accent:
    backgroundColor: "{colors.accent-face}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "{spacing.cap-pad}"
  key-mod:
    backgroundColor: "{colors.mod-face}"
    textColor: "{colors.mod-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "{spacing.cap-pad}"
  keycap-small:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    typography: "{typography.legend}"
    rounded: "{rounded.keycap-sm}"
    padding: "0 8px"
    height: "44px"
  board:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.board}"
    padding: "{spacing.board-pad}"
  button-primary:
    backgroundColor: "{colors.accent-face}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.1rem"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.1rem"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.key-hi}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.1rem"
  input:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.625rem 0.875rem"
    height: "44px"
---

# Design System: MatiasTK Links

## Overview

**Creative North Star: "The Desk Keyboard"**

The page is a mechanical keyboard sitting on a warm gray desk. The owner's name is set huge beside it, and the content is the board: a recessed plate holding sculpted keycaps, one per section or link. Every control is a key that physically travels when pressed, by finger, pointer or the number row, and then navigates. The system rejects the centred avatar over a column of rounded pill buttons; the keyboard is the layout, not a decoration on top of one.

Density is low and the objects are large: on desktop, keys run around 200px tall, and on a phone they span the full width at no less than 84px. Depth is physical, never ambient. Light falls from above onto a dished cap face, a darker skirt sits under every cap, and the board casts one long soft shadow onto the case. Motion is short, precise and mechanical: a 90ms travel, plus one staggered settle as the keys land on the plate at load.

Dark theme is the same board at night. The case turns charcoal, the plain caps turn graphite, the modifier key sinks to a near-black cap darker than the graphite, and the orange key stays the only bright key and the only warm light in the room. Admin and login surfaces inherit the same tokens, type and key-travel detail at a quieter, form-sized scale.

**Key Characteristics:**
- Every navigable item is a keycap with a face, a skirt and real travel.
- One orange accent key per board, one charcoal modifier key at most, every other key plain.
- Bricolage Grotesque for names and key legends; JetBrains Mono for numbers, counts, domains and hints.
- Number keys 1–9 and Escape drive navigation; a pressed key travels before it navigates.
- Visited keys rest 3px low, like a key that has been used; no extra mark.

## Colors

A warm, desaturated workshop palette of case, plate and caps, with one hot orange used as a signal light, not a theme color.

### Primary
- **Signal Orange** (accent-face): the face of the single primary key on each board (the first section on home, the first link on a section page), the primary button in admin, the selection highlight, the caret, the checked toggle and the code glyph in the footer credit. It has its own highlight (accent-hi), lower face (accent-lo) and a burnt skirt (accent-skirt).
- **Ember Ink** (primary-ink): the darker orange for any orange that has to be read as text on the light case. The night theme lifts it to a pale coral (night-primary-ink).

### Secondary
- **Modifier Charcoal** (mod-face): the one dark modifier key on a board (the last key, when the board has three or more). Its legends use mod-ink and mod-legend. At night it becomes a near-black cap (night-mod-face on a night-mod-skirt base), darker than the graphite plain caps, with the same light legends. It stays the odd key out without competing with the orange.

### Neutral
- **Desk Gray** (case): the page background, the browser `theme-color` and the ground everything sits on.
- **Plate Stone** (plate, plate-hi, plate-lo): the recessed board under the keys, drawn as a top-to-bottom gradient from plate-hi to plate-lo. Also the off state of toggles.
- **Cap White** (key-face, with key-hi above and key-lo below): the face of every plain key and small keycap, plus input and card fills.
- **Skirt Taupe** (key-skirt): the visible sides of a plain key below its face, and the 3px hard base under small keycaps and secondary buttons.
- **Legend Gray** (key-legend): number legends, arrows, link counts, domains and hint text. Shared with muted-foreground.
- **Type Black** (ink): names, key labels and body text.
- **Seam** (border): 1px input and panel borders.
- **Fault Red** (destructive): destructive buttons and errors only.

### Named Rules
**The One Warm Light Rule.** Orange appears on exactly one key per board, the primary one. Everything else stays in the case, plate and cap neutrals. A second orange key means the first one is no longer primary.

**The Ink Not Paint Rule.** Orange is never used for small text on the light case. Text that has to read as orange uses primary-ink (`.text-primary` is overridden to it). Legends on an orange key use dark accent-ink and accent-legend, never white.

**The Night Board Rule.** Theme differences are expressed only through tokens redefined under `.dark` (for example `--key-glow`, which dims the dished-face highlight at night). Never write `.dark .x` descendant rules in globals.css: the CSS pipeline drops them.

## Typography

**Display Font:** Bricolage Grotesque (with system-ui, sans-serif), via next/font as `--font-display`; it is also the Tailwind `font-sans`.
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace), via next/font as `--font-mono-ui`; it is also the Tailwind `font-mono`.

**Character:** A wide, ink-trap grotesque at extra-bold weight gives the owner's name the weight of a printed keycap legend. A monospace for every small or numeric thing reads like the secondary legends and switch labels on a real board.

### Hierarchy
- **Display** (800, clamp 4.5rem → 8rem, line-height 0.88, -0.04em): the owner's or section's name in the intro. One per page. Balanced wrapping.
- **Headline** (800, 3rem, 1, -0.04em): page titles on Operate surfaces such as "Sign in".
- **Title** (700, clamp 1.5rem → 2.75rem, 1.02, -0.03em): a section key's label. Link keys use the smaller title-link step (clamp 1.25rem → 1.875rem) on one line with an ellipsis.
- **Body lead** (400, clamp 1.0625rem → 1.375rem, 1.45): the one-line bio under the display name, max 34ch, at 80% ink.
- **Body** (400–600, 0.9375rem): admin buttons, inputs and form copy.
- **Label** (JetBrains Mono, 13px): link counts, destination domains, the top-bar path and hint rows. **Legend** is the same face at 700 with tabular figures, used for key numbers and small-keycap glyphs.

### Named Rules
**The Mono For Machines Rule.** Anything that is a number, a count, a domain, a path or a keyboard hint is set in JetBrains Mono at 13–14px. Names and labels that people read as words stay in Bricolage.

## Layout

The public page is a deck: a top bar (path at left, theme keycap at right), the intro (name and bio), and the board. On phones it is a single column with a 16px side gutter, 20px top padding and 28px gaps; the name sits in the top third and the first key lands above the fold. At 1024px and up the deck becomes a 5fr / 7fr two-column grid. The intro is vertically centred on the left with the number-key hint pinned bottom-left, and the board fills the right column. Side padding is clamp(40px, 5.5vw, 80px) and the column gap is clamp(48px, 6vw, 96px), up to a 1440px max width.

The board is one column on phones, two columns from 640px (section boards) or from 900px (link boards). Its gap grows from 12px to 20px and its padding from 14px to 30px at 1024px. Section keys grow with the viewport (84px → 168px → 210px tall). Link keys stay shorter (116px → 128px) because there are more of them.

Operate surfaces (login and admin) do not use the deck. Login centres one board, max 448px wide, on the case. Admin uses a 256px card-colored sidebar beside the content area.

## Elevation & Depth

Depth comes from objects, not ambient shadows. There are three physical layers: the case (flat), the board (recessed plate with a long, soft drop onto the case) and the keys (a face lifted above a solid skirt). Hard offset bases are native to this world: a keycap's skirt *is* a hard offset, so small keycaps and buttons use a solid 3px base in their skirt color rather than a blur.

### Shadow Vocabulary
- **Board drop** (`box-shadow: 0 2px 0 #b9b5ac, 0 40px 80px -30px rgba(40,30,20,0.35)`; night `0 2px 0 #0e0e10, 0 40px 80px -30px rgba(0,0,0,0.7)`): the plate sitting on the desk, with inset top highlight and bottom shade. Only the board uses it.
- **Cap sculpt** (`inset 0 2px 0 <hi mixed with white>, inset 0 -10px 18px -10px rgba(0,0,0,0.14)`, plus a radial dished-face highlight at 0.7 opacity, 0.25 on accent and modifier keys, and 0.05 at night): the face of a large key.
- **Skirt base** (`0 3px 0 <skirt>, 0 4px 8px rgba(0,0,0,0.12)`): small keycaps; buttons use `0 3px 0 <skirt>` alone. Collapses to 0–1px on press.
- **Well** (`inset 0 2px 3px rgba(0,0,0,0.05–0.15)`): inputs and toggle tracks, which are recessed into the surface rather than raised.

### Named Rules
**The Skirt Is The Shadow Rule.** A raised control shows its height with a solid base in its own skirt color, and pressing it removes that base as the face travels down. Do not add floating blur shadows to controls.

## Shapes

Soft, sculpted rectangles, never pills for content. Radius scales with the object: small keycaps 8px, icon tiles 10px, buttons and inputs 12px, large keys 18px (22px from 640px), the board 28px (34px at 1024px). The cap face inherits its key's radius so the skirt shows as an even lip below. Full circles are reserved for the LED and the toggle knob, and the toggle track is the one pill shape in the system. Empty boards use a 2px dashed outline at 22px radius.

## Components

### Keycap (signature)
A physical key: a skirt-colored body with a face that sits above it and travels down into it.
- **Anatomy:** the number legend top-left (mono 700, tabular; `·` beyond 9), arrow top-right (a right arrow for sections, a north-east arrow for external links), and the label with meta (link count or destination domain) at the bottom. An optional 36px icon tile at 8% ink sits before the label.
- **Tones:** plain (cap white), accent (signal orange, first key) and modifier (charcoal, last key on boards of three or more). Tone comes from position, not content.
- **Travel:** a hover (on hover-capable pointers) moves the face 2px, a visited key rests at 3px (no glyph; the lower rest is the whole signal), and a press or a number-key press goes to 6px (7px from 640px) over 90ms on `cubic-bezier(0.2,0.8,0.2,1)`, then navigates. Focus shows a 3px ink outline at 4px offset.
- **Switch tester (/keys):** keys that link nowhere and exist only for sound: 13 recorded switch sets in four rows by feel (Clicky, Linear, Tactile, Other), four slots per row (two below 560px). Each key carries a top-left legend that matches a physical key (1–4, Q–R, A–S, Z–C), and under it, printed on the plate, a mono label with a small cross in the real stem colour. All caps are identical plain caps (the stem cross carries the switch identity); there is no orange or charcoal key on this board. The nine tester-only sets load only on /keys. Reached from a small keyboard keycap in the top bar.
- **Footer credit:** plain text, not a key. Mono 13px "Made by" in muted ink, then a code glyph in orange ink and "MatiasTK" in bold foreground, linking to GitHub. On phones it sits centred right under the board; from 1024px it sits bottom-right, on the same line as the number-key hint.

### Small Keycap
A mini key (30px, or 44px when interactive) used for the number hints, the theme switch, the Escape/home key and the admin "View site" link. It has a cap-white gradient face, a 3px skirt base and mono 700 13px glyphs. On press it moves down 3px as the base collapses.

### Buttons
- **Shape:** gently rounded (12px), min-height 40px, 600 weight at 0.9375rem.
- **Primary:** orange face gradient (accent-hi → accent-face) with dark accent-ink text on a 3px accent-skirt base.
- **Secondary:** cap-white gradient on a 3px key-skirt base.
- **Destructive:** fault red with white text on a base mixed 60% toward black.
- **Ghost:** transparent; fills with the accent neutral on hover.
- **Press / Disabled:** moves down 2px with the base shrinking to 1px; disabled at 55% opacity.

### Inputs / Fields
- **Style:** cap-white fill, 1px seam border, 12px radius, 44px min height, faint inset well.
- **Focus:** one 2px signal-orange edge (the border turns orange plus a 1px ring of the same colour), no second ink border and no soft halo. Selects use the same treatment plus a legend-gray chevron.

### Toggle
A 44×26 recessed plate-colored track with a domed white knob on a 2px base. It turns signal orange when on and moves over 160ms on the ease-out curve.

### Navigation
On public pages, navigation *is* the board: keys 1–9 open the matching key and Escape presses the home keycap. The top bar holds a mono path (owner handle in bold ink) and the theme keycap. In admin, sidebar items are 8px-radius rows that fill with the accent neutral on hover.

## Do's and Don'ts

### Do:
- **Do** make every navigable item on a public board a keycap with a face, skirt and travel; tone it by position (first accent, last modifier, rest plain).
- **Do** keep keys large: at least 84px tall on phones and full width, so the first key sits above the fold.
- **Do** use primary-ink for orange text and accent-ink for legends on orange.
- **Do** express light and dark differences through tokens redefined in `.dark`, never `.dark` descendant selectors.
- **Do** keep motion to the 90ms travel and the single staggered settle (420ms, 45ms per key) on load, and freeze both under `prefers-reduced-motion`.
- **Do** show visited keys 3px low, stored per viewer. **Don't** add a check or badge for visited.

### Don't:
- **Don't** lay links out as a centred avatar over a column of rounded pill buttons.
- **Don't** put a second orange key on a board, or use orange for small text on the light case.
- **Don't** put white legends on the orange key.
- **Don't** give raised controls floating blur shadows; their depth is the skirt base.
- **Don't** set counts, domains, numbers or hints in the display face, or names in the mono.
