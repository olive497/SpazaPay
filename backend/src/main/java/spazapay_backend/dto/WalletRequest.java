package spazapay_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record WalletRequest(@NotBlank String walletAddress) {
}
