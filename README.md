# obiex-api-node

An API wrapper for the [Obiex](https://obiex.finance) API. Build crypto payment experiences — collections, payouts, trading, invoice settlement — with a simple, typed interface.

## Requirements

- Node.js 16+
- An Obiex API key and secret ([sign up](https://obiex.finance) or use the [staging environment](https://staging.app.obiex.finance/auth/signup) for testing)

## Installation

```bash
npm install obiex-api
```

## Quick Start

```ts
import { ObiexClient } from 'obiex-api';

const client = new ObiexClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  sandboxMode: true, // use false in production
});

// Get a deposit address
const address = await client.getDepositAddress('USDT', 'TRX', 'user-123');

// Swap currencies
const quote = await client.createQuote('USDT', 'BTC', 'BUY', 100);
await client.acceptQuote(quote.id);
```

## Environments

| Environment | `sandboxMode` | Base URL |
|---|---|---|
| Staging | `true` | `https://staging.api.obiex.finance` |
| Production | `false` | `https://api.obiex.finance` |

Use staging for all development and testing — no real funds are involved.

## Authentication

All requests are signed automatically using your API key and secret. You can generate credentials from your Obiex dashboard under **API Keys**.

```ts
const client = new ObiexClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  sandboxMode: true,
});
```

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | Yes | Your API key |
| `apiSecret` | `string` | Yes | Your API secret |
| `sandboxMode` | `boolean` | No | Defaults to `false` |

## API Reference

### Collections (Deposit Addresses)

```ts
// Generate a deposit address for a user
const address = await client.getDepositAddress('USDT', 'TRX', 'user-identifier');

// Get all broker deposit addresses
const addresses = await client.getDepositAddresses();
```

### Trading

```ts
// Get all trade pairs
const pairs = await client.getTradePairs();

// Get a specific pair
const pair = await client.getTradePair('USDT', 'NGNX');

// Get pairs for a currency
const pairs = await client.getTradePairsByCurrency(currencyId);

// Get tradeable currencies (with their pairs)
const currencies = await client.getTradableCurrencies();

// Create a quote (locks in a rate for 30 seconds)
const quote = await client.createQuote('USDT', 'BTC', 'BUY', 100);

// Accept a quote
await client.acceptQuote(quote.id);

// Swap in one step (creates and accepts a quote)
await client.trade('USDT', 'BTC', 'BUY', 100);
// or equivalently:
await client.directSwap('USDT', 'BTC', 'BUY', 100);

// Get trade history
const history = await client.getTradeHistory(1, 30);

// Get trade volume summary
const summary = await client.getUserTradesSummary();
```

### Wallets

```ts
// Get wallet balance for a specific currency
const wallet = await client.getWalletBalance('USDT');

// Get all wallets
const wallets = await client.getWallets();
```

### Payouts (Withdrawals)

```ts
// Withdraw crypto
await client.withdrawCrypto('BTC', 0.001, {
  address: 'bc1q...',
  network: 'BTC',
});

// Withdraw NGN to a bank account
await client.withdrawNaira(10000, {
  accountNumber: '0123456789',
  accountName: 'John Doe',
  bankName: 'GTBank',
  bankCode: '058',
  merchantCode: 'merchant-code',
});

// NGN bank helpers
const banks = await client.getBanks();
const resolved = await client.resolveNairaBankAccount(bankId, accountNumber);

// GHS bank helpers
const ghsBanks = await client.getGhsBanks();
const mobileNetworks = await client.getGhsMobileNetworks();
const resolvedGhs = await client.resolveGhsBankAccount('VOD', '0207333672');
```

### NGN Deposits

```ts
// Get a virtual bank account to deposit NGN into
const merchants = await client.getNairaMerchants();
const payment = await client.requestNairaDepositBankAccount({
  merchantCode: merchants[0].code,
  amount: 50000,
});

// Verify a deposit or withdrawal
await client.verifyNairaDeposit(reference);
await client.verifyNairaWithdrawal(reference);
```

### Currencies & Networks

```ts
// Get all supported currencies
const currencies = await client.getCurrencies();

// Find a currency by code
const usdt = await client.getCurrencyByCode('USDT');

// Get withdrawal networks for a currency
const networks = await client.getNetworks('USDT');
```

### Transactions

```ts
// All transactions
const transactions = await client.getTransactionHistory(1, 30, TransactionCategory.DEPOSIT);

// Deposits only
const deposits = await client.getDepositTransactions({ page: 1, pageSize: 30 });

// Withdrawals only
const payouts = await client.getPayoutTransactions({
  status: 'COMPLETED',
  startDate: '2025-01-01',
  endDate: '2025-06-01',
});

// Single transaction
const transaction = await client.getTransactionById(transactionId);

// Resend webhooks
await client.resendWebhook(transactionId);
await client.resendWebhooks([id1, id2, id3]);
```

### Invoice Settlement

Settle USD invoices by having payers fund a virtual NGN account.

```ts
// 1. Upload the invoice document (JPEG, PNG, or PDF — max 1 MB)
const docUrl = await client.uploadInvoiceDocument(
  fs.readFileSync('./invoice.pdf'),
  'invoice.pdf',
  'application/pdf'
);

// 2. Create the invoice — returns a virtual NGN account valid for 30 minutes
const invoice = await client.createInvoice({
  targetAmount: 1000,       // amount in target currency
  source: 'NGN',
  target: 'USD',
  purposeOfPayment: 'Payment for software services',
  invoiceDocument: docUrl,
  destination: {
    accountName: 'Acme Corp',
    accountNumber: '12345678901',
    swiftCode: 'FIBKUS33XXX',
    bankName: 'First International Bank',
    bankCode: 'FIBK',
    bankCountry: 'US',
    bankAddress: '123 Main Street, New York, NY 10001',
    beneficiaryName: 'Acme Corp',
    beneficiaryAddress: '456 Business Ave, San Francisco, CA 94105',
    beneficiaryCountryCode: 'US',
    beneficiaryCountryOfResidence: 'United States',
  },
});


// 3. Retrieve invoices
const invoices = await client.getInvoices({ status: 'PENDING', page: 1 });
const single = await client.getInvoiceById(invoice.id);
```

## Error Handling

Failed requests throw a `ServerError` with the API's response details:

```ts
import { ServerError } from 'obiex-api';

try {
  await client.withdrawCrypto('BTC', 999999, { address: '...', network: 'BTC' });
} catch (err) {
  if (err instanceof ServerError) {
    console.log(err.statusCode); // e.g. 400
    console.log(err.data);       // API error payload
  }
}
```

## Links

- [API Documentation](https://developer.obiex.finance)
- [Staging Sign Up](https://staging.app.obiex.finance/auth/signup)
- [Production Sign Up](https://obiex.finance)
