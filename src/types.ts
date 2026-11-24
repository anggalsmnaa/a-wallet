export type WalletType = 'cash' | 'bank' | 'ewallet' | 'credit';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type ThemePreference = 'system' | 'light' | 'dark';

export type CategoryIconName =
  | 'utensils'
  | 'car'
  | 'shopping-bag'
  | 'zap'
  | 'film'
  | 'heart-pulse'
  | 'package'
  | 'briefcase'
  | 'trending-up'
  | 'coins';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: CategoryIconName;
  color: string;
  monthlyBudget?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string;
  categoryId?: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface WalletData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  hideBalances: boolean;
}
