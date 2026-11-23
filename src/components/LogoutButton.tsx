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
    <button type="button" onClick={handleLogout} className="adm-tool adm-tool--danger" title="Log out">
      <LogOut size={18} aria-hidden />
      <span className="sr-only">Log out</span>
    </button>
  );
}
