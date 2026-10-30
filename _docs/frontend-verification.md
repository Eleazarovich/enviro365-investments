> Historical verification record. Browser commands and test counts below describe
> earlier suites; use the root README for the current consolidated workflow.

# Frontend verification — 29 October 2026

The frontend implements four UI features: portfolio
dashboard, withdrawal form, withdrawal history table and CSV download button. This
report covers the frontend phase using the real mock adapter and HTTP fixtures.

## Requirements verified

| Area | Verified behaviour |
| --- | --- |
| Portfolio | Investor and products, R140,000 demo total, individual investment navigation, and balance refresh after submission. |
| Withdrawal form | Grouped rand input, preserved cents and cursor editing, positive amounts, two-decimal validation, R100 minimum, available-balance and maximum checks, retirement eligibility, duplicate-click prevention, confirmation and failure retry. |
| Withdrawal history | Recent and investment-specific records, signed deductions, new requests, product/date filters, empty results, invalid date ranges, reset and error recovery. |
| CSV download | Download above filters; product and inclusive date filters reach the export adapter; matching records, Date/Investment/Amount columns, negative two-decimal amounts, filename and export-error retry. |
| Responsive and keyboard behaviour | Desktop and mobile test projects, overflow checks at 320/768/1024/1280px, dialog initial focus, Tab containment, Escape, focus restoration and locked submission. |

The mock financial tests cover retirement ages 64/65/66, repeated requests on both
products, downward cent rounding, R99.99/R100 and R111.11/R111.12 boundaries,
concurrent mock requests, and unchanged data after rejection. The R100 minimum and
per-request interpretation of 90% remain the user's decisions, as recorded in
[business rules](business-rules.md).

## Four review issues resolved

1. History ignores superseded successes and failures. Results from previous filters
   are hidden while the new selection loads; download stays disabled until current
   results are available. Regression tests delay Cash responses until after the
   Retirement response and verify that the table and CSV still agree.
2. A successful withdrawal followed by a failed balance refresh keeps its success
   confirmation and new history entry. Outdated balance and maximum figures are
   replaced by an error with retry. Another request is unavailable until refresh
   succeeds; retry performs no additional POST. The regression verifies R79,000
   available and R71,100 maximum after a single R1,000 request.
3. The dependency lockfile is committed and no longer ignored. A separate temporary
   frontend directory completed `npm ci`, type check, lint and production build
   using the existing dependency versions.
4. The specification and checklist now follow the current language and presentation
   decisions. Desktop and mobile previews were refreshed from the working frontend:
   R72,000 cash maximum, Standard investment, signed deductions, no visible status
   or pending totals, no separate limit meter, and download above filters.

## Check results

| Check | Result |
| --- | --- |
| `npm run type-check` | Passed |
| `npm run lint` | Passed with six existing warnings |
| `npm run build` | Passed |
| `npm run test:e2e` | 56 passed across desktop and mobile |
| Clean `npm ci`, type check, lint and build | Passed in a separate temporary directory |
| Current mock-mode screens | Portfolio, investment details, withdrawal dialog and history captured on desktop and mobile |

The six lint warnings are the existing `any` types in `AppIcon.tsx` and
`AppImage.tsx`, plus two image alt-text warnings in `AppImage.tsx`. They were kept
outside this task's four fixes.

Verification includes the earlier uncommitted UI changes present at the start of
this task. Those changes were preserved separately from the fixes. The frontend
service-layer contracts and financial policy were preserved. Mock notices remain
in memory and reset on a full reload; this report does not establish live API or
database integration.

See the [implementation checklist](TASKS.md), [specification](SPEC.md) and
[current design previews](design-system.md#previews).
