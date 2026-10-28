import { Info, Landmark, ShieldCheck } from 'lucide-react';

const points = [
  {
    key: 'limit',
    icon: ShieldCheck,
    title: 'Up to 90% of your investment',
    body: 'Your limit includes withdrawals that are still waiting to be processed.',
  },
  {
    key: 'retirement',
    icon: Landmark,
    title: 'A note on retirement funds',
    body: 'Withdrawals are available to investors older than 65.',
  },
  {
    key: 'request',
    icon: Info,
    title: 'A request comes first',
    body: 'Submitting a request does not mean the money has reached your bank account.',
  },
];

export default function LimitsExplainer() {
  return (
    <section
      aria-labelledby="limits-heading"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow !text-primary">Good to know</p>
      </div>
      <h2 id="limits-heading" className="mt-3 text-lg font-medium tracking-tight">
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
