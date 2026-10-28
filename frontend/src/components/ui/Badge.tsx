import React from 'react';

type Tone = 'primary' | 'neutral' | 'success' | 'warning' | 'destructive';

const tones: Record<Tone, string> = {
  primary: 'bg-accent text-accent-foreground',
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({ tone = 'neutral', children, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
