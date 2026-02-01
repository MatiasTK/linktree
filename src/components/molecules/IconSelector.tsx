'use client';

import { cn } from '@/lib/utils';
import { AVAILABLE_ICONS, type IconType } from '@/lib/types';
import { iconMap } from '../atoms/Icon';
import * as LucideIcons from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onChange: (value: IconType) => void;
  className?: string;
}

export function IconSelector({ value, onChange, className }: IconSelectorProps) {
  return (
    <div className={cn('grid grid-cols-6 gap-2', className)}>
      {AVAILABLE_ICONS.map((iconName) => {
        const Icon = iconMap[iconName] || LucideIcons.Link;
        const isSelected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              'p-2 rounded-lg border transition-all',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-accent',
            )}
            title={iconName}
          >
            <Icon size={20} className="mx-auto" />
          </button>
        );
      })}
    </div>
  );
}
