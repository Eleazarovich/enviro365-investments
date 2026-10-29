package com.enviro.assessment.junior.eleazar.dto;

import com.enviro.assessment.junior.eleazar.entity.ProductType;
import java.math.BigDecimal;

public record InvestmentProductResponse(Long id, String name, ProductType type,
        BigDecimal availableBalance, BigDecimal minimumWithdrawable,
        BigDecimal maximumWithdrawable, BigDecimal pendingWithdrawals) {}
