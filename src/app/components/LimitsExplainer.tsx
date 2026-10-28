import React from 'react';
import { Info, ShieldCheck, Landmark } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export default function LimitsExplainer() {
  const points = [
    {
      key: 'explain-limit',
      icon: ShieldCheck,
      title: 'A withdrawal limit applies',
      body: 'You can withdraw up to 90% of an investment in total, including any withdrawals that are still waiting to be processed.',
    },
    {
      key: 'explain-retirement',
      icon: Landmark,
      title: 'Retirement withdrawals',
      body: 'These are only available to investors older than 65.',
    },
    {
      key: 'explain-request',
      icon: Info,
      title: 'A request is not a payment',
      body: 'Submitting a withdrawal records your request. It does not mean the money has reached your bank account.',
    },
  ];

  return (
    <section
      aria-labelledby="limits-heading"
      className="rounded-2xl border border-border bg-secondary/60 p-6"
    >
      <h2 id="limits-heading" className="text-base font-semibold tracking-tight">
        How withdrawals work
      </h2>
      <ul className="mt-5 space-y-5">
        {points?.map((p) => {
          const Icon = p?.icon;
          return (
            <li key={p?.key} className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">{p?.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p?.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}