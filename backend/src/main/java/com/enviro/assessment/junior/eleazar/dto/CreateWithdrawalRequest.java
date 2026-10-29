package com.enviro.assessment.junior.eleazar.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateWithdrawalRequest(
        @NotNull(message = "Select an investment.")
        @Positive(message = "Select a valid investment.") Long productId,
        @NotNull(message = "Enter an amount to withdraw.")
        @DecimalMin(value = "0", inclusive = false, message = "Enter an amount greater than R0.")
        @Digits(integer = 17, fraction = 2, message = "Enter an amount with no more than two decimal places and at most 17 whole digits.")
        BigDecimal amount) {}
