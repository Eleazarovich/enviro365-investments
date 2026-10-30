package com.enviro.assessment.junior.eleazar.exception;

import com.enviro.assessment.junior.eleazar.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.util.DisconnectedClientHelper;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(WithdrawalRejectedException.class)
    ResponseEntity<ErrorResponse> rejected(WithdrawalRejectedException ex) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(InvalidRequestException.class)
    ResponseEntity<ErrorResponse> invalid(InvalidRequestException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(BindException.class)
    ResponseEntity<ErrorResponse> validation(BindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.isBindingFailure() ? "Use valid filters: productId and dates in YYYY-MM-DD format." : e.getDefaultMessage())
                .sorted().findFirst().orElse("Check the values you entered.");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> methodValidation(HandlerMethodValidationException ex) {
        if (ex.isForReturnValue()) return unexpected(ex);
        // MVC method validation can include @Valid request-body field errors as
        // well as path parameters. Preserve the DTO's useful financial messages.
        String message = ex.getBeanResults().stream().flatMap(result -> result.getFieldErrors().stream())
                .map(e -> e.isBindingFailure() ? "Use valid filters: productId and dates in YYYY-MM-DD format." : e.getDefaultMessage())
                .filter(java.util.Objects::nonNull).sorted().findFirst()
                .orElse("Use positive identifiers and valid dates in YYYY-MM-DD format.");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler({ConstraintViolationException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> invalidParameter(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, "Use positive identifiers and valid dates in YYYY-MM-DD format.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> malformedBody() {
        return error(HttpStatus.BAD_REQUEST, "Provide JSON containing a numeric productId and amount only.");
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    ResponseEntity<ErrorResponse> lockConflict() {
        return error(HttpStatus.CONFLICT, "This investment is being updated. Refresh your balance and try again.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> unknownEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        // Preserve Next.js's exported not-found screen for browser navigation.
        // API errors always retain their JSON contract, even when opened in a browser.
        if (!path.equals("/api") && !path.startsWith("/api/")
                && accept != null && accept.contains(MediaType.TEXT_HTML_VALUE)) {
            var page = new ClassPathResource("static/404.html");
            if (page.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).contentType(MediaType.TEXT_HTML).body(page);
            }
        }
        return error(HttpStatus.NOT_FOUND, "We couldn't find that endpoint.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> unsupportedMethod(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .allow(ex.getSupportedHttpMethods() == null ? new HttpMethod[0] : ex.getSupportedHttpMethods().toArray(HttpMethod[]::new))
                .body(new ErrorResponse("This HTTP method is not supported for that endpoint."));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorResponse> unsupportedMedia() {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Send the request as application/json.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception ex) {
        // Navigation can cancel an HTML/asset response. The socket is already closed,
        // so attempting to write a JSON error would produce a second failure.
        if (DisconnectedClientHelper.isClientDisconnectedException(ex)) return null;
        log.error("Unexpected API failure", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Please try again. Your request could not be completed.");
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(new ErrorResponse(message));
    }
}
