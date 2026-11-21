---
version: 1
slug: "src-app-type-page-tsx"
primary_target: "src/app/type/page.tsx"
related_targets: ["src/components/type/TypingTest.tsx"]
---

# Type test (/type)

Mode: Operate with Experience moments (the visitor is inside a timed task; the result is the payoff).
Audience: visitors who found the switch tester or the home page, mostly on desktop with a physical keyboard; phones must still work with the on-screen keyboard.
Job: start typing within one second of landing, finish a 15–60s or 10–50 word test, read WPM/accuracy, optionally put a name on the public leaderboard.
Owner answers: modes time 15/30/60 + words 10/25/50; Spanish + English word lists; sound = pick one of the 13 recorded switches, volume, and a distinct error sound; leaderboard in D1 (public, name-only, basic anti-cheat).
Constraints: inherit the Desk Keyboard world untouched; leaderboard abuse is bounded (rate limit, signed start token, server-recomputed WPM); the owner can delete scores via API.

## Direction contract

THESIS: The test is a board on the desk: options are the board's function row of keycaps, the words sit in a recessed well, and every press answers with the switch you picked. No drawn keyboard (owner removed it: it took space for nothing). It refuses the floating centred text on an empty dark page.

OWN-WORLD: Same case, plate and cap neutrals. Config is a function row of small keycaps with an orange LED on the selected one. Words in a recessed well, in Bricolage; untyped legend gray, typed ink, errors fault red, orange bar caret. Results are printed on caps: WPM on the one orange key, accuracy on a plain cap, Next test on the charcoal modifier.

STORY: Land, see "Type test" and the words already waiting; type; the chosen switch answers each press and a miss sounds different; the timer runs in mono; at the end the well becomes the result (WPM, accuracy, per-second chart) and a name field posts to the leaderboard below.

FIRST VIEWPORT: Desktop 1440: top bar; title left, one-line description right; full-width board with function row (mode, length, language, switch) and the three-line well; leaderboard starts within the fold. Phone 390: title, function row wrapping, three-line well; tapping the well opens the native keyboard.

FORM: Keycap board as instrument (extension of the established world, no surface roll). seed: none (pinned) "un juego como monkeytype con el estilo y diseño de nuestra web". Signature interaction: every keypress plays the chosen switch at the chosen volume; a miss plays the error sound (thud or buzz). Motion grammar: the board's single staggered settle on load, caret glides 80ms, results settle once; frozen under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
