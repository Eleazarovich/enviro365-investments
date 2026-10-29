# Enviro365 Investments — Frontend Specification

## Project overview

Build a modern, responsive investor portfolio and withdrawal management application.

The application allows an investor to:

1. View their overall portfolio and investment products.
2. View the details of an individual investment.
3. Submit a withdrawal request from an investment product.
4. Review their withdrawal history.
5. Filter withdrawal records and download CSV statements.

The application must feel like polished, production-quality financial software: simple, trustworthy, fast, intuitive, and fully functional.

**Important:** Implement the defined functionality exceptionally well. Do not invent additional financial products or features.

## Technology

- React with TypeScript.
- Tailwind CSS.
- shadcn/ui components where suitable.
- Lucide icons.
- Responsive layouts.
- Modular, reusable components.
- A separate API service layer to support later integration with a Java Spring Boot REST backend.

Use mock data initially, but structure the application so that mock services can be replaced with real REST API calls without rewriting the UI.

The frontend phase is complete. The backend implementation phase uses Java 21,
Spring Boot 4.1 and H2 in `backend/`; see its [README](../backend/README.md).

## Visual design direction

Create a premium, modern, minimalist financial application.

### Design characteristics

- Light, neutral background with white or subtly elevated surfaces.
- Dark, highly readable typography.
- Restrained rosewood accents with porcelain backgrounds and white surfaces, following the [design system](design-system.md).
- Clear information hierarchy and generous, purposeful whitespace.
- Beautiful but understated investment cards.
- Subtle borders, restrained shadows, and consistent spacing.
- Clean, professional tables and form controls.
- Smooth, subtle interactions.
- Responsive desktop, tablet, and mobile layouts.
- Appropriate loading, empty, error, and confirmation states.

Use Geist typography and the existing Enviro365 brand mark.

Avoid oversized headings, excessive gradients, glassmorphism, decorative charts, unnecessary animations, large stock illustrations, or generic AI-generated dashboard clutter.

Do not imitate an existing investment platform's exact branding or interface.

The design should feel like financial software built for real users, not a marketing landing page.

## Product language

Use simple, familiar terms throughout the interface.

Preferred labels:

- Portfolio
- Investment details
- Withdrawals
- Total available balance
- Your investments
- Available balance
- Withdraw money
- Amount
- Maximum you can withdraw
- Download statement
- Date
- Investment

Avoid internal terminology such as:

- Ledger balance
- Withdrawal notice entity
- Transaction orchestration
- Fund allocation workflow
- Portfolio liquidity exposure

Internal code may use precise technical terms, but the interface must use language ordinary investors understand.

Do not introduce deposits, fees, interest calculations, investment performance metrics, or other functionality outside this specification.

## Navigation and application structure

Use a clean and minimal navigation system.

Primary sections:

- Portfolio
- Withdrawals

Individual investments should be accessible from the portfolio dashboard through their cards.

The withdrawal form should be available from the relevant investment detail view.

Use clear navigation back to the portfolio.

Do not include login, registration, profile editing, settings, notifications, administrative controls, or product creation.

---

## Screen 1 — Portfolio dashboard

### Purpose

Give the investor an immediate understanding of their available portfolio balance and individual investments.

### Layout

At the top:

- Application identity: Enviro365 Investments.
- Main heading: "Portfolio value".
- A prominent total available balance across all investment products.
- Balance label: "Total available balance", without a repeated supporting explanation.

Below:

- Section heading: "Your investments".
- A responsive collection of investment product cards.

### Investment cards

Each investment card should display:

- Product name.
- Product type, such as Standard investment or Retirement.
- Current available balance.
- A clear action: "View investment".

Example products:

- Cash Investment.
- Retirement Investment.

Use fictional demonstration data. Do not use real investment provider branding.

### Interaction

Selecting an investment card opens its individual details.

The total available balance must be calculated consistently from the displayed available balances of the investment products.

No performance charts, return projections, interest figures, deposits, or fee summaries.

---

## Screen 2 — Individual investment details

### Purpose

Show details of a selected investment and provide an easy way to withdraw money.

### Content

- Back navigation to Portfolio.
- Investment name.
- Product type.
- Available balance, prominently displayed.
- Maximum amount the investor can currently withdraw.
- Primary button: "Withdraw money".
- A section showing withdrawal history for this specific investment.

