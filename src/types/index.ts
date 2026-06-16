export type Options = {
  apiKey: string;
  apiSecret: string;
  sandboxMode: boolean;
};

export interface Response<T> {
  message: string;
  data: T;
  errors?: [
    {
      message: string;
      property: string;
    },
  ];
  meta?: {
    perPage: number;
    currentPage: number;
    totalPages: number;
    count: number;
    total: number;
  };
}

export interface Currency {
  id: string;

  name: string;

  code: string;

  receivable: boolean;

  withdrawable: boolean;

  transferrable: boolean;

  minimumDeposit: number;

  /**
   * This property only applies when above 0
   */
  maximumDeposit: number;

  /**
   * This property only applies when above 0
   */
  maximumDailyDepositLimit: number;

  maximumDecimalPlaces: number;
}

export interface Quote {
  id: string;
  rate: number;
  side: string;
  amount: number;
  expiryDate: Date;
  amountReceived: number;
}

export interface TradePair {
  id: string;
  isSellable: boolean;
  isBuyable: boolean;
  source: Currency;
  target: Currency;
}

export interface Network {
  id: string;
  name: string;
  code: string;
  memoRegex: string;
  addressRegex: string;
  minimumConfirmations: number;
}
export interface BankAccountPayout {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

export interface CryptoAccountPayout {
  address: string;
  network: string;
  memo?: string;
}

export interface Wallet {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  availableBalance: number;
  pendingBalance: number;
  pendingSwapBalance: number;
  lockedBalance: number;
  totalSwappableBalance: number;
  totalPendingBalance: number;
  userId: string;
  currency: Currency;
}

export interface FiatMerchant {
  id: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  code: string;
  depositFee: number;
  payoutFee: number;
  userId: string;
  user: {
    id: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  totalRequests: number;
  completedRequests: number;
}

export interface Banks {
  name: string;
  uuid: string;
  interInstitutionCode: string;
  sortCode: string;
}

export interface BankDepositRequest {
  merchantCode: string;
  amount: number;
}

export interface FiatBankAccount {
  bankId: string;
  accountNumber: string;
  accountName: string;
}

export interface DepositAddress {
  id: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  value: string;
  reference: string;
  network: string;
  memo: string | null;
  purpose: string;
  userId: string;
  currencyId: string | null;
  isMaster: boolean;
}

export interface TradableCurrency {
  id: string;
  active: boolean;
  name: string;
  code: string;
  receivable: boolean;
  withdrawable: boolean;
  transferrable: boolean;
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  maximumDecimalPlaces: number;
  withdrawalFee: number;
  receiveFee: number;
  type: string;
  receiveFeeType: string;
  withdrawalFeeType: string;
  sourcePairs: Array<{
    id: string;
    active: boolean;
    sourceId: string;
    targetId: string;
    isSellable: boolean;
    isBuyable: boolean;
    isLeverage: boolean;
    target: Currency;
  }>;
}

export interface GhsBank {
  name: string;
  uuid: string;
  sortCode: string;
}

export interface GhsMobileNetwork {
  name: string;
  sortCode: string;
}

export interface TradesSummary {
  totalDollarVolume: number;
}

export interface TransactionFilter {
  page?: number;
  pageSize?: number;
  currencyId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface NairaPayment {
  createdAt: Date;

  reference: string;

  customerReference: string;

  merchantAccountNumber: string;

  merchantAccountName: string;

  fee: number;

  amount: number;

  merchantId: string;

  recipientBankAccountId?: string;

  type: "DEPOSIT" | "WITHDRAW";

  status: "FAILED" | "PENDING" | "PROCESSING" | "CANCELLED" | "COMPLETED";

  recipientBankAccount: {
    accountName: string;
    accountNumber: string;
    bankId: string;
  };
}

export type InvoiceStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

export interface InvoiceDestination {
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  bankName: string;
  bankCode: string;
  bankCountry: string;
  bankAddress: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryCountryCode: string;
  beneficiaryCountryOfResidence: string;
}

export interface CreateInvoiceRequest {
  targetAmount: number;
  source: string;
  target: string;
  purposeOfPayment: string;
  invoiceDocument: string;
  destination: InvoiceDestination;
}

export interface Invoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InvoiceStatus;
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  rate: number;
  purposeOfPayment: string;
  invoiceDocument?: string;
  virtualAccountNumber: string;
  virtualAccountName: string;
  virtualBankName: string;
  virtualAccountReference: string;
  accountExpiresAt: string;
  trackingId: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountName: string;
  beneficiaryBankName: string;
  beneficiaryBankCountry?: string;
  beneficiaryBankAddress?: string;
  beneficiaryName?: string;
  beneficiaryAddress?: string;
  beneficiaryCountryCode?: string;
  beneficiaryCountryOfResidence?: string;
  swiftCode: string;
}

export interface InvoiceFilter {
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
