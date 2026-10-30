#!/usr/bin/env bash
set -euo pipefail

repository=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repository"
command -v java >/dev/null || { echo 'Java 21 JDK is required.' >&2; exit 1; }
command -v javac >/dev/null || { echo 'Java 21 JDK (including javac) is required.' >&2; exit 1; }
java_version=$(java -version 2>&1)
[[ "$java_version" =~ version\ \"21\. ]] || { echo 'Use a Java 21 JDK.' >&2; exit 1; }
docker info >/dev/null
docker compose version

# A unique project and image allow separate runs without touching development data.
run_directory=$(mktemp -d "${TMPDIR:-/tmp}/enviro365-it-XXXXXXXX")
export COMPOSE_PROJECT_NAME
COMPOSE_PROJECT_NAME="$(basename "$run_directory" | tr '[:upper:]' '[:lower:]')"
compose=(docker compose -p "$COMPOSE_PROJECT_NAME" -f "$repository/compose.yaml" -f "$repository/compose.integration.yaml")
reports="$repository/backend/target/docker-it/$COMPOSE_PROJECT_NAME"
mkdir -p "$reports"
printf '%s\n' "$COMPOSE_PROJECT_NAME" > "$reports/project.txt"
tests_started=false

cleanup() {
    result=$?
    trap - EXIT INT TERM
    if "$tests_started" && [ -d "$repository/backend/target/failsafe-reports" ]; then
        cp -R "$repository/backend/target/failsafe-reports" "$reports/" || true
    fi
    "${compose[@]}" logs --no-color > "$reports/application.log" 2>&1 || true
    if (( result != 0 )); then
        printf '\nIntegration workflow failed (exit %s). Application log tail:\n' "$result" >&2
        tail -n 100 "$reports/application.log" >&2
    fi
    if ! "${compose[@]}" down --volumes --remove-orphans --rmi all --timeout 15; then
        echo "Cleanup failed. Run: docker compose -p $COMPOSE_PROJECT_NAME -f compose.yaml -f compose.integration.yaml down --volumes --remove-orphans --rmi all" >&2
        result=1
    fi
    rm -rf -- "$run_directory"
    printf '\nReports: %s\n' "$reports"
    exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Validate the merged configuration, including support for !override, before building.
"${compose[@]}" config --quiet
"${compose[@]}" build app 2>&1 | tee "$reports/build.log"
"${compose[@]}" up --detach --wait --wait-timeout 120 app
address=$("${compose[@]}" port app 8080)
[[ "$address" =~ ^127\.0\.0\.1:[0-9]+$ ]] || { echo "Unexpected test address: $address" >&2; exit 1; }

cd backend
# Keep reports from aborted/earlier runs out of this run's result snapshot.
rm -rf -- target/failsafe-reports
tests_started=true
# The existing Dockerfile already verifies unit/context tests when inputs change.
# Compile the HTTP tests and run Failsafe without repeating that suite on the host.
./mvnw -B -ntp -Pdocker-it test-compile failsafe:integration-test failsafe:verify \
    "-Dit.baseUrl=http://$address" \
    "-Dit.composeProject=$COMPOSE_PROJECT_NAME" \
    "-Dit.orderSeed=${IT_ORDER_SEED:-365}" 2>&1 | tee "$reports/maven.log"
