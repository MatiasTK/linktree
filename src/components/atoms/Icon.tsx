'use client';

import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

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
  discord: LucideIcons.MessageCircle,
  tiktok: LucideIcons.Music2,
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
  folder: LucideIcons.Folder,
  'chevron-right': LucideIcons.ChevronRight,
  'external-link': LucideIcons.ExternalLink,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 20 }: IconProps) {
  const LucideIcon = iconMap[name] || LucideIcons.Link;
  return <LucideIcon className={cn(className)} size={size} />;
}

export { iconMap };
