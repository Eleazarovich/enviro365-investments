package com.enviro.assessment.junior.eleazar.dto;

import com.enviro.assessment.junior.eleazar.entity.WithdrawalStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record WithdrawalNoticeResponse(Long id, Long productId, String productName,
        BigDecimal amount, WithdrawalStatus status, Instant submittedAt) {}
