import { Landmark, ShieldCheck, Wallet } from 'lucide-react';

const points = [
  {
    key: 'limit',
    icon: ShieldCheck,
    title: 'Up to 90% of your balance',
    body: 'Your maximum withdrawal is shown on each investment.',
  },
  {
    key: 'balance',
    icon: Wallet,
    title: 'Within your available balance',
    body: 'You cannot withdraw more than your available balance.',
  },
  {
    key: 'retirement',
    icon: Landmark,
    title: 'Retirement investments',
    body: 'Withdrawals are available to investors older than 65.',
  },
];

export default function LimitsExplainer() {
  return (
    <section
      aria-labelledby="limits-heading"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="limits-heading" className="text-lg font-medium tracking-tight">
        How withdrawals work
      </h2>
      <ul className="mt-5 space-y-5">
        {points.map(({ key, icon: Icon, title, body }) => (
          <li key={key} className="flex gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-medium leading-relaxed">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
