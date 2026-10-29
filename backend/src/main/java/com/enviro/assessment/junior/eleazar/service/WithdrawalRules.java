package com.enviro.assessment.junior.eleazar.service;

import com.enviro.assessment.junior.eleazar.entity.*;
import com.enviro.assessment.junior.eleazar.exception.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;

@Service
public class WithdrawalRules {
    public static final BigDecimal MINIMUM = new BigDecimal("100.00");
    private static final BigDecimal RATE = new BigDecimal("0.90");
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private final Clock clock;

    public WithdrawalRules(Clock clock) { this.clock = clock; }

    public int age(Investor investor) {
        return Period.between(investor.getDateOfBirth(), LocalDate.now(clock)).getYears();
    }

    public BigDecimal available(BigDecimal balance, BigDecimal reserved) {
        return balance.subtract(reserved).max(ZERO);
    }

    public BigDecimal maximum(BigDecimal balance, BigDecimal reserved) {
        // The cumulative cap is based on the underlying balance, never on the
        // already-reduced available balance. Subtract reservations exactly once.
        BigDecimal remainingCap = balance.multiply(RATE).setScale(2, RoundingMode.DOWN).subtract(reserved);
        BigDecimal maximum = remainingCap.min(available(balance, reserved)).max(ZERO);
        return maximum.compareTo(MINIMUM) < 0 ? ZERO : maximum;
    }

    public void validate(InvestmentProduct product, Investor investor, BigDecimal reserved, BigDecimal amount) {
        // Service validation is deliberate: non-HTTP callers cannot bypass the rules.
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidRequestException("Enter an amount greater than R0.");
        }
        if (amount.scale() > 2 || amount.precision() - amount.scale() > 17) {
            throw new InvalidRequestException("Enter an amount with no more than two decimal places and at most 17 whole digits.");
        }
        if (amount.compareTo(MINIMUM) < 0) {
            throw new InvalidRequestException("Minimum withdrawal is R100.");
        }
        if (product.getType() == ProductType.RETIREMENT && age(investor) <= 65) {
            throw new WithdrawalRejectedException("Retirement withdrawals are only available to investors older than 65.");
        }
        if (amount.compareTo(available(product.getBalance(), reserved)) > 0) {
            throw new WithdrawalRejectedException("Your available balance for this investment is " + rand(available(product.getBalance(), reserved)) + ".");
        }
        BigDecimal maximum = maximum(product.getBalance(), reserved);
        if (amount.compareTo(maximum) > 0) {
            throw new WithdrawalRejectedException("You can withdraw up to " + rand(maximum) + " from this investment.");
        }
    }

    private String rand(BigDecimal amount) {
        return "R" + String.format(java.util.Locale.UK, "%,.2f", amount);
    }
}
