import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, Installment, ThemePreference, Transaction, Wallet, WalletData } from '../types';
import { getTodayISO, getMonthKey } from '../utils/format';

const STORAGE_KEY = 'a-wallet:data:v1';
const THEME_KEY = 'a-wallet:theme:v1';

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'w-cash', name: 'Tunai', type: 'cash', initialBalance: 0, color: '#059669' },
  { id: 'w-bank', name: 'Bank Utama', type: 'bank', initialBalance: 0, color: '#0f766e' },
  { id: 'w-ewallet', name: 'E-Wallet / QRIS', type: 'ewallet', initialBalance: 0, color: '#475569' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c-food', name: 'Makan & Minum', type: 'expense', icon: 'utensils', color: '#059669', monthlyBudget: 1500000 },
  { id: 'c-transport', name: 'Transportasi', type: 'expense', icon: 'car', color: '#0f766e', monthlyBudget: 500000 },
  { id: 'c-shop', name: 'Belanja', type: 'expense', icon: 'shopping-bag', color: '#475569', monthlyBudget: 750000 },
  { id: 'c-bills', name: 'Tagihan', type: 'expense', icon: 'zap', color: '#0f766e', monthlyBudget: 1000000 },
  { id: 'c-fun', name: 'Hiburan', type: 'expense', icon: 'film', color: '#475569', monthlyBudget: 400000 },
  { id: 'c-health', name: 'Kesehatan', type: 'expense', icon: 'heart-pulse', color: '#059669' },
  { id: 'c-other-exp', name: 'Lainnya', type: 'expense', icon: 'package', color: '#475569' },
  { id: 'c-salary', name: 'Gaji', type: 'income', icon: 'briefcase', color: '#059669' },
  { id: 'c-bonus', name: 'Bonus / Freelance', type: 'income', icon: 'trending-up', color: '#0f766e' },
  { id: 'c-other-inc', name: 'Lainnya', type: 'income', icon: 'coins', color: '#475569' },
];

const DEFAULT_DATA: WalletData = {
  wallets: DEFAULT_WALLETS,
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  installments: [],
  hideBalances: false,
};

function loadInitialData(): { data: WalletData; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: DEFAULT_DATA, error: null };
    const parsed = JSON.parse(raw) as Partial<WalletData>;

    const categories =
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories.map((c) => {
            const fallback = DEFAULT_CATEGORIES.find((dc) => dc.id === c.id);
            return {
              ...c,
              icon: c.icon ?? fallback?.icon ?? 'package',
            };
          })
        : DEFAULT_CATEGORIES;

    return {
      data: {
        wallets: Array.isArray(parsed.wallets) && parsed.wallets.length > 0 ? parsed.wallets : DEFAULT_WALLETS,
        categories,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        installments: Array.isArray(parsed.installments) ? parsed.installments : [],
        hideBalances: Boolean(parsed.hideBalances),
      },
      error: null,
    };
  } catch {
    return {
      data: DEFAULT_DATA,
      error: 'Gagal membaca data tersimpan di browser. Menampilkan data bawaan.',
    };
  }
}

function loadTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  } catch {
    return 'system';
  }
}

