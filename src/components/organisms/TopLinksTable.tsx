'use client';

import { EmptyState } from '@/components/molecules';
import type { Link as LinkType } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

interface TopLinksTableProps {
  links: LinkType[];
}

export function TopLinksTable({ links }: TopLinksTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" />
        <h2 className="font-semibold">Top Performing Links</h2>
      </div>
      <div className="divide-y divide-border">
        {links.length === 0 ? (
          <EmptyState message="No link data yet. Clicks will appear here." />
        ) : (
          links.map((link, index) => (
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
  );
}
