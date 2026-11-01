package spazapay_backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/** One payment request / payment in the shop's ledger. */
@Entity
@Table(name = "transactions")
public class Transaction {

    public enum Status { PENDING, PAID, EXPIRED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long shopId;

    /** Amount in minor units (cents). R25.00 -> 2500. */
    @Column(nullable = false)
    private long amountMinor;

    @Column(nullable = false, length = 8)
    private String currency;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PENDING;

    /** Open Payments incoming payment URL (this is what the QR code holds). */
    @Column(nullable = false, length = 600)
    private String incomingPaymentUrl;

    @Column(nullable = false, length = 300)
    private String walletAddress;

    private Instant expiresAt;
    private Instant paidAt;
    private Instant createdAt = Instant.now();

    public Transaction() {}

    public Long getId() { return id; }
    public Long getShopId() { return shopId; }
    public void setShopId(Long shopId) { this.shopId = shopId; }
    public long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(long amountMinor) { this.amountMinor = amountMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getIncomingPaymentUrl() { return incomingPaymentUrl; }
    public void setIncomingPaymentUrl(String incomingPaymentUrl) { this.incomingPaymentUrl = incomingPaymentUrl; }
    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public Instant getCreatedAt() { return createdAt; }
}
