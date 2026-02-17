# Wallet API Documentation

**Base URL:** `https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api`

---

## Authentication

All requests require the following headers:

| Header | Required | Description |
|--------|----------|-------------|
| `apikey` | Yes | Project anon key (provided on setup) |
| `x-api-key` | Yes | Your project API key (e.g. `mw_xxxxx...`) |
| `Content-Type` | Yes | `application/json` |

### Example Headers

```
Content-Type: application/json
apikey: <ANON_KEY>
x-api-key: <YOUR_API_KEY>
```

---

## Supported Chains

| Chain ID | Label | Network |
|----------|-------|---------|
| ethereum | ETH | Ethereum Mainnet |
| bitcoin | BTC | Bitcoin Mainnet |
| bsc | BSC | Binance Smart Chain |
| solana | SOL | Solana Mainnet |
| solana (SPL) | USDC-SOL | USDC on Solana (SPL Token) |
| tron | TRX | Tron Mainnet |
| tron (TRC20) | USDT-TRC20 | USDT on Tron (TRC20 Token) |

---

## Endpoints

All endpoints use query parameter `action` to specify the operation.

---

### 1. Get Mother Wallet Addresses

Returns the master wallet addresses for all supported chains.

**Request:**
```
GET ?action=get-mother-wallet
```

**Response:**
```json
[
  {
    "chain": "ETH",
    "address": "0x66421f59a3f4efac97f8c5b4878de23d8fdcd691",
    "xpub": "xpub6D..."
  },
  {
    "chain": "BTC",
    "address": "bc1q56pe64nep525uqkwrtda2wpuccpgzhqqvwl3t9",
    "xpub": "xpub6C..."
  }
]
```

---

### 2. Get Balance

Fetch the balance of a specific address on a given chain.

