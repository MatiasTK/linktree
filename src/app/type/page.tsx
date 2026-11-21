import { Deck } from '@/components/keys';
import { TypingTest } from '@/components/type/TypingTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Type test',
  description: 'A typing test on a mechanical board. Pick a switch, type, and put your WPM on the leaderboard.',
};

export default function TypePage() {
  return (
    <Deck
      wide
      title="Type test"
      description="Type the words as fast as you can. Pick the switch you want to hear."
      path={
        <>
          <strong>matiastk</strong> / type
        </>
      }
      showHome
      hideTypeLink
      shortcutCount={0}
      hint={
        <>
          <span className="keycap" aria-hidden>
            tab
          </span>
          restart
          <span className="keycap ml-3" aria-hidden>
            esc
          </span>
          stop typing, then esc again to go home
        </>
      }
    >
      <TypingTest />
    </Deck>
  );
}
