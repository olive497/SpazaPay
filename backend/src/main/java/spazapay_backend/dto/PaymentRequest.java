package spazapay_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** amount is in major units, e.g. 25.50 */
public record PaymentRequest(
        @NotNull @DecimalMin(value = "0.01", message = "Amount must be at least 0.01") BigDecimal amount,
        @Size(max = 140) String description) {
}
