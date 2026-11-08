package spazapay_backend.dto;

public record LoginResponse(String token, ShopResponse shop) {}