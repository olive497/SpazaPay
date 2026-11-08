package spazapay_backend.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        String currency,
        BigDecimal todaySales,
        long todayCount,
        BigDecimal totalReceived,
        long totalCount,
        long pendingCount) {
}
