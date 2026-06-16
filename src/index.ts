import { removeEmptyValue, buildQueryString } from "./utils";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { createHmac } from "crypto";
import { CacheService } from "./cache";
import { ServerError } from "./errors/server";
import {
  Currency,
  Network,
  Options,
  Response,
  TradePair,
  BankAccountPayout,
  CryptoAccountPayout,
  Wallet,
  FiatMerchant,
  Banks,
  BankDepositRequest,
  FiatBankAccount,
  NairaPayment,
  DepositAddress,
  TradableCurrency,
  GhsBank,
  GhsMobileNetwork,
  TradesSummary,
  TransactionFilter,
  CreateInvoiceRequest,
  Invoice,
  InvoiceFilter,
} from "./types";
import { TransactionCategory } from "./enums/TransactionCategory";
import FormData from "form-data";

export class ObiexClient {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  private readonly cacheService: CacheService;

  constructor({ apiKey, apiSecret, sandboxMode = false }: Options) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    const baseURL = sandboxMode
      ? "https://staging.api.obiex.finance"
      : "https://api.obiex.finance";

    this.client = axios.create({ baseURL });

    this.client.interceptors.request.use((c) => this.requestConfig(c));
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          return Promise.reject(
            new ServerError(
              error.response.message,
              error.response.data,
              error.response.status,
            ),
          );
        }

        return Promise.reject(error);
      },
    );

    this.cacheService = new CacheService();
  }

  private requestConfig(requestConfig: AxiosRequestConfig) {
    let url = requestConfig.url,
      params = requestConfig.params;

    params = removeEmptyValue(params);
    params = buildQueryString(params);

    if (params !== "") {
      url = `${url}?${params}`;
    }

    const { timestamp, signature } = this.sign(requestConfig.method, url);

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
  async getDepositAddress(
    currency: string,
    network: string,
    identifier: string,
  ) {
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
    const { data: response } =
      await this.client.get<Response<TradePair[]>>("/v1/trades/pairs");

    return response.data.map((x) => ({
      id: x.id,
      source: x.source.code,
      target: x.target.code,
      isBuyable: x.isBuyable,
      isSellable: x.isSellable,
    }));
  }

  async getTradePairsByCurrency(currencyId: string) {
    const { data: response } = await this.client.get<Response<TradePair[]>>(
      `/v1/currencies/${currencyId}/pairs`,
    );

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
  async createQuote(
    source: string,
    target: string,
    side: "BUY" | "SELL",
    amount: number,
  ) {
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
      sourceCurrency: sourceCurrency.code,
      targetCurrency: targetCurrency.code,
      sourceId: sourceCurrency.id,
      targetId: targetCurrency.id,
      expiresIn: data.expiresIn,
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
  async trade(
    source: string,
    target: string,
    side: "BUY" | "SELL",
    amount: number,
  ) {
    const quote = await this.createQuote(source, target, side, amount);

    await this.acceptQuote(quote.id);

    return quote;
  }

  /**
   * Accept quote using provided quote ID
   * @param quoteId Quote ID gotten from createQuote
   * @returns
   */
  async acceptQuote(quoteId: string) {
    await this.client.post(`/v1/trades/quote/${quoteId}`);

    return true;
  }

  async withdrawCrypto(
    currencyCode: string,
    amount: number,
    wallet: CryptoAccountPayout,
  ) {
    const { data: response } = await this.client.post(
      `/v1/wallets/ext/debit/crypto`,
      {
        amount,
        currency: currencyCode,
        destination: wallet,
      },
    );

    return response.data;
  }

  async withdrawFiat(
    amount: number,
    currency: string,
    account: BankAccountPayout,
  ) {
    const { data: response } = await this.client.post(
      `/v1/wallets/ext/debit/fiat`,
      {
        amount,
        currency,
        destination: account,
      },
    );

    return response.data;
  }

  async getNGNBanks() {
    const { data: response } = await this.client.get<Response<Banks[]>>(
      "/v1/ngn-payments/banks",
    );

    return response.data;
  }

  async getCurrencies() {
    return await this.cacheService.getOrSet(
      "currencies",
      async () => {
        const { data: response } =
          await this.client.get<Response<Currency[]>>("/v1/currencies");

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
      },
      86400, // 24 Hours
    );
  }

  /**
   * @param currencyCode Get networks by currency code
   * @returns Array
   */
  async getNetworks(currencyCode: string) {
    const currency = await this.getCurrencyByCode(currencyCode);

    const { data: response } = await this.client.get<Response<Network[]>>(
      `/v1/currencies/${currency.id}/networks`,
    );

    return response.data;
  }

  /**
   *
   * @param page number // default: 1
   * @param pageSize number // default: 30
   * @returns
   */
  async getNairaMerchants(page = 1, pageSize = 30) {
    const { data: response } = await this.client.get<Response<FiatMerchant[]>>(
      `/v1/ngn-payments/merchants`,
      {
        params: {
          page,
          pageSize,
        },
      },
    );

    return response.data;
  }

  /**
   *
   * @param page number
   * @param pageSize number
   * @param category TransactionCategory
   * @returns
   */
  async getTransactionHistory({
    page = 1,
    pageSize = 30,
    category,
  }: {
    page?: number;
    pageSize?: number;
    category?: TransactionCategory;
  }) {
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

  async getTransactionById(transactionId: string) {
    const { data } = await this.client.get(`/v1/transactions/${transactionId}`);

    return data;
  }

  async getCurrencyByCode(code: string) {
    const currencies = await this.getCurrencies();

    return currencies.find((x) => x.code === code);
  }

  async getOrCreateWallet(currencyCode: string): Promise<Wallet> {
    const { data: response } = await this.client.get(
      `/v1/wallets/${currencyCode}`,
    );

    return response.data.map((x: Wallet) => ({
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
  async requestNairaDepositBankAccount({
    merchantCode,
    amount,
  }: BankDepositRequest) {
    const { data: response } = await this.client.post<Response<NairaPayment>>(
      `/v1/ngn-payments/deposits`,
      {
        merchantCode,
        amount,
      },
    );

    return response.data;
  }

  /**
   *
   * @param reference string
   * @returns
   */
  async verifyNairaDeposit(reference: string) {
    const { data: response } = await this.client.put(
      `/v1/ngn-payments/deposits/${reference}`,
    );

    return response.data;
  }

  /**
   *
   * @param reference string
   * @returns
   */
  async verifyNairaWithdrawal(reference: string) {
    const { data: response } = await this.client.put(
      `/v1/ngn-payments/withdrawals/${reference}`,
    );

    return response.data;
  }

  /**
   *
   * @param bankId string
   * @param accountNumber string
   * @returns FiatBankAccount
   */
  async resolveNairaBankAccount(bankId: string, accountNumber: string) {
    const { data: response } = await this.client.get<
      Response<FiatBankAccount[]>
    >(`/v1/ngn-payments/accounts/resolve`, {
      params: {
        bankId,
        accountNumber,
      },
    });

    return response.data;
  }

  /**
   * Get all broker deposit addresses for the authenticated user
   */
  async getDepositAddresses() {
    const { data: response } = await this.client.get<
      Response<DepositAddress[]>
    >(`/v1/addresses/me/broker`);

    return response.data;
  }

  /**
   * Create deposit address for the authenticated user
   */
  async createDepositAddress({
    currency,
    network,
    uniqueUserIdentifier,
  }: {
    currency: string;
    network: string;
    uniqueUserIdentifier: string;
  }): Promise<DepositAddress> {
    const { data: response } = await this.client.post<Response<DepositAddress>>(
      `/v1/addresses/broker`,
      {
        currency,
        network,
        uniqueUserIdentifier,
      },
    );

    return response.data;
  }

  /**
   * Get a single trade pair by source and target currency codes
   * @param sourceCode e.g. "USDT"
   * @param targetCode e.g. "NGNX"
   */
  async getTradePair(sourceCode: string, targetCode: string) {
    const { data: response } = await this.client.get<Response<TradePair>>(
      `/v1/trades/pairs/${sourceCode}/${targetCode}`,
    );

    return response.data;
  }

  /**
   * Get user's trade volume summary
   * @param currencyId Optional currency ID to filter by
   * @param page number
   * @param pageSize number
   */
  async getUserTradesSummary(
    currencyId?: string,
    page = 1,
    pageSize = 30,
  ): Promise<TradesSummary> {
    const { data: response } = await this.client.get<Response<TradesSummary>>(
      `/v1/trades/summary/me`,
      {
        params: {
          currencyId,
          page,
          pageSize,
        },
      },
    );

    return response.data;
  }

  /**
   * Get all tradeable currencies with their associated pairs
   */
  async getTradableCurrencies() {
    const { data: response } = await this.client.get<
      Response<TradableCurrency[]>
    >(`/v1/currencies/tradeable`);

    return response.data;
  }

  /**
   * Get all wallets for the authenticated user
   */
  async getWallets(): Promise<Wallet[]> {
    const { data: response } =
      await this.client.get<Response<Wallet[]>>(`/v1/wallets/me`);

    return response.data;
  }

  /**
   * Get the wallet balance for a specific currency
   * @param currencyCode e.g. "USDT", "BTC"
   */
  async getWalletBalance(currencyCode: string): Promise<Wallet> {
    const { data: response } = await this.client.get<Response<Wallet>>(
      `/v1/wallets/${currencyCode}`,
    );

    return response.data;
  }

  /**
   * Get list of banks available for GHS (Ghana Cedis) withdrawal
   */
  async getGhsBanks() {
    const { data: response } = await this.client.get<Response<GhsBank[]>>(
      `/v1/ghs-payments/banks`,
    );

    return response.data;
  }

  /**
   * Get list of mobile money networks available for GHS withdrawal
   */
  async getGhsMobileNetworks() {
    const { data: response } = await this.client.get<
      Response<GhsMobileNetwork[]>
    >(`/v1/ghs-payments/mobile/networks`);

    return response.data;
  }

  /**
   * Resolve a GHS bank account or mobile money number
   * @param bankCode Bank sort code or mobile network code e.g. "VOD", "MTN"
   * @param accountNumber Account or phone number
   */
  async resolveGhsBankAccount(bankCode: string, accountNumber: string) {
    const { data: response } = await this.client.get<Response<FiatBankAccount>>(
      `/v1/ghs-payments/accounts/resolve`,
      {
        params: {
          bankCode,
          accountNumber,
        },
      },
    );

    return response.data;
  }

  /**
   * Get deposit (incoming) transactions for the authenticated user
   */
  async getDepositTransactions({
    page = 1,
    pageSize = 30,
    currencyId,
    status,
    startDate,
    endDate,
  }: TransactionFilter = {}) {
    const { data } = await this.client.get(`/v1/transactions/deposits/me`, {
      params: {
        page,
        pageSize,
        currencyId,
        status,
        startDate,
        endDate,
      },
    });

    return data;
  }

  /**
   * Get payout (withdrawal) transactions for the authenticated user
   */
  async getPayoutTransactions({
    page = 1,
    pageSize = 30,
    currencyId,
    status,
    startDate,
    endDate,
  }: TransactionFilter = {}) {
    const { data } = await this.client.get(`/v1/transactions/withdrawals/me`, {
      params: {
        page,
        pageSize,
        currencyId,
        status,
        startDate,
        endDate,
      },
    });

    return data;
  }

  /**
   * Resend webhook for a single transaction
   * @param transactionId The transaction ID
   */
  async resendWebhook(transactionId: string) {
    await this.client.post(`/v1/transactions/${transactionId}/resendWebhook`);

    return true;
  }

  /**
   * Resend webhooks for multiple transactions
   * @param transactionIds Array of transaction IDs
   */
  async resendWebhooks(transactionIds: string[]) {
    await this.client.post(`/v1/transactions/resendWebhooks`, {
      ids: transactionIds,
    });

    return true;
  }

  async getActiveNetworks() {
    const { data: response } = await this.client.get<Response<Banks[]>>(
      "/v1/currencies/networks/active",
    );

    return response.data;
  }

  /**
   * Upload an invoice document (JPEG, PNG, or PDF, max 1 MB).
   * Returns a URL to pass into createInvoice.
   * @param file A Buffer or Readable stream of the file
   * @param filename Original filename e.g. "invoice.pdf"
   * @param mimeType e.g. "application/pdf", "image/jpeg", "image/png"
   */
  async uploadInvoiceDocument(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    const form = new FormData();
    form.append("file", file, { filename, contentType: mimeType });

    const { data: response } = await this.client.post(
      `/v1/uploads/invoices`,
      form,
      { headers: form.getHeaders() },
    );

    return response.data.url;
  }

  /**
   * Create an invoice for USD settlement.
   * Returns a virtual NGN bank account to pay into (valid for 30 minutes).
   */
  async createInvoice(payload: CreateInvoiceRequest) {
    const { data: response } = await this.client.post<Response<Invoice>>(
      `/v1/invoices`,
      payload,
    );

    return response.data;
  }

  /**
   * Get a paginated list of your invoices.
   */
  async getInvoices({
    status,
    startDate,
    endDate,
    page = 1,
    pageSize = 30,
  }: InvoiceFilter = {}) {
    const { data } = await this.client.get(`/v1/invoices/me`, {
      params: { status, startDate, endDate, page, pageSize },
    });

    return data;
  }

  /**
   * Get a single invoice by ID.
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const { data: response } = await this.client.get<Response<Invoice>>(
      `/v1/invoices/${invoiceId}`,
    );

    return response.data;
  }
}

export { ServerError } from "./errors/server";

export { TransactionCategory } from "./enums/TransactionCategory";

export {
  Currency,
  Network,
  Options,
  Quote,
  Response,
  TradePair,
  BankAccountPayout,
  CryptoAccountPayout,
  Wallet,
  FiatMerchant,
  Banks,
  BankDepositRequest,
  FiatBankAccount,
  DepositAddress,
  TradableCurrency,
  GhsBank,
  GhsMobileNetwork,
  TradesSummary,
  TransactionFilter,
  CreateInvoiceRequest,
  Invoice,
  InvoiceFilter,
  InvoiceStatus,
} from "./types";
