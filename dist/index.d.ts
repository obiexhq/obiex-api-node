/// <reference types="node" />
/// <reference types="node" />
import { Network, Options, TradePair, BankAccountPayout, CryptoAccountPayout, Wallet, FiatMerchant, Banks, BankDepositRequest, FiatBankAccount, NairaPayment, DepositAddress, TradableCurrency, GhsBank, GhsMobileNetwork, TradesSummary, TransactionFilter, CreateInvoiceRequest, Invoice, InvoiceFilter } from "./types";
import { TransactionCategory } from "./enums/TransactionCategory";
export declare class ObiexClient {
    private readonly client;
    private readonly apiKey;
    private readonly apiSecret;
    private readonly cacheService;
    constructor({ apiKey, apiSecret, sandboxMode }: Options);
    private requestConfig;
    private sign;
    /**
     * Generate a deposit address for a currency. Re-using the same identifier always returns the same address
     * @param currency The currency code eg. BTC, USDT
     * @param identifier A unique identifier you can tie to your users.
     */
    getDepositAddress(currency: string, network: string, identifier: string): Promise<{
        address: any;
        memo: any;
        network: any;
        identifier: any;
    }>;
    getTradePairs(): Promise<{
        id: string;
        source: string;
        target: string;
        isBuyable: boolean;
        isSellable: boolean;
    }[]>;
    getTradePairsByCurrency(currencyId: string): Promise<{
        id: string;
        source: string;
        target: string;
        isBuyable: boolean;
        isSellable: boolean;
    }[]>;
    /**
     * Create quote for trade
     * @param source Left hand side for pair i.e. BTC in BTC/USDT
     * @param target Right hand side for trade pair i.e. USDT in BTC/USDT
     * @param side The trade side i.e. BUY: USDT -> BTC & SELL: BTC -> USDT for BTC/USDT
     * @param amount The amount you intend to trade
     * @returns
     */
    createQuote(source: string, target: string, side: "BUY" | "SELL", amount: number): Promise<{
        id: any;
        rate: any;
        side: any;
        amount: any;
        expiryDate: any;
        amountReceived: any;
        sourceCurrency: string;
        targetCurrency: string;
        sourceId: string;
        targetId: string;
        expiresIn: any;
    }>;
    /**
     * Swap from one currency to another (if you are not interested in verifying prices)
     * @param source Left hand side for pair i.e. BTC in BTC/USDT
     * @param target Right hand side for trade pair i.e. USDT in BTC/USDT
     * @param side The trade side i.e. BUY: USDT -> BTC & SELL: BTC -> USDT for BTC/USDT
     * @param amount The amount you intend to trade
     * @returns
     */
    trade(source: string, target: string, side: "BUY" | "SELL", amount: number): Promise<{
        id: any;
        rate: any;
        side: any;
        amount: any;
        expiryDate: any;
        amountReceived: any;
        sourceCurrency: string;
        targetCurrency: string;
        sourceId: string;
        targetId: string;
        expiresIn: any;
    }>;
    /**
     * Accept quote using provided quote ID
     * @param quoteId Quote ID gotten from createQuote
     * @returns
     */
    acceptQuote(quoteId: string): Promise<boolean>;
    withdrawCrypto(currencyCode: string, amount: number, wallet: CryptoAccountPayout): Promise<any>;
    withdrawFiat(amount: number, currency: string, account: BankAccountPayout): Promise<any>;
    getNGNBanks(): Promise<Banks[]>;
    getCurrencies(): Promise<{
        id: string;
        name: string;
        code: string;
        receivable: boolean;
        withdrawable: boolean;
        transferrable: boolean;
        minimumDeposit: number;
        maximumDailyDeposit: number;
        maximumDecimalPlaces: number;
    }[]>;
    /**
     * @param currencyCode Get networks by currency code
     * @returns Array
     */
    getNetworks(currencyCode: string): Promise<Network[]>;
    /**
     *
     * @param page number // default: 1
     * @param pageSize number // default: 30
     * @returns
     */
    getNairaMerchants(page?: number, pageSize?: number): Promise<FiatMerchant[]>;
    /**
     *
     * @param page number
     * @param pageSize number
     * @param category TransactionCategory
     * @returns
     */
    getTransactionHistory({ page, pageSize, category, }: {
        page?: number;
        pageSize?: number;
        category?: TransactionCategory;
    }): Promise<any>;
    /**
     *
     * @param page number
     * @param pageSize number
     * @returns
     */
    getTradeHistory(page?: number, pageSize?: number): Promise<any>;
    getTransactionById(transactionId: string): Promise<any>;
    getCurrencyByCode(code: string): Promise<{
        id: string;
        name: string;
        code: string;
        receivable: boolean;
        withdrawable: boolean;
        transferrable: boolean;
        minimumDeposit: number;
        maximumDailyDeposit: number;
        maximumDecimalPlaces: number;
    }>;
    getOrCreateWallet(currencyCode: string): Promise<Wallet>;
    /**
     *
     * @param payload BankDepositRequest
     * @returns
     */
    requestNairaDepositBankAccount({ merchantCode, amount, }: BankDepositRequest): Promise<NairaPayment>;
    /**
     *
     * @param reference string
     * @returns
     */
    verifyNairaDeposit(reference: string): Promise<any>;
    /**
     *
     * @param reference string
     * @returns
     */
    verifyNairaWithdrawal(reference: string): Promise<any>;
    /**
     *
     * @param bankId string
     * @param accountNumber string
     * @returns FiatBankAccount
     */
    resolveNairaBankAccount(bankId: string, accountNumber: string): Promise<FiatBankAccount[]>;
    /**
     * Get all broker deposit addresses for the authenticated user
     */
    getDepositAddresses(): Promise<DepositAddress[]>;
    /**
     * Create deposit address for the authenticated user
     */
    createDepositAddress({ currency, network, uniqueUserIdentifier, }: {
        currency: string;
        network: string;
        uniqueUserIdentifier: string;
    }): Promise<DepositAddress>;
    /**
     * Get a single trade pair by source and target currency codes
     * @param sourceCode e.g. "USDT"
     * @param targetCode e.g. "NGNX"
     */
    getTradePair(sourceCode: string, targetCode: string): Promise<TradePair>;
    /**
     * Get user's trade volume summary
     * @param currencyId Optional currency ID to filter by
     * @param page number
     * @param pageSize number
     */
    getUserTradesSummary(currencyId?: string, page?: number, pageSize?: number): Promise<TradesSummary>;
    /**
     * Get all tradeable currencies with their associated pairs
     */
    getTradableCurrencies(): Promise<TradableCurrency[]>;
    /**
     * Get all wallets for the authenticated user
     */
    getWallets(): Promise<Wallet[]>;
    /**
     * Get the wallet balance for a specific currency
     * @param currencyCode e.g. "USDT", "BTC"
     */
    getWalletBalance(currencyCode: string): Promise<Wallet>;
    /**
     * Get list of banks available for GHS (Ghana Cedis) withdrawal
     */
    getGhsBanks(): Promise<GhsBank[]>;
    /**
     * Get list of mobile money networks available for GHS withdrawal
     */
    getGhsMobileNetworks(): Promise<GhsMobileNetwork[]>;
    /**
     * Resolve a GHS bank account or mobile money number
     * @param bankCode Bank sort code or mobile network code e.g. "VOD", "MTN"
     * @param accountNumber Account or phone number
     */
    resolveGhsBankAccount(bankCode: string, accountNumber: string): Promise<FiatBankAccount>;
    /**
     * Get deposit (incoming) transactions for the authenticated user
     */
    getDepositTransactions({ page, pageSize, currencyId, status, startDate, endDate, }?: TransactionFilter): Promise<any>;
    /**
     * Get payout (withdrawal) transactions for the authenticated user
     */
    getPayoutTransactions({ page, pageSize, currencyId, status, startDate, endDate, }?: TransactionFilter): Promise<any>;
    /**
     * Resend webhook for a single transaction
     * @param transactionId The transaction ID
     */
    resendWebhook(transactionId: string): Promise<boolean>;
    /**
     * Resend webhooks for multiple transactions
     * @param transactionIds Array of transaction IDs
     */
    resendWebhooks(transactionIds: string[]): Promise<boolean>;
    getActiveNetworks(): Promise<Banks[]>;
    /**
     * Upload an invoice document (JPEG, PNG, or PDF, max 1 MB).
     * Returns a URL to pass into createInvoice.
     * @param file A Buffer or Readable stream of the file
     * @param filename Original filename e.g. "invoice.pdf"
     * @param mimeType e.g. "application/pdf", "image/jpeg", "image/png"
     */
    uploadInvoiceDocument(file: Buffer | NodeJS.ReadableStream, filename: string, mimeType: string): Promise<string>;
    /**
     * Create an invoice for USD settlement.
     * Returns a virtual NGN bank account to pay into (valid for 30 minutes).
     */
    createInvoice(payload: CreateInvoiceRequest): Promise<Invoice>;
    /**
     * Get a paginated list of your invoices.
     */
    getInvoices({ status, startDate, endDate, page, pageSize, }?: InvoiceFilter): Promise<any>;
    /**
     * Get a single invoice by ID.
     */
    getInvoiceById(invoiceId: string): Promise<Invoice>;
}
export { ServerError } from "./errors/server";
export { TransactionCategory } from "./enums/TransactionCategory";
export { Currency, Network, Options, Quote, Response, TradePair, BankAccountPayout, CryptoAccountPayout, Wallet, FiatMerchant, Banks, BankDepositRequest, FiatBankAccount, DepositAddress, TradableCurrency, GhsBank, GhsMobileNetwork, TradesSummary, TransactionFilter, CreateInvoiceRequest, Invoice, InvoiceFilter, InvoiceStatus, } from "./types";
