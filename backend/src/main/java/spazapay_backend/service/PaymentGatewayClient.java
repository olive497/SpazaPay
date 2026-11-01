package spazapay_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/** Talks to the Node payments-gateway, which talks to Open Payments. */
@Service
public class PaymentGatewayClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};

    private final RestClient http;

    public PaymentGatewayClient(@Value("${app.gateway.url:http://localhost:4000}") String baseUrl,
                                @Value("${app.gateway.key:}") String key) {
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-gateway-key", key)
                .build();
    }

    public Map<String, Object> validateWallet(String walletAddress) {
        return call(() -> http.post().uri("/wallet/validate")
                .body(Map.of("walletAddress", walletAddress))
                .retrieve().body(MAP));
    }

    public Map<String, Object> createIncomingPayment(String walletAddress, long amountMinor,
                                                     String description, String externalRef) {
        Map<String, Object> body = new HashMap<>();
        body.put("walletAddress", walletAddress);
        body.put("amountMinor", amountMinor);
        if (description != null) body.put("description", description);
        if (externalRef != null) body.put("externalRef", externalRef);
        return call(() -> http.post().uri("/incoming-payments").body(body).retrieve().body(MAP));
    }

    public Map<String, Object> getIncomingPayment(String incomingPaymentUrl, String walletAddress) {
        return call(() -> http.get()
                .uri(b -> b.path("/incoming-payments")
                        .queryParam("url", incomingPaymentUrl)
                        .queryParam("walletAddress", walletAddress)
                        .build())
                .retrieve().body(MAP));
    }

    private Map<String, Object> call(java.util.function.Supplier<Map<String, Object>> action) {
        try {
            Map<String, Object> result = action.get();
            if (result == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from payments gateway");
            }
            return result;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Payments gateway error: " + e.getMessage());
        }
    }
}
