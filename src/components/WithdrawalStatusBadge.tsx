import React from 'react';
import { Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { statusLabel } from '@/lib/format';

export default function WithdrawalStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone="warning" icon={<Clock className="h-3 w-3" aria-hidden="true" />}>
      {statusLabel(status)}
    </Badge>
  );
}