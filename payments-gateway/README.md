# payments-gateway

Small Node/TypeScript service that talks to Open Payments with the official
`@interledger/open-payments` SDK. Spring Boot calls it over HTTP; it never
exposes the private key.

## Run
```bash
npm install
cp .env.example .env     # fill in wallet address, key id, private key path
npm run dev              # http://localhost:4000
```

All routes except `/health` need header `x-gateway-key: <GATEWAY_API_KEY>`.

| Method | Route | Body / query | Returns |
|---|---|---|---|
| GET | `/health` | | `{status:"ok"}` |
| POST | `/wallet/validate` | `{walletAddress}` | `{valid, id, publicName, assetCode, assetScale}` |
| POST | `/incoming-payments` | `{walletAddress, amountMinor?, description?, externalRef?}` | `{incomingPaymentUrl, expiresAt, ...}` (put this in the QR) |
| GET | `/incoming-payments` | `?url=<incomingPaymentUrl>&walletAddress=<shop wallet>` | `{paid, completed, receivedAmount}` |
| POST | `/payer/quote` | `{senderWallet, incomingPaymentUrl}` | quote (demo customer side) |
| POST | `/payer/start` | `{senderWallet, quote, redirectUri}` | `{interactUrl, continueUri, continueToken}` |
| POST | `/payer/finish` | `{senderWallet, quoteId, continueUri, continueToken, interactRef}` | outgoing payment |

`amountMinor` is in the wallet's smallest unit (e.g. cents: R25.00 = 2500 when assetScale is 2).
