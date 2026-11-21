import { cn } from '@/lib/utils';

/** The recessed well a project's capture sits in; without an image the name is set in the well. */
export function ProjectShot({ name, imageUrl, alt, className, priority }: {
  name: string;
  imageUrl: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('pf-shot', !imageUrl && 'pf-shot--empty', className)}>
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- images live on the owner's own host */
        <img src={imageUrl} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <span aria-hidden>{name}</span>
      )}
    </div>
  );
}
