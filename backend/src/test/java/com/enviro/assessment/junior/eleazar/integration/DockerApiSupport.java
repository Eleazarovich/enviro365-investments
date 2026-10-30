package com.enviro.assessment.junior.eleazar.integration;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

/** All application operations use real HTTP. Fixture resets alone use H2's
 * bundled CLI inside the managed container; no reset API or host DB port exists. */
@Execution(ExecutionMode.SAME_THREAD)
abstract class DockerApiSupport {
    static final JsonMapper JSON = JsonMapper.builder().enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS).build();
    static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
            .version(HttpClient.Version.HTTP_1_1).build();
    static volatile String baseUrl = System.getProperty("it.baseUrl", "");
    static final String PROJECT = System.getProperty("it.composeProject", "");
    static final String DATABASE = "jdbc:h2:file:/app/data/integration;AUTO_SERVER=TRUE;LOCK_TIMEOUT=10000";
    static final Path ROOT = Path.of(System.getProperty("it.repository", "..")).toAbsolutePath().normalize();
    static OpenApiContract contract;

    @BeforeAll
    static void verifyManagedTestEnvironment() throws Exception {
        assertThat(PROJECT).as("Run make test-integration to create an isolated environment")
                .matches("enviro365-it-[a-z0-9-]+");
        assertThat(baseUrl).matches("http://127\\.0\\.0\\.1:[0-9]+");
        String id = compose("ps", "-q", "app").trim();
        assertThat(id).isNotBlank();
        JsonNode container = JSON.readTree(command(List.of("docker", "inspect", id))).get(0);
        assertThat(container.at("/Config/Labels/com.docker.compose.project").asString()).isEqualTo(PROJECT);
        assertThat(container.at("/Config/Image").asString()).isEqualTo(PROJECT + ":app");
        List<String> environment = container.at("/Config/Env").valueStream().map(JsonNode::asString).toList();
        assertThat(environment).contains("DB_URL=" + DATABASE,
                "SEED_ENABLED=false", "SPRING_SQL_INIT_DATA_LOCATIONS=file:/test/seed.sql");
        // Docker's short tmpfs syntax is recorded in HostConfig, not Mounts.
        assertThat(container.at("/HostConfig/Tmpfs").path("/app/data").asString(""))
                .contains("uid=10001", "gid=10001", "mode=0700");
        refreshAddress();
        contract = new OpenApiContract(ROOT.resolve("openapi.yaml"));
    }

    @BeforeEach
    void resetDatabase(TestInfo test) throws Exception {
        System.out.println("Docker scenario: " + test.getDisplayName());
        // Keep Spring running. The private H2 CLI connects to the application's
        // database via AUTO_SERVER and replaces only this disposable fixture.
        // IFEXISTS prevents a mistyped path from creating a different database.
        compose("exec", "-T", "app", "java", "-cp", "/tmp/h2.jar", "org.h2.tools.RunScript",
                "-url", DATABASE + ";IFEXISTS=TRUE", "-user", "sa", "-script", "/test/seed.sql");
        awaitSeed();
    }

    private void awaitSeed() throws Exception {
        long deadline = System.nanoTime() + Duration.ofSeconds(90).toNanos();
        String lastFailure = "No response";
        while (System.nanoTime() < deadline) {
            try {
                var response = raw("GET", "/api/investors/1/portfolio", null, "application/json");
                if (response.statusCode() == 200) {
                    JsonNode portfolio = JSON.readTree(response.body());
                    if (portfolio.path("investor").path("name").asString("").equals("Docker Investor")) {
                        assertThat(portfolio.path("totalAvailable").decimalValue()).isEqualByComparingTo("144222.24");
                        return;
                    }
                }
                lastFailure = response.statusCode() + ": " + response.body();
            } catch (IOException e) {
                lastFailure = e.toString();
            }
            TimeUnit.MILLISECONDS.sleep(200); // Readiness polling, never an assumed startup delay.
        }
        fail("Docker API did not become ready: %s%n%s", lastFailure, compose("logs", "--tail", "80", "app"));
    }

    private static void refreshAddress() throws Exception {
        String address = compose("port", "app", "8080").trim();
        assertThat(address).as("Managed test service must remain bound to loopback").matches("127\\.0\\.0\\.1:[0-9]+");
        baseUrl = "http://" + address;
    }

    static String compose(String... arguments) throws Exception {
        var invocation = new ArrayList<>(List.of("docker", "compose", "-p", PROJECT,
                "-f", ROOT.resolve("compose.yaml").toString(), "-f", ROOT.resolve("compose.integration.yaml").toString()));
        invocation.addAll(List.of(arguments));
        return command(invocation);
    }

    private static String command(List<String> invocation) throws Exception {
        Path output = Files.createTempFile("enviro365-it-command-", ".log");
        try {
            Process process = new ProcessBuilder(invocation).directory(ROOT.toFile()).redirectErrorStream(true)
                    .redirectOutput(output.toFile()).start();
            if (!process.waitFor(60, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                throw new AssertionError("Docker command timed out: " + invocation);
            }
            String result = Files.readString(output);
            assertThat(process.exitValue()).as("%s%n%s", invocation, result).isZero();
            return result;
        } finally {
            Files.deleteIfExists(output);
        }
    }

    static String path(long investor) { return "/api/investors/" + investor + "/withdrawal-notices"; }
    static HttpResponse<String> raw(String method, String path, String body, String contentType) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(baseUrl + path)).timeout(Duration.ofSeconds(20))
                .header("Accept", "*/*");
        if (body != null) request.header("Content-Type", contentType);
        return HTTP.send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8)).build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    static JsonNode request(String method, String path, String body, int status) throws Exception {
        var response = raw(method, path, body, "application/json");
        assertThat(response.statusCode()).as("%s %s%n%s", method, path, response.body()).isEqualTo(status);
        JsonNode json = JSON.readTree(response.body());
        contract.response(method, path, status, response.headers().firstValue("Content-Type").orElse(""), json);
        if (status >= 400) assertSafeError(json);
        return json;
    }

    static JsonNode get(String path) throws Exception { return request("GET", path, null, 200); }
    static JsonNode portfolio(long investor) throws Exception { return get("/api/investors/" + investor + "/portfolio"); }
    static JsonNode history(long investor) throws Exception { return get(path(investor)); }
    static JsonNode product(JsonNode portfolio, long id) {
        return portfolio.path("products").valueStream().filter(p -> p.path("id").asLong() == id).findFirst().orElseThrow();
    }
    static JsonNode create(long investor, long product, String amount, int status) throws Exception {
        return request("POST", path(investor), "{\"productId\":" + product + ",\"amount\":" + amount + "}", status);
    }
    static void money(JsonNode object, String field, String expected) {
        assertThat(object.path(field).isNumber()).as(field).isTrue();
        assertThat(object.path(field).decimalValue()).as(field).isEqualByComparingTo(expected);
    }
    static void assertSafeError(JsonNode json) {
        contract.error(json);
        assertThat(json.path("message").asString()).isNotBlank();
        assertThat(json.propertyNames()).containsExactly("message");
        assertThat(json.toString()).doesNotContain("stackTrace", "java.lang", "org.hibernate", "org.h2",
                "jdbc:", "SQL", "insert into", "integration_simulated_failure", "Exception");
    }
    static void unchanged(long investor, JsonNode beforePortfolio, JsonNode beforeHistory) throws Exception {
        assertThat(portfolio(investor)).isEqualTo(beforePortfolio);
        assertThat(history(investor)).isEqualTo(beforeHistory);
    }
    static BigDecimal sum(JsonNode records, String field) {
        return records.valueStream().map(r -> r.path(field).decimalValue()).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
