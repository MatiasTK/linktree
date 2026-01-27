import { AdminContent } from '@/components/AdminContent';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getAuthUser } from '@/lib/auth';
import { Home, Layers, LayoutDashboard, Link2, Settings } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user.isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="mb-8">
          {/* Improved Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Back to Site</span>
          </Link>
          <h1 className="text-xl font-bold mt-4 gradient-text">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage your links</p>
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
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-background">
        <AdminContent>{children}</AdminContent>
      </main>
    </div>
  );
}
