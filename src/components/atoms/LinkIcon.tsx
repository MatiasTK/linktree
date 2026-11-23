import { linkIcon } from '@/lib/link-icon';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface LinkIconProps {
  iconType: string;
  url: string;
  size?: number;
  className?: string;
}

/** A link's icon: the chosen glyph, or the destination's favicon when the icon is "auto". */
export function LinkIcon({ iconType, url, size = 20, className }: LinkIconProps) {
  const source = linkIcon(iconType, url);
  if (source.kind === 'glyph') return <Icon name={source.name} size={size} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source.src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('link-favicon', className)}
    />
  );
}
