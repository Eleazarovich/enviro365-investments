package com.enviro.assessment.junior.eleazar.config;

import com.enviro.assessment.junior.eleazar.entity.*;
import com.enviro.assessment.junior.eleazar.repository.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;

@Component
@ConditionalOnProperty(name = "app.seed-enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataSeeder implements ApplicationRunner {
    private final InvestorRepository investors;
    private final PortfolioRepository portfolios;
    private final InvestmentProductRepository products;
    private final WithdrawalNoticeRepository notices;

    public DemoDataSeeder(InvestorRepository investors, PortfolioRepository portfolios,
                          InvestmentProductRepository products, WithdrawalNoticeRepository notices) {
        this.investors = investors;
        this.portfolios = portfolios;
        this.products = products;
        this.notices = notices;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (investors.count() != 0) return;
        var investor = investors.save(new Investor("Eleazarovich", LocalDate.of(1958, 10, 1), LocalDate.of(2026, 4, 1)));
        var portfolio = portfolios.save(new Portfolio(investor));
        var cash = products.save(new InvestmentProduct(portfolio, "Cash Investment", ProductType.GENERAL, new BigDecimal("100000.00")));
        var retirement = products.save(new InvestmentProduct(portfolio, "Retirement Investment", ProductType.RETIREMENT, new BigDecimal("60000.00")));
        seed(cash, "20000.00", "2026-10-21T09:12:00Z", true);
        // Inactive historical reservations are already reflected in the recorded
        // balances imported for this demo. Their records do not imply payments here.
        seed(cash, "4500.00", "2026-09-30T13:40:00Z", false);
        seed(retirement, "7500.50", "2026-09-12T08:05:00Z", false);
        seed(cash, "12000.00", "2026-08-26T15:22:00Z", false);
        seed(retirement, "3200.00", "2026-08-04T10:18:00Z", false);
        seed(cash, "1850.75", "2026-07-17T07:55:00Z", false);
        seed(retirement, "9000.00", "2026-06-23T12:30:00Z", false);
        seed(cash, "6000.00", "2026-05-14T14:02:00Z", false);
        seed(cash, "2750.00", "2026-04-02T09:47:00Z", false);
    }

    private void seed(InvestmentProduct product, String amount, String at, boolean active) {
        notices.save(new WithdrawalNotice(product, new BigDecimal(amount), Instant.parse(at), active));
    }
}
