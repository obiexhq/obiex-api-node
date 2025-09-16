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
        }
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
interface ActiveNetwork {
    networkName: string;
    networkCode: string;
    minimumDeposit: number;
    depositFee: number;
    minimumWithdrawal: number;
    withdrawalFee: number;
    maximumDecimalPlaces: number;
    receiveFeeType: "PERCENTAGE" | "FLAT";
    withdrawalFeeType: "PERCENTAGE" | "FLAT";
}
interface ActiveNetworkCurrency {
    currencyName: string;
    networks: ActiveNetwork[];
}
export interface ActiveNetworkCurrencyMap {
    [key: string]: ActiveNetworkCurrency;
}
export interface BankAccountPayout {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    merchantCode: string;
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
export {};
