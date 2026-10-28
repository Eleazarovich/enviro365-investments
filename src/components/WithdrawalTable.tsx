import React from 'react';
import { formatDate, formatRandPrecise } from '@/lib/format';
import type { WithdrawalNotice } from '@/lib/types';
import WithdrawalStatusBadge from './WithdrawalStatusBadge';

interface WithdrawalTableProps {
  rows: WithdrawalNotice[];
  showInvestment?: boolean;
  highlightId?: number | null;
  caption: string;
}

export default function WithdrawalTable({
  rows,
  showInvestment = true,
  highlightId,
  caption,
}: WithdrawalTableProps) {
  return (
    <>
      {/* Tablet and desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-6 py-3 font-semibold">Date</th>
              {showInvestment && <th scope="col" className="px-6 py-3 font-semibold">Investment</th>}
              <th scope="col" className="px-6 py-3 text-right font-semibold">Amount</th>
              <th scope="col" className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`withdrawal-${row.id}`}
                className={`border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/50 ${
                  highlightId === row.id ? 'animate-row-flash' : ''
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4 font-medium">{formatDate(row.submittedAt)}</td>
                {showInvestment && <td className="px-6 py-4">{row.productName}</td>}
                <td className="tabular whitespace-nowrap px-6 py-4 text-right font-semibold">
                  {formatRandPrecise(row.amount)}
                </td>
                <td className="px-6 py-4">
                  <WithdrawalStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li
            key={`withdrawal-card-${row.id}`}
            className={`flex items-start justify-between gap-3 px-4 py-4 ${
              highlightId === row.id ? 'animate-row-flash' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="tabular text-base font-semibold">{formatRandPrecise(row.amount)}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {showInvestment ? `${row.productName} · ` : ''}
                {formatDate(row.submittedAt)}
              </p>
            </div>
            <WithdrawalStatusBadge status={row.status} />
          </li>
        ))}
      </ul>
    </>
  );
}