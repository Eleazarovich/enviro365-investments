'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { InvestmentProduct } from '@/lib/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface FilterState {
  productId: string;
  fromDate: string;
  toDate: string;
}

interface HistoryFiltersProps {
  products: InvestmentProduct[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  canReset: boolean;
  invalidRange: boolean;
}

function DateField({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? 'date-range-error' : undefined}
        className={`field tabular ${
          invalid
            ? 'border-warning focus-visible:ring-warning/10'
            : 'border-input focus-visible:border-primary focus-visible:ring-primary/10'
        }`}
      />
    </div>
  );
}

export default function HistoryFilters({
  products,
  value,
  onChange,
  onReset,
  canReset,
  invalidRange,
}: HistoryFiltersProps) {
  const options = [
    { value: '', label: 'All investments' },
    ...products.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <section
      aria-label="Filter your withdrawals"
      className="border-b border-border bg-muted/30 p-5 sm:p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
        <Select
          id="filter-investment"
          label="Investment"
          value={value.productId}
          onChange={(e) => onChange({ ...value, productId: e.target.value })}
          options={options}
        />
        <DateField
          id="filter-from"
          label="Start date"
          value={value.fromDate}
          onChange={(v) => onChange({ ...value, fromDate: v })}
          invalid={invalidRange}
        />
        <DateField
          id="filter-to"
          label="End date"
          value={value.toDate}
          onChange={(v) => onChange({ ...value, toDate: v })}
          invalid={invalidRange}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={!canReset}
          className="sm:col-span-2 lg:col-span-1"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset filters
        </Button>
      </div>
    </section>
  );
}
