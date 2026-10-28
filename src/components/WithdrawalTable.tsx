import { ArrowUpRight } from 'lucide-react';
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
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/50">
            <tr className="border-b border-border text-[11px] text-muted-foreground">
              <th scope="col" className="whitespace-nowrap px-5 py-3.5 font-medium sm:px-6">
                Date submitted
              </th>
              {showInvestment && (
                <th scope="col" className="px-5 py-3.5 font-medium sm:px-6">
                  Investment
                </th>
              )}
              <th scope="col" className="px-5 py-3.5 text-right font-medium sm:px-6">
                Amount
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium sm:px-6">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`withdrawal-${row.id}`}
                className={`border-b border-border/75 transition-colors last:border-b-0 hover:bg-muted/60 ${highlightId === row.id ? 'animate-row-flash' : ''}`}
              >
                <td className="whitespace-nowrap px-5 py-[18px] text-muted-foreground sm:px-6">
                  <time dateTime={row.submittedAt}>{formatDate(row.submittedAt)}</time>
                </td>
                {showInvestment && (
                  <td className="px-5 py-[18px] font-medium sm:px-6">{row.productName}</td>
                )}
                <td className="tabular whitespace-nowrap px-5 py-[18px] text-right font-medium sm:px-6">
                  {formatRandPrecise(row.amount)}
                </td>
                <td className="px-5 py-[18px] sm:px-6">
                  <WithdrawalStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label={caption} className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li
            key={`withdrawal-card-${row.id}`}
            className={`flex items-start gap-3 px-5 py-4 ${highlightId === row.id ? 'animate-row-flash' : ''}`}
          >
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary"
              aria-hidden="true"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              {showInvestment && <p className="text-xs font-medium">{row.productName}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">
                <time dateTime={row.submittedAt}>{formatDate(row.submittedAt)}</time>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular mb-2 text-sm font-medium">{formatRandPrecise(row.amount)}</p>
              <WithdrawalStatusBadge status={row.status} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
