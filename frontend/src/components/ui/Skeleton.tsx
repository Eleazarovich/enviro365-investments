import React from 'react';

export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-muted ${className}`} />;
}
