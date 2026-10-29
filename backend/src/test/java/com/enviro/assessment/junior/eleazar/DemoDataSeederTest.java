package com.enviro.assessment.junior.eleazar;

import com.enviro.assessment.junior.eleazar.config.DemoDataSeeder;
import com.enviro.assessment.junior.eleazar.dto.WithdrawalFilters;
import com.enviro.assessment.junior.eleazar.repository.*;
import com.enviro.assessment.junior.eleazar.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import static org.assertj.core.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DemoDataSeederTest {
    private ConfigurableApplicationContext context;
    @Autowired DemoDataSeeder seeder;
    @Autowired InvestorRepository investors;
    @Autowired WithdrawalNoticeRepository notices;
    @Autowired PortfolioService portfolios;
    @Autowired WithdrawalService withdrawals;

    @BeforeAll
    void startApplication() {
        context = new SpringApplicationBuilder(Enviro365Application.class).web(WebApplicationType.NONE).run(
                "--spring.datasource.url=jdbc:h2:mem:seed-test;DB_CLOSE_DELAY=-1",
                "--spring.jpa.hibernate.ddl-auto=create-drop", "--app.seed-enabled=true");
        context.getAutowireCapableBeanFactory().autowireBean(this);
    }

    @AfterAll
    void stopApplication() { if (context != null) context.close(); }

    @Test
    void seedsRealisticPortfolioOnceAndDoesNotResetExistingData() {
        var portfolio = portfolios.getPortfolio(1L);
        assertThat(portfolio.totalAvailable()).isEqualByComparingTo("140000");
        assertThat(portfolio.products()).hasSize(2);
        assertThat(portfolio.products().getFirst().maximumWithdrawable()).isEqualByComparingTo("70000");
        assertThat(withdrawals.history(1L, new WithdrawalFilters(null, null, null))).hasSize(9);
        seeder.run(new DefaultApplicationArguments(new String[0]));
        assertThat(investors.count()).isEqualTo(1);
        assertThat(notices.count()).isEqualTo(9);
        assertThat(portfolios.getPortfolio(1L)).isEqualTo(portfolio);
    }
}
