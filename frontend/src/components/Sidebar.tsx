'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';
import { navItems } from './navItems';
import { usePortfolio } from '@/lib/PortfolioProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { portfolio } = usePortfolio();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
      <Link
        href="/"
        aria-label="Enviro365 Investments home"
        className="flex items-center gap-2.5 rounded-lg px-1 focus-visible:outline-accent"
      >
        <AppLogo size={35} className="text-accent" />
        <div>
          <p className="text-[19px] font-semibold leading-tight tracking-[-0.04em]">
            enviro<span className="font-normal text-accent">365</span>
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-sidebar-muted">
            Investments
          </p>
        </div>
      </Link>
      <nav aria-label="Primary" className="mt-14">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = item.matches.includes(pathname);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-accent ${active ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'text-sidebar-muted hover:bg-card/5 hover:text-sidebar-foreground'}`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-2.5 px-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sidebar-foreground/20 text-[10px] font-medium text-accent"
            aria-hidden="true"
          >
            {portfolio?.investor.name
              .split(' ')
              .map((part) => part.charAt(0))
              .join('')
              .slice(0, 2) || '··'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {portfolio?.investor.name || 'Your account'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
