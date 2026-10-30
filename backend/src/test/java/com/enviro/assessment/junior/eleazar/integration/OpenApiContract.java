package com.enviro.assessment.junior.eleazar.integration;

import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

/** Checks the schema vocabulary used by this repository's OpenAPI 3.2 contract.
 * This deliberately does not downgrade the contract to feed a 3.0-only validator. */
final class OpenApiContract {
    private final JsonNode document;

    OpenApiContract(Path specification) throws IOException {
        try (var input = Files.newInputStream(specification)) {
            Object yaml = new Yaml(new SafeConstructor(new LoaderOptions())).load(input);
            document = JsonMapper.builder().build().valueToTree(yaml);
        }
        assertThat(document.path("openapi").asString()).startsWith("3.2.");
    }

    void response(String method, String path, int status, String contentType, JsonNode body) {
        String template = path.split("\\?", 2)[0].replaceFirst("/investors/[^/]+", "/investors/{investorId}");
        JsonNode operation = document.path("paths").path(template).path(method.toLowerCase(Locale.ROOT));
        assertThat(operation.isObject()).as("Documented operation %s %s", method, template).isTrue();
        JsonNode responses = operation.path("responses");
        JsonNode response = resolve(responses.has(String.valueOf(status))
                ? responses.get(String.valueOf(status)) : responses.path("default"));
        assertThat(response.isObject()).as("Documented HTTP %s for %s %s", status, method, template).isTrue();
        String mediaType = contentType.split(";", 2)[0].trim();
        JsonNode media = response.path("content").path(mediaType);
        assertThat(media.isObject()).as("Documented Content-Type %s", contentType).isTrue();
        if (body != null) validate(media.path("schema"), body, "$response");
    }

    void error(JsonNode body) { validate(document.at("/components/schemas/ErrorResponse"), body, "$error"); }

    private JsonNode resolve(JsonNode node) {
        if (!node.has("$ref")) return node;
        String reference = node.get("$ref").asString();
        assertThat(reference).startsWith("#/");
        return resolve(document.at(reference.substring(1)));
    }

    private void validate(JsonNode original, JsonNode value, String path) {
        JsonNode schema = resolve(original);
        assertThat(schema.isObject()).as("Schema at %s", path).isTrue();
        for (JsonNode part : schema.path("allOf")) validate(part, value, path);
        if (schema.has("enum")) assertThat(schema.get("enum").values()).as(path).contains(value);
        if (!schema.has("type")) return;
        switch (schema.get("type").asString()) {
            case "object" -> {
                assertThat(value.isObject()).as(path).isTrue();
                for (JsonNode required : schema.path("required")) {
                    assertThat(value.hasNonNull(required.asString())).as("%s.%s is required", path, required.asString()).isTrue();
                }
                for (var field : value.properties()) {
                    if (schema.path("properties").has(field.getKey())) {
                        validate(schema.path("properties").get(field.getKey()), field.getValue(), path + "." + field.getKey());
                    } else if (schema.has("additionalProperties") && !schema.get("additionalProperties").asBoolean()) {
                        throw new AssertionError("Undocumented property " + path + "." + field.getKey());
                    }
                }
            }
            case "array" -> {
                assertThat(value.isArray()).as(path).isTrue();
                for (int i = 0; i < value.size(); i++) validate(schema.path("items"), value.get(i), path + "[" + i + "]");
            }
            case "string" -> {
                assertThat(value.isString()).as(path).isTrue();
                switch (schema.path("format").asString("")) {
                    case "date" -> LocalDate.parse(value.asString());
                    case "date-time" -> OffsetDateTime.parse(value.asString());
                    default -> { }
                }
            }
            case "integer", "number" -> {
                assertThat(value.isNumber()).as(path).isTrue();
                if (schema.get("type").asString().equals("integer")) assertThat(value.isIntegralNumber()).as(path).isTrue();
                BigDecimal number = value.decimalValue();
                if (schema.has("minimum")) assertThat(number).as(path).isGreaterThanOrEqualTo(schema.get("minimum").decimalValue());
                if (schema.has("maximum")) assertThat(number).as(path).isLessThanOrEqualTo(schema.get("maximum").decimalValue());
                if (schema.has("exclusiveMinimum")) assertThat(number).as(path).isGreaterThan(schema.get("exclusiveMinimum").decimalValue());
                if (schema.has("multipleOf")) assertThat(number.remainder(schema.get("multipleOf").decimalValue())).as(path).isEqualByComparingTo("0");
            }
            default -> throw new AssertionError("Unsupported schema type at " + path + ": " + schema);
        }
    }
}
