package com.enviro.assessment.junior.eleazar.controller;

import com.enviro.assessment.junior.eleazar.dto.PortfolioResponse;
import com.enviro.assessment.junior.eleazar.service.PortfolioService;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investors/{investorId}/portfolio")
public class PortfolioController {
    private final PortfolioService service;

    public PortfolioController(PortfolioService service) { this.service = service; }

    @GetMapping
    public PortfolioResponse get(@PathVariable @Positive Long investorId) {
        return service.getPortfolio(investorId);
    }
}
