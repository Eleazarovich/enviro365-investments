package com.enviro.assessment.junior.eleazar.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(check = @CheckConstraint(constraint = "balance >= 0"))
public class InvestmentProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;
    @Column(nullable = false)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductType type;
    // Underlying recorded investment balance. Creating a notice reserves funds;
    // it never executes a payment or mutates this balance.
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    protected InvestmentProduct() {}

    public InvestmentProduct(Portfolio portfolio, String name, ProductType type, BigDecimal balance) {
        this.portfolio = portfolio;
        this.name = name;
        this.type = type;
        this.balance = balance;
    }

    public Long getId() { return id; }
    public Portfolio getPortfolio() { return portfolio; }
    public String getName() { return name; }
    public ProductType getType() { return type; }
    public BigDecimal getBalance() { return balance; }
}
