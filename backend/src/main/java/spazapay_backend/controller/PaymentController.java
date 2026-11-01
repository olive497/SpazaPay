package spazapay_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import spazapay_backend.dto.*;
import spazapay_backend.model.Shop;
import spazapay_backend.model.Transaction;
import spazapay_backend.repository.ShopRepository;
import spazapay_backend.repository.TransactionRepository;
import spazapay_backend.service.PaymentGatewayClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaymentController {

    private static final ZoneId SA = ZoneId.of("Africa/Johannesburg");

    private final ShopRepository shops;
    private final TransactionRepository transactions;
    private final PaymentGatewayClient gateway;

    public PaymentController(ShopRepository shops, TransactionRepository transactions,
                             PaymentGatewayClient gateway) {
        this.shops = shops;
        this.transactions = transactions;
        this.gateway = gateway;
    }

    private Shop currentShop(Authentication auth) {
        Long shopId = (Long) auth.getPrincipal();
        return shops.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shop not found"));
    }

    /** Shop owner saves their Open Payments wallet address (checked against the real network). */
    @PutMapping("/shops/me/wallet")
    public Map<String, Object> setWallet(@Valid @RequestBody WalletRequest req, Authentication auth) {
        Shop shop = currentShop(auth);
        Map<String, Object> wallet;
        try {
            wallet = gateway.validateWallet(req.walletAddress().trim());
        } catch (ResponseStatusException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That wallet address could not be verified: " + e.getReason());
        }
        shop.setWalletAddress(String.valueOf(wallet.get("id")));
        shops.save(shop);
        return wallet;
    }

    /** Create a payment request. The response's qrPayload is what the QR code encodes. */
    @PostMapping("/payments/request")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse request(@Valid @RequestBody PaymentRequest req, Authentication auth) {
        Shop shop = currentShop(auth);
        if (shop.getWalletAddress() == null || shop.getWalletAddress().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Set your wallet address first (PUT /api/shops/me/wallet)");
        }
        long amountMinor = req.amount().movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();

        Map<String, Object> created = gateway.createIncomingPayment(
                shop.getWalletAddress(), amountMinor, req.description(), "shop-" + shop.getId());

        Transaction t = new Transaction();
        t.setShopId(shop.getId());
        t.setAmountMinor(amountMinor);
        Object amountObj = created.get("incomingAmount");
        String currency = "EUR";
        if (amountObj instanceof Map<?, ?> m && m.get("assetCode") != null) {
            currency = String.valueOf(m.get("assetCode"));
        }
        t.setCurrency(currency);
        t.setDescription(req.description());
        t.setIncomingPaymentUrl(String.valueOf(created.get("incomingPaymentUrl")));
        t.setWalletAddress(shop.getWalletAddress());
        Object exp = created.get("expiresAt");
        if (exp != null) t.setExpiresAt(Instant.parse(String.valueOf(exp)));
        return TransactionResponse.from(transactions.save(t));
    }

    /** Check one payment. If it is still pending, ask Open Payments whether the money arrived. */
    @GetMapping("/payments/{id}")
    public TransactionResponse status(@PathVariable Long id, Authentication auth) {
        Long shopId = (Long) auth.getPrincipal();
        Transaction t = transactions.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (t.getStatus() == Transaction.Status.PENDING) {
            Map<String, Object> state = gateway.getIncomingPayment(t.getIncomingPaymentUrl(), t.getWalletAddress());
            if (Boolean.TRUE.equals(state.get("paid"))) {
                t.setStatus(Transaction.Status.PAID);
                t.setPaidAt(Instant.now());
                transactions.save(t);
            } else if (t.getExpiresAt() != null && Instant.now().isAfter(t.getExpiresAt())) {
                t.setStatus(Transaction.Status.EXPIRED);
                transactions.save(t);
            }
        }
        return TransactionResponse.from(t);
    }

    /** Full transaction history, newest first. */
    @GetMapping("/transactions")
    public List<TransactionResponse> history(Authentication auth) {
        Long shopId = (Long) auth.getPrincipal();
        return transactions.findByShopIdOrderByCreatedAtDesc(shopId).stream()
                .map(TransactionResponse::from).toList();
    }

    /** Dashboard numbers: today's sales, running total, pending count. */
    @GetMapping("/transactions/summary")
    public SummaryResponse summary(Authentication auth) {
        Long shopId = (Long) auth.getPrincipal();
        List<Transaction> all = transactions.findByShopIdOrderByCreatedAtDesc(shopId);
        LocalDate today = LocalDate.now(SA);

        List<Transaction> paid = all.stream().filter(t -> t.getStatus() == Transaction.Status.PAID).toList();
        List<Transaction> paidToday = paid.stream()
                .filter(t -> t.getPaidAt() != null && t.getPaidAt().atZone(SA).toLocalDate().equals(today))
                .toList();
        long pending = all.stream().filter(t -> t.getStatus() == Transaction.Status.PENDING).count();
        String currency = all.isEmpty() ? "EUR" : all.get(0).getCurrency();

        return new SummaryResponse(
                currency,
                sum(paidToday), paidToday.size(),
                sum(paid), paid.size(),
                pending);
    }

    private static BigDecimal sum(List<Transaction> list) {
        long cents = list.stream().mapToLong(Transaction::getAmountMinor).sum();
        return BigDecimal.valueOf(cents, 2);
    }
}
