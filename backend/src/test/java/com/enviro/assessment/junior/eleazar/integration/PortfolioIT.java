package com.enviro.assessment.junior.eleazar.integration;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PortfolioIT extends DockerApiSupport {
    @Test
    void portfolioContainsStoredInvestorProductsAndCorrectReservationBalances() throws Exception {
        var portfolio = portfolio(1);
        assertThat(portfolio.path("investor").path("id").asLong()).isEqualTo(1);
        assertThat(portfolio.path("investor").path("name").asString()).isEqualTo("Docker Investor");
        assertThat(portfolio.path("investor").path("age").asInt()).isEqualTo(66);
        assertThat(portfolio.path("investor").path("investorSince").asString()).isEqualTo("2026-04-01");
        assertThat(portfolio.path("products").size()).isEqualTo(9);
        var cash = product(portfolio, 1);
        assertThat(cash.path("name").asString()).isEqualTo("Cash Investment");
        assertThat(cash.path("type").asString()).isEqualTo("GENERAL");
        money(cash, "availableBalance", "80000.00");
        money(cash, "pendingWithdrawals", "20000.00");
        money(cash, "minimumWithdrawable", "100.00");
        money(cash, "maximumWithdrawable", "70000.00");
        var retirement = product(portfolio, 2);
        assertThat(retirement.path("name").asString()).isEqualTo("Retirement Investment");
        assertThat(retirement.path("type").asString()).isEqualTo("RETIREMENT");
        money(retirement, "availableBalance", "60000.00");
        money(retirement, "pendingWithdrawals", "0.00");
        money(retirement, "maximumWithdrawable", "54000.00");
        money(portfolio, "totalAvailable", "144222.24");
        assertThat(sum(portfolio.path("products"), "availableBalance"))
                .isEqualByComparingTo(portfolio.path("totalAvailable").decimalValue());
        assertThat(portfolio.toString()).doesNotContain("dateOfBirth", "portfolioId", "\"balance\"");
        // The inactive imported records remain visible without being reserved twice.
        assertThat(history(1).size()).isEqualTo(7);
    }

    @Test
    void emptyInvestmentRetainsZeroBalanceAndCannotBeWithdrawn() throws Exception {
        var before = portfolio(1);
        var records = history(1);
        money(product(before, 6), "availableBalance", "0.00");
        money(product(before, 6), "maximumWithdrawable", "0.00");
        create(1, 6, "100", 422);
        unchanged(1, before, records);
    }
}
