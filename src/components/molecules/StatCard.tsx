'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number | string;
}

export function StatCard({ icon: Icon, iconColor, label, value }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconColor}/10 flex items-center justify-center`}>
          <Icon className={iconColor} size={20} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
