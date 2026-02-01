'use client';

interface ProfileHeaderProps {
  title: string;
  description: string;
  initial: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    avatar: 'w-16 h-16',
    initial: 'text-xl',
    title: 'text-xl',
  },
  md: {
    avatar: 'w-20 h-20',
    initial: 'text-2xl',
    title: 'text-2xl',
  },
  lg: {
    avatar: 'w-24 h-24',
    initial: 'text-3xl',
    title: 'text-2xl',
  },
};

export function ProfileHeader({
  title,
  description,
  initial,
  imageUrl,
  size = 'lg',
}: ProfileHeaderProps) {
  const classes = sizeClasses[size];

  return (
    <header className="text-center mb-10">
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={title}
          className={`${classes.avatar} mx-auto mb-4 rounded-full object-cover ring-4 ring-primary/20`}
        />
      ) : (
        <div
          className={`${classes.avatar} mx-auto mb-4 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center`}
        >
          <span className={`${classes.initial} font-bold text-white`}>{initial}</span>
        </div>
      )}
      <h1 className={`${classes.title} font-bold gradient-text`}>{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
    </header>
  );
}
