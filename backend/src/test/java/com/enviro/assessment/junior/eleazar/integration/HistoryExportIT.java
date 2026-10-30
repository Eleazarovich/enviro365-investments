package com.enviro.assessment.junior.eleazar.integration;

import org.apache.commons.csv.CSVFormat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.JsonNode;

import java.io.StringReader;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class HistoryExportIT extends DockerApiSupport {
    record Seed(long id, long product, String amount, String timestamp) {}
    static final Map<Long, Seed> SEEDS = Map.of(
            1001L, new Seed(1001, 1, "20000.00", "2026-10-21T09:12:00Z"),
            1002L, new Seed(1002, 1, "4500.00", "2026-09-30T23:59:59.999999Z"),
            1003L, new Seed(1003, 2, "7500.50", "2026-09-01T00:00:00Z"),
            1004L, new Seed(1004, 1, "1850.75", "2026-08-31T23:59:59.999999Z"),
            1005L, new Seed(1005, 2, "3200.00", "2026-10-01T00:00:00Z"),
            1006L, new Seed(1006, 1, "100.25", "2026-09-15T12:00:00Z"),
            1007L, new Seed(1007, 2, "200.50", "2026-09-15T12:00:00Z"));

    @ParameterizedTest(name = "history and CSV filters {0}")
    @CsvSource(value = {
            " |1001 1005 1002 1007 1006 1003 1004",
            "?productId=1|1001 1002 1006 1004",
            "?productId=2|1005 1007 1003",
            "?fromDate=2026-09-01|1001 1005 1002 1007 1006 1003",
            "?toDate=2026-09-30|1002 1007 1006 1003 1004",
            "?fromDate=2026-09-01&toDate=2026-09-30|1002 1007 1006 1003",
            "?fromDate=2026-09-01&toDate=2026-09-01|1003",
            "?fromDate=2026-09-30&toDate=2026-09-30|1002",
            "?fromDate=2026-09-15&toDate=2026-09-15|1007 1006",
            "?productId=1&fromDate=2026-09-01&toDate=2026-09-30|1002 1006",
            "?productId=2&fromDate=2026-09-01&toDate=2026-09-30|1007 1003",
            "?productId=999999| ", "?productId=20| ", "?fromDate=2030-01-01| ",
            "?productId=1&fromDate=2026-09-01&toDate=2026-09-01| "
    }, delimiter = '|', emptyValue = "")
    void historyAndCsvMatchIndependentSeedExpectations(String query, String expectedIds) throws Exception {
        query = query == null ? "" : query;
        List<Long> ids = expectedIds == null || expectedIds.isBlank() ? List.of()
                : Arrays.stream(expectedIds.split(" ")).map(Long::valueOf).toList();
        var history = get(path(1) + query);
        assertThat(history.valueStream().map(r -> r.path("id").asLong()).toList()).containsExactlyElementsOf(ids);
        for (JsonNode row : history) {
            var seed = SEEDS.get(row.path("id").asLong());
            assertThat(row.path("productId").asLong()).isEqualTo(seed.product());
            assertThat(row.path("productName").asString()).isEqualTo(name(seed.product()));
            money(row, "amount", seed.amount());
            assertThat(row.path("status").asString()).isEqualTo("SUBMITTED");
            assertThat(Instant.parse(row.path("submittedAt").asString())).isEqualTo(Instant.parse(seed.timestamp()));
            assertThat(row.propertyNames()).containsExactlyInAnyOrder("id", "productId", "productName", "amount", "status", "submittedAt");
        }

        String csv = export(1, query);
        assertThat(csv.replace("\r\n", "")).doesNotContain("\r", "\n");
        try (var parser = CSVFormat.RFC4180.builder().setHeader().setSkipHeaderRecord(true).get().parse(new StringReader(csv))) {
            assertThat(parser.getHeaderNames()).containsExactly("Date", "Investment", "Amount");
            var rows = parser.getRecords();
            assertThat(rows).hasSize(ids.size());
            for (int i = 0; i < ids.size(); i++) {
                var seed = SEEDS.get(ids.get(i));
                var row = rows.get(i);
                assertThat(row.size()).isEqualTo(3);
                assertThat(row.get("Date")).isEqualTo(Instant.parse(seed.timestamp()).atOffset(ZoneOffset.UTC).toLocalDate().toString());
                assertThat(row.get("Investment")).isEqualTo(name(seed.product()));
                assertThat(row.get("Amount")).isEqualTo("-" + seed.amount()).matches("-\\d+\\.\\d{2}");
                assertThat(new BigDecimal(row.get("Amount"))).isEqualByComparingTo(new BigDecimal(seed.amount()).negate());
            }
        }
        if (ids.isEmpty()) assertThat(csv).isEqualTo("Date,Investment,Amount");
    }

    @Test
    void csvEscapesUnicodeCommasQuotesAndEmbeddedNewlines() throws Exception {
        var created = create(1, 3, "123.45", 201);
        String date = Instant.parse(created.path("submittedAt").asString()).atOffset(ZoneOffset.UTC).toLocalDate().toString();
        String csv = export(1, "?productId=3&fromDate=" + date + "&toDate=" + date);
        assertThat(csv).isEqualTo("Date,Investment,Amount\r\n" + date + ",\"Cash, \"\"Réserve\"\"\nFund\",-123.45");
        try (var parser = CSVFormat.RFC4180.builder().setHeader().setSkipHeaderRecord(true).get().parse(new StringReader(csv))) {
            var rows = parser.getRecords();
            assertThat(rows).hasSize(1);
            assertThat(rows.getFirst().get("Investment")).isEqualTo("Cash, \"Réserve\"\nFund");
            assertThat(rows.getFirst().get("Amount")).isEqualTo("-123.45");
        }
        assertThat(get(path(1) + "?productId=3").values()).containsExactly(created);
    }

    @Test
    void investorWithNoNoticesReceivesEmptyHistoryAndHeaderOnlyCsv() throws Exception {
        assertThat(history(64).isEmpty()).isTrue();
        assertThat(export(64, "")).isEqualTo("Date,Investment,Amount");
    }

    private static String name(long product) { return product == 1 ? "Cash Investment" : "Retirement Investment"; }

    static String export(long investor, String query) throws Exception {
        var response = raw("GET", path(investor) + "/export" + query, null, "application/json");
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        String type = response.headers().firstValue("Content-Type").orElseThrow();
        assertThat(type).isEqualToIgnoringCase("text/csv;charset=UTF-8");
        contract.response("GET", path(investor) + "/export", 200, type, JSON.stringNode(response.body()));
        String disposition = response.headers().firstValue("Content-Disposition").orElseThrow();
        assertThat(disposition).matches("attachment; filename=\"withdrawal-statement-\\d{4}-\\d{2}-\\d{2}\\.csv\"");
        String date = disposition.substring(disposition.indexOf("withdrawal-statement-") + 21, disposition.length() - 5);
        LocalDate.parse(date);
        return response.body();
    }
}
