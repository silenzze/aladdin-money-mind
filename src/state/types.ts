export type AccountType = "card" | "cash" | "vault";
export type TxType = "income" | "expense" | "investment" | "transfer";
export type CryptoSymbol = "BTC" | "ETH";
export type DCAFrequency = "weekly" | "biweekly" | "monthly";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // always positive; sign derived from type
  category: string;
  note?: string;
  accountId: string;
  toAccountId?: string; // for transfers
  date: string; // ISO
  recurring?: boolean;
}

export interface CryptoLot {
  id: string;
  symbol: CryptoSymbol;
  quantity: number;
  pricePerUnit: number; // cost basis at purchase
  date: string;
  source: "dca" | "manual";
}

export interface DCAPlan {
  id: string;
  symbol: CryptoSymbol;
  amount: number; // fiat per cycle
  frequency: DCAFrequency;
  accountId: string;
  active: boolean;
  startDate: string;
  lastExecuted?: string;
}

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  dayOfMonth: number; // 1-28
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: "info" | "positive" | "warning";
  importance: number; // 0-100
  createdAt: string;
  icon?: string;
}

export interface CryptoPrices {
  BTC: number;
  ETH: number;
  updatedAt: string;
}

export interface AppState {
  onboardingCompleted: boolean;
  dcaEnabled: boolean;
  baseCurrency: string;
  accounts: Account[];
  transactions: Transaction[];
  cryptoHoldings: CryptoLot[];
  dcaPlans: DCAPlan[];
  recurringIncomes: RecurringIncome[];
  prices: CryptoPrices;
}
