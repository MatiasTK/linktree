import { AdminContent } from '@/components/AdminContent';
import { AdminSidebar } from '@/components/organisms';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user.isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-background">
        <AdminContent>{children}</AdminContent>
      </main>
    </div>
  );
}
