#!/usr/bin/env bash
set -euo pipefail

repository=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repository"
command -v node >/dev/null || { echo 'Node.js 24 and npm are required.' >&2; exit 1; }
command -v npm >/dev/null || { echo 'npm is required.' >&2; exit 1; }
docker info >/dev/null
docker compose version
test -x e2e/node_modules/.bin/playwright || {
    echo 'Install dependencies: npm --prefix e2e ci' >&2; exit 1;
}
npm --prefix e2e run type-check

run_directory=$(mktemp -d "${TMPDIR:-/tmp}/enviro365-e2e-XXXXXXXX")
export COMPOSE_PROJECT_NAME
COMPOSE_PROJECT_NAME="$(basename "$run_directory" | tr '[:upper:]' '[:lower:]')"
compose=(docker compose -p "$COMPOSE_PROJECT_NAME" -f "$repository/compose.yaml" -f "$repository/compose.integration.yaml" -f "$repository/e2e/compose.yaml")
reports="$repository/e2e/reports/$COMPOSE_PROJECT_NAME"
mkdir -p "$reports"
printf '%s\n' "$COMPOSE_PROJECT_NAME" > "$reports/project.txt"

cleanup() {
    result=$?
    trap - EXIT INT TERM
    "${compose[@]}" logs --no-color > "$reports/application.log" 2>&1 || true
    "${compose[@]}" ps --all > "$reports/containers.txt" 2>&1 || true
    if (( result != 0 )); then
        printf '\nE2E workflow failed (exit %s). Application log tail:\n' "$result" >&2
        tail -n 80 "$reports/application.log" >&2
    fi
    if ! "${compose[@]}" down --volumes --remove-orphans --rmi all --timeout 15; then
        echo "Cleanup failed for $COMPOSE_PROJECT_NAME; see e2e/testing.md." >&2
        result=1
    fi
    rm -rf -- "$run_directory"
    printf '\nReports and logs: %s\n' "$reports"
    exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

"${compose[@]}" config --quiet
"${compose[@]}" build app 2>&1 | tee "$reports/build.log"
"${compose[@]}" up --detach --wait --wait-timeout 120 app
address=$("${compose[@]}" port app 8080)
[[ "$address" =~ ^127\.0\.0\.1:[0-9]+$ ]] || { echo "Unexpected test address: $address" >&2; exit 1; }
export E2E_BASE_URL="http://$address"
export E2E_COMPOSE_PROJECT="$COMPOSE_PROJECT_NAME"
export E2E_OUTPUT_DIR="$reports/test-results"
export E2E_REPORT_DIR="$reports/playwright-report"
export E2E_JUNIT_FILE="$reports/results.xml"

cd e2e
# API and exported frontend share the Compose port. Poll both before launching tests.
node <<'NODE'
const { setTimeout: poll } = require('node:timers/promises');
(async () => {
    const deadline = Date.now() + 30_000;
    let failure;
    do {
        try {
            const api = await fetch(`${process.env.E2E_BASE_URL}/api/investors/1/portfolio`, { signal: AbortSignal.timeout(3000) });
            if (!api.ok || (await api.json()).investor.name !== 'E2E Investor') throw new Error('API fixture is not ready');
            const ui = await fetch(process.env.E2E_BASE_URL, { signal: AbortSignal.timeout(3000) });
            if (!ui.ok || !(await ui.text()).includes('Portfolio value')) throw new Error('Frontend export is not ready');
            console.log(`Full stack ready: ${process.env.E2E_BASE_URL}`);
            return;
        } catch (error) { failure = error; }
        await poll(250);
    } while (Date.now() < deadline);
    throw failure;
})().catch(error => { console.error(error); process.exitCode = 1; });
NODE
npm run test:browser -- "$@" 2>&1 | tee "$reports/playwright.log"
