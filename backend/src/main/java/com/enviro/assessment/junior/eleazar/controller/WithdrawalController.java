package com.enviro.assessment.junior.eleazar.controller;

import com.enviro.assessment.junior.eleazar.dto.*;
import com.enviro.assessment.junior.eleazar.service.WithdrawalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/investors/{investorId}/withdrawal-notices")
public class WithdrawalController {
    private final WithdrawalService service;

    public WithdrawalController(WithdrawalService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<WithdrawalNoticeResponse> create(@PathVariable @Positive Long investorId,
                                                           @Valid @RequestBody CreateWithdrawalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(investorId, request));
    }

    @GetMapping
    public List<WithdrawalNoticeResponse> history(@PathVariable @Positive Long investorId,
                                                 @Valid @ModelAttribute WithdrawalFilters filters) {
        return service.history(investorId, filters);
    }

    @GetMapping("/export")
    public ResponseEntity<String> export(@PathVariable @Positive Long investorId,
                                         @Valid @ModelAttribute WithdrawalFilters filters) {
        var csv = service.export(investorId, filters);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(csv.filename()).build().toString())
                .body(csv.content());
    }
}
