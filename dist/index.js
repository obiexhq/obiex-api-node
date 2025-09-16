"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategory = exports.ServerError = exports.ObiexClient = void 0;
const utils_1 = require("./utils");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const cache_1 = require("./cache");
const server_1 = require("./errors/server");
class ObiexClient {
    constructor({ apiKey, apiSecret, sandboxMode = false }) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        const baseURL = sandboxMode
            ? "https://staging.api.obiex.finance"
            : "https://api.obiex.finance";
        this.client = axios_1.default.create({ baseURL });
        this.client.interceptors.request.use((c) => this.requestConfig(c));
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.data) {
                return Promise.reject(new server_1.ServerError(error.response.message, error.response.data, error.response.status));
            }
            return Promise.reject(error);
        });
        this.cacheService = new cache_1.CacheService();
    }
    requestConfig(requestConfig) {
        let url = requestConfig.url, params = requestConfig.params;
        params = (0, utils_1.removeEmptyValue)(params);
        params = (0, utils_1.buildQueryString)(params);
        if (params !== "") {
            url = `${url}?${params}`;
        }
        const { timestamp, signature } = this.sign(requestConfig.method, url);
        requestConfig.headers["x-api-timestamp"] = timestamp;
        requestConfig.headers["x-api-signature"] = signature;
        requestConfig.headers["x-api-key"] = this.apiKey;
        return requestConfig;
    }
    sign(method, originalUrl) {
        const timestamp = Date.now();
        const content = `${method.toUpperCase()}${originalUrl}${timestamp}`;
        const signature = (0, crypto_1.createHmac)("sha256", this.apiSecret)
            .update(content)
            .digest("hex");
        return {
            timestamp,
            signature,
        };
    }
    /**
     * Generate a deposit address for a currency. Re-using the same identifier always returns the same address
     * @param currency The currency code eg. BTC, USDT
     * @param identifier A unique identifier you can tie to your users.
     */
    async getDepositAddress(currency, network, identifier) {
        const { data: response } = await this.client.post(`/v1/addresses/broker`, {
            currency,
            network,
            purpose: identifier,
        });
        const { data } = response;
        return {
            address: data.value,
            memo: data.memo,
            network: data.network,
            identifier: data.purpose,
        };
    }
    async getTradePairs() {
        const { data: response } = await this.client.get("/v1/trades/pairs");
        return response.data.map((x) => ({
            id: x.id,
            source: x.source.code,
            target: x.target.code,
            isBuyable: x.isBuyable,
            isSellable: x.isSellable,
        }));
    }
    async getTradePairsByCurrency(currencyId) {
        const { data: response } = await this.client.get(`/v1/currencies/${currencyId}/pairs`);
        return response.data.map((x) => ({
            id: x.id,
            source: x.source.code,
            target: x.target.code,
            isBuyable: x.isBuyable,
            isSellable: x.isSellable,
        }));
    }
    /**
     * Create quote for trade
     * @param source Left hand side for pair i.e. BTC in BTC/USDT
     * @param target Right hand side for trade pair i.e. USDT in BTC/USDT
     * @param side The trade side i.e. BUY: USDT -> BTC & SELL: BTC -> USDT for BTC/USDT
     * @param amount The amount you intend to trade
     * @returns
     */
    async createQuote(source, target, side, amount) {
        const sourceCurrency = await this.getCurrencyByCode(source);
        const targetCurrency = await this.getCurrencyByCode(target);
        const { data: response } = await this.client.post(`/v1/trades/quote`, {
            sourceId: sourceCurrency.id,
            targetId: targetCurrency.id,
            side,
            amount,
        });
        const { data } = response;
        return {
            id: data.id,
            rate: data.rate,
            side: data.side,
            amount: data.amount,
            expiryDate: data.expiryDate,
            amountReceived: data.amountReceived,
        }; // satisfies Quote;
    }
    /**
     * Swap from one currency to another (if you are not interested in verifying prices)
     * @param source Left hand side for pair i.e. BTC in BTC/USDT
     * @param target Right hand side for trade pair i.e. USDT in BTC/USDT
     * @param side The trade side i.e. BUY: USDT -> BTC & SELL: BTC -> USDT for BTC/USDT
     * @param amount The amount you intend to trade
     * @returns
     */
    async trade(source, target, side, amount) {
        const quote = await this.createQuote(source, target, side, amount);
        await this.acceptQuote(quote.id);
        return quote;
    }
    /**
     * Accept quote using provided quote ID
     * @param quoteId Quote ID gotten from createQuote
     * @returns
     */
    async acceptQuote(quoteId) {
        await this.client.post(`/v1/trades/quote/${quoteId}`);
        return true;
    }
    async withdrawCrypto(currencyCode, amount, wallet) {
        const { data: response } = await this.client.post(`/v1/wallets/ext/debit/crypto`, {
            amount,
            currency: currencyCode,
            destination: wallet,
        });
        return response.data;
    }
    async withdrawNaira(amount, account) {
        const { data: response } = await this.client.post(`/v1/wallets/ext/debit/fiat`, {
            amount,
            currency: "NGNX",
            destination: account,
        });
        return response.data;
    }
    async getBanks() {
        const { data: response } = await this.client.get("/v1/ngn-payments/banks");
        return response.data;
    }
    async getCurrencies() {
        return await this.cacheService.getOrSet("currencies", async () => {
            const { data: response } = await this.client.get("/v1/currencies");
            return response.data.map((x) => ({
                id: x.id,
                name: x.name,
                code: x.code,
                receivable: x.receivable,
                withdrawable: x.withdrawable,
                transferrable: x.transferrable,
                minimumDeposit: x.minimumDeposit,
                maximumDailyDeposit: x.maximumDailyDepositLimit,
                maximumDecimalPlaces: x.maximumDecimalPlaces,
            }));
        }, 86400);
    }
    /**
     * @param currencyCode Get networks by currency code
     * @returns Array
     */
    async getNetworks(currencyCode) {
        const currency = await this.getCurrencyByCode(currencyCode);
        const { data: response } = await this.client.get(`/v1/currencies/${currency.id}/networks`);
        return response.data;
    }
    /**
     * @returns
     */
    async getActiveNetworks() {
        const { data: response } = await this.client.get(`/v1/currencies/networks/active`);
        return response.data;
    }
    /**
     *
     * @param page number // default: 1
     * @param pageSize number // default: 30
     * @returns
     */
    async getNairaMerchants(page = 1, pageSize = 30) {
        const { data: response } = await this.client.get(`/v1/ngn-payments/merchants`, {
            params: {
                page,
                pageSize,
            },
        });
        return response.data;
    }
    /**
     *
     * @param page number
     * @param pageSize number
     * @param category TransactionCategory
     * @returns
     */
    async getTransactionHistory(page = 1, pageSize = 30, category) {
        const { data } = await this.client.get(`/v1/transactions/me`, {
            params: {
                page,
                pageSize,
                category,
            },
        });
        return data;
    }
    /**
     *
     * @param page number
     * @param pageSize number
     * @returns
     */
    async getTradeHistory(page = 1, pageSize = 30) {
        const { data } = await this.client.get(`/v1/trades/me`, {
            params: {
                page,
                pageSize,
            },
        });
        return data;
    }
    async getTransactionById(transactionId) {
        const { data } = await this.client.get(`/v1/transactions/${transactionId}`);
        return data;
    }
    async getCurrencyByCode(code) {
        const currencies = await this.getCurrencies();
        return currencies.find((x) => x.code === code);
    }
    async getOrCreateWallet(currencyCode) {
        const { data: response } = await this.client.get(`/v1/wallets/${currencyCode}`);
        return response.data.map((x) => ({
            id: x.id,
            createdAt: x.createdAt,
            updatedAt: x.updatedAt,
            active: x.active,
            availableBalance: x.availableBalance,
            pendingBalance: x.pendingBalance,
            pendingSwapBalance: x.pendingSwapBalance,
            lockedBalance: x.lockedBalance,
            totalSwappableBalance: x.totalSwappableBalance,
            totalPendingBalance: x.totalPendingBalance,
            userId: x.userId,
            currency: {
                id: x.currency.id,
                name: x.currency.name,
                code: x.currency.code,
                receivable: x.currency.receivable,
                withdrawable: x.currency.withdrawable,
                transferrable: x.currency.transferrable,
                minimumDeposit: x.currency.minimumDeposit,
                maximumDeposit: x.currency.maximumDeposit,
                maximumDailyDepositLimit: x.currency.maximumDailyDepositLimit,
                maximumDecimalPlaces: x.currency.maximumDecimalPlaces,
            },
        }));
    }
    /**
     *
     * @param payload BankDepositRequest
     * @returns
     */
    async requestNairaDepositBankAccount({ merchantCode, amount, }) {
        const { data: response } = await this.client.post(`/v1/ngn-payments/deposits`, {
            merchantCode,
            amount,
        });
        return response.data;
    }
    /**
     *
     * @param reference string
     * @returns
     */
    async verifyNairaDeposit(reference) {
        const { data: response } = await this.client.put(`/v1/ngn-payments/deposits/${reference}`);
        return response.data;
    }
    /**
     *
     * @param reference string
     * @returns
     */
    async verifyNairaWithdrawal(reference) {
        const { data: response } = await this.client.put(`/v1/ngn-payments/withdrawals/${reference}`);
        return response.data;
    }
    /**
     *
     * @param bankId string
     * @param accountNumber string
     * @returns FiatBankAccount
     */
    async resolveNairaBankAccount(bankId, accountNumber) {
        const { data: response } = await this.client.get(`/v1/ngn-payments/accounts/resolve`, {
            params: {
                bankId,
                accountNumber,
            },
        });
        return response.data;
    }
}
exports.ObiexClient = ObiexClient;
var server_2 = require("./errors/server");
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return server_2.ServerError; } });
var TransactionCategory_1 = require("./enums/TransactionCategory");
Object.defineProperty(exports, "TransactionCategory", { enumerable: true, get: function () { return TransactionCategory_1.TransactionCategory; } });
//# sourceMappingURL=index.js.map