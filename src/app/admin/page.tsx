import { TopLinksTable } from '@/components/organisms';
import { statsService } from '@/services';
import { Layers, Link2, MousePointerClick } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: number;
}

function StatCard({ icon, iconBgClass, label, value }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await statsService.getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Layers className="text-blue-500" size={20} />}
          iconBgClass="bg-blue-500/10"
          label="Sections"
          value={stats.sectionsCount}
        />
        <StatCard
          icon={<Link2 className="text-green-500" size={20} />}
          iconBgClass="bg-green-500/10"
          label="Links"
          value={stats.linksCount}
        />
        <StatCard
          icon={<MousePointerClick className="text-purple-500" size={20} />}
          iconBgClass="bg-purple-500/10"
          label="Total Clicks"
          value={stats.totalClicks}
        />
      </div>

      <TopLinksTable links={stats.topLinks} />
    </div>
  );
}
