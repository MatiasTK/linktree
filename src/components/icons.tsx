'use client';

import { AVAILABLE_ICONS, IconType } from '@/lib/types';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcons.LucideIcon> = {
  link: LucideIcons.Link,
  github: LucideIcons.Github,
  twitter: LucideIcons.Twitter,
  instagram: LucideIcons.Instagram,
  facebook: LucideIcons.Facebook,
  linkedin: LucideIcons.Linkedin,
  youtube: LucideIcons.Youtube,
  twitch: LucideIcons.Twitch,
  discord: LucideIcons.MessageCircle, // Discord doesn't exist in Lucide
  tiktok: LucideIcons.Music2, // TikTok doesn't exist in Lucide
  globe: LucideIcons.Globe,
  mail: LucideIcons.Mail,
  phone: LucideIcons.Phone,
  'map-pin': LucideIcons.MapPin,
  'book-open': LucideIcons.BookOpen,
  'file-text': LucideIcons.FileText,
  'shopping-bag': LucideIcons.ShoppingBag,
  coffee: LucideIcons.Coffee,
  heart: LucideIcons.Heart,
  star: LucideIcons.Star,
  music: LucideIcons.Music,
  camera: LucideIcons.Camera,
  video: LucideIcons.Video,
  code: LucideIcons.Code,
  terminal: LucideIcons.Terminal,
  palette: LucideIcons.Palette,
  'pen-tool': LucideIcons.PenTool,
  briefcase: LucideIcons.Briefcase,
  calendar: LucideIcons.Calendar,
  'message-circle': LucideIcons.MessageCircle,
  // Additional icons used in UI
  folder: LucideIcons.Folder,
  'chevron-right': LucideIcons.ChevronRight,
  'external-link': LucideIcons.ExternalLink,
};

export function DynamicIcon({ name, className, size = 20 }: DynamicIconProps) {
  const Icon = iconMap[name] || LucideIcons.Link;
  return <Icon className={className} size={size} />;
}

interface IconSelectorProps {
  value: string;
  onChange: (value: IconType) => void;
  className?: string;
}

export function IconSelector({ value, onChange, className }: IconSelectorProps) {
  return (
    <div className={`grid grid-cols-6 gap-2 ${className}`}>
      {AVAILABLE_ICONS.map((iconName) => {
        const Icon = iconMap[iconName] || LucideIcons.Link;
        const isSelected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`p-2 rounded-lg border transition-all ${
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-accent'
            }`}
            title={iconName}
          >
            <Icon size={20} className="mx-auto" />
          </button>
        );
      })}
    </div>
  );
}
