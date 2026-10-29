package com.enviro.assessment.junior.eleazar.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(indexes = @Index(name = "idx_notice_product_time", columnList = "product_id,submitted_at"),
        check = @CheckConstraint(constraint = "amount > 0"))
public class WithdrawalNotice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private InvestmentProduct product;
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WithdrawalStatus status;
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;
    // Kept internal: historical notices can remain visible after their reservation
    // is no longer active. No API changes reservation state.
    @Column(nullable = false)
    private boolean active;

    protected WithdrawalNotice() {}

    public WithdrawalNotice(InvestmentProduct product, BigDecimal amount, Instant submittedAt, boolean active) {
        this.product = product;
        this.amount = amount;
        this.submittedAt = submittedAt;
        this.status = WithdrawalStatus.SUBMITTED;
        this.active = active;
    }

    public Long getId() { return id; }
    public InvestmentProduct getProduct() { return product; }
    public BigDecimal getAmount() { return amount; }
    public WithdrawalStatus getStatus() { return status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public boolean isActive() { return active; }
}
