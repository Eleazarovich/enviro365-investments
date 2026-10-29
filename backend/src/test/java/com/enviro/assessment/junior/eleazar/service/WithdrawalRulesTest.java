package com.enviro.assessment.junior.eleazar.service;

import com.enviro.assessment.junior.eleazar.entity.*;
import com.enviro.assessment.junior.eleazar.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import java.math.BigDecimal;
import java.time.*;
import static org.assertj.core.api.Assertions.*;

class WithdrawalRulesTest {
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 29);
    private final WithdrawalRules rules = new WithdrawalRules(Clock.fixed(TODAY.atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC));

    @ParameterizedTest
    @CsvSource({"100000.00,20000.00,80000.00,70000.00", "1000,0,1000,900", "1000,800,200,100",
            "1000,900,100,0", "111.11,0,111.11,0", "111.12,0,111.12,100", "111.13,0,111.13,100.01",
            "1234.56,0,1234.56,1111.10", "0,0,0,0"})
    void computesAvailableAndCumulativeMaximum(String balance, String pending, String available, String maximum) {
        assertThat(rules.available(money(balance), money(pending))).isEqualByComparingTo(available);
        assertThat(rules.maximum(money(balance), money(pending))).isEqualByComparingTo(maximum);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "99.99", "100.001", "100000000000000000.00"})
    void rejectsInvalidAmountsInService(String amount) {
        var investor = investor(68);
        assertThatThrownBy(() -> rules.validate(product(investor, ProductType.GENERAL), investor, money("0"), money(amount)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {64, 65})
    void rejectsRetirementAt64And65ButAllowsGeneral(int age) {
        var investor = investor(age);
        assertThatThrownBy(() -> rules.validate(product(investor, ProductType.RETIREMENT), investor, money("0"), money("100")))
                .isInstanceOf(WithdrawalRejectedException.class).hasMessageContaining("older than 65");
        assertThatCode(() -> rules.validate(product(investor, ProductType.GENERAL), investor, money("0"), money("100")))
                .doesNotThrowAnyException();
    }

    @Test
    void allowsRetirementOn66thBirthdayAndUsesFullYears() {
        var investor = investor(66);
        assertThat(rules.age(investor)).isEqualTo(66);
        assertThatCode(() -> rules.validate(product(investor, ProductType.RETIREMENT), investor, money("0"), money("900")))
                .doesNotThrowAnyException();
        var birthdayTomorrow = new Investor("Demo", TODAY.minusYears(66).plusDays(1), TODAY.minusYears(1));
        assertThat(rules.age(birthdayTomorrow)).isEqualTo(65);
    }

    @Test
    void distinguishesAvailableBalanceFromCumulativeCap() {
        var investor = investor(68);
        var product = product(investor, ProductType.GENERAL);
        assertThatThrownBy(() -> rules.validate(product, investor, money("200"), money("800.01")))
                .hasMessageContaining("available balance");
        assertThatThrownBy(() -> rules.validate(product, investor, money("200"), money("700.01")))
                .hasMessageContaining("R700.00");
        assertThatCode(() -> rules.validate(product, investor, money("200"), money("700")))
                .doesNotThrowAnyException();
    }

    private Investor investor(int age) { return new Investor("Demo", TODAY.minusYears(age), TODAY.minusYears(1)); }
    private InvestmentProduct product(Investor investor, ProductType type) {
        return new InvestmentProduct(new Portfolio(investor), "Investment", type, money("1000.00"));
    }
    private BigDecimal money(String value) { return new BigDecimal(value); }
}
