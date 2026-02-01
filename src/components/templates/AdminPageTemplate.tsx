'use client';

import type { ReactNode } from 'react';

interface AdminPageTemplateProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AdminPageTemplate({ title, action, children }: AdminPageTemplateProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}
