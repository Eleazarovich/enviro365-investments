package com.enviro.assessment.junior.eleazar.service;

import com.enviro.assessment.junior.eleazar.entity.*;
import com.enviro.assessment.junior.eleazar.exception.ResourceNotFoundException;
import com.enviro.assessment.junior.eleazar.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {
    @Mock InvestorRepository investors;
    @Mock InvestmentProductRepository products;
    @Mock WithdrawalNoticeRepository notices;

    @Test
    void mapsInvestorProductsReservationsAndCorrectTotal() {
        var investor = new Investor("Demo", LocalDate.of(1958, 10, 1), LocalDate.of(2026, 4, 1));
        var portfolio = new Portfolio(investor);
        var cash = new InvestmentProduct(portfolio, "Cash", ProductType.GENERAL, new BigDecimal("100000"));
        var retirement = new InvestmentProduct(portfolio, "Retirement", ProductType.RETIREMENT, new BigDecimal("60000"));
        ReflectionTestUtils.setField(cash, "id", 1L);
        ReflectionTestUtils.setField(retirement, "id", 2L);
        var reserved = mock(WithdrawalNoticeRepository.ReservationTotal.class);
        when(reserved.getProductId()).thenReturn(1L);
        when(reserved.getAmount()).thenReturn(new BigDecimal("20000"));
        when(investors.findById(1L)).thenReturn(Optional.of(investor));
        when(products.findByPortfolioInvestorIdOrderByIdAsc(1L)).thenReturn(List.of(cash, retirement));
        when(notices.activeTotals(1L)).thenReturn(List.of(reserved));

        var response = service().getPortfolio(1L);
        assertThat(response.investor().name()).isEqualTo("Demo");
        assertThat(response.investor().age()).isEqualTo(68);
        assertThat(response.totalAvailable()).isEqualByComparingTo("140000");
        assertThat(response.products()).hasSize(2);
        assertThat(response.products().getFirst().availableBalance()).isEqualByComparingTo("80000");
        assertThat(response.products().getFirst().maximumWithdrawable()).isEqualByComparingTo("70000");
        assertThat(response.products().get(1).maximumWithdrawable()).isEqualByComparingTo("54000");
    }

    @Test
    void missingInvestorHasMeaningfulError() {
        when(investors.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service().getPortfolio(99L)).isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("We couldn't find that investor.");
    }

    private PortfolioService service() {
        return new PortfolioService(investors, products, notices,
                new WithdrawalRules(Clock.fixed(Instant.parse("2026-10-29T12:00:00Z"), ZoneOffset.UTC)));
    }
}
