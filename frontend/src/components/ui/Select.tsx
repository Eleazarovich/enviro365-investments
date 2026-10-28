import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

export default function Select({ id, label, options, className = '', ...rest }: SelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <select id={id} className="field appearance-none pr-10" {...rest}>
          {options.map((o) => (
            <option key={`${id}-${o.value}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
