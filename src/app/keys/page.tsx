import { Deck } from '@/components/keys';
import { SwitchTester } from '@/components/keys/SwitchTester';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Switch tester',
  description: 'Thirteen mechanical switches. Nothing here links anywhere: press for the sound.',
};

export default function KeysPage() {
  return (
    <Deck
      title="Switch tester"
      description="Thirteen switches, no destinations. Press any key, or type on your own keyboard."
      path={
        <>
          <strong>matiastk</strong> / keys
        </>
      }
      showHome
      hideTesterLink
      shortcutCount={0}
      hint={
        <>
          <span className="flex gap-2" aria-hidden>
            {['1', 'Q', 'A', 'Z'].map((k) => (
              <span key={k} className="keycap">
                {k}
              </span>
            ))}
          </span>
          type 1–4, Q–R, A–S and Z–C on your keyboard
        </>
      }
    >
      <SwitchTester />
    </Deck>
  );
}
