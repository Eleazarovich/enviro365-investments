package com.enviro.assessment.junior.eleazar.entity;

import jakarta.persistence.*;

@Entity
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investor_id", nullable = false, unique = true)
    private Investor investor;

    protected Portfolio() {}

    public Portfolio(Investor investor) { this.investor = investor; }

    public Long getId() { return id; }
    public Investor getInvestor() { return investor; }
}
