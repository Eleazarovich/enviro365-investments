'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { WithdrawalFilters } from '@/lib/types';

interface DownloadStatementButtonProps {
  filters: WithdrawalFilters;
  disabled?: boolean;
  onResult: (message: { tone: 'success' | 'error'; text: string }) => void;
}

export default function DownloadStatementButton({
  filters,
  disabled,
  onResult,
}: DownloadStatementButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Backend integration: GET /api/investors/1/withdrawal-notices/export?productId&fromDate&toDate
      const file = await api.exportWithdrawals(filters);
      const blob = new Blob(['\uFEFF', file.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onResult({ tone: 'success', text: `Statement downloaded as ${file.filename}` });
    } catch (e) {
      onResult({
        tone: 'error',
        text:
          e instanceof Error ? e.message : "We couldn't download your statement. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="md"
      onClick={handleDownload}
      disabled={disabled}
      loading={busy}
      loadingLabel="Preparing statement…"
      className="w-full sm:w-auto"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Download statement
    </Button>
  );
}
