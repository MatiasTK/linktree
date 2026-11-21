import type { KeySound } from '@/lib/key-sound';

/** The 13 recorded switches, shared by the switch tester and the type test. */

export interface Switch {
  name: string;
  sound: KeySound;
  /** stem colour, as on the real switch */
  stem: string;
  /** physical key that presses it */
  legend: string;
}

export interface Group {
  name: string;
  switches: Switch[];
}

/** One row per feel; each row is typed with one row of a QWERTY board (1234, QWER, AS, ZXC). */
export const SWITCH_GROUPS: Group[] = [
  {
    name: 'Clicky',
    switches: [
      { name: 'MX Blue PBT', sound: 'plain', stem: '#3d6fd8', legend: '1' },
      { name: 'MX Blue ABS', sound: 'blue-abs', stem: '#3d6fd8', legend: '2' },
      { name: 'Box White', sound: 'accent', stem: '#f4f3ef', legend: '3' },
      { name: 'Razer Green', sound: 'razer-green', stem: '#3fae4f', legend: '4' },
    ],
  },
  {
    name: 'Linear',
    switches: [
      { name: 'MX Black PBT', sound: 'mod', stem: '#1c1c1e', legend: 'Q' },
      { name: 'MX Black ABS', sound: 'black-abs', stem: '#1c1c1e', legend: 'W' },
      { name: 'Tealios V2', sound: 'tealios-v2', stem: '#f2a7c3', legend: 'E' },
      { name: 'NK Cream', sound: 'small', stem: '#e6d8b8', legend: 'R' },
    ],
  },
  {
    name: 'Tactile',
    switches: [
      { name: 'MX Brown PBT', sound: 'brown-pbt', stem: '#8a5a3c', legend: 'A' },
      { name: 'Akko Lavender', sound: 'akko-lavender', stem: '#b9a3e3', legend: 'S' },
    ],
  },
  {
    name: 'Other',
    switches: [
      { name: 'Typewriter', sound: 'typewriter', stem: '#6e6b64', legend: 'Z' },
      { name: 'Rubber dome', sound: 'rubber-dome', stem: '#9b9890', legend: 'X' },
      { name: 'Trust GXT', sound: 'trust-gxt', stem: '#d24a3a', legend: 'C' },
    ],
  },
];

export const SWITCHES = SWITCH_GROUPS.flatMap((g) => g.switches);

export function switchBySound(sound: string) {
  return SWITCHES.find((s) => s.sound === sound);
}
