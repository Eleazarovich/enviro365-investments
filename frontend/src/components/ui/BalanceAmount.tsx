import { formatRand } from '@/lib/format';

export default function BalanceAmount({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const formatted = formatRand(value, true);
  const [whole, cents] = formatted.split('.');

  return (
    <p className={`tabular text-balance-xl font-medium ${className}`}>
      <span className="sr-only">{formatted}</span>
      <span aria-hidden="true">
        {whole}
        <span className="text-[0.55em] font-normal opacity-65">.{cents}</span>
      </span>
    </p>
  );
}
