import { Briefcase, History } from 'lucide-react';

export const navItems = [
  { key: 'nav-portfolio', label: 'Portfolio', href: '/', icon: Briefcase, matches: ['/', '/investment-detail'] },
  {
    key: 'nav-withdrawal-history',
    label: 'Withdrawal history',
    href: '/withdrawal-history',
    icon: History,
    matches: ['/withdrawal-history'],
  },
];