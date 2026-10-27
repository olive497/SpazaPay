package spazapay_backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ownerName;

    @Column(unique = true, nullable = false)
    private String email;

    // BCrypt hash only. The real password is never saved.
    @Column(nullable = false)
    private String passwordHash;

    private String shopName;

    // Open Payments wallet address, e.g. https://ilp.interledger-test.dev/spaza-jenny
    private String walletAddress;

    // "en", "zu", "af", "st" ...
    private String preferredLanguage;

    private Instant createdAt = Instant.now();

    public Shop() {}

    public Long getId() { return id; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }
    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public Instant getCreatedAt() { return createdAt; }
}