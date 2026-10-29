package com.enviro.assessment.junior.eleazar.dto;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponse(InvestorResponse investor, BigDecimal totalAvailable,
                                List<InvestmentProductResponse> products) {}