Keep the layout simple, well spaced, and visually consistent with the dashboard.
Use the investment name as the page heading without a separate "Your investment" label.
Show the current maximum beside the withdrawal action; omit the separate withdrawal-limit meter.

### Withdrawal history preview

Display existing withdrawal records for this investment, including:

- Date.
- Amount, shown as a negative deduction with cents preserved.

Keep notice status internal; investment-specific lists omit the Investment column.

If no withdrawals exist, display:
"You haven't made any withdrawals from this investment yet."

Do not create a separate complex transaction-detail screen.

---

## Withdrawal form

### Entry point

The investor selects "Withdraw money" from an investment detail view.

The form may be presented in a dedicated focused view, dialog, or side panel, depending on which produces the clearest responsive experience.

### Information displayed

- Selected investment.
- Available balance.
- Maximum permitted withdrawal.
- Amount input.
- Submit button: "Confirm withdrawal".

The selected investment must already be known from the investment detail view.
Format the amount with comma-separated thousands as the investor types, allow up to two
decimal places, and complete the cents on blur (for example, `80000` becomes `80,000.00`).
Preserve the caret during edits and reject invalid input without changing the requested amount.

### Validation

Validate that:

- An amount is entered.
- The amount is greater than zero.
- The amount is a valid monetary amount with no more than two decimal places.
- The amount meets the API-provided R100 minimum.
- The amount does not exceed the available balance.
- The amount does not exceed the maximum permitted withdrawal.
- Retirement withdrawals are only available to eligible investors.

The backend will remain the final authority for business validation. Do not trust or allow the user to change their age or the investment's retirement classification through the form.

### Feedback

Provide inline, understandable errors.

Examples:

- "Enter an amount to withdraw."
- "Enter an amount greater than R0."
- "You can withdraw up to R70,000 from this investment."
- "Minimum withdrawal is R100."
- "Retirement withdrawals are only available to investors older than 65."
- "We couldn't submit your withdrawal. Please try again."

Do not simply display "Invalid request".

### Submission behavior

- Disable duplicate submissions while processing.
- Show a clear loading state.
- Send the request through the API service.
- On success, show confirmation.
- Refresh the investment balance and withdrawal history using the updated data.
- If the balance refresh fails after an accepted request, preserve the success confirmation and updated history, replace outdated balance figures with a retry state, and prevent another withdrawal until the balance refresh succeeds. Retrying the balance must not resubmit the withdrawal.
- On failure, retain the entered amount and show an understandable error.

### Success confirmation

Title:
"Withdrawal submitted successfully"

Show the investment name and signed withdrawal amount with a "Done" button.
Update the balance and history in the background without a balance-update message.

Do not claim the money has arrived in a bank account.

No EFT selection, bank account details, withdrawal charges, or payment arrival estimates.

---

## Screen 3 — Withdrawal history

### Purpose

Allow the investor to review withdrawals across their portfolio and download a filtered CSV statement.

### Layout

Heading: "Withdrawals", shown once in the top bar.

Display a clean, readable table containing:

- Date.
- Investment.
- Amount, shown as a negative deduction with cents preserved.

Keep status labels and pending totals out of the investor-facing table.

Sort by most recent first.

### Filters

Provide:

- Investment product filter, with an "All investments" option.
- Start date.
- End date.
- A clear way to reset filters.

Filters should be easy to understand and should apply consistently to displayed results and CSV downloads.
Only the latest filter request may update the results, error, or loading state.
Hide results from previous filters while the current selection loads, and enable
statement download only after results for that selection have loaded successfully.

### CSV download

Provide a clearly visible button:
"Download statement"

Place the button above the withdrawal filters.

When activated, request a CSV file using the current filters.

The downloaded statement should contain:

- Date.
- Investment.
- Amount, as a negative numeric deduction with two decimal places.

The CSV uses the same three columns as the history table. API amounts remain positive
and notice status remains internal.

Use a descriptive filename, such as:
`withdrawal-statement-2026-10-28.csv`

The actual filename can be supplied by the backend.

### States

Handle:

- Records available.
- No withdrawals yet.
- No records matching the selected filters.
- Data loading.
- Failed data loading.
- CSV download failure.

Do not add PDF downloads or complex reporting features.

---

## Financial behavior

These rules reflect the selected implementation design and must remain consistent with the Spring Boot backend.

Apply a cumulative 90% cap per product against its underlying balance, with a R100
minimum and no final-balance exception. See [business rules](business-rules.md) for
the calculations and worked examples.

