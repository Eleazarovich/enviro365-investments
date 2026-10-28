'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  tone: 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const isError = toast.tone === 'error';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6 md:justify-end md:px-8">
      <div
        role={isError ? 'alert' : 'status'}
        className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg"
      >
        {isError ? (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        )}
        <p className="flex-1 text-sm font-medium">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
