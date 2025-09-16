import { Network, Options, BankAccountPayout, CryptoAccountPayout, Wallet, FiatMerchant, Banks, BankDepositRequest, FiatBankAccount, NairaPayment, ActiveNetworkCurrencyMap } from "./types";
import { TransactionCategory } from "./enums/TransactionCategory";
export declare class ObiexClient {
    private client;
    private apiKey;
    private apiSecret;
    private cacheService;
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
    }>;
    /**
     * Accept quote using provided quote ID
     * @param quoteId Quote ID gotten from createQuote
     * @returns
     */
    acceptQuote(quoteId: string): Promise<boolean>;
    withdrawCrypto(currencyCode: string, amount: number, wallet: CryptoAccountPayout): Promise<any>;
    withdrawNaira(amount: number, account: BankAccountPayout): Promise<any>;
    getBanks(): Promise<Banks[]>;
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
     * @returns
     */
    getActiveNetworks(): Promise<ActiveNetworkCurrencyMap>;
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
    getTransactionHistory(page?: number, pageSize?: number, category?: TransactionCategory): Promise<any>;
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
}
export { ServerError } from "./errors/server";
export { TransactionCategory } from "./enums/TransactionCategory";
export { Currency, Network, Options, Quote, Response, TradePair, BankAccountPayout, CryptoAccountPayout, Wallet, FiatMerchant, Banks, BankDepositRequest, FiatBankAccount, } from "./types";
