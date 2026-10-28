import React from 'react';
import { Landmark, Wallet } from 'lucide-react';
import Badge from './ui/Badge';
import { productTypeLabel } from '@/lib/format';
import type { ProductType } from '@/lib/types';

export default function ProductTypeTag({ type }: { type: ProductType }) {
  const Icon = type === 'RETIREMENT' ? Landmark : Wallet;
  return (
    <Badge tone="primary" icon={<Icon className="h-3 w-3" aria-hidden="true" />}>
      {productTypeLabel(type)}
    </Badge>
  );
}
