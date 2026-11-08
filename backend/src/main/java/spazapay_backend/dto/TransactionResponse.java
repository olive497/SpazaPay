package spazapay_backend.dto;

import spazapay_backend.model.Transaction;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(
        Long id,
        BigDecimal amount,
        String currency,
        String description,
        String status,
        String incomingPaymentUrl,
        String qrPayload,
        Instant expiresAt,
        Instant paidAt,
        Instant createdAt) {

    /** Amounts are stored in cents; assumes 2 decimal places (EUR, ZAR, USD). */
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                BigDecimal.valueOf(t.getAmountMinor(), 2),
                t.getCurrency(),
                t.getDescription(),
                t.getStatus().name(),
                t.getIncomingPaymentUrl(),
                t.getIncomingPaymentUrl(), // what the QR code should encode
                t.getExpiresAt(),
                t.getPaidAt(),
                t.getCreatedAt());
    }
}
