# syntax=docker/dockerfile:1

FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# These are build-time values. Always use the real, same-origin Spring Boot API.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL="" \
    NEXT_PUBLIC_USE_MOCK_API=false
RUN npm run type-check && npm run lint && npm run build \
    && test -s out/index.html \
    && test -s out/investment-detail.html \
    && test -s out/withdrawal-history.html \
    && test -s out/portfolio-dashboard.html

FROM eclipse-temurin:21-jdk-alpine@sha256:b78a1d385da875588e21207f07dddf9a1418849971ae857fb24c8f3a7d441a72 AS backend-build
WORKDIR /build/backend
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn/ .mvn/
RUN chmod +x mvnw && ./mvnw -B -ntp dependency:go-offline
COPY backend/src/ src/
# Copy the export BEFORE Maven packages resources into the executable JAR.
COPY --from=frontend-build /build/frontend/out/ src/main/resources/static/
RUN ./mvnw -B -ntp verify && cp target/enviro365-*.jar /build/app.jar

FROM eclipse-temurin:21-jre-alpine@sha256:82cf3d9ccbe1ed46252008d51b2f2329e6b9e8a2f4394c4bebefc3ea7f4b1372 AS runtime
WORKDIR /app
RUN addgroup -S -g 10001 app && adduser -S -D -H -u 10001 -G app app \
    && mkdir /app/data && chown app:app /app/data
COPY --from=backend-build --chown=root:root /build/app.jar /app/app.jar
ENV SERVER_PORT=8080
USER 10001:10001
VOLUME ["/app/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${SERVER_PORT}/" || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
