# Enviro365 Investments

The existing portfolio and withdrawal workflows use the **Rosewood & Porcelain** identity: restrained rosewood accents, warm neutral backgrounds, white surfaces, neutral financial amounts, and the original leaf-and-capital mark. The existing navigation, layout structure, interactions, and responsive behaviour are preserved.

## Visual rules

- **Colour:** rosewood `#663344` marks primary actions, selected states, and brand details; primary hover is `#522A38`. Porcelain `#F8F5F0` forms the page background, with white `#FFFFFF` card surfaces, `#26252B` primary text, `#6A6364` secondary text, and `#E6DFDC` borders. Subtle accent surfaces use `#EADDE2`. Success uses `#146649`, errors use `#B42318`, and warnings retain their semantic amber. The sidebar uses neutral charcoal; financial amounts stay neutral. Avoid gradients, competing accent colours, and excessive shadows.
- **Type:** Geist, served through `next/font`, is used throughout. Page titles are 26–30px; investment balances are 32px; the principal balance scales from 40–56px. Amounts use tabular numerals. Small labels stay secondary to financial values.
- **Spacing:** use a 4px base, 20–24px between related panels, and 24–32px inside important surfaces. The desktop sidebar is 232px. Content is bounded on wide screens; screens below 1024px use the existing two-destination bottom navigation to leave room for financial information.
- **Surfaces:** 16px corners, subtle borders, and minimal shadows. Group related controls and information: history filters and results share a single surface. Investment details flow directly from the balance summary to withdrawal history, with the current withdrawal maximum beside the action.
- **Actions and fields:** primary actions use rosewood with white text; secondary actions use a neutral border. Inputs share `.field` and `.field-label`, with visible rosewood focus rings and explicit validation messages. Field boundaries use a dedicated input token with at least 3:1 contrast on white; text and action colours meet WCAG AA contrast expectations.
- **States:** skeletons follow the eventual content shape. Errors offer the existing retry action. Withdrawal confirmation uses **Withdrawal submitted successfully**, the investment name, the signed amount, and **Done**. Balance and history updates run in the background without explanatory success copy. Motion respects reduced-motion preferences.

## Implementation

Colour tokens and shared styles live in `frontend/src/styles/tailwind.css`; `frontend/tailwind.config.js` maps those tokens to reusable utilities. Channel-based colours support Tailwind opacity modifiers consistently. The in-app vector mark inherits the surrounding theme colour. Its component accepts
only size and class name; icons use direct Lucide imports. Shared components include `BalanceAmount`, `Button`, `Badge`, `Select`, `Dialog`, and `WithdrawalTable`.

`BalanceAmount` displays actual decimal cents and exposes the complete amount to assistive technology. Investment cards and limits use the existing precise currency formatter. The modal supports initial focus, keyboard containment, Escape, focus restoration, and disabled dismissal during submission.

Investment details use the investment name as the heading without an extra eyebrow. General products carry the **Standard investment** label; retirement products retain **Retirement**. API product types remain unchanged. `CurrencyInput` adds grouping commas during entry, permits up to two decimal places, completes cents on blur, and preserves cursor editing. Invalid edits and pastes retain the previous amount. The separate withdrawal-limit meter and its skeleton are removed; the maximum withdrawal and financial validation remain available.

The routes, eligibility rule, filters, and CSV export remain in place. Active submitted withdrawals share a cumulative cap of 90% of the underlying investment balance, rounded down to cents, with a R100 minimum. This follows the latest backend request. The API supplies both `minimumWithdrawable` and `maximumWithdrawable`; visual components do not calculate the limits. The decorative leaf outlines are original CSS and SVG, with no third-party imagery or chart data.

History displays results for the current filter selection only, and keeps statement
download unavailable until those results load. The download button is right-aligned
above the filters and remains full-width on mobile. Late responses cannot replace newer
results or errors. If a balance refresh fails after a submitted withdrawal, preserve
the success confirmation and refreshed history, replace outdated balance figures
with a retry state, and require a successful balance refresh before another request.

When no request of at least R100 fits within the 90% limit, show **Minimum you can withdraw: R100** on the investment detail and portfolio card, and disable **Withdraw money**, without an additional limit explanation. Keep the actual available balance visible. Eligible investments continue to show **Maximum you can withdraw** with their current limit. The API still returns a maximum of R0 when unavailable; this is a display change only. The form's existing amount hint shows **Minimum withdrawal is R100.** There is no final-cent or full-balance exception.

Investment cards show the available balance and maximum withdrawal in a compact layout. Withdrawal tables use **Date**, **Investment**, and **Amount**, with right-aligned negative amounts such as `-R20,000`. Investment-specific tables omit the Investment column. Mobile rows use the same signed amounts with vertically centred content. CSV statements use the same three columns and negative amounts. API withdrawal amounts remain positive; the presentation and statement export apply the debit sign.

The **How withdrawals work** panel shows the confirmed rules: retirement withdrawals require age greater than 65, withdrawals cannot exceed the available balance, and submitted withdrawals count toward a 90% investment limit with a R100 minimum. Account status and pending totals are internal data; investor-facing lists focus on the date, investment, and deduction.

## Verification

Run these commands from the project root:

```sh
cd frontend
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The current Playwright suite uses the real HTTP adapter and Spring Boot/H2. Six
focused tests cover the required portfolio, withdrawal, history, CSV and mobile flows.
Backend tests cover detailed financial boundaries. Earlier fixture and mock-adapter
browser suites have been retired; their verification reports are historical records.

## Previews

Current README previews were captured on 1 November 2026 using the real Spring
Boot/H2 API and fresh seed data. The four desktop previews use a 1440 × 1120px
viewport so fixed navigation reaches the image edge. Cash has R80,000 available
and a R70,000 withdrawal maximum.

[Portfolio](previews/current/portfolio-desktop.png) · [Investment details](previews/current/investment-details-desktop.png) · [Withdraw money](previews/current/withdrawal-desktop.png) · [Withdrawals](previews/current/history-desktop.png)

Earlier mock-mode previews remain in `previews/rosewood-porcelain/` as historical
design references. Their R72,000 cash maximum predates the cumulative cap.
