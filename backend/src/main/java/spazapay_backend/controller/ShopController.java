package spazapay_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import spazapay_backend.dto.ShopResponse;
import spazapay_backend.repository.ShopRepository;

@RestController
@RequestMapping("/api/shops")
public class ShopController {

    private final ShopRepository shopRepository;

    public ShopController(ShopRepository shopRepository) {
        this.shopRepository = shopRepository;
    }

    // Returns ONLY the logged-in owner's shop, taken from the token, never from the URL
    @GetMapping("/me")
    public ShopResponse me(Authentication authentication) {
        Long shopId = (Long) authentication.getPrincipal();
        return shopRepository.findById(shopId)
                .map(ShopResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shop not found"));
    }
}