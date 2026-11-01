# Enviro365 Investments — agent instructions

These instructions apply throughout this repository. Build the investor portfolio and
withdrawal application using the agreed technologies, preserve the user's design decisions,
and make regular local commits as work is completed.

## Read before working

- Read [`_docs/SPEC.md`](_docs/SPEC.md) for scope, workflows, financial behaviour, and the
  API contract; [`_docs/TASKS.md`](_docs/TASKS.md) for implementation and delivery
  requirements; and [`_docs/design-system.md`](_docs/design-system.md) for current UI decisions.
- Inspect `README.md`, the relevant source and dependency manifests, `git status --short`,
  and recent Git history before editing. Follow established patterns and inspect relevant
  commits when a decision needs context.
- Follow the latest explicit user instructions and use the current design system for copy
  and visuals. Preserve mandatory technical and business requirements; surface conflicts.
- Update the appropriate document when requirements, API contracts, setup, or lasting
  design decisions change. Keep this file focused on durable working agreements.

## Scope

- Deliver portfolio retrieval, persisted withdrawal notices with correct balances,
  withdrawal history, and filtered CSV exports. The final UI must call the real backend.
- Implement at least three of: global exception handling, DTOs, input validation, unit tests,
  and UI validation. Cover all five where practical and record what is actually verified.
- Keep the implementation understandable enough for the user to review and explain.
  Explain significant design assumptions and add useful comments around non-obvious logic.
- The frontend calls the Spring Boot backend. Do not add login, deposits, fees, interest,
  investment performance, payment processing, or unrelated infrastructure without a task
  that calls for it.

## Technology and versions

| Area                   | Required direction                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend language       | **Java 21 LTS.** Target Java 21 for compilation, runtime, CI, and containers. Use stable Java 21 updates; do not raise the major version or enable preview features.                                             |
| Backend framework      | **Spring Boot 4.x**, version **4.1.2 or a newer stable 4.x release** compatible with Java 21. Use REST APIs and keep business rules in a service layer. **Do not use Spring Boot 3.x.**                          |
| Database               | **H2**. Persist notices in the backend; the frontend always calls the real HTTP API.                                                                                                                        |
| Java packages          | Follow `com.enviro.assessment.junior.yourname`, replacing `yourname` with the developer's name when scaffolding.                                                                                                 |
| Frontend               | Continue the existing **Next.js App Router, React, and TypeScript** application in `frontend/`.                                                                                                                  |
| Styling and components | **Tailwind CSS**, existing shared UI components, and **Lucide** icons. Use shadcn/ui where suitable; reuse existing controls before adding a library.                                                            |
| Tooling and checks     | Use the existing npm scripts and Playwright suite. When scaffolding the backend, default to Maven with the Maven Wrapper and Spring Boot's test support unless an existing build establishes another convention. |

- When introducing or deliberately upgrading technology, verify the **latest stable,
  mutually compatible versions** in official release documentation. Keep Spring Boot on
  **4.x** and Java on **21**. Exclude snapshots, milestones, release candidates, and other
  prereleases.
- Preserve declared versions during unrelated work. Treat dependency upgrades as explicit,
  coherent changes, record the versions chosen, and run the affected checks. Use exact
  versions or the project's dependency-management mechanism for reproducible builds.
- Do not implement the business backend in Next.js API routes or substitute another
  language, framework, or database for Java 21, Spring Boot 4, and H2.

## Repository and integration conventions

- Keep the application in `frontend/`, the Java application in `backend/`, and specifications,
  checklists, and design references in `_docs/`. Inspect the backend build configuration
  before assuming a runnable backend or build wrapper exists.
- UI code uses the adapter exported by `frontend/src/lib/api/index.ts`. Keep HTTP calls,
  endpoint construction, and HTTP error handling in `frontend/src/lib/api/`; share data
  contracts through `frontend/src/lib/types.ts`.
- Configure integration with `NEXT_PUBLIC_API_BASE_URL`. Keep API URLs out of visual
  components. Never put secrets in `NEXT_PUBLIC_*` variables or commits.
- Preserve the proposed `/api/investors/{investorId}/portfolio` and
  `/api/investors/{investorId}/withdrawal-notices` contracts, including POST creation and
  `/withdrawal-notices/export`. History and CSV use the same `productId`, `fromDate`, and
  `toDate` filters. Coordinate any contract changes across backend, adapters, types, and tests.
- Use request/response DTOs, server-side validation, consistent HTTP errors, and centralized
  exception handling when implementing the backend. Keep database entities out of the API.

## Financial correctness

- The backend is authoritative for eligibility, available balances, and maximum withdrawals.
  Frontend validation provides immediate feedback and must also display backend errors.
- Retirement withdrawals require **age greater than 65**; an investor aged exactly 65 is
  ineligible. Amounts must be positive, have at most two decimal places, and stay within
  both the available balance and the permitted 90% maximum.