1. Each investment product has its own balance and withdrawal limits.
2. A withdrawal must be greater than zero.
3. The investor cannot withdraw more than their available balance.
4. Active submitted notices share a cumulative 90% cap per product. Available funds equal the underlying balance less active reservations. The remaining cap equals 90% of the underlying balance, rounded down to cents, less active reservations. Calculate both from the underlying balance so reservations are subtracted exactly once.
5. Retirement-product withdrawals are permitted only if the investor is older than 65.
6. A successful withdrawal request creates a notice with status `SUBMITTED`.
7. The requested amount is immediately excluded from the investor's available balance.
8. Submitting a withdrawal is not equivalent to completing a bank payment.
9. Invalid submissions must not change the available balance or create successful notices.
10. Withdrawals must be at least R100 and may include cents above that minimum. If the rounded percentage maximum is below R100, return a maximum of R0 and disable withdrawals. Keep the actual remaining balance visible; do not waive the 90% rule to clear it.

The Spring Boot backend enforces these rules. The frontend displays the server-provided available balance and maximum withdrawal amount instead of maintaining its own authoritative financial calculations.

Do not create artificial fees, returns, or interest calculations.

---

## Mock data and interaction behavior

Provide a single demonstration investor with at least two investment products.

Use internally consistent fictional data, for example:

**Cash Investment**

- Recorded investment balance: R100,000.
- Existing submitted withdrawal: R20,000.
- Available balance: R80,000.
- Maximum additional withdrawal: R70,000 (90% of R100,000 less R20,000 reserved).
- After requesting R70,000: R10,000 available, with a new maximum of R0.
- Minimum withdrawal: R100.

**Retirement Investment**

- Recorded investment balance: R60,000.
- No existing pending withdrawals; historical records remain available in history.
- Available balance: R60,000.
- Maximum withdrawal: R54,000.
- After requesting R54,000: R6,000 available, with a new maximum of R5,400.
- Minimum withdrawal: R100.
- Demonstration investor age: above 65.

**Portfolio**

- Total available: R140,000.

These are demonstration figures, not financial information from a real investor.

In mock mode, interactions must actually work:

- Portfolio and product data must remain synchronized.
- Valid requests create history records.
- Available balances update correctly.
- Invalid requests do not modify data.
- Filters change the displayed records.
- CSV downloads contain the filtered mock records.
- Navigation and responsive views work.

Keep the mock implementation separate from the visual components. Make it replaceable by the real API service.

Do not present mock actions as genuine bank transactions.

---

## Spring Boot API integration contract

Use a dedicated API client. Suggested endpoints:

`GET /api/investors/1/portfolio`

Returns the investor, portfolio summary, and investment products.

Each product should expose:

- id
- name
- type
- availableBalance
- minimumWithdrawable (R100 under the current policy)
- maximumWithdrawable (remaining cumulative 90% cap after active reservations; R0 when below the minimum)

`GET /api/investors/1/withdrawal-notices`

Supports optional filters:

- productId
- fromDate
- toDate

`POST /api/investors/1/withdrawal-notices`

Request:

```json
{
  "productId": 1,
  "amount": 20000.00
}
```

Success:

- HTTP 201.
- Returns the created withdrawal notice.

`GET /api/investors/1/withdrawal-notices/export`

Supports the same filters and returns a downloadable CSV.

These implemented API contracts remain in one configurable service layer and are defined in [openapi.yaml](../openapi.yaml).

Handle HTTP errors consistently, including validation errors, missing resources, and unexpected failures.

Do not hardcode API URLs into UI components.

---

## Frontend quality expectations

- All navigation must work.
- All required views must display correctly.
- All buttons must perform their intended actions.
- All forms must have proper labels.
- Money must be formatted consistently in South African rand.
- Dates must be readable and consistent.
- Inputs must support keyboard interaction.
- Focus indicators must be visible.
- Colours must provide good contrast.
- Desktop, tablet, and mobile layouts must be usable.
- Loading states and error states must be implemented.
- Do not rely on placeholder functionality or dead buttons.
- Avoid duplicate components and unnecessary abstraction.
- Use clear component names and a maintainable directory structure.

## Deliverable

Produce a functional, polished React frontend with realistic mock data, working interactions, reusable components, and a clean API integration layer.

Prioritize usability, correctness, consistency, restrained visual design, and maintainability over unnecessary features.

**The final result should feel simple to use, even though the underlying financial behavior is carefully designed.**
