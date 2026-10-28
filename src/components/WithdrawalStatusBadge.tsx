import React from 'react';
import Badge from './ui/Badge';
import { statusLabel } from '@/lib/format';

export default function WithdrawalStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      tone="warning"
      icon={<span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />}
    >
      {statusLabel(status)}
    </Badge>
  );
}
