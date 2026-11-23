'use client';

import { isKeySoundOn, setKeySoundOn } from '@/lib/key-sound';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SoundToggle() {
  const [on, setOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOn(isKeySoundOn());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setKeySoundOn(next);
  };

  return (
    <button
      type="button"
      className="keycap"
      onClick={toggle}
      aria-pressed={mounted ? on : undefined}
      aria-label={on ? 'Mute key sound' : 'Turn on key sound'}
      title={on ? 'Mute key sound' : 'Turn on key sound'}
    >
      {on ? <Volume2 className="w-4 h-4" aria-hidden /> : <VolumeX className="w-4 h-4" aria-hidden />}
    </button>
  );
}
