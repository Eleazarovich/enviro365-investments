package com.enviro.assessment.junior.eleazar.config;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import org.springframework.web.servlet.config.annotation.*;
import java.time.Clock;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    private final CorsProperties cors;

    public WebConfiguration(CorsProperties cors) { this.cors = cors; }

    @Bean
    Clock clock() { return Clock.systemUTC(); }

    @Bean
    JsonMapperBuilderCustomizer strictNumericJson() {
        return builder -> builder.disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
                .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(cors.allowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders(HttpHeaders.CONTENT_TYPE)
                .exposedHeaders(HttpHeaders.CONTENT_DISPOSITION)
                .maxAge(3600);
    }
}
