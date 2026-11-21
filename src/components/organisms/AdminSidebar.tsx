'use client';

import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Briefcase, Home, Layers, LayoutDashboard, Link2, Settings } from 'lucide-react';
import Link from 'next/link';

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/" className="keycap text-sm">
          <Home size={16} aria-hidden />
          <span className="font-sans font-semibold">View site</span>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight mt-6">Admin</h1>
        <p className="text-sm text-muted-foreground">Sections, links, portfolio and settings</p>
      </div>

      <nav className="space-y-1 flex-1">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/sections"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Layers size={18} />
          <span>Sections</span>
        </Link>
        <Link
          href="/admin/links"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Link2 size={18} />
          <span>Links</span>
        </Link>
        <Link
          href="/admin/portfolio"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Briefcase size={18} />
          <span>Portfolio</span>
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
