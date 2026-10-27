package spazapay_backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import spazapay_backend.model.Shop;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiryMinutes;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-minutes}") long expiryMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryMinutes = expiryMinutes;
    }

    public String generateToken(Shop shop) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(shop.getId()))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMinutes * 60_000))
                .signWith(key)
                .compact();
    }

    // Throws an exception if the token is fake, tampered with, or expired
    public Long extractShopId(String token) {
        String subject = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject();
        return Long.valueOf(subject);
    }
}