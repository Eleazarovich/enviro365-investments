> Historical verification record. Browser commands and test counts below describe
> earlier suites; use the root README for the current consolidated workflow.

# Docker deployment

## Architecture

The Next.js App Router pages render static shells. Portfolio, withdrawals and CSV
data are fetched by the browser through the existing HTTP adapter. Investment IDs
are client-side query parameters inside a Suspense boundary; there are no server
actions, request-time server data, cookies, middleware or dynamic path segments.
The dashboard alias also exports its existing redirect. The application therefore
supports static export without a Node.js runtime. Images use their original files;
Geist is downloaded during the build and served locally with the exported assets.

The root Dockerfile uses three stages: Node.js 24 with `npm ci`, Java 21 with the
checked-in Maven wrapper, and an Alpine Java 21 JRE. Exported files are copied into
Spring Boot's static resources **before** `./mvnw verify` packages the executable
JAR. Image digests, the Maven wrapper and npm lockfile pin build inputs. The final
image runs as UID/GID 10001 and includes an HTTP health check. Spring Boot serves
HTML, JavaScript, CSS, fonts and `/api/**` on one port. Explicit mappings forward
known page URLs to their own exported HTML. Trailing-slash URLs redirect to their
canonical paths with query parameters preserved, matching Next.js behavior;
there is no catch-all forwarding rule for API requests or missing assets. Unknown
browser pages retain the exported not-found screen with HTTP 404; API errors keep
their existing JSON responses even when the browser asks for HTML.

## Build and run

From the repository root, with Docker running:

```sh
docker build -t enviro365:local .
docker run -d --name enviro365 -p 8080:8080 \
  --mount source=enviro365-data,target=/app/data enviro365:local
docker logs -f enviro365
```

Open http://localhost:8080. No environment variables are required.
Alternatively, Compose builds the same single container and manages its volume:

```sh
docker compose up --build -d
docker compose logs -f app
docker compose down
```

Compose accepts `PORT` for the host port and `SERVER_PORT` for the container port:
`PORT=8090 SERVER_PORT=9090 docker compose up --build -d` serves http://localhost:8090.
With `docker run`, use `-e SERVER_PORT=9090 -p 8090:9090` for the same result.
The health check follows `SERVER_PORT`.

The existing Spring configuration also accepts `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `SEED_ENABLED` and `CORS_ALLOWED_ORIGINS` at runtime via `docker run -e`
or a Compose override. No database settings or credentials are changed by the image.
Same-origin hosting does not require CORS configuration. Frontend API calls always
use relative `/api` URLs in this image, with the mock adapter disabled. These
`NEXT_PUBLIC_*` settings are compiled during the build and cannot be changed by
setting them on a running container. Local Next.js development keeps its existing
API origin configuration.

## H2 storage

The existing file-backed URL `jdbc:h2:file:./data/enviro365` resolves under `/app`.
Use a named volume at `/app/data`; it survives container replacement and
`docker compose down`. Compose uses `h2-data` (prefixed with the Compose project
name). An empty database is seeded once with investor 1, two investments and nine
withdrawal records. Existing data is never reset by seeding. `docker compose down -v`
deletes the volume and its data. Local `backend/data` and `.env` files are excluded
from the build context. Bind mounts must be writable by UID/GID 10001.

## Tests

Every Docker build runs frontend types, lint, static export checks and the backend
test suite. To run the existing checks outside Docker:

```sh
cd backend && ./mvnw verify
cd ../frontend
npm ci
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The current browser suite starts disposable Spring Boot/H2 and Next.js servers
itself. No separate container browser configuration or Docker fixture reset is needed.

## Deployment limits

Use one application instance per H2 file volume. This setup does not provide a
shared multi-instance database or add authentication, TLS termination or payment
processing. Those existing application boundaries remain unchanged. Future
Next.js features that require a server need a deployment review. Builds need
network access to the container registries, npm, Maven Central and Google Fonts.
Update pinned base-image digests deliberately to receive runtime security updates.
Serve the production export through Spring Boot; `next start` (`npm run serve`)
does not serve an exported build. `npm run dev` remains available for development.

## Verified on 30 October 2026

- Built and ran the complete Linux/amd64 Docker image, including clean npm
  installation, frontend type checking/lint/export and all **57 backend tests**.
  Lint reports the existing `AppIcon`/`AppImage` warnings; there are no lint errors.
- Passed all **56 existing frontend browser tests** and **8 container browser tests**
  across desktop and mobile. The container tests cover portfolio data from Spring
  Boot, valid and invalid withdrawals, balance updates, stale-balance errors,
  history, combined product/date CSV filters and browser downloads.
- Checked direct navigation, refresh, the dashboard alias, query parameter
  preservation and canonical trailing-slash redirects. All requested JavaScript,
  CSS, fonts and images loaded, with no browser errors. Unknown browser pages keep
  the existing not-found screen; missing APIs/assets return HTTP 404 and API errors
  remain JSON, including requests accepting HTML.
- Confirmed the runtime uses Java 21 as UID/GID 10001, has writable H2 storage and
  an unwritable application JAR, contains no Node/npm/Maven/Java compiler, and
  becomes healthy. Replacing a container with another listening on **9091** retained
  all **12 test notices**, balances and limits in the named volume.
- Verified Compose `down`/`up` keeps those records and balances. Changed both the
  host and application ports to **8082:9090**; the application and health check
  continued to work against the same volume.
- Reviewed final container logs: no unexpected errors or warnings.

Verification used Docker Desktop's Windows CLI from WSL. The Windows host address
was used for browser access from this distro; normal desktop access is through
`localhost`. WSL-to-Windows environment overrides require forwarding variables
through `WSLENV` when using `docker.exe`; native `docker` and Docker Compose use
the commands above directly.
