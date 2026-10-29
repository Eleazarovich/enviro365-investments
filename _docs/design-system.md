# Enviro365 Investments

The existing portfolio and withdrawal workflows use the **Rosewood & Porcelain** identity: restrained rosewood accents, warm neutral backgrounds, white surfaces, neutral financial amounts, and the original leaf-and-capital mark. The existing navigation, layout structure, interactions, and responsive behaviour are preserved.

## Visual rules

- **Colour:** rosewood `#663344` marks primary actions, selected states, and brand details; primary hover is `#522A38`. Porcelain `#F8F5F0` forms the page background, with white `#FFFFFF` card surfaces, `#26252B` primary text, `#6A6364` secondary text, and `#E6DFDC` borders. Subtle accent surfaces use `#EADDE2`. Success uses `#146649`, errors use `#B42318`, and warnings retain their semantic amber. The sidebar uses neutral charcoal; financial amounts stay neutral. Avoid gradients, competing accent colours, and excessive shadows.
- **Type:** Geist, served through `next/font`, is used throughout. Page titles are 26–30px; investment balances are 32px; the principal balance scales from 40–56px. Amounts use tabular numerals. Small labels stay secondary to financial values.
- **Spacing:** use a 4px base, 20–24px between related panels, and 24–32px inside important surfaces. The desktop sidebar is 232px. Content is bounded on wide screens; screens below 1024px use the existing two-destination bottom navigation to leave room for financial information.
- **Surfaces:** 16px corners, subtle borders, and minimal shadows. Group related controls and information: history filters and results share a single surface. The existing withdrawal-limit meter is the only data visualisation.
- **Actions and fields:** primary actions use rosewood with white text; secondary actions use a neutral border. Inputs share `.field` and `.field-label`, with visible rosewood focus rings and explicit validation messages. Field boundaries use a dedicated input token with at least 3:1 contrast on white; text and action colours meet WCAG AA contrast expectations.
- **States:** skeletons follow the eventual content shape. Errors offer the existing retry action. Withdrawal confirmation uses **Withdrawal submitted successfully**, the investment name, the signed amount, and **Done**. Balance and history updates run in the background without explanatory success copy. Motion respects reduced-motion preferences.

## Implementation

Colour tokens and shared styles live in `frontend/src/styles/tailwind.css`; `frontend/tailwind.config.js` maps those tokens to reusable utilities. Channel-based colours support Tailwind opacity modifiers consistently. The in-app vector mark inherits the surrounding theme colour. Shared components include `BalanceAmount`, `Button`, `Badge`, `Select`, `Dialog`, and `WithdrawalTable`.

`BalanceAmount` displays actual decimal cents and exposes the complete amount to assistive technology. Investment cards and limits use the existing precise currency formatter. The modal supports initial focus, keyboard containment, Escape, focus restoration, and disabled dismissal during submission.

The original routes, API adapter contracts, financial calculations, eligibility rule, cumulative 90% limit, filters, and CSV export remain in place. The decorative leaf outlines are original CSS and SVG, with no third-party imagery or chart data.

Investment cards show the available balance and maximum withdrawal in a compact layout. Withdrawal tables use **Date**, **Investment**, and **Amount**, with right-aligned negative amounts such as `-R20,000`. Investment-specific tables omit the Investment column. Mobile rows use the same signed amounts with vertically centred content. CSV statements use the same three columns and negative amounts. API withdrawal amounts remain positive; the presentation and statement export apply the debit sign.

The **How withdrawals work** panel shows the withdrawal rules: retirement withdrawals require age greater than 65, withdrawals cannot exceed the available balance, and withdrawals cannot exceed 90% of the balance. Account status and pending totals are internal data; investor-facing lists focus on the date, investment, and deduction.

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

The Playwright suite runs desktop and mobile browser projects against the existing HTTP adapter, with isolated responses matching its contract. It covers balance refresh after a fractional withdrawal, financial validation boundaries, retirement eligibility, exhausted limits, request failure and retry, loading controls, keyboard focus, history filters, date validation, empty results, CSV export and export errors, recovery from loading errors, and page overflow at 320, 768, 1024, and 1280px.

Browser fixtures do not contact a live investment backend or submit real withdrawal requests. The normal development server continues to use the existing API environment configuration; the test server uses port 4029 and a separate build directory.


## Previews

[Desktop portfolio](previews/rosewood-porcelain/portfolio-desktop.png) · [Investment details](previews/rosewood-porcelain/investment-details-desktop.png) · [Withdrawal form](previews/rosewood-porcelain/withdrawal-desktop.png) · [Withdrawal history](previews/rosewood-porcelain/history-desktop.png)

[Mobile portfolio](previews/rosewood-porcelain/portfolio-mobile.png) · [Mobile investment details](previews/rosewood-porcelain/investment-details-mobile.png) · [Mobile withdrawal form](previews/rosewood-porcelain/withdrawal-mobile.png) · [Mobile withdrawal history](previews/rosewood-porcelain/history-mobile.png)
