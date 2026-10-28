'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './navItems';

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-2">
        {navItems?.map((item) => {
          const active = item?.matches?.includes(pathname);
          const Icon = item?.icon;
          return (
            <li key={item?.key}>
              <Link
                href={item?.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center gap-1.5 py-3 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                  active ? 'bg-secondary/70 text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item?.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
