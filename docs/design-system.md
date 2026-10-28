# Enviro365 interface

The existing portfolio and withdrawal workflows use a quieter investment identity: forest green, warm neutral surfaces, a small amount of leaf green, and a simplified vector version of the original leaf-and-capital mark. The reference at https://shadcn-fintech.vercel.app/dashboard informed the compact navigation, surface treatment, and information hierarchy.

## Visual rules

- **Colour:** forest `#182e24` anchors navigation and balance panels; leaf `#d5ed9b` marks the active destination and withdrawal action on dark surfaces. The page background is `#f7f8f4`. General and retirement investments use closely related sage and stone surfaces.
- **Type:** Geist, served through `next/font`, is used throughout. Page titles are 26–30px; investment balances are 32px; the principal balance scales from 40–56px. Amounts use tabular numerals. Small labels stay secondary to financial values.
- **Spacing:** use a 4px base, 20–24px between related panels, and 24–32px inside important surfaces. The desktop sidebar is 232px. Content is bounded on wide screens; screens below 1024px use the existing two-destination bottom navigation to leave room for financial information.
- **Surfaces:** 16px corners, subtle borders, and minimal shadows. Group related controls and information: history filters and results share a single surface. The existing withdrawal-limit meter is the only data visualisation.
- **Actions and fields:** primary actions use forest green; secondary actions use a neutral border; leaf green is reserved for actions on dark panels. Inputs share `.field` and `.field-label`, with visible focus and explicit validation messages.
- **States:** skeletons follow the eventual content shape. Errors offer the existing retry action. Withdrawal confirmation emphasises the submitted amount and explains that a request is not a bank payment. Motion respects reduced-motion preferences.

## Implementation

Colour channels and shared styles live in `src/styles/tailwind.css` and `tailwind.config.js`. Channel-based colours support Tailwind opacity modifiers consistently. Shared components include `BalanceAmount`, `Button`, `Badge`, `Select`, `Dialog`, and `WithdrawalTable`.

`BalanceAmount` displays actual decimal cents and exposes the complete amount to assistive technology. Investment cards and limits use the existing precise currency formatter. The modal supports initial focus, keyboard containment, Escape, focus restoration, and disabled dismissal during submission.

The original routes, API adapter contracts, financial calculations, eligibility rule, cumulative 90% limit, filters, and CSV export remain in place. The decorative leaf outlines are original CSS and SVG, with no third-party imagery or chart data.

## Verification

```sh
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The Playwright suite runs desktop and mobile browser projects against the existing HTTP adapter, with isolated responses matching its contract. It covers balance refresh after a fractional withdrawal, financial validation boundaries, retirement eligibility, exhausted limits, request failure and retry, loading controls, keyboard focus, history filters, date validation, empty results, CSV export and export errors, recovery from loading errors, and page overflow at 320, 768, 1024, and 1280px.

Browser fixtures do not contact a live investment backend or submit real withdrawal requests. The normal development server continues to use the existing API environment configuration; the test server uses port 4029 and a separate build directory.


## Previews

[Desktop portfolio](previews/portfolio-desktop.png) · [Mobile portfolio](previews/portfolio-mobile.png)
