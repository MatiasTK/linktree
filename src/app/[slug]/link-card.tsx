'use client';

import { DynamicIcon } from '@/components/icons';
import type { Link as LinkType } from '@/lib/types';

interface LinkCardProps {
  link: LinkType;
}

export function LinkCard({ link }: LinkCardProps) {
  const handleClick = async () => {
    // Fire-and-forget click tracking
    fetch(`/api/links/${link.id}/click`, {
      method: 'POST',
    }).catch(() => {
      // Ignore errors - click tracking is non-critical
    });
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="link-card block p-4 rounded-xl bg-card border border-border hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <DynamicIcon name={link.icon_type} className="text-primary" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{link.label}</h3>
          <p className="text-sm text-muted-foreground truncate">{link.url}</p>
        </div>
        <DynamicIcon name="external-link" className="text-muted-foreground shrink-0" size={16} />
      </div>
    </a>
  );
}
