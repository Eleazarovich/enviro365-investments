package com.enviro.assessment.junior.eleazar.exception;

import com.enviro.assessment.junior.eleazar.controller.PortfolioController;
import com.enviro.assessment.junior.eleazar.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTest {
    @Test
    void unexpectedErrorsDoNotExposeDatabaseDetailsOrStackTraces() throws Exception {
        var service = mock(PortfolioService.class);
        when(service.getPortfolio(1L)).thenThrow(new IllegalStateException("Sensitive database details"));
        var mvc = MockMvcBuilders.standaloneSetup(new PortfolioController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(get("/api/investors/1/portfolio")).andExpect(status().isInternalServerError())
                .andExpect(content().json("{\"message\":\"Please try again. Your request could not be completed.\"}", org.springframework.test.json.JsonCompareMode.STRICT));
    }
}
