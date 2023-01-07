import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { createHmac } from "crypto";

export class ObiexClient {
  private client: AxiosInstance;
  apiKey: string;
  apiSecret: string;

  constructor(apiKey: string, apiSecret: string, sandboxMode: boolean) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    const baseURL = sandboxMode
      ? "https://staging.api.obiex.finance/v1"
      : "https://api.obiex.finance/v1";

    this.client = axios.create({ baseURL });

    this.client.interceptors.request.use((c) => this.requestConfig(c));
  }

  /**
   * NOTE: The array conversion logic is different from usual query string.
   * E.g. symbols=["BTCUSDT","BNBBTC"] instead of symbols[]=BTCUSDT&symbols[]=BNBBTC
   */
  stringifyKeyValuePair = ([key, value]) => {
    const valueString = Array.isArray(value)
      ? `["${value.join('","')}"]`
      : value;
    return `${key}=${encodeURIComponent(valueString)}`;
  };

  buildQueryString = (params) => {
    if (!params) return "";

    return Object.entries(params).map(this.stringifyKeyValuePair).join("&");
  };

  private requestConfig(requestConfig: AxiosRequestConfig) {
    const url = requestConfig.url;

    if (requestConfig.params) {
      requestConfig.url =
        url + "?" + this.buildQueryString(requestConfig.params);
      requestConfig.params = null;
    }

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

  private sign(method: string, url: string) {
    const timestamp = Date.now();
    const path = url.startsWith("/") ? url : `/${url}`;

    const content = `${method.toUpperCase()}/v1${path}${timestamp}`;

    const signature = createHmac("sha256", this.apiSecret)
      .update(content)
      .digest("hex");

    return {
      timestamp,
      signature,
    };
  }

  // getDepositAddress(currency: string, identifier: string, isMaster: boolean) defaults: isMaster: false

  async getTradePairs() {
    const { data } = await this.client.get("/trades/pairs");

    return data;
  }
  async getTradePairsByCurrency(currencyId: string) {
    const { data } = await this.client.get(`/currencies/${currencyId}/pairs`);

    return data;
  }

  async createQuote(
    sourceId: string,
    targetId: string,
    side: "BUY" | "SELL",
    amount: number
  ) {
    const { data } = await this.client.post(`/trades/quote`, {
      sourceId,
      targetId,
      side,
      amount,
    });

    return data;
  }

  async acceptQuote(quoteId: string) {
    const { data } = await this.client.post(`/trades/quote/${quoteId}`);

    return data;
  }

  // trade(source: string, target: string, side: 'BUY'|'SELL', amount: number)

  async withdrawCrypto(
    currencyCode: string,
    amount: number,
    walletAddress: string,
    network: string,
    memo?: string
  ) {
    const { data } = await this.client.post(`/wallets/ext/debit/crypto`, {
      amount,
      currency: currencyCode,
      destination: {
        address: walletAddress,
        network,
        memo,
      },
    });

    return data;
  }

  async withdrawNaira(
    currencyCode: string,
    amount: number,
    account: BankAccount
  ) {
    const { data } = await this.client.post(`/wallets/ext/debit/fiat`, {
      amount,
      currency: currencyCode,
      destination: account,
    });

    return data;
  }

  async getBanks() {
    const { data } = await this.client.get("/ngn-payments/banks");

    return data;
  }

  async getCurrencies() {
    const { data } = await this.client.get("/currencies");

    return data;
  }

  async getNetworks(currencyId: string) {
    const { data } = await this.client.get(
      `/currencies/${currencyId}/networks`
    );

    return data;
  }

  /**
   *
   * @param page number // default: 1
   * @param pageSize number // default: 30
   * @returns
   */
  async getNairaMerchants(page?: number, pageSize?: number) {
    const { data } = await this.client.get(
      `/ngn-payments/merchants?page$=${page}&pageSize=${pageSize}`
    );

    return data;
  }

  /**
   *
   * @param page number // default: 1
   * @param pageSize number // default: 30
   * @param category TransactionCategory
   * @returns
   */
  async getTransactionHistory(
    page?: number,
    pageSize?: number,
    category?: TransactionCategory
  ) {
    const { data } = await this.client.get(
      `/transactions/me?page=${page}&pageSize=${pageSize}&category=${category}`
    );

    return data;
  }

  /**
   *
   * @param page number // default: 1
   * @param pageSize number // default: 30
   * @returns
   */
  async getTradeHistory(page?: number, pageSize?: number) {
    const { data } = await this.client.get(
      `/trades/me?page=${page}&pageSize=${pageSize}`
    );

    return data;
  }

  async getTransactionById(transactionId: string) {
    const { data } = await this.client.get(`/transactions/${transactionId}`);

    return data;
  }

  async getTradeById(tradeId: string) {
    const trades = await this.getTradeHistory();

    return trades.find((x) => x.id === tradeId);
  }
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  pagaBankCode: string;
  merchantCode: string;
}

export enum TransactionCategory {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  SWAP = "SWAP",
  TRANSFER = "TRANSFER",
}
