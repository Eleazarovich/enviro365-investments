package com.enviro.assessment.junior.eleazar;

import com.enviro.assessment.junior.eleazar.dto.*;
import com.enviro.assessment.junior.eleazar.repository.WithdrawalNoticeRepository;
import com.enviro.assessment.junior.eleazar.service.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import java.math.BigDecimal;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.*;

class FilePersistenceTest {
    @TempDir Path databaseDirectory;

    @Test
    void noticesAndReservationsSurviveRestartWithoutReseeding() {
        PortfolioResponse afterSubmission;
        Long noticeId;
        try (var first = start()) {
            var notice = first.getBean(WithdrawalService.class).create(1L,
                    new CreateWithdrawalRequest(1L, new BigDecimal("1500.75")));
            noticeId = notice.id();
            afterSubmission = first.getBean(PortfolioService.class).getPortfolio(1L);
        }
        try (var restarted = start()) {
            assertThat(restarted.getBean(PortfolioService.class).getPortfolio(1L)).isEqualTo(afterSubmission);
            var records = restarted.getBean(WithdrawalService.class).history(1L, new WithdrawalFilters(null, null, null));
            assertThat(records).hasSize(10);
            assertThat(records).anySatisfy(n -> {
                assertThat(n.id()).isEqualTo(noticeId);
                assertThat(n.amount()).isEqualByComparingTo("1500.75");
            });
            assertThat(restarted.getBean(WithdrawalNoticeRepository.class).sumActiveAmount(1L)).isEqualByComparingTo("21500.75");
        }
    }

    private ConfigurableApplicationContext start() {
        return new SpringApplicationBuilder(Enviro365Application.class).web(WebApplicationType.NONE).run(
                "--spring.datasource.url=jdbc:h2:file:" + databaseDirectory.resolve("investments") + ";DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=10000",
                "--spring.jpa.hibernate.ddl-auto=update", "--app.seed-enabled=true");
    }
}
