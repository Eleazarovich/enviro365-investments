package com.enviro.assessment.junior.eleazar.service;

import com.enviro.assessment.junior.eleazar.dto.*;
import com.enviro.assessment.junior.eleazar.entity.Investor;
import com.enviro.assessment.junior.eleazar.exception.ResourceNotFoundException;
import com.enviro.assessment.junior.eleazar.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PortfolioService {
    private final InvestorRepository investors;
    private final InvestmentProductRepository products;
    private final WithdrawalNoticeRepository notices;
    private final WithdrawalRules rules;

    public PortfolioService(InvestorRepository investors, InvestmentProductRepository products,
                            WithdrawalNoticeRepository notices, WithdrawalRules rules) {
        this.investors = investors;
        this.products = products;
        this.notices = notices;
        this.rules = rules;
    }

    @Transactional(readOnly = true)
    public PortfolioResponse getPortfolio(Long investorId) {
        Investor investor = investors.findById(investorId)
                .orElseThrow(() -> new ResourceNotFoundException("We couldn't find that investor."));
        Map<Long, BigDecimal> totals = notices.activeTotals(investorId).stream().collect(
                Collectors.toMap(WithdrawalNoticeRepository.ReservationTotal::getProductId,
                        WithdrawalNoticeRepository.ReservationTotal::getAmount));
        var productResponses = products.findByPortfolioInvestorIdOrderByIdAsc(investorId).stream().map(p -> {
            BigDecimal reserved = totals.getOrDefault(p.getId(), new BigDecimal("0.00"));
            return new InvestmentProductResponse(p.getId(), p.getName(), p.getType(),
                    rules.available(p.getBalance(), reserved), WithdrawalRules.MINIMUM,
                    rules.maximum(p.getBalance(), reserved), reserved);
        }).toList();
        BigDecimal total = productResponses.stream().map(InvestmentProductResponse::availableBalance)
                .reduce(new BigDecimal("0.00"), BigDecimal::add);
        return new PortfolioResponse(new InvestorResponse(investor.getId(), investor.getName(),
                rules.age(investor), investor.getInvestorSince()), total, productResponses);
    }
}
