'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  value: string;
  onValueChange: (value: string) => void;
}

// Format strings without converting to a number, preserving cents and partial input.
function formatInput(raw: string): string | null {
  const amount = raw.replace(/^\s*R\s*/i, '').replace(/[,\s]/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(amount)) return null;
  if (!amount) return '';
  const [whole, cents] = amount.split('.');
  const grouped = (whole || '0').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cents === undefined ? grouped : `${grouped}.${cents}`;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onValueChange, onBlur, onKeyDown, ...props },
  ref
) {
  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(event) => {
        const input = event.currentTarget;
        const raw = input.value;
        const cursor = input.selectionStart ?? raw.length;
        const formatted = formatInput(raw);

        // Reject invalid edits rather than silently changing the requested amount.
        if (formatted === null) {
          input.value = value;
          const restoredCursor = Math.max(0, cursor - Math.max(0, raw.length - value.length));
          input.setSelectionRange(restoredCursor, restoredCursor);
          return;
        }

        // Keep the caret beside the same digit when grouping commas are inserted.
        const suffixLength = raw.slice(cursor).replace(/[^\d.]/g, '').length;
        let nextCursor = formatted.length;
        let remaining = suffixLength;
        while (nextCursor > 0 && remaining > 0) {
          nextCursor -= 1;
          if (/[\d.]/.test(formatted[nextCursor])) remaining -= 1;
        }
        input.value = formatted;
        input.setSelectionRange(nextCursor, nextCursor);
        onValueChange(formatted);
      }}
      onBlur={(event) => {
        if (value) {
          const [whole, cents = ''] = value.split('.');
          onValueChange(`${whole}.${cents.padEnd(2, '0')}`);
        }
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const input = event.currentTarget;
        const cursor = input.selectionStart;
        if (cursor === null || cursor !== input.selectionEnd) return;
        // Treat grouping commas as decoration when deleting adjacent digits.
        if (event.key === 'Backspace' && value[cursor - 1] === ',') {
          input.setSelectionRange(cursor - 1, cursor - 1);
        } else if (event.key === 'Delete' && value[cursor] === ',') {
          input.setSelectionRange(cursor + 1, cursor + 1);
        }
      }}
    />
  );
});

export default CurrencyInput;
