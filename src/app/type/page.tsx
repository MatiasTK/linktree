import { Deck } from '@/components/keys';
import { TypingTest } from '@/components/type/TypingTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speed typing',
  description: 'How fast can you type? Pick a switch, race the clock and put your WPM on the leaderboard.',
};

export default function TypePage() {
  return (
    <Deck
      wide
      title="Speed typing"
      description="How fast can you type? Pick a switch and race the clock."
      path={
        <>
          <strong>matiastk</strong>
          <span>/ type</span>
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
