package com.enviro.assessment.junior.eleazar.service;

import com.enviro.assessment.junior.eleazar.dto.*;
import com.enviro.assessment.junior.eleazar.entity.WithdrawalNotice;
import com.enviro.assessment.junior.eleazar.exception.*;
import com.enviro.assessment.junior.eleazar.repository.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.math.RoundingMode;
import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class WithdrawalService {
    private final InvestorRepository investors;
    private final InvestmentProductRepository products;
    private final WithdrawalNoticeRepository notices;
    private final WithdrawalRules rules;
    private final Clock clock;

    public WithdrawalService(InvestorRepository investors, InvestmentProductRepository products,
            WithdrawalNoticeRepository notices, WithdrawalRules rules, Clock clock) {
        this.investors = investors;
        this.products = products;
        this.notices = notices;
        this.rules = rules;
        this.clock = clock;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public WithdrawalNoticeResponse create(Long investorId, CreateWithdrawalRequest request) {
        requireInvestor(investorId);
        var product = products.findForWithdrawal(investorId, request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("We couldn't find that investment."));
        var reserved = notices.sumActiveAmount(product.getId());
        rules.validate(product, product.getPortfolio().getInvestor(), reserved, request.amount());
        // The active notice IS the reservation. A single insert makes both durable
        // together; there is no duplicate counter or balance update to drift.
        var notice = notices.saveAndFlush(new WithdrawalNotice(product,
                request.amount().setScale(2, RoundingMode.UNNECESSARY), clock.instant(), true));
        return toResponse(notice);
    }

    @Transactional(readOnly = true)
    public List<WithdrawalNoticeResponse> history(Long investorId, WithdrawalFilters filters) {
        requireInvestor(investorId);
        validateFilters(filters);
        Specification<WithdrawalNotice> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("product").get("portfolio").get("investor").get("id"), investorId));
            if (filters.productId() != null) {
                predicates.add(cb.equal(root.get("product").get("id"), filters.productId()));
            }
            if (filters.fromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("submittedAt"), filters.fromDate().atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            if (filters.toDate() != null) {
                // Half-open timestamp range includes every instant of the final UTC day.
                predicates.add(cb.lessThan(root.get("submittedAt"), filters.toDate().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return notices.findAll(specification, Sort.by(Sort.Direction.DESC, "submittedAt", "id"))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CsvStatement export(Long investorId, WithdrawalFilters filters) {
        var rows = history(investorId, filters);
        StringBuilder csv = new StringBuilder("Date,Investment,Amount");
        for (var row : rows) {
            csv.append("\r\n").append(row.submittedAt().atOffset(ZoneOffset.UTC).toLocalDate())
                    .append(',').append(quote(row.productName())).append(',')
                    .append(row.amount().negate().setScale(2).toPlainString());
        }
        return new CsvStatement("withdrawal-statement-" + LocalDate.now(clock) + ".csv", csv.toString());
    }

    private void requireInvestor(Long investorId) {
        if (!investors.existsById(investorId)) {
            throw new ResourceNotFoundException("We couldn't find that investor.");
        }
    }

    private void validateFilters(WithdrawalFilters filters) {
        if (filters.productId() != null && filters.productId() <= 0) {
            throw new InvalidRequestException("Select a valid investment.");
        }
        if (filters.fromDate() != null && filters.toDate() != null && filters.fromDate().isAfter(filters.toDate())) {
            throw new InvalidRequestException("The start date must not be after the end date.");
        }
        if (filters.toDate() != null && filters.toDate().equals(LocalDate.MAX)) {
            throw new InvalidRequestException("Use a date in YYYY-MM-DD format.");
        }
    }

    private WithdrawalNoticeResponse toResponse(WithdrawalNotice n) {
        return new WithdrawalNoticeResponse(n.getId(), n.getProduct().getId(), n.getProduct().getName(),
                n.getAmount(), n.getStatus(), n.getSubmittedAt());
    }

    private String quote(String value) { return "\"" + value.replace("\"", "\"\"") + "\""; }
}
