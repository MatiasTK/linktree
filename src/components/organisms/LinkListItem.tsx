'use client';

import { Icon } from '@/components/atoms';
import { IconButton } from '@/components/molecules';
import type { Link as LinkType } from '@/lib/types';
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface LinkListItemProps {
  link: LinkType;
  sectionName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export function LinkListItem({
  link,
  sectionName,
  onEdit,
  onDelete,
  onToggleVisibility,
}: LinkListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon name={link.icon_type} className="text-primary" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{link.label}</p>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-xs bg-secondary px-2 py-0.5 rounded">{sectionName}</span>
          {link.group_title && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {link.group_title}
            </span>
          )}
          <span className="text-xs text-muted-foreground">Order: {link.display_order}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          title="Open link"
        >
          <ExternalLink size={18} />
        </a>
        <IconButton
          icon={link.is_visible ? Eye : EyeOff}
          variant={link.is_visible ? 'success' : 'muted'}
          onClick={onToggleVisibility}
          title={link.is_visible ? 'Visible' : 'Hidden'}
        />
        <IconButton icon={Pencil} onClick={onEdit} title="Edit" />
        <IconButton icon={Trash2} variant="danger" onClick={onDelete} title="Delete" />
      </div>
    </div>
  );
}
