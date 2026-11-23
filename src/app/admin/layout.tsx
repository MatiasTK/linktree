import { AdminContent } from '@/components/AdminContent';
import { AdminRail, AdminTopbar } from '@/components/admin/AdminNav';
import { getAuthUser } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import './admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user.isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="adm">
      <AdminRail />
      <main className="adm-main">
        <AdminTopbar />
        <AdminContent>{children}</AdminContent>
      </main>
    </div>
  );
}
