package com.enviro.assessment.junior.eleazar.integration;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class WithdrawalIT extends DockerApiSupport {
    @Test
    void submissionCreatesNoticeReservesFundsOnceAndAppearsInHistory() throws Exception {
        var before = portfolio(1);
        var beforeHistory = history(1);
        Instant earliest = Instant.now().minusSeconds(2);
        var created = create(1, 1, "1500.75", 201);
        assertThat(created.path("id").asLong()).isGreaterThan(0);
        assertThat(created.path("productId").asLong()).isEqualTo(1);
        assertThat(created.path("productName").asString()).isEqualTo("Cash Investment");
        money(created, "amount", "1500.75");
        assertThat(created.path("status").asString()).isEqualTo("SUBMITTED");
        assertThat(Instant.parse(created.path("submittedAt").asString()))
                .isBetween(earliest, Instant.now().plusSeconds(2));
        assertThat(created.propertyNames()).containsExactlyInAnyOrder("id", "productId", "productName", "amount", "status", "submittedAt");
        var after = portfolio(1);
        var cash = product(after, 1);
        money(cash, "availableBalance", "78499.25");
        money(cash, "pendingWithdrawals", "21500.75");
        money(cash, "maximumWithdrawable", "68499.25");
        // Available + reserved remains the recorded balance: submission is no bank payment.
        assertThat(cash.path("availableBalance").decimalValue().add(cash.path("pendingWithdrawals").decimalValue()))
                .isEqualByComparingTo("100000.00");
        assertThat(before.path("totalAvailable").decimalValue().subtract(after.path("totalAvailable").decimalValue()))
                .isEqualByComparingTo("1500.75");
        assertThat(product(after, 2)).isEqualTo(product(before, 2));
        var afterHistory = history(1);
        assertThat(afterHistory.size()).isEqualTo(beforeHistory.size() + 1);
        assertThat(afterHistory.values()).contains(created).containsAll(beforeHistory.values());
        // Repeated reads must never reserve the same notice again.
        assertThat(portfolio(1)).isEqualTo(after);
        assertThat(history(1)).isEqualTo(afterHistory);
    }

    @ParameterizedTest(name = "amount {0} returns HTTP {1} without state changes")
    @CsvSource({"0,400,greater than R0", "-1,400,greater than R0", "99.99,400,Minimum withdrawal",
            "100.001,400,two decimal places", "100.000,400,two decimal places",
            "80000.01,422,available balance", "70000.01,422,up to R70", "100000000000000000,400,17 whole digits"})
    void invalidAmountsDoNotChangeAnyStoredFinancialState(String amount, int status, String message) throws Exception {
        var before = portfolio(1);
        var records = history(1);
        var error = create(1, 1, amount, status);
        assertThat(error.path("message").asString()).contains(message);
        unchanged(1, before, records);
    }

    @ParameterizedTest
    @CsvSource({"1,70000.00,10000.00", "2,54000.00,6000.00", "4,100.00,11.12", "8,900.00,100.01"})
    void exactCumulativeLimitIsAcceptedAndTenPercentIsRetained(long id, String amount, String remainder) throws Exception {
        var created = create(1, id, amount, 201);
        money(created, "amount", amount);
        var after = portfolio(1);
        money(product(after, id), "availableBalance", remainder);
        money(product(after, id), "maximumWithdrawable", "0.00");
        var records = history(1);
        create(1, id, "100", 422);
        unchanged(1, after, records);
    }

    @Test
    void roundedCapBelowMinimumDoesNotPermitAnException() throws Exception {
        var before = portfolio(1);
        var records = history(1);
        money(product(before, 5), "availableBalance", "111.11");
        money(product(before, 5), "maximumWithdrawable", "0");
        create(1, 5, "100", 422);
        unchanged(1, before, records);
    }

    @ParameterizedTest
    @CsvSource({"64,422", "65,422", "66,201"})
    void retirementEligibilityComesFromStoredDateOfBirth(int age, int status) throws Exception {
        var before = portfolio(age);
        var records = history(age);
        assertThat(before.path("investor").path("age").asInt()).isEqualTo(age);
        var response = create(age, age, "100.25", status);
        if (status == 201) {
            assertThat(history(age).values()).containsExactly(response);
            money(product(portfolio(age), age), "availableBalance", "899.75");
        } else {
            assertThat(response.path("message").asString()).contains("older than 65");
            unchanged(age, before, records);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"\"age\":66", "\"dateOfBirth\":\"1950-01-01\"", "\"type\":\"GENERAL\"",
            "\"status\":\"SUBMITTED\"", "\"availableBalance\":1000000"})
    void clientCannotOverrideTrustedInvestorOrFinancialFields(String untrustedField) throws Exception {
        var before = portfolio(65);
        var records = history(65);
        request("POST", path(65), "{\"productId\":65,\"amount\":100," + untrustedField + "}", 400);
        create(65, 65, "100", 422);
        unchanged(65, before, records);
    }

    @ParameterizedTest
    @CsvSource({"1,40000.25,29999.75,10000.00", "2,30000.25,23999.75,6000.00"})
    void repeatedNoticesShareOneCapPerProduct(long id, String first, String second, String remainder) throws Exception {
        var before = portfolio(1);
        var records = history(1);
        create(1, id, first, 201);
        var intermediate = portfolio(1);
        assertThat(product(before, id).path("availableBalance").decimalValue()
                .subtract(product(intermediate, id).path("availableBalance").decimalValue())).isEqualByComparingTo(first);
        create(1, id, second, 201);
        var after = portfolio(1);
        money(product(after, id), "availableBalance", remainder);
        money(product(after, id), "maximumWithdrawable", "0");
        money(product(after, id), "pendingWithdrawals", id == 1 ? "90000" : "54000");
        assertThat(history(1).size()).isEqualTo(records.size() + 2);
        long otherProduct = id == 1 ? 2 : 1;
        assertThat(product(after, otherProduct)).isEqualTo(product(before, otherProduct));
        var afterRecords = history(1);
        create(1, id, "100", 422);
        unchanged(1, after, afterRecords);
    }

    @RepeatedTest(2)
    void simultaneousHttpRequestsCannotOverReserveFundsOrBypassCumulativeCap() throws Exception {
        int participants = 12;
        var ready = new CountDownLatch(participants);
        var start = new CountDownLatch(1);
        var recordsBefore = history(1);
        var before = portfolio(1);
        var responses = new ArrayList<java.net.http.HttpResponse<String>>();
        try (var executor = Executors.newFixedThreadPool(participants)) {
            var futures = IntStream.range(0, participants).mapToObj(i -> executor.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("Start barrier timed out");
                return raw("POST", path(1), "{\"productId\":7,\"amount\":100}", "application/json");
            })).toList();
            boolean allReady = ready.await(10, TimeUnit.SECONDS);
            start.countDown();
            assertThat(allReady).as("All clients reached the start barrier").isTrue();
            for (var future : futures) responses.add(future.get(30, TimeUnit.SECONDS));
        }
        assertThat(responses).filteredOn(r -> r.statusCode() == 201).hasSize(9);
        assertThat(responses).filteredOn(r -> r.statusCode() == 422).hasSize(3);
        var acceptedIds = new HashSet<Long>();
        for (var response : responses) {
            var json = JSON.readTree(response.body());
            contract.response("POST", path(1), response.statusCode(), response.headers().firstValue("Content-Type").orElseThrow(), json);
            if (response.statusCode() == 201) acceptedIds.add(json.path("id").asLong());
            else assertSafeError(json);
        }
        assertThat(acceptedIds).hasSize(9);
        var filtered = get(path(1) + "?productId=7");
        assertThat(filtered.valueStream().map(r -> r.path("id").asLong()).toList()).containsExactlyInAnyOrderElementsOf(acceptedIds);
        assertThat(sum(filtered, "amount")).isEqualByComparingTo("900");
        assertThat(history(1).size()).isEqualTo(recordsBefore.size() + 9);
        var after = portfolio(1);
        money(product(after, 7), "pendingWithdrawals", "900");
        money(product(after, 7), "availableBalance", "100");
        money(product(after, 7), "maximumWithdrawable", "0");
        assertThat(before.path("totalAvailable").decimalValue().subtract(after.path("totalAvailable").decimalValue()))
                .isEqualByComparingTo("900");
        var afterRecords = history(1);
        create(1, 7, "100", 422);
        unchanged(1, after, afterRecords);
    }
}
