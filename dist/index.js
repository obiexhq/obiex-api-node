"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategory = exports.ServerError = exports.ObiexClient = void 0;
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
            if (error.response && error.response.data) {
                return Promise.reject(new server_1.ServerError(error.response.message, error.response.data, error.response.status));
            }
            return Promise.reject(error);
        });
        this.cacheService = new cache_1.CacheService();
    }
    requestConfig(requestConfig) {
        const { timestamp, signature } = this.sign(requestConfig.method, requestConfig.url);
        requestConfig.headers["Content-Type"] = "application/json";
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
            purpose: identifier
        });
        const { data } = response;
        return {
            address: data.value,
            memo: data.memo,
            network: data.network,
            identifier: data.purpose
        };
    }
    async getTradePairs() {
        const { data } = await this.client.get("/v1/trades/pairs");
        return data;
    }
    async getTradePairsByCurrency(currencyId) {
        const { data } = await this.client.get(`/v1/currencies/${currencyId}/pairs`);
        return data;
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
        const { data } = await this.client.post(`/v1/trades/quote`, {
            sourceId: sourceCurrency.id,
            targetId: targetCurrency.id,
            side,
            amount,
        });
        return data;
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
        return await this.acceptQuote(quote.id);
    }
    /**
     * Accept quote using provided quote ID
     * @param quoteId Quote ID gotten from createQuote
     * @returns
     */
    async acceptQuote(quoteId) {
        const { data } = await this.client.post(`/v1/trades/quote/${quoteId}`);
        return data;
    }
    async withdrawCrypto(currencyCode, amount, wallet) {
        const { data } = await this.client.post(`/v1/wallets/ext/debit/crypto`, {
            amount,
            currency: currencyCode,
            destination: wallet,
        });
        return data;
    }
    async withdrawNaira(amount, account) {
        const { data } = await this.client.post(`/v1/wallets/ext/debit/fiat`, {
            amount,
            currency: 'NGNX',
            destination: account,
        });
        return data;
    }
    async getBanks() {
        const { data } = await this.client.get("/v1/ngn-payments/banks");
        return data;
    }
    async getCurrencies() {
        return this.cacheService.getOrSet("currencies", async () => {
            const { data } = await this.client.get("/v1/currencies");
            return data;
        }, 86400 // 24 Hours
        );
    }
    async getNetworks(currencyCode) {
        const currency = await this.getCurrencyByCode(currencyCode);
        const { data } = await this.client.get(`/v1/currencies/${currency.id}/networks`);
        return data;
    }
    /**
     *
     * @param page number // default: 1
     * @param pageSize number // default: 30
     * @returns
     */
    async getNairaMerchants(page = 1, pageSize = 30) {
        const { data } = await this.client.get(`/v1/ngn-payments/merchants?page$=${page}&pageSize=${pageSize}`);
        return data;
    }
    /**
     *
     * @param page number
     * @param pageSize number
     * @param category TransactionCategory
     * @returns
     */
    async getTransactionHistory(page = 1, pageSize = 30, category) {
        const { data } = await this.client.get(`/v1/transactions/me?page=${page}&pageSize=${pageSize}&category=${category ? category : ""}`);
        return data;
    }
    /**
     *
     * @param page number
     * @param pageSize number
     * @returns
     */
    async getTradeHistory(page = 1, pageSize = 30) {
        const { data } = await this.client.get(`/v1/trades/me?page=${page}&pageSize=${pageSize}`);
        return data;
    }
    async getTransactionById(transactionId) {
        const { data } = await this.client.get(`/v1/transactions/${transactionId}`);
        return data;
    }
    async getTradeById(tradeId) {
        const trades = await this.getTradeHistory();
        return trades.find((x) => x.id === tradeId);
    }
    async getCurrencyByCode(code) {
        const currencies = await this.getCurrencies();
        return currencies.find((x) => x.code === code);
    }
}
exports.ObiexClient = ObiexClient;
var server_2 = require("./errors/server");
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return server_2.ServerError; } });
var TransactionCategory;
(function (TransactionCategory) {
    TransactionCategory["DEPOSIT"] = "DEPOSIT";
    TransactionCategory["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionCategory["SWAP"] = "SWAP";
    TransactionCategory["TRANSFER"] = "TRANSFER";
})(TransactionCategory = exports.TransactionCategory || (exports.TransactionCategory = {}));
//# sourceMappingURL=index.js.map