- Apply the **cumulative per-product 90% cap** for both cash and retirement products.
  Normal withdrawals have a **R100 minimum** and may include cents. Use the
  backend-provided limits in the frontend:

  ```text
  available = max(0, recorded balance - active submitted reservations)
  minimum = 100.00
  remainingCap = floorToCents(recorded balance * 0.9) - active submitted reservations
  candidate = max(0, min(available, remainingCap))
  maximum = candidate >= minimum ? candidate : 0
  ```

- Round the maximum **down** to cents. If the percentage maximum is below R100, disable
  withdrawals and retain the actual balance. There is no final-cent or full-remainder
  exception. A balance of R111.12 permits R100; R111.11 permits no withdrawal.
- Use `BigDecimal` and suitable decimal storage for Java money calculations; handle cents
  deliberately across the API. Verify boundaries, fractional amounts, and repeated requests.
- A valid request creates a notice and immediately reduces the available balance. Invalid
  requests must leave data unchanged. Persist the notice and balance effect atomically;
  concurrent requests must not overdraw or bypass the cumulative limit or minimum.
- API withdrawal amounts remain positive and notices retain their internal `SUBMITTED`
  status. User-facing tables and CSV statements show deductions with a negative sign.
  A submitted notice does not mean a bank payment has completed.

## User preferences to preserve

- Keep the **Rosewood & Porcelain** identity, Geist typography, existing brand mark, restrained
  surfaces, and neutral financial amounts. Use the shared tokens and components documented
  in `_docs/design-system.md`.
- Use plain investor language: **Portfolio**, **Investment details**, **Withdrawals**, and
  **Download statement**. Avoid repeated headings, redundant explanatory text, internal
  terminology, and excessive whitespace. Keep layouts usable on desktop, tablet, and mobile.
- Write READMEs for external reviewers, focused on project requirements. Use a Mermaid
  architecture diagram, four core desktop screenshots with investor-friendly labels, and
  consolidated documentation links. Keep personal review reminders in the working checklist.
- Withdrawal lists and CSV use **Date, Investment, Amount**, with signed deductions; omit
  Investment in investment-specific lists. Keep status labels and pending totals out of the
  investor-facing lists while retaining the internal data needed for correctness.
- Keep **Download statement** above the withdrawal filters. Use the investment name as the
  detail page heading, **Standard investment** for `GENERAL`,
  maximum withdrawal beside the action, and no separate withdrawal-limit meter.
- Format money in South African rand and preserve cents. Amount entry groups thousands,
  allows two decimal places, completes cents on blur, and preserves cursor editing.
- Preserve keyboard access, visible focus, dialog focus management, and useful loading,
  empty, error, retry, and confirmation states. Keep Rocket branding injections removed
  and the Next.js development indicator hidden.

## Verification and documentation

- Run checks appropriate to the change. For frontend code changes, run from `frontend/`:

  ```sh
  npm run type-check
  npm run lint
  npm run build
  ```

- For UI, withdrawal, filter, export, or API integration changes, also run
  `npm run test:e2e` from `frontend/`. If Chromium is missing, install it with
  `npx playwright install chromium`. Playwright uses port 4029 and `.next-e2e`;
  normal development uses `npm run dev` on port 4028.
- Production builds enforce TypeScript and ESLint checks. Separate checks remain
  useful for fast feedback.
- The Playwright suite calls a disposable Spring Boot/H2 backend on port 8081.
  When integrating, test real API calls, stored records, errors, balance refresh, and filtered
  CSV downloads as well. Run backend tests with the checked-in wrapper once it exists
  (for Maven, `./mvnw test` from `backend/`).
- Test financial boundaries and failure behaviour meaningfully. Documentation-only edits
  need document/link review and `git diff --check`; they do not need application test runs.
- Update `_docs/TASKS.md` only for completed, verified requirements. Maintain the root
  `README.md` with startup instructions, API documentation, screenshots, and an honest
  AI-use disclosure. The GitHub repository must include backend and frontend.

## Regular commits and handoff

- **Make regular local commits without waiting to be reminded.** Commit each coherent,
  verified unit of work and commit the completed task before the final handoff. On longer
  tasks, create useful milestone commits instead of collecting everything into one commit.
- Inspect the working tree and staged diff first. Stage only changes belonging to the
  current task; preserve unrelated or concurrent work. Avoid `git add .` in a dirty tree.
  Never revert someone else's changes to make checks pass.
- Use short, descriptive commit messages in plain project language, such as
  `Update project README`. Include relevant documentation and test changes together.
  Never claim failing or unrun checks passed;
  report blockers and any deliberately committed work in progress clearly.
- State project behaviour and requirements directly in documentation and commit messages.
  Describe the change itself without attributing requirements to external correspondence
  or source documents. Keep the AI-use disclosure accurate.
- Local commits are authorized by this working agreement. Push or publish only when the
  user has requested it or existing session authorization covers it. Avoid history rewrites
  unless specifically authorized.
- In the final handoff, briefly state what changed, what was verified, any remaining issue,
  and the commit hash. Keep status updates and explanations clear and concise.
