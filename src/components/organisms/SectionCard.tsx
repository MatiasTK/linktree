'use client';

import { Icon } from '@/components/atoms';
import type { Section } from '@/lib/types';
import Link from 'next/link';

interface SectionCardProps {
  section: Section;
}

export function SectionCard({ section }: SectionCardProps) {
  return (
    <Link
      href={`/${section.slug}`}
      className="link-card block p-4 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="folder" className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="font-semibold">{section.title}</h2>
          <p className="text-sm text-muted-foreground">/{section.slug}</p>
        </div>
        <Icon name="chevron-right" className="ml-auto text-muted-foreground" size={20} />
      </div>
    </Link>
  );
}