**Request:**
```
GET ?action=get-balance&chain=ETH&address=0x66421f...
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| chain | string | Yes | Chain label: ETH, BTC, BSC, SOL, TRX, USDC-SOL, USDT-TRC20 |
| address | string | Yes | Wallet address to check |

**Response:**
```json
{
  "balance": "0.05"
}
```

> **Note:** Unactivated accounts (e.g. new TRX addresses) will return `{"balance": "0"}` instead of an error.

---

### 3. Generate User Wallet

Create a new HD-derived child wallet for a user on a specific chain.

**Request:**
```
POST ?action=generate-user-wallet
```

**Body:**
```json
{
  "chain": "ETH",
  "derivationIndex": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chain | string | Yes | Chain label (ETH, BTC, etc.) |
| derivationIndex | number | Yes | HD derivation index (unique per user) |

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "chain": "ETH",
  "address": "0xabc123...",
  "xpub": "xpub6D...",
  "label": "User Wallet #1",
  "project_id": "uuid",
  "created_at": "2026-02-17T00:00:00Z"
}
```

> **Tip:** Use a unique `derivationIndex` per user (e.g. auto-incrementing counter) to ensure each user gets a unique address.

---

### 4. Send Transaction

Send cryptocurrency from a wallet address to another.

**Request:**
```
POST ?action=send-transaction
```

**Body:**
```json
{
  "chain": "ETH",
  "fromAddress": "0x66421f...",
  "toAddress": "0xRecipient...",
  "amount": "0.01"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chain | string | Yes | Chain label: ETH, BTC, BSC, SOL, TRX, USDC-SOL, USDT-TRC20 |
| fromAddress | string | Yes | Sender address (must be a derived wallet) |
| toAddress | string | Yes | Recipient address |
| amount | string | Yes | Amount to send (in native currency or token units) |

**Response:**
```json
{
  "txId": "0xabc123...",
  "transaction": {
    "id": "uuid",
    "tx_hash": "0xabc123...",
    "from_address": "0x66421f...",
    "to_address": "0xRecipient...",
    "amount": "0.01",
    "chain": "ETH",
    "status": "completed",
    "direction": "outgoing",
    "created_at": "2026-02-17T00:00:00Z"
  }
}
```

---

### 5. List Wallets

List all wallets belonging to the authenticated user/project.

**Request:**
```
GET ?action=list-wallets
```

**Response:**
```json
[
  {
    "id": "uuid",
    "chain": "ETH",
    "address": "0xabc...",
    "label": "User Wallet #1",
    "created_at": "2026-02-17T00:00:00Z"
  }
]
```

---

### 6. Get Transactions

Retrieve transaction history, optionally filtered by wallet.

**Request:**
```
GET ?action=get-transactions
GET ?action=get-transactions&walletId=<WALLET_UUID>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| walletId | string | No | Filter by specific wallet ID |

**Response:**
```json
[
  {
    "id": "uuid",
    "wallet_id": "uuid",
    "tx_hash": "0xabc...",
    "from_address": "0x...",
    "to_address": "0x...",
    "amount": "0.01",
    "chain": "ETH",
    "status": "completed",
    "direction": "outgoing",
    "created_at": "2026-02-17T00:00:00Z"
  }
]
```

---

### 7. Delete Wallet

Delete a user wallet by ID.

**Request:**
```
GET ?action=delete-wallet&walletId=<WALLET_UUID>
```

**Response:**
```json
{
  "success": true
}
```

---

## Webhooks

Webhooks allow your project to receive real-time HTTP POST notifications when deposits and withdrawals occur.

### 8. Register Webhook

**Request:**
```
POST ?action=register-webhook
```

**Body:**
```json
{
  "url": "https://your-app.com/webhooks/wallet",
  "events": ["deposit", "withdrawal"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "url": "https://your-app.com/webhooks/wallet",
  "secret": "a1b2c3d4e5f6...",
  "events": ["deposit", "withdrawal"],
  "is_active": true,
  "created_at": "2026-02-17T00:00:00Z"
}
```

> **Important:** Save the `secret` — it's used to verify webhook signatures via HMAC-SHA256.

---

### 9. List Webhooks

**Request:**
```
GET ?action=list-webhooks
```

**Response:**
```json
[
  {
    "id": "uuid",
    "url": "https://your-app.com/webhooks/wallet",
    "events": ["deposit", "withdrawal"],
    "is_active": true
  }
]
```

---

### 10. Delete Webhook

**Request:**
```
GET ?action=delete-webhook&webhookId=<WEBHOOK_UUID>
```

---

### 11. Test Webhook

Send a test payload to verify your endpoint is receiving webhooks correctly.

**Request:**
```
GET ?action=test-webhook&webhookId=<WEBHOOK_UUID>
```

**Response:**
```json
{
  "success": true,
  "status_code": 200
}
```

---

### Webhook Payload Format

When a deposit or withdrawal event occurs, your endpoint receives a POST request:

```json
{
  "event": "withdrawal",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "tx_hash": "0xabc123...",
    "chain": "ETH",
    "from_address": "0x...",
    "to_address": "0x...",
    "amount": "0.01",
    "status": "completed"
  }
}
```

### Verifying Webhook Signatures

Each webhook request includes an `X-Webhook-Signature` header containing an HMAC-SHA256 hex digest of the request body, signed with your webhook secret.

**Node.js verification example:**
```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your Express handler:
app.post('/webhooks/wallet', (req, res) => {
  const sig = req.headers['x-webhook-signature'];
  const valid = verifyWebhook(JSON.stringify(req.body), sig, YOUR_WEBHOOK_SECRET);
  if (!valid) return res.status(401).send('Invalid signature');
  
  const { event, data } = req.body;
  console.log(`Received ${event}:`, data);
  res.status(200).send('OK');
});
```

**Python verification example:**
```python
import hmac, hashlib

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

---

## Error Handling

All errors return a JSON object with an `error` field:

```json
{
  "error": "Error message description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad request (unknown action) |
| 401 | Unauthorized (invalid or missing API key) |
| 500 | Internal server error |

---

## Quick Start Example (JavaScript)

```javascript
const BASE_URL = "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api";
const ANON_KEY = "<YOUR_ANON_KEY>";
const API_KEY = "<YOUR_API_KEY>";

async function walletApi(action, params = {}, body = null) {
  const qp = new URLSearchParams({ action, ...params });
  const options = {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "x-api-key": API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}?${qp}`, options);
  return res.json();
}

// Get mother wallet addresses
const addresses = await walletApi("get-mother-wallet");

// Check ETH balance
const balance = await walletApi("get-balance", {
  chain: "ETH",
  address: "0x66421f..."
});

// Generate a user wallet
const wallet = await walletApi("generate-user-wallet", {}, {
  chain: "ETH",
  derivationIndex: 1
});

// Send a transaction
const tx = await walletApi("send-transaction", {}, {
  chain: "ETH",
  fromAddress: "0x...",
  toAddress: "0x...",
  amount: "0.01"
});
```

---

## Quick Start Example (Python)

```python
import requests

BASE_URL = "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api"
HEADERS = {
    "Content-Type": "application/json",
    "apikey": "<YOUR_ANON_KEY>",
    "x-api-key": "<YOUR_API_KEY>",
}

# Get mother wallet
r = requests.get(f"{BASE_URL}?action=get-mother-wallet", headers=HEADERS)
print(r.json())

# Get balance
r = requests.get(f"{BASE_URL}?action=get-balance&chain=ETH&address=0x...", headers=HEADERS)
print(r.json())

# Generate user wallet
r = requests.post(
    f"{BASE_URL}?action=generate-user-wallet",
    headers=HEADERS,
    json={"chain": "ETH", "derivationIndex": 1}
)
print(r.json())
```

---

## Quick Start Example (cURL)

```bash
# Get mother wallet
curl -H "apikey: <ANON_KEY>" -H "x-api-key: <API_KEY>" \
  "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api?action=get-mother-wallet"

# Get balance
curl -H "apikey: <ANON_KEY>" -H "x-api-key: <API_KEY>" \
  "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api?action=get-balance&chain=ETH&address=0x..."

# Generate user wallet
curl -X POST -H "apikey: <ANON_KEY>" -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"chain":"ETH","derivationIndex":1}' \
  "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api?action=generate-user-wallet"
```

---

## Integration Checklist

- [ ] Obtain your `apikey` (anon key) and `x-api-key` (project API key)
- [ ] Test authentication with `get-mother-wallet`
- [ ] Generate user wallets with unique derivation indexes
- [ ] Implement balance checking for deposit confirmation
- [ ] Implement send-transaction for withdrawals
- [ ] Set up transaction history polling or tracking

---

*Last updated: February 2026*
