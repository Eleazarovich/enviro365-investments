'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatRand, formatRandPrecise } from '@/lib/format';
import { parseAmount, validateWithdrawalAmount } from '@/lib/withdrawalValidation';
import type { InvestmentProduct, WithdrawalNotice } from '@/lib/types';

interface FormValues {
  amount: string;
}

interface WithdrawalDialogProps {
  open: boolean;
  onClose: () => void;
  product: InvestmentProduct;
  investorAge: number;
  onSubmitted: (notice: WithdrawalNotice) => Promise<void> | void;
  onNotify: (message: { tone: 'success' | 'error'; text: string }) => void;
}

export default function WithdrawalDialog({
  open,
  onClose,
  product,
  investorAge,
  onSubmitted,
  onNotify,
}: WithdrawalDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { amount: '' }, mode: 'onSubmit', reCriteriaMode: 'all' } as never);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ amount: number } | null>(null);
  const submittingRef = useRef(false);

  // Reset the form each time the dialog is opened
  useEffect(() => {
    if (open) {
      reset({ amount: '' });
      setServerError(null);
      setConfirmed(null);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    // Ref guard blocks duplicate submissions even before state re-renders
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setServerError(null);
    const amount = parseAmount(values.amount);
    try {
      // Backend integration: POST /api/investors/1/withdrawal-notices { productId, amount }
      const notice = await api.createWithdrawal({ productId: product.id, amount });
      setConfirmed({ amount: notice.amount });
      await onSubmitted(notice);
    } catch (e) {
      const message = e instanceof Error ? e.message : "We couldn't submit your withdrawal. Please try again.";
      const code = (e as { code?: string }).code;
      if (code === 'VALIDATION_ERROR' || code === 'LIMIT_EXCEEDED' || code === 'INSUFFICIENT_BALANCE' || code === 'NOT_ELIGIBLE') {
        setError('amount', { type: 'server', message });
      } else {
        setServerError(message);
        onNotify({ tone: 'error', text: message });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  if (confirmed) {
    return (
      <Dialog open={open} onClose={handleClose} title="Withdrawal submitted">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm text-foreground">
            Your withdrawal request of{' '}
            <span className="tabular font-bold">{formatRandPrecise(confirmed.amount)}</span> has been
            submitted. Your available balance has been updated.
          </p>
          <p className="mt-3 rounded-lg bg-muted px-3.5 py-2.5 text-xs text-muted-foreground">
            This is a request, not a bank payment. We&apos;ll show its status in your withdrawal history.
          </p>
          <Button className="mt-6 w-full" onClick={onClose} data-autofocus>
            Done
          </Button>
        </div>
      </Dialog>
    );
  }

  const fieldError = errors.amount?.message;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      locked={submitting}
      title="Withdraw money"
      description={`From ${product.name}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <dl className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Available balance</dt>
            <dd className="tabular mt-0.5 font-bold">{formatRand(product.availableBalance)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Maximum you can withdraw</dt>
            <dd className="tabular mt-0.5 font-bold">{formatRand(product.maximumWithdrawable)}</dd>
          </div>
        </dl>

        <label htmlFor="withdrawal-amount" className="mb-1.5 block text-sm font-medium">
          Amount
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
            aria-hidden="true"
          >
            R
          </span>
          <input
            id="withdrawal-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            data-autofocus
            disabled={submitting}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? 'amount-error' : 'amount-hint'}
            className={`tabular h-12 w-full rounded-md border bg-card pl-8 pr-3.5 text-base font-semibold transition-colors placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-muted ${
              fieldError
                ? 'border-destructive focus-visible:ring-destructive/30' :'border-input focus-visible:border-primary focus-visible:ring-ring/30'
            }`}
            {...register('amount', {
              validate: (v) => validateWithdrawalAmount(v, { product, investorAge }),
            })}
          />
        </div>
        {fieldError ? (
          <p id="amount-error" role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {fieldError}
          </p>
        ) : (
          <p id="amount-hint" className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            You can withdraw up to {formatRandPrecise(product.maximumWithdrawable)} from this investment.
          </p>
        )}

        {serverError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{serverError} Your amount has been kept.</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} loadingLabel="Submitting…" className="sm:min-w-[11rem]">
            Submit withdrawal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}