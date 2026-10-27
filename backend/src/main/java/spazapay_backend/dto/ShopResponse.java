package spazapay_backend.dto;

import spazapay_backend.model.Shop;

public record ShopResponse(
        Long id,
        String ownerName,
        String email,
        String shopName,
        String walletAddress,
        String preferredLanguage
) {
    public static ShopResponse from(Shop s) {
        return new ShopResponse(s.getId(), s.getOwnerName(), s.getEmail(),
                s.getShopName(), s.getWalletAddress(), s.getPreferredLanguage());
    }
}