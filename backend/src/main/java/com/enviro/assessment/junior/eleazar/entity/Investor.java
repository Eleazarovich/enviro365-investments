package com.enviro.assessment.junior.eleazar.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Investor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    @Column(nullable = false)
    private LocalDate investorSince;

    protected Investor() {}

    public Investor(String name, LocalDate dateOfBirth, LocalDate investorSince) {
        this.name = name;
        this.dateOfBirth = dateOfBirth;
        this.investorSince = investorSince;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public LocalDate getInvestorSince() { return investorSince; }
}
