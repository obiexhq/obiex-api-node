import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { createHmac } from "crypto";
import { CacheService } from "./cache";

export class ObiexClient {
  private client: AxiosInstance;
  apiKey: string;
  apiSecret: string;

  cacheService: CacheService;

  constructor(apiKey: string, apiSecret: string, sandboxMode: boolean) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    const baseURL = sandboxMode
      ? "https://staging.api.obiex.finance"
      : "https://api.obiex.finance";

    this.client = axios.create({ baseURL });

    this.client.interceptors.request.use((c) => this.requestConfig(c));

    this.cacheService = new CacheService();
  }

  private requestConfig(requestConfig: AxiosRequestConfig) {
    const { timestamp, signature } = this.sign(
      requestConfig.method,
      requestConfig.url
    );

    requestConfig.headers["Content-Type"] = "application/json";
    requestConfig.headers["x-api-timestamp"] = timestamp;
    requestConfig.headers["x-api-signature"] = signature;
    requestConfig.headers["x-api-key"] = this.apiKey;

    return requestConfig;
  }

  private sign(method: string, originalUrl: string) {
    const timestamp = Date.now();

    const content = `${method.toUpperCase()}${originalUrl}${timestamp}`;

    const signature = createHmac("sha256", this.apiSecret)
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
  async getDepositAddress(currency: string, network: string, identifier: string) {
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

  async getTradePairsByCurrency(currencyId: string) {
    const { data } = await this.client.get(
      `/v1/currencies/${currencyId}/pairs`
    );

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
  async createQuote(
    source: string,
    target: string,
    side: "BUY" | "SELL",
    amount: number
  ) {
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
  async trade(
    source: string,
    target: string,
    side: "BUY" | "SELL",
    amount: number
  ) {
    const quote = await this.createQuote(source, target, side, amount);
    
    return await this.acceptQuote(quote.id);
  }

  /**
   * Accept quote using provided quote ID
   * @param quoteId Quote ID gotten from createQuote
   * @returns 
   */
  async acceptQuote(quoteId: string) {
    const { data } = await this.client.post(`/v1/trades/quote/${quoteId}`);

    return data;
  }

  async withdrawCrypto(
    currencyCode: string,
    amount: number,
    wallet: CryptoAccountPayout
  ) {
    const { data } = await this.client.post(`/v1/wallets/ext/debit/crypto`, {
      amount,
      currency: currencyCode,
      destination: wallet,
    });

    return data;
  }

  async withdrawNaira(
    amount: number,
    account: BankAccountPayout
  ) {
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
    return this.cacheService.getOrSet(
      "currencies",
      async () => {
        const { data } = await this.client.get("/v1/currencies");

        return data;
      },
      86400 // 24 Hours
    );
  }

  async getNetworks(currencyCode: string) {
    const currency = await this.getCurrencyByCode(currencyCode);

    const { data } = await this.client.get(
      `/v1/currencies/${currency.id}/networks`
    );

    return data;
  }

  /**
   *
   * @param page number // default: 1
   * @param pageSize number // default: 30
   * @returns
   */
  async getNairaMerchants(page = 1, pageSize = 30) {
    const { data } = await this.client.get(
      `/v1/ngn-payments/merchants?page$=${page}&pageSize=${pageSize}`
    );

    return data;
  }

  /**
   *
   * @param page number
   * @param pageSize number
   * @param category TransactionCategory
   * @returns
   */
  async getTransactionHistory(
    page = 1,
    pageSize = 30,
    category?: TransactionCategory
  ) {
    const { data } = await this.client.get(
      `/v1/transactions/me?page=${page}&pageSize=${pageSize}&category=${
        category ? category : ""
      }`
    );

    return data;
  }

  /**
   *
   * @param page number
   * @param pageSize number
   * @returns
   */
  async getTradeHistory(page = 1, pageSize = 30) {
    const { data } = await this.client.get(
      `/v1/trades/me?page=${page}&pageSize=${pageSize}`
    );

    return data;
  }

  async getTransactionById(transactionId: string) {
    const { data } = await this.client.get(`/v1/transactions/${transactionId}`);

    return data;
  }

  async getTradeById(tradeId: string) {
    const trades = await this.getTradeHistory();

    return trades.find((x) => x.id === tradeId);
  }

  async getCurrencyByCode(code: string) {
    const currencies = await this.getCurrencies();

    return currencies.find((x) => x.code === code);
  }
}

export interface BankAccountPayout {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  pagaBankCode: string;
  merchantCode: string;
}

export interface CryptoAccountPayout {
  address: string;
  network: string;
  memo?: string;
}

export enum TransactionCategory {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  SWAP = "SWAP",
  TRANSFER = "TRANSFER",
}
