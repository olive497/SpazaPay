import "dotenv/config";
import express from "express";
import {
  createAuthenticatedClient,
  isFinalizedGrant,
  isPendingGrant,
  type AuthenticatedClient,
} from "@interledger/open-payments";

/**
 * SpazaPay payments gateway.
 * Spring Boot (the ledger) calls this service over HTTP; this service talks to
 * Open Payments using the official SDK (GNAP grants + HTTP message signatures).
 *
 * Merchant side (what SpazaPay really needs):
 *   POST /wallet/validate         check that a shop's wallet address is real
 *   POST /incoming-payments       create a payment request on the shop's wallet (goes in the QR)
 *   GET  /incoming-payments       poll status so the ledger can record it
 * Customer side (demo only - a real customer uses their own wallet app):
 *   POST /payer/quote, /payer/start, /payer/finish
 */

const PORT = Number(process.env.PORT ?? 4000);
const GATEWAY_KEY = process.env.GATEWAY_API_KEY ?? "";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (see .env.example)`);
  return v;
}

/** "$wallet.example/alice" -> "https://wallet.example/alice" */
export function normalizeWalletUrl(input: string): string {
  const t = input.trim();
  return t.startsWith("$") ? "https://" + t.slice(1) : t;
}

let clientPromise: Promise<AuthenticatedClient> | null = null;
function getClient(): Promise<AuthenticatedClient> {
  clientPromise ??= createAuthenticatedClient({
    walletAddressUrl: normalizeWalletUrl(env("OP_WALLET_ADDRESS_URL")),
    privateKey: env("OP_PRIVATE_KEY_PATH"), // path to the PEM file
    keyId: env("OP_KEY_ID"),
  });
  return clientPromise;
}

/** Access token from a finalized grant (throws if the grant has none). */
function tok(grant: { access_token?: { value: string } }): string {
  if (!grant.access_token) throw new Error("Grant has no access token");
  return grant.access_token.value;
}

const app = express();
app.use(express.json());

// Shared secret so only Spring Boot can call this service.
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (GATEWAY_KEY && req.header("x-gateway-key") !== GATEWAY_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

const wrap =
  (fn: express.RequestHandler): express.RequestHandler =>
  async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e: any) {
      console.error(e);
      res.status(502).json({
        error: "open_payments_error",
        message: e?.message ?? String(e),
        details: e?.description ?? e?.status ?? undefined,
      });
    }
  };

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 1) Validate a wallet address (works for any Open Payments wallet).
app.post(
  "/wallet/validate",
  wrap(async (req, res) => {
    const client = await getClient();
    const wa = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.body.walletAddress ?? "")),
    });
    res.json({
      valid: true,
      id: wa.id,
      publicName: wa.publicName ?? null,
      assetCode: wa.assetCode,
      assetScale: wa.assetScale,
    });
  }),
);

// 2) Create an incoming payment on the SHOP's wallet.
//    body: { walletAddress, amountMinor?, description?, externalRef? }
app.post(
  "/incoming-payments",
  wrap(async (req, res) => {
    const client = await getClient();
    const wa = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.body.walletAddress ?? "")),
    });
    const grant = await client.grant.request(
      { url: wa.authServer },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["create", "read", "read-all", "complete"],
            },
          ],
        },
      },
    );
    if (!isFinalizedGrant(grant)) {
      return res.status(502).json({ error: "grant_requires_interaction" });
    }
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const ip = await client.incomingPayment.create(
      { url: wa.resourceServer, accessToken: tok(grant) },
      {
        walletAddress: wa.id,
        expiresAt,
        metadata: {
          description: req.body.description ?? "SpazaPay sale",
          externalRef: req.body.externalRef ?? undefined,
        },
        ...(req.body.amountMinor
          ? {
              incomingAmount: {
                value: String(req.body.amountMinor),
                assetCode: wa.assetCode,
                assetScale: wa.assetScale,
              },
            }
          : {}),
      },
    );
    res.status(201).json({
      incomingPaymentUrl: ip.id,
      walletAddress: wa.id,
      expiresAt: ip.expiresAt,
      incomingAmount: ip.incomingAmount ?? null,
      completed: ip.completed,
    });
  }),
);

// 3) Poll an incoming payment (the ledger uses this to confirm money arrived).
//    GET /incoming-payments?url=<incomingPaymentUrl>&walletAddress=<shop wallet>
app.get(
  "/incoming-payments",
  wrap(async (req, res) => {
    const client = await getClient();
    const wa = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.query.walletAddress ?? "")),
    });
    const grant = await client.grant.request(
      { url: wa.authServer },
      {
        access_token: {
          access: [{ type: "incoming-payment", actions: ["read", "read-all"] }],
        },
      },
    );
    if (!isFinalizedGrant(grant)) {
      return res.status(502).json({ error: "grant_requires_interaction" });
    }
    const ip = await client.incomingPayment.get({
      url: String(req.query.url),
      accessToken: tok(grant),
    });
    const received = BigInt(ip.receivedAmount.value);
    const expected = ip.incomingAmount ? BigInt(ip.incomingAmount.value) : null;
    res.json({
      incomingPaymentUrl: ip.id,
      receivedAmount: ip.receivedAmount,
      incomingAmount: ip.incomingAmount ?? null,
      completed: ip.completed,
      // paid = money received (full amount if one was requested)
      paid: expected !== null ? received >= expected : received > 0n,
    });
  }),
);

// ---------- Customer side (demo helper) ----------

// POST /payer/quote { senderWallet, incomingPaymentUrl }
app.post(
  "/payer/quote",
  wrap(async (req, res) => {
    const client = await getClient();
    const sender = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.body.senderWallet)),
    });
    const grant = await client.grant.request(
      { url: sender.authServer },
      { access_token: { access: [{ type: "quote", actions: ["create", "read"] }] } },
    );
    if (!isFinalizedGrant(grant)) {
      return res.status(502).json({ error: "grant_requires_interaction" });
    }
    const quote = await client.quote.create(
      { url: sender.resourceServer, accessToken: tok(grant) },
      {
        walletAddress: sender.id,
        receiver: String(req.body.incomingPaymentUrl),
        method: "ilp",
      },
    );
    res.json(quote);
  }),
);

// POST /payer/start { senderWallet, quote, redirectUri }
// Returns the URL the customer opens to approve the payment.
app.post(
  "/payer/start",
  wrap(async (req, res) => {
    const client = await getClient();
    const sender = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.body.senderWallet)),
    });
    const quote = req.body.quote;
    const grant = await client.grant.request(
      { url: sender.authServer },
      {
        access_token: {
          access: [
            {
              type: "outgoing-payment",
              actions: ["create", "read"],
              identifier: sender.id,
              limits: { debitAmount: quote.debitAmount, receiveAmount: quote.receiveAmount },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: String(req.body.redirectUri),
            nonce: crypto.randomUUID(),
          },
        },
      },
    );
    if (!isPendingGrant(grant)) {
      return res.status(502).json({ error: "expected_interactive_grant" });
    }
    res.json({
      interactUrl: grant.interact.redirect,
      continueUri: grant.continue.uri,
      continueToken: grant.continue.access_token.value,
    });
  }),
);

// POST /payer/finish { senderWallet, quoteId, continueUri, continueToken, interactRef }
app.post(
  "/payer/finish",
  wrap(async (req, res) => {
    const client = await getClient();
    const sender = await client.walletAddress.get({
      url: normalizeWalletUrl(String(req.body.senderWallet)),
    });
    const grant = await client.grant.continue(
      { url: String(req.body.continueUri), accessToken: String(req.body.continueToken) },
      { interact_ref: String(req.body.interactRef) },
    );
    if (!isFinalizedGrant(grant)) {
      return res.status(409).json({ error: "grant_not_approved_yet" });
    }
    const op = await client.outgoingPayment.create(
      { url: sender.resourceServer, accessToken: tok(grant) },
      { walletAddress: sender.id, quoteId: String(req.body.quoteId) },
    );
    res.status(201).json(op);
  }),
);

app.listen(PORT, () => console.log(`payments-gateway listening on :${PORT}`));
