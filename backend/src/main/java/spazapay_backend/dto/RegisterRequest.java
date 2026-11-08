package spazapay_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String ownerName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String password,
        @NotBlank @Size(max = 100) String shopName,
        @NotBlank @Pattern(regexp = "^https://.+", message = "Wallet address must start with https://") String walletAddress,
        @Pattern(regexp = "^(en|zu|af|st)$", message = "Language must be en, zu, af or st") String preferredLanguage
) {}