export function useWalletStore() {
  const initial = useMemo(loadInitialData, []);
  const [data, setData] = useState<WalletData>(initial.data);
  const [storageError, setStorageError] = useState<string | null>(initial.error);
  const [theme, setTheme] = useState<ThemePreference>(loadTheme);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setStorageError('Penyimpanan browser penuh atau diblokir. Backup data Anda ke JSON.');
    }
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore theme persistence failure
    }
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'));
  }, []);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  const walletBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of data.wallets) {
      map[w.id] = w.initialBalance;
    }
    for (const tx of data.transactions) {
      if (tx.type === 'income') {
        map[tx.walletId] = (map[tx.walletId] ?? 0) + tx.amount;
      } else if (tx.type === 'expense') {
        map[tx.walletId] = (map[tx.walletId] ?? 0) - tx.amount;
      } else if (tx.type === 'transfer') {
        map[tx.walletId] = (map[tx.walletId] ?? 0) - tx.amount;
        if (tx.toWalletId) {
          map[tx.toWalletId] = (map[tx.toWalletId] ?? 0) + tx.amount;
        }
      }
    }
    return map;
  }, [data.wallets, data.transactions]);

  const totalBalance = useMemo(
    () => Object.values(walletBalances).reduce((acc, v) => acc + v, 0),
    [walletBalances]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
      const item: Transaction = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      setData((prev) => ({
        ...prev,
        transactions: [item, ...prev.transactions],
      }));
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const addWallet = useCallback((wallet: Omit<Wallet, 'id'>) => {
    const item: Wallet = {
      ...wallet,
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setData((prev) => ({
      ...prev,
      wallets: [...prev.wallets, item],
    }));
  }, []);

  const deleteWallet = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== id),
    }));
  }, []);

  const addInstallment = useCallback((inst: Omit<Installment, 'id'>) => {
    const item: Installment = {
      ...inst,
      id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setData((prev) => ({
      ...prev,
      installments: [item, ...prev.installments],
    }));
  }, []);

  const payInstallment = useCallback((installmentId: string, walletId: string) => {
    const today = getTodayISO();
    const currentMonth = getMonthKey(today);

    setData((prev) => {
      const target = prev.installments.find((i) => i.id === installmentId);
      if (!target || target.paidMonths >= target.totalMonths) return prev;

      const nextPaid = target.paidMonths + 1;
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'expense',
        amount: target.monthlyAmount,
        walletId,
        categoryId: 'c-bills',
        note: `Cicilan ${target.name} (${nextPaid}/${target.totalMonths})`,
        date: today,
        createdAt: Date.now(),
      };

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        installments: prev.installments.map((i) =>
          i.id === installmentId
            ? { ...i, paidMonths: nextPaid, lastPaidMonth: currentMonth }
            : i
        ),
      };
    });
  }, []);

  const deleteInstallment = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      installments: prev.installments.filter((i) => i.id !== id),
    }));
  }, []);

  const updateCategoryBudget = useCallback((id: string, monthlyBudget?: number) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, monthlyBudget } : c
      ),
    }));
  }, []);

  const toggleHideBalances = useCallback(() => {
    setData((prev) => ({ ...prev, hideBalances: !prev.hideBalances }));
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importJSON = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<WalletData>;
      if (!Array.isArray(parsed.wallets) || !Array.isArray(parsed.transactions)) {
        return false;
      }
      setData({
        wallets: parsed.wallets,
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
        transactions: parsed.transactions,
        installments: Array.isArray(parsed.installments) ? parsed.installments : [],
        hideBalances: Boolean(parsed.hideBalances),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadSampleData = useCallback(() => {
    const today = getTodayISO();
    const month = getMonthKey(today);
    const sampleTx: Transaction[] = [
      { id: 's1', type: 'income', amount: 8500000, walletId: 'w-bank', categoryId: 'c-salary', note: 'Gaji Bulanan', date: `${month}-01`, createdAt: Date.now() - 86400000 * 5 },
      { id: 's2', type: 'transfer', amount: 1000000, walletId: 'w-bank', toWalletId: 'w-ewallet', note: 'Top up QRIS', date: `${month}-02`, createdAt: Date.now() - 86400000 * 4 },
      { id: 's3', type: 'expense', amount: 45000, walletId: 'w-ewallet', categoryId: 'c-food', note: 'Kopi & makan siang', date: today, createdAt: Date.now() - 3600000 * 3 },
      { id: 's4', type: 'expense', amount: 28000, walletId: 'w-ewallet', categoryId: 'c-transport', note: 'Ojek online', date: today, createdAt: Date.now() - 3600000 * 1 },
      { id: 's5', type: 'expense', amount: 350000, walletId: 'w-bank', categoryId: 'c-bills', note: 'Internet & Listrik', date: `${month}-05`, createdAt: Date.now() - 86400000 * 2 },
    ];
    const sampleInstallments: Installment[] = [
      {
        id: 'si-1',
        name: 'SPayLater Smartphone',
        monthlyAmount: 550000,
        totalMonths: 12,
        paidMonths: 3,
        dueDay: 5,
        principalAmount: 6000000,
      },
    ];
    setData({
      wallets: [
        { id: 'w-cash', name: 'Tunai', type: 'cash', initialBalance: 350000, color: '#059669' },
        { id: 'w-bank', name: 'Bank Utama', type: 'bank', initialBalance: 2500000, color: '#0f766e' },
        { id: 'w-ewallet', name: 'E-Wallet / QRIS', type: 'ewallet', initialBalance: 200000, color: '#475569' },
      ],
      categories: DEFAULT_CATEGORIES,
      transactions: sampleTx,
      installments: sampleInstallments,
      hideBalances: false,
    });
  }, []);

  const resetAllData = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  return {
    data,
    theme,
    cycleTheme,
    storageError,
    clearStorageError,
    walletBalances,
    totalBalance,
    addTransaction,
    deleteTransaction,
    addWallet,
    deleteWallet,
    addInstallment,
    payInstallment,
    deleteInstallment,
    updateCategoryBudget,
    toggleHideBalances,
    exportJSON,
    importJSON,
    loadSampleData,
    resetAllData,
  };
}
