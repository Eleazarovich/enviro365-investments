package com.enviro.assessment.junior.eleazar.dto;

import java.time.LocalDate;

public record InvestorResponse(Long id, String name, int age, LocalDate investorSince) {}
