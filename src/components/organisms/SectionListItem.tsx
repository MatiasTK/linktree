'use client';

import { IconButton } from '@/components/molecules';
import type { Section } from '@/lib/types';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface SectionListItemProps {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export function SectionListItem({
  section,
  onEdit,
  onDelete,
  onToggleVisibility,
}: SectionListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{section.title}</p>
        <p className="text-sm text-muted-foreground">/{section.slug}</p>
      </div>
      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
        Order: {section.display_order + 1}
      </span>
      <div className="flex items-center gap-2">
        <IconButton
          icon={section.show_in_main ? Eye : EyeOff}
          variant={section.show_in_main ? 'success' : 'muted'}
          onClick={onToggleVisibility}
          title={section.show_in_main ? 'Visible on main page' : 'Hidden from main page'}
        />
        <IconButton icon={Pencil} onClick={onEdit} title="Edit" />
        <IconButton icon={Trash2} variant="danger" onClick={onDelete} title="Delete" />
      </div>
    </div>
  );
}
