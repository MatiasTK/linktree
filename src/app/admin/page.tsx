import { query } from '@/lib/db';
import type { Link as LinkType, Section } from '@/lib/types';
import { Layers, Link2, MousePointerClick, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const sections = await query<Section>('SELECT * FROM sections');
    const links = await query<LinkType>('SELECT * FROM links');
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    return {
      sectionsCount: sections.length,
      linksCount: links.length,
      totalClicks,
      topLinks,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      sectionsCount: 0,
      linksCount: 0,
      totalClicks: 0,
      topLinks: [],
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Layers className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sections</p>
              <p className="text-2xl font-bold">{stats.sectionsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Link2 className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Links</p>
              <p className="text-2xl font-bold">{stats.linksCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MousePointerClick className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{stats.totalClicks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Links */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="font-semibold">Top Performing Links</h2>
        </div>
        <div className="divide-y divide-border">
          {stats.topLinks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No link data yet. Clicks will appear here.
            </div>
          ) : (
            stats.topLinks.map((link, index) => (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{link.clicks}</p>
                  <p className="text-xs text-muted-foreground">clicks</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
