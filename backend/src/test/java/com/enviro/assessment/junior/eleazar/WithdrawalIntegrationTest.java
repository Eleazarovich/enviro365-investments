package com.enviro.assessment.junior.eleazar;

import com.enviro.assessment.junior.eleazar.dto.*;
import com.enviro.assessment.junior.eleazar.entity.*;
import com.enviro.assessment.junior.eleazar.exception.*;
import com.enviro.assessment.junior.eleazar.repository.*;
import com.enviro.assessment.junior.eleazar.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Spring 7's SpringExtension requires JUnit 6. Start the same full Boot context
// explicitly to run the integration tests with JUnit 5.
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WithdrawalIntegrationTest {
    @TestConfiguration
    static class FixedClock {
        @Bean @Primary Clock fixedClock() { return Clock.fixed(Instant.parse("2026-10-29T12:00:00Z"), ZoneOffset.UTC); }
    }

    private ConfigurableApplicationContext context;
    MockMvc mvc;
    @Autowired InvestorRepository investors;
    @Autowired PortfolioRepository portfolios;
    @Autowired InvestmentProductRepository products;
    @Autowired WithdrawalNoticeRepository notices;
    @Autowired WithdrawalService withdrawals;
    @Autowired PortfolioService portfolioService;
    @Autowired PlatformTransactionManager transactions;
    Investor investor;
    Portfolio portfolio;
    InvestmentProduct cash;
    InvestmentProduct retirement;

    @BeforeAll
    void startApplication() {
        context = new SpringApplicationBuilder(Enviro365Application.class, FixedClock.class)
                .profiles("test").run("--server.port=0");
        context.getAutowireCapableBeanFactory().autowireBean(this);
        mvc = MockMvcBuilders.webAppContextSetup((WebApplicationContext) context).build();
    }

    @AfterAll
    void stopApplication() { if (context != null) context.close(); }

    @BeforeEach
    void setUp() {
        notices.deleteAll();
        products.deleteAll();
        portfolios.deleteAll();
        investors.deleteAll();
        investor = investors.save(new Investor("Demo Investor", LocalDate.of(1958, 10, 1), LocalDate.of(2026, 4, 1)));
        portfolio = portfolios.save(new Portfolio(investor));
        cash = products.save(new InvestmentProduct(portfolio, "Cash Investment", ProductType.GENERAL, money("100000")));
        retirement = products.save(new InvestmentProduct(portfolio, "Retirement Investment", ProductType.RETIREMENT, money("60000")));
        notices.save(new WithdrawalNotice(cash, money("20000"), Instant.parse("2026-10-21T09:12:00Z"), true));
        notices.save(new WithdrawalNotice(cash, money("4500"), Instant.parse("2026-09-30T23:59:59.999999Z"), false));
        notices.save(new WithdrawalNotice(retirement, money("7500.50"), Instant.parse("2026-09-01T00:00:00Z"), false));
    }

    @Test
    void retrievesPortfolioWithDerivedBalancesAndNoEntities() throws Exception {
        mvc.perform(get(base() + "/portfolio")).andExpect(status().isOk())
                .andExpect(jsonPath("$.investor.name").value("Demo Investor"))
                .andExpect(jsonPath("$.investor.age").value(68))
                .andExpect(jsonPath("$.totalAvailable").value(140000))
                .andExpect(jsonPath("$.products[0].availableBalance").value(80000))
                .andExpect(jsonPath("$.products[0].pendingWithdrawals").value(20000))
                .andExpect(jsonPath("$.products[0].maximumWithdrawable").value(70000))
                .andExpect(jsonPath("$.products[1].maximumWithdrawable").value(54000))
                .andExpect(jsonPath("$.products[0].balance").doesNotExist())
                .andExpect(jsonPath("$.investor.dateOfBirth").doesNotExist());
    }

    @Test
    void validWithdrawalPersistsReservationAndRefreshesBalanceOnce() throws Exception {
        mvc.perform(post(path()).contentType(MediaType.APPLICATION_JSON).content(body(cash, "1500.75")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.amount").value(1500.75))
                .andExpect(jsonPath("$.productId").value(cash.getId()))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.submittedAt").value("2026-10-29T12:00:00Z"))
                .andExpect(jsonPath("$.active").doesNotExist());
        assertThat(notices.count()).isEqualTo(4);
        assertThat(notices.sumActiveAmount(cash.getId())).isEqualByComparingTo("21500.75");
        assertThat(products.findById(cash.getId()).orElseThrow().getBalance()).isEqualByComparingTo("100000");
        var response = portfolioService.getPortfolio(investor.getId());
        assertThat(response.products().getFirst().availableBalance()).isEqualByComparingTo("78499.25");
        assertThat(response.products().getFirst().maximumWithdrawable()).isEqualByComparingTo("68499.25");
        assertThat(response.totalAvailable()).isEqualByComparingTo("138499.25");
        mvc.perform(get(path()).param("productId", cash.getId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].amount").value(1500.75));
    }

    @ParameterizedTest
    @CsvSource({"0,400", "-1,400", "99.99,400", "100.001,400", "80000.01,422", "70000.01,422", "100000000000000000,400"})
    void rejectsInvalidAmountsWithoutChangingDatabase(String amount, int statusCode) throws Exception {
        var before = portfolioService.getPortfolio(investor.getId());
        mvc.perform(post(path()).contentType(MediaType.APPLICATION_JSON).content(body(cash, amount)))
                .andExpect(status().is(statusCode)).andExpect(jsonPath("$.message").isNotEmpty());
        assertThat(portfolioService.getPortfolio(investor.getId())).isEqualTo(before);
        assertThat(notices.count()).isEqualTo(3);
        assertThat(notices.sumActiveAmount(cash.getId())).isEqualByComparingTo("20000");
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"productId\":1}", "{\"amount\":100}", "null", "{", "{\"productId\":1,\"amount\":\"oops\"}",
            "{\"productId\":1,\"amount\":100,\"age\":66}", "{\"productId\":0,\"amount\":100}"})
    void malformedRequestsReturnUsable400(String body) throws Exception {
        mvc.perform(post(path()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").isNotEmpty());
        assertThat(notices.count()).isEqualTo(3);
    }

    @Test
    void jsonRequiresNumericAmountAndIntegerProductId() throws Exception {
        for (String json : List.of("{\"productId\":" + cash.getId() + ",\"amount\":\"100\"}",
                "{\"productId\":" + cash.getId() + ".5,\"amount\":100}")) {
            mvc.perform(post(path()).contentType(MediaType.APPLICATION_JSON).content(json))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        }
        assertThat(notices.count()).isEqualTo(3);
    }

    @ParameterizedTest
    @CsvSource({"64,422", "65,422", "66,201"})
    void retirementUsesStoredDateOfBirthAtAgeBoundaries(int age, int statusCode) throws Exception {
        var person = investors.save(new Investor("Age test", LocalDate.of(2026, 10, 29).minusYears(age), LocalDate.of(2026, 1, 1)));
        var account = portfolios.save(new Portfolio(person));
        var product = products.save(new InvestmentProduct(account, "Retirement", ProductType.RETIREMENT, money("1000")));
        mvc.perform(post("/api/investors/" + person.getId() + "/withdrawal-notices")
                        .contentType(MediaType.APPLICATION_JSON).content(body(product, "100")))
                .andExpect(status().is(statusCode));
        assertThat(notices.sumActiveAmount(product.getId())).isEqualByComparingTo(age == 66 ? "100" : "0");
        assertThat(notices.count()).isEqualTo(age == 66 ? 4 : 3);
    }

    @Test
    void repeatedRequestsShareOneCumulativeLimitAndPreserveTenPercent() {
        withdrawals.create(investor.getId(), new CreateWithdrawalRequest(cash.getId(), money("40000")));
        withdrawals.create(investor.getId(), new CreateWithdrawalRequest(cash.getId(), money("30000")));
        var response = portfolioService.getPortfolio(investor.getId());
        assertThat(response.products().getFirst().availableBalance()).isEqualByComparingTo("10000");
        assertThat(response.products().getFirst().maximumWithdrawable()).isEqualByComparingTo("0");
        assertThat(notices.sumActiveAmount(cash.getId())).isEqualByComparingTo("90000");
        assertThatThrownBy(() -> withdrawals.create(investor.getId(), new CreateWithdrawalRequest(cash.getId(), money("100"))))
                .isInstanceOf(WithdrawalRejectedException.class);
        assertThat(portfolioService.getPortfolio(investor.getId())).isEqualTo(response);
        assertThat(notices.count()).isEqualTo(5);
    }

    @Test
    void transactionFailureRollsBackInsertedNoticeAndItsReservation() {
        var before = portfolioService.getPortfolio(investor.getId());
        var tx = new TransactionTemplate(transactions);
        assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
            withdrawals.create(investor.getId(), new CreateWithdrawalRequest(cash.getId(), money("1500.75")));
            assertThat(notices.sumActiveAmount(cash.getId())).isEqualByComparingTo("21500.75");
            throw new IllegalStateException("Simulated failure after database insert");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(notices.count()).isEqualTo(3);
        assertThat(portfolioService.getPortfolio(investor.getId())).isEqualTo(before);
    }

    @Test
    void concurrentTransactionsCannotReserveBeyondCumulativeCap() throws Exception {
        var product = products.save(new InvestmentProduct(portfolio, "Concurrent", ProductType.GENERAL, money("1000")));
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(10)) {
            List<Future<Boolean>> results = IntStream.range(0, 10).mapToObj(i -> executor.submit(() -> {
                if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Barrier timed out");
                try {
                    withdrawals.create(investor.getId(), new CreateWithdrawalRequest(product.getId(), money("100")));
                    return true;
                } catch (WithdrawalRejectedException expected) {
                    return false;
                }
            })).toList();
            start.countDown();
            int accepted = 0;
            for (var result : results) if (result.get(20, TimeUnit.SECONDS)) accepted++;
            assertThat(accepted).isEqualTo(9);
        }
        assertThat(notices.sumActiveAmount(product.getId())).isEqualByComparingTo("900");
        assertThat(notices.count()).isEqualTo(12);
        var summary = portfolioService.getPortfolio(investor.getId()).products().stream()
                .filter(p -> p.id().equals(product.getId())).findFirst().orElseThrow();
        assertThat(summary.availableBalance()).isEqualByComparingTo("100");
        assertThat(summary.maximumWithdrawable()).isEqualByComparingTo("0");
    }

    @Test
    void filtersCombineProductAndInclusiveUtcDatesAndCsvMatchesExactly() throws Exception {
        String expected = "Date,Investment,Amount\r\n2026-09-30,\"Cash Investment\",-4500.00";
        mvc.perform(get(path()).param("productId", cash.getId().toString()).param("fromDate", "2026-09-01").param("toDate", "2026-09-30"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].amount").value(4500));
        mvc.perform(get(path() + "/export").param("productId", cash.getId().toString()).param("fromDate", "2026-09-01").param("toDate", "2026-09-30"))
                .andExpect(status().isOk()).andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"withdrawal-statement-2026-10-29.csv\""))
                .andExpect(content().string(expected));
        var rows = withdrawals.history(investor.getId(), new WithdrawalFilters(null, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)));
        assertThat(rows).extracting(WithdrawalNoticeResponse::amount).containsExactly(money("4500.00"), money("7500.50"));
        assertThat(withdrawals.history(investor.getId(), new WithdrawalFilters(null, null, null)))
                .extracting(WithdrawalNoticeResponse::amount).containsExactly(money("20000.00"), money("4500.00"), money("7500.50"));
    }

    @Test
    void csvEscapesCommasQuotesAndNewlinesAndUsesNegativeCents() {
        var product = products.save(new InvestmentProduct(portfolio, "Cash, \"Reserve\"\nFund", ProductType.GENERAL, money("1000")));
        withdrawals.create(investor.getId(), new CreateWithdrawalRequest(product.getId(), money("123.45")));
        var csv = withdrawals.export(investor.getId(), new WithdrawalFilters(product.getId(), null, null));
        assertThat(csv.content()).isEqualTo("Date,Investment,Amount\r\n2026-10-29,\"Cash, \"\"Reserve\"\"\nFund\",-123.45");
    }

    @Test
    void noMatchesReturnEmptyArrayAndHeaderOnlyCsv() throws Exception {
        mvc.perform(get(path()).param("fromDate", "2030-01-01"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get(path() + "/export").param("fromDate", "2030-01-01"))
                .andExpect(status().isOk()).andExpect(content().string("Date,Investment,Amount"));
        mvc.perform(get(path()).param("productId", "999999"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"?fromDate=2026-10-30&toDate=2026-10-01", "?fromDate=invalid", "?toDate=2026-02-30", "?productId=abc", "?productId=-1"})
    void historyAndExportRejectInvalidFilters(String query) throws Exception {
        for (String endpoint : List.of(path(), path() + "/export")) {
            mvc.perform(get(endpoint + query)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }
    }

    @Test
    void investorAndProductOwnershipAreEnforced() throws Exception {
        for (String suffix : List.of("/portfolio", "/withdrawal-notices", "/withdrawal-notices/export")) {
            mvc.perform(get("/api/investors/999999" + suffix)).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").value("We couldn't find that investor."));
        }
        var stranger = investors.save(new Investor("Other", LocalDate.of(1958, 1, 1), LocalDate.of(2026, 1, 1)));
        mvc.perform(post("/api/investors/" + stranger.getId() + "/withdrawal-notices")
                        .contentType(MediaType.APPLICATION_JSON).content(body(cash, "100")))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("We couldn't find that investment."));
        assertThat(withdrawals.history(stranger.getId(), new WithdrawalFilters(cash.getId(), null, null))).isEmpty();
        assertThat(notices.count()).isEqualTo(3);
    }

    @Test
    void corsAllowsConfiguredOriginPreflightAndExposesFilename() throws Exception {
        mvc.perform(options(path()).header("Origin", "http://localhost:4028")
                        .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4028"));
        mvc.perform(get(path() + "/export").header("Origin", "http://localhost:4028"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Expose-Headers", "Content-Disposition"));
        mvc.perform(options(path()).header("Origin", "https://unconfigured.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    private String base() { return "/api/investors/" + investor.getId(); }
    private String path() { return base() + "/withdrawal-notices"; }
    private BigDecimal money(String value) { return new BigDecimal(value).setScale(2); }
    private String body(InvestmentProduct product, String amount) {
        return "{\"productId\":" + product.getId() + ",\"amount\":" + amount + "}";
    }
}
