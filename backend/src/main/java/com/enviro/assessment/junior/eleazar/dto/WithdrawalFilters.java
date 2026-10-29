package com.enviro.assessment.junior.eleazar.dto;

import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

public record WithdrawalFilters(
        @Positive(message = "Select a valid investment.") Long productId,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {}
