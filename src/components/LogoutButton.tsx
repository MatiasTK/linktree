'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
    >
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  );
}
