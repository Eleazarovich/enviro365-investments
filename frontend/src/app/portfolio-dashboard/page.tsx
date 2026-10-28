import { redirect } from 'next/navigation';

// The Portfolio Dashboard is served at "/" (src/app/page.tsx).
// This route label forwards there so both URLs resolve to the same screen.
export default function PortfolioDashboardAlias() {
  redirect('/');
}
