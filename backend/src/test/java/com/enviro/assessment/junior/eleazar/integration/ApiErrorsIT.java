package com.enviro.assessment.junior.eleazar.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ApiErrorsIT extends DockerApiSupport {
    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"productId\":1}", "{\"productId\":1,\"amount\":null}", "{\"amount\":100}",
            "{\"productId\":null,\"amount\":100}", "{\"productId\":0,\"amount\":100}",
            "{\"productId\":-1,\"amount\":100}", "{\"productId\":1.5,\"amount\":100}",
            "{\"productId\":\"1\",\"amount\":100}", "{\"productId\":1,\"amount\":\"100\"}",
            "{\"productId\":1,\"amount\":true}", "{\"productId\":1,\"amount\":\"oops\"}", "null", "{", "[]", ""})
    void malformedOrMissingRequestFieldsReturn400AndLeaveStateUnchanged(String json) throws Exception {
        var before = portfolio(1);
        var records = history(1);
        request("POST", path(1), json, 400);
        unchanged(1, before, records);
    }

    @ParameterizedTest
    @ValueSource(strings = {"?fromDate=2026-10-30&toDate=2026-10-01", "?fromDate=invalid",
            "?toDate=2026-02-30", "?productId=abc", "?productId=-1", "?productId=0", "?productId=1.5"})
    void bothHistoryAndCsvRejectInvalidFilters(String query) throws Exception {
        var before = portfolio(1);
        var records = history(1);
        request("GET", path(1) + query, null, 400);
        request("GET", path(1) + "/export" + query, null, 400);
        unchanged(1, before, records);
    }

    @Test
    void missingInvestorsAndProductsAndForeignOwnershipReturnAppropriateResponses() throws Exception {
        var before = portfolio(1);
        var records = history(1);
        var other = portfolio(2);
        var otherHistory = history(2);
        for (String suffix : List.of("/portfolio", "/withdrawal-notices", "/withdrawal-notices/export")) {
            var error = request("GET", "/api/investors/999999" + suffix, null, 404);
            assertThat(error.path("message").asString()).contains("investor");
        }
        create(999999, 1, "100", 404);
        create(1, 999999, "100", 404);
        create(1, 20, "100", 404);
        create(2, 1, "100", 404);
        assertThat(get(path(1) + "?productId=20").isEmpty()).isTrue();
        assertThat(get(path(2) + "?productId=1").isEmpty()).isTrue();
        assertThat(HistoryExportIT.export(1, "?productId=20")).isEqualTo("Date,Investment,Amount");
        unchanged(1, before, records);
        unchanged(2, other, otherHistory);
    }

    @Test
    void invalidIdentifiersUnsupportedMethodsContentTypesAndUnknownApiRoutesHaveSafeErrors() throws Exception {
        var before = portfolio(1);
        var records = history(1);
        for (String id : List.of("0", "-1", "abc", "1.5")) {
            for (String suffix : List.of("/portfolio", "/withdrawal-notices", "/withdrawal-notices/export")) {
                request("GET", "/api/investors/" + id + suffix, null, 400);
            }
        }
        var unsupported = raw("DELETE", path(1), null, "application/json");
        assertThat(unsupported.statusCode()).isEqualTo(405);
        assertThat(unsupported.headers().firstValue("Allow").orElseThrow()).contains("GET", "POST");
        assertSafeError(JSON.readTree(unsupported.body()));
        var media = raw("POST", path(1), "productId=1&amount=100", "text/plain");
        assertThat(media.statusCode()).isEqualTo(415);
        assertSafeError(JSON.readTree(media.body()));
        var missing = raw("GET", "/api/missing", null, "application/json");
        assertThat(missing.statusCode()).isEqualTo(404);
        assertSafeError(JSON.readTree(missing.body()));
        unchanged(1, before, records);
    }

    @Test
    void actualDatabaseFailureReturnsSafe500AndRollsBackReservation() throws Exception {
        var before = portfolio(1);
        var records = history(1);
        var error = create(1, 90, "100.25", 500);
        assertThat(error.path("message").asString()).isEqualTo("Please try again. Your request could not be completed.");
        unchanged(1, before, records);
        assertThat(get(path(1) + "?productId=90").isEmpty()).isTrue();
        // Confirm this was the intended real database failure, not an unrelated 500.
        assertThat(compose("logs", "--tail", "200", "app").toLowerCase(java.util.Locale.ROOT))
                .contains("integration_simulated_failure");
        create(1, 1, "100.25", 201);
        money(product(portfolio(1), 1), "availableBalance", "79899.75");
        assertThat(history(1).size()).isEqualTo(records.size() + 1);
    }
}
