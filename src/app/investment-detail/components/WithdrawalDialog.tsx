'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatRandPrecise } from '@/lib/format';
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
  } = useForm<FormValues>({ defaultValues: { amount: '' }, mode: 'onSubmit', criteriaMode: 'all' });

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
      const message =
        e instanceof Error ? e.message : "We couldn't submit your withdrawal. Please try again.";
      const code = (e as { code?: string }).code;
      if (
        code === 'VALIDATION_ERROR' ||
        code === 'LIMIT_EXCEEDED' ||
        code === 'INSUFFICIENT_BALANCE' ||
        code === 'NOT_ELIGIBLE'
      ) {
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
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">Withdrawal request received</p>
          <p className="tabular mt-2 text-4xl font-medium tracking-tight">
            {formatRandPrecise(confirmed.amount)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your request has been submitted and your available balance has been updated.
          </p>
          <p className="mt-5 rounded-xl border border-border bg-muted/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            This is a request, not a bank payment. We&apos;ll show its status in your withdrawal
            history.
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
        <dl className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/60 p-4 text-xs">
          <div>
            <dt className="text-muted-foreground">Available balance</dt>
            <dd className="tabular mt-2 text-lg font-medium">
              {formatRandPrecise(product.availableBalance)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Maximum you can withdraw</dt>
            <dd className="tabular mt-2 text-lg font-medium">
              {formatRandPrecise(product.maximumWithdrawable)}
            </dd>
          </div>
        </dl>

        <label htmlFor="withdrawal-amount" className="field-label">
          Amount
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground"
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
            className={`tabular h-16 w-full rounded-xl border bg-card pl-10 pr-4 text-[28px] font-medium transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-muted ${
              fieldError
                ? 'border-destructive focus-visible:ring-destructive/10'
                : 'border-input focus-visible:border-primary focus-visible:ring-primary/10'
            }`}
            {...register('amount', {
              validate: (v) => validateWithdrawalAmount(v, { product, investorAge }),
            })}
          />
        </div>
        {fieldError ? (
          <p
            id="amount-error"
            role="alert"
            className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {fieldError}
          </p>
        ) : (
          <p
            id="amount-hint"
            className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            You can withdraw up to {formatRandPrecise(product.maximumWithdrawable)} from this
            investment.
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

        <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          Submitting records a request, not a bank payment. You can follow your request in
          withdrawal history.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            loadingLabel="Submitting…"
            className="sm:min-w-[11rem]"
          >
            Submit withdrawal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
