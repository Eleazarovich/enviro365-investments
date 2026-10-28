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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col bg-[var(--forest)] px-5 py-7 text-white lg:flex">
      <Link
        href="/"
        aria-label="Enviro365 Investments home"
        className="flex items-center gap-2.5 rounded-lg px-1 focus-visible:outline-lime-200"
      >
        <AppLogo size={35} />
        <div>
          <p className="text-[19px] font-semibold leading-tight tracking-[-0.04em]">
            enviro<span className="font-normal text-[#d5ed9b]">365</span>
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-[#b6c6b9]">
            Investments
          </p>
        </div>
      </Link>
      <p className="mb-3 mt-14 px-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9eafa3]">
        Your workspace
      </p>
      <nav aria-label="Primary">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = item.matches.includes(pathname);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-lime-200 ${active ? 'bg-[#d5ed9b] text-[#203b29]' : 'text-[#c6d2c9] hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                  {item.label}
                  {active && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-current"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="mb-6 border-b border-white/10 px-3 pb-6">
          <AppLogo size={28} className="mb-4 opacity-70" />
          <p className="text-sm font-medium leading-relaxed text-[#e3ebdc]">
            A clear view.
            <br />A considered future.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#9eafa3]">
            Your investments, all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] font-medium text-[#d5ed9b]"
            aria-hidden="true"
          >
            {portfolio?.investor.name
              .split(' ')
              .map((part) => part.charAt(0))
              .join('')
              .slice(0, 2) || '··'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[#e3ebdc]">
              {portfolio?.investor.name || 'Your account'}
            </p>
            <p className="mt-0.5 text-[10px] text-[#9eafa3]">Investor account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
