package spazapay_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import spazapay_backend.dto.LoginRequest;
import spazapay_backend.dto.LoginResponse;
import spazapay_backend.dto.RegisterRequest;
import spazapay_backend.dto.ShopResponse;
import spazapay_backend.model.Shop;
import spazapay_backend.repository.ShopRepository;
import spazapay_backend.security.JwtService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ShopRepository shopRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(ShopRepository shopRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.shopRepository = shopRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ShopResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = req.email().trim().toLowerCase();

        if (shopRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        Shop shop = new Shop();
        shop.setOwnerName(req.ownerName().trim());
        shop.setEmail(email);
        shop.setPasswordHash(passwordEncoder.encode(req.password())); // hashed here
        shop.setShopName(req.shopName().trim());
        shop.setWalletAddress(req.walletAddress().trim());
        shop.setPreferredLanguage(req.preferredLanguage() == null ? "en" : req.preferredLanguage());

        return ShopResponse.from(shopRepository.save(shop));
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        // Same error for "wrong email" and "wrong password" on purpose,
        // so attackers can't discover which emails are registered.
        Shop shop = shopRepository.findByEmail(req.email().trim().toLowerCase())
                .filter(s -> passwordEncoder.matches(req.password(), s.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        return new LoginResponse(jwtService.generateToken(shop), ShopResponse.from(shop));
    }
}