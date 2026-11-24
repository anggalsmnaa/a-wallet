import { useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Home,
  Monitor,
  Moon,
  PieChart,
  Plus,
  PlusCircle,
  Receipt,
  RotateCcw,
  Search,
  Sun,
  Trash2,
  Upload,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';
import { useWalletStore } from './store/useWalletStore';
import {
  formatCompactIDR,
  formatDateLabel,
  formatIDR,
  formatMonthTitle,
  getMonthKey,
  getTodayISO,
} from './utils/format';
import { TransactionModal } from './components/TransactionModal';
import { WalletModal } from './components/WalletModal';
import { InstallmentModal } from './components/InstallmentModal';
import { CategoryIcon } from './components/CategoryIcon';
import type { Transaction } from './types';

type Tab = 'home' | 'transactions' | 'budget' | 'wallets';
type WalletSubTab = 'wallets' | 'installments';

export function App() {
  const {
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
  } = useWalletStore();

  const [tab, setTab] = useState<Tab>('home');
  const [walletSubTab, setWalletSubTab] = useState<WalletSubTab>('wallets');
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [payWalletByInst, setPayWalletByInst] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(getTodayISO()));
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonthKey = getMonthKey(getTodayISO());

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  const walletMap = useMemo(
    () => Object.fromEntries(data.wallets.map((w) => [w.id, w])),
    [data.wallets]
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(data.categories.map((c) => [c.id, c])),
    [data.categories]
  );

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};

    for (const tx of data.transactions) {
      if (getMonthKey(tx.date) !== selectedMonth) continue;
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') {
        expense += tx.amount;
        if (tx.categoryId) {
          byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
        }
      }
    }
    return { income, expense, net: income - expense, byCategory };
  }, [data.transactions, selectedMonth]);

  const installmentSummary = useMemo(() => {
    const active = data.installments.filter((i) => i.paidMonths < i.totalMonths);
    const completed = data.installments.filter((i) => i.paidMonths >= i.totalMonths);
    let totalRemainingDebt = 0;
    let dueThisMonth = 0;
    let unpaidThisMonthCount = 0;

    for (const inst of active) {
      const remMonths = inst.totalMonths - inst.paidMonths;
      totalRemainingDebt += remMonths * inst.monthlyAmount;
      if (inst.lastPaidMonth !== currentMonthKey) {
        dueThisMonth += inst.monthlyAmount;
        unpaidThisMonthCount += 1;
      }
    }

    return {
      active,
      completed,
      totalRemainingDebt,
      dueThisMonth,
      unpaidThisMonthCount,
    };
  }, [data.installments, currentMonthKey]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (!q) return true;
      const cat = tx.categoryId ? categoryMap[tx.categoryId]?.name.toLowerCase() ?? '' : '';
      const wal = walletMap[tx.walletId]?.name.toLowerCase() ?? '';
      return tx.note.toLowerCase().includes(q) || cat.includes(q) || wal.includes(q);
    });
  }, [data.transactions, typeFilter, searchQuery, categoryMap, walletMap]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a-wallet-backup-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh.');
  };

  const handleExportCSV = () => {
    const header = 'Tanggal,Tipe,Dompet,Dompet Tujuan,Kategori,Nominal,Catatan';
    const rows = data.transactions.map((tx) => {
      const w = walletMap[tx.walletId]?.name ?? '';
      const tw = tx.toWalletId ? walletMap[tx.toWalletId]?.name ?? '' : '';
      const c = tx.categoryId ? categoryMap[tx.categoryId]?.name ?? '' : '';
      const safeNote = `"${tx.note.replace(/"/g, '""')}"`;
      return `${tx.date},${tx.type},"${w}","${tw}","${c}",${tx.amount},${safeNote}`;
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a-wallet-transaksi-${getTodayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File CSV berhasil diunduh.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importJSON(text);
    showToast(ok ? 'Data berhasil dipulihkan!' : 'Format file backup tidak valid.');
    e.target.value = '';
  };

  const themeLabel =
    theme === 'light'
      ? 'Tema terang (tap untuk ganti)'
      : theme === 'dark'
        ? 'Tema gelap (tap untuk ganti)'
        : 'Tema sistem (tap untuk ganti)';

  const renderTxRow = (tx: Transaction) => {
    const cat = tx.categoryId ? categoryMap[tx.categoryId] : undefined;
    const wal = walletMap[tx.walletId];
    const toWal = tx.toWalletId ? walletMap[tx.toWalletId] : undefined;

    const title =
      tx.type === 'transfer'
        ? `Transfer: ${wal?.name ?? '?'} → ${toWal?.name ?? '?'}`
        : tx.note || cat?.name || 'Transaksi';

    const subtitle =
      tx.type === 'transfer'
        ? tx.note || 'Pindah saldo'
        : `${cat?.name ?? 'Umum'} • ${wal?.name ?? 'Dompet'}`;

    const amountColor =
      tx.type === 'income'
        ? 'text-emerald-600 dark:text-emerald-400'
        : tx.type === 'expense'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-600 dark:text-slate-300';

    const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';

    return (
      <div
        key={tx.id}
        className="flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            {tx.type === 'transfer' ? (
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <CategoryIcon name={cat?.icon} className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{title}</p>
            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`font-bold tabular-nums ${amountColor}`}>
            {prefix}
            {formatIDR(tx.amount, data.hideBalances)}
          </span>
          {tab === 'transactions' && (
            <button
              type="button"
              onClick={() => deleteTransaction(tx.id)}
              aria-label={`Hapus transaksi ${title}`}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pb-28">
      {/* Solid Header */}
      <header
        className="safe-top sticky top-0 z-20 flex items-center justify-between border-b px-4 pb-3.5"
        style={{
          backgroundColor: 'var(--bg-app)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-black text-white">
            A
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">A-wallet</h1>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {formatMonthTitle(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="month"
            aria-label="Pilih bulan"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 rounded-lg border px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          />
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : theme === 'dark' ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Monitor className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleHideBalances}
            aria-label={data.hideBalances ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {data.hideBalances ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Toast */}
      {statusMessage && (
        <div
          role="status"
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white"
        >
          {statusMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 space-y-5 px-4 pt-4">
        {/* Storage Error State */}
        {storageError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <span>{storageError}</span>
            <button
              type="button"
              onClick={clearStorageError}
              aria-label="Tutup pesan error penyimpanan"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-rose-500/15"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* iOS Install Hint */}
        {!isStandalone && tab === 'home' && (
          <div
            className="rounded-2xl border px-4 py-3 text-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-muted)' }}>
              <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Install di iPhone:
              </strong>{' '}
              Tap tombol <strong>Share</strong> di Safari lalu pilih <strong>Add to Home Screen</strong>.
            </p>
          </div>
        )}

        {/* TAB: HOME */}
        {tab === 'home' && (
          <>
            {/* Solid Deep Emerald Net Worth Card */}
            <section className="rounded-2xl bg-[#065f46] p-5 text-white">
              <p className="text-xs font-medium text-emerald-100">Total Saldo Bersih</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
                {formatIDR(totalBalance, data.hideBalances)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#044e3b] p-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                    <span>Pemasukan</span>
                  </div>
                  <p className="mt-1 font-bold tabular-nums">
                    {formatCompactIDR(monthSummary.income, data.hideBalances)}
                  </p>
                </div>
                <div className="rounded-lg bg-[#044e3b] p-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                    <ArrowUpRight className="h-3.5 w-3.5 text-rose-300" aria-hidden="true" />
                    <span>Pengeluaran</span>
                  </div>
                  <p className="mt-1 font-bold tabular-nums">
                    {formatCompactIDR(monthSummary.expense, data.hideBalances)}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Wallets */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-bold">Dompet Saya</h2>
                <button
                  type="button"
                  onClick={() => {
                    setWalletSubTab('wallets');
                    setTab('wallets');
                  }}
                  className="min-h-9 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  Kelola
                </button>
              </div>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {data.wallets.map((w) => (
                  <div
                    key={w.id}
                    className="min-w-[9.5rem] shrink-0 rounded-2xl border p-3.5"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: w.color }}
                      />
                      <span className="truncate text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {w.name}
                      </span>
                    </div>
                    <p className="mt-2 font-bold tabular-nums">
                      {formatCompactIDR(walletBalances[w.id] ?? 0, data.hideBalances)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Installment Summary Card (separate from Net Worth) */}
            {installmentSummary.active.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => {
                    setWalletSubTab('installments');
                    setTab('wallets');
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors hover:border-emerald-500"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <CalendarClock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Tagihan Cicilan Bulan Ini
                      </p>
                      <p className="mt-0.5 text-base font-bold tabular-nums">
                        {installmentSummary.unpaidThisMonthCount > 0
                          ? formatIDR(installmentSummary.dueThisMonth, data.hideBalances)
                          : 'Semua terbayar bulan ini'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {installmentSummary.active.length} aktif
                  </span>
                </button>
              </section>
            )}

            {/* Recent Transactions */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-bold">Transaksi Terbaru</h2>
                <button
                  type="button"
                  onClick={() => setTab('transactions')}
                  className="min-h-9 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  Lihat semua
                </button>
              </div>

              {data.transactions.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <p className="text-sm font-semibold">Belum ada transaksi tercatat</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Tap tombol <strong>+</strong> di bawah untuk mencatat pengeluaran atau pemasukan pertamamu.
                  </p>
                  <button
                    type="button"
                    onClick={loadSampleData}
                    className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600/15 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Isi Data Contoh
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.transactions.slice(0, 6).map(renderTxRow)}
                </div>
              )}
            </section>
          </>
        )}

        {/* TAB: TRANSACTIONS */}
        {tab === 'transactions' && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold">Riwayat Transaksi</h2>

            <search>
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Cari transaksi"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari catatan, kategori, atau dompet..."
                  className="min-h-12 w-full rounded-2xl border pl-10 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                />
              </form>
            </search>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'expense', label: 'Pengeluaran' },
                  { id: 'income', label: 'Pemasukan' },
                  { id: 'transfer', label: 'Transfer' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id)}
                  className={`min-h-10 shrink-0 rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                    typeFilter === f.id ? 'bg-emerald-600 text-white' : 'border'
                  }`}
                  style={
                    typeFilter === f.id
                      ? undefined
                      : {
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-subtle)',
                        }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>

            {groupedTransactions.length === 0 ? (
              <div
                className="rounded-2xl border p-6 text-center"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <p className="text-sm font-semibold">Tidak ada transaksi ditemukan</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ubah kata kunci pencarian atau filter tipe transaksi.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedTransactions.map(([date, list]) => (
                  <div key={date} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {formatDateLabel(date)}
                    </h3>
                    <div className="space-y-2">{list.map(renderTxRow)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: BUDGET */}
        {tab === 'budget' && (
          <section className="space-y-4">
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h2 className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Cashflow {formatMonthTitle(selectedMonth)}
              </h2>
              <p
                className={`mt-1 text-2xl font-extrabold tabular-nums ${
                  monthSummary.net >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {monthSummary.net >= 0 ? '+' : ''}
                {formatIDR(monthSummary.net, data.hideBalances)}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Tap nominal anggaran di bawah untuk mengubah batas bulanan tiap kategori.
              </p>
            </div>

            <div className="space-y-3">
              {data.categories
                .filter((c) => c.type === 'expense')
                .map((cat) => {
                  const spent = monthSummary.byCategory[cat.id] ?? 0;
                  const budget = cat.monthlyBudget ?? 0;
                  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                  const over = budget > 0 && spent > budget;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{ backgroundColor: 'var(--bg-elevated)' }}
                          >
                            <CategoryIcon name={cat.icon} className="h-4 w-4" />
                          </div>
                          <span className="font-semibold">{cat.name}</span>
                        </div>
                        {editingBudgetId === cat.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const val = Number(budgetDraft.replace(/\D/g, ''));
                              updateCategoryBudget(cat.id, val > 0 ? val : undefined);
                              setEditingBudgetId(null);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              aria-label={`Limit anggaran ${cat.name}`}
                              autoFocus
                              value={budgetDraft}
                              onChange={(e) => setBudgetDraft(e.target.value.replace(/\D/g, ''))}
                              placeholder="Limit Rp"
                              className="h-9 w-28 rounded-lg border px-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              style={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            />
                            <button
                              type="submit"
                              className="h-9 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white"
                            >
                              OK
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBudgetId(cat.id);
                              setBudgetDraft(budget ? String(budget) : '');
                            }}
                            className="min-h-9 px-1.5 text-right text-xs font-semibold tabular-nums"
                          >
                            <span className={over ? 'text-rose-600 dark:text-rose-400' : ''}>
                              {formatCompactIDR(spent, data.hideBalances)}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {' '}
                              / {budget > 0 ? formatCompactIDR(budget, data.hideBalances) : 'Set Limit'}
                            </span>
                          </button>
                        )}
                      </div>

                      {budget > 0 && (
                        <div
                          className="mt-3 h-2 w-full overflow-hidden rounded-lg"
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <div
                            className={`h-full rounded-lg transition-all ${
                              over
                                ? 'bg-rose-500'
                                : pct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* TAB: WALLETS & INSTALLMENTS */}
        {tab === 'wallets' && (
          <section className="space-y-5">
            {/* Sub-tab switcher */}
            <div
              className="grid grid-cols-2 gap-1.5 rounded-2xl p-1"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <button
                type="button"
                onClick={() => setWalletSubTab('wallets')}
                className={`min-h-11 rounded-lg text-xs font-semibold transition-colors ${
                  walletSubTab === 'wallets' ? 'bg-emerald-600 text-white' : 'opacity-75'
                }`}
              >
                Dompet ({data.wallets.length})
              </button>
              <button
                type="button"
                onClick={() => setWalletSubTab('installments')}
                className={`min-h-11 rounded-lg text-xs font-semibold transition-colors ${
                  walletSubTab === 'installments' ? 'bg-emerald-600 text-white' : 'opacity-75'
                }`}
              >
                Cicilan ({installmentSummary.active.length})
              </button>
            </div>

            {walletSubTab === 'wallets' ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Daftar Dompet</h2>
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Tambah Dompet
                  </button>
                </div>

                <div className="space-y-2.5">
                  {data.wallets.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-2xl border p-4"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg"
                          style={{ backgroundColor: w.color }}
                        />
                        <div>
                          <p className="font-semibold">{w.name}</p>
                          <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                            {w.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums">
                          {formatIDR(walletBalances[w.id] ?? 0, data.hideBalances)}
                        </span>
                        {data.wallets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteWallet(w.id)}
                            aria-label={`Hapus dompet ${w.name}`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Backup & Data */}
                <div
                  className="space-y-3 rounded-2xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h2 className="text-sm font-bold">Cadangkan & Kelola Data</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Semua data tersimpan offline di iPhone kamu. Unduh backup secara berkala agar aman.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Backup JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Restore JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset semua transaksi, dompet, dan cicilan ke awal?')) {
                          resetAllData();
                          showToast('Data berhasil di-reset.');
                        }
                      }}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Reset Data
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Installment Summary Card */}
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        Total Sisa Cicilan
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-rose-600 tabular-nums dark:text-rose-400">
                        {formatCompactIDR(installmentSummary.totalRemainingDebt, data.hideBalances)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        Belum Dibayar Bulan Ini
                      </p>
                      <p className="mt-1 text-lg font-extrabold tabular-nums">
                        {formatCompactIDR(installmentSummary.dueThisMonth, data.hideBalances)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Cicilan Aktif</h2>
                  <button
                    type="button"
                    onClick={() => setInstallmentModalOpen(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Tambah Cicilan
                  </button>
                </div>

                {installmentSummary.active.length === 0 ? (
                  <div
                    className="rounded-2xl border p-6 text-center"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <p className="text-sm font-semibold">Belum ada cicilan aktif</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Catat tagihan paylater, kredit, atau pinjaman dengan nominal tetap bulanan agar mudah dipantau.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {installmentSummary.active.map((inst) => {
                      const remMonths = inst.totalMonths - inst.paidMonths;
                      const remAmount = remMonths * inst.monthlyAmount;
                      const pct = Math.min(100, Math.round((inst.paidMonths / inst.totalMonths) * 100));
                      const paidThisMonth = inst.lastPaidMonth === currentMonthKey;
                      const selectedWalletId =
                        payWalletByInst[inst.id] ?? data.wallets[1]?.id ?? data.wallets[0]?.id ?? '';

                      const interestInfo =
                        inst.principalAmount && inst.principalAmount > 0
                          ? {
                              amount: inst.monthlyAmount * inst.totalMonths - inst.principalAmount,
                              pct: (
                                ((inst.monthlyAmount * inst.totalMonths - inst.principalAmount) /
                                  inst.principalAmount) *
                                100
                              ).toFixed(1),
                            }
                          : null;

                      return (
                        <div
                          key={inst.id}
                          className="space-y-3 rounded-2xl border p-4"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold">{inst.name}</p>
                              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                Jatuh tempo tgl {inst.dueDay} • {inst.paidMonths}/{inst.totalMonths} bulan
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold tabular-nums">
                                {formatIDR(inst.monthlyAmount, data.hideBalances)}
                                <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                                  /bln
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteInstallment(inst.id)}
                                aria-label={`Hapus cicilan ${inst.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <div
                            className="h-2 w-full overflow-hidden rounded-lg"
                            style={{ backgroundColor: 'var(--bg-elevated)' }}
                          >
                            <div
                              className="h-full rounded-lg bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span style={{ color: 'var(--text-muted)' }}>
                              Sisa: <strong style={{ color: 'var(--text-primary)' }}>{formatIDR(remAmount, data.hideBalances)}</strong> ({remMonths} bln)
                            </span>
                            {interestInfo && interestInfo.amount > 0 && (
                              <span className="text-rose-600 tabular-nums dark:text-rose-400">
                                Bunga: {formatCompactIDR(interestInfo.amount, data.hideBalances)} ({interestInfo.pct}%)
                              </span>
                            )}
                          </div>

                          {paidThisMonth ? (
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Sudah dibayar bulan ini
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1">
                              <select
                                aria-label={`Pilih dompet untuk bayar ${inst.name}`}
                                value={selectedWalletId}
                                onChange={(e) =>
                                  setPayWalletByInst((prev) => ({
                                    ...prev,
                                    [inst.id]: e.target.value,
                                  }))
                                }
                                className="min-h-11 flex-1 rounded-lg border px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  borderColor: 'var(--border-subtle)',
                                }}
                              >
                                {data.wallets.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedWalletId) return;
                                  payInstallment(inst.id, selectedWalletId);
                                  showToast(`Cicilan ${inst.name} bulan ini tercatat!`);
                                }}
                                className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500"
                              >
                                Bayar Bulan Ini
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {installmentSummary.completed.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Lunas
                    </h3>
                    {installmentSummary.completed.map((inst) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between rounded-2xl border p-3.5 opacity-75"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div>
                          <p className="font-semibold">{inst.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Lunas ({inst.totalMonths}/{inst.totalMonths} bln)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteInstallment(inst.id)}
                          aria-label={`Hapus riwayat cicilan ${inst.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        aria-label="Navigasi utama"
        className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-2 pt-1.5">
          <button
            type="button"
            onClick={() => setTab('home')}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'home' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-65'
            }`}
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('transactions')}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'transactions' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-65'
            }`}
          >
            <Receipt className="h-5 w-5" aria-hidden="true" />
            <span>Transaksi</span>
          </button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setTxModalOpen(true)}
              aria-label="Catat transaksi baru"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform active:scale-95 hover:bg-emerald-500"
            >
              <Plus className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTab('budget')}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'budget' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-65'
            }`}
          >
            <PieChart className="h-5 w-5" aria-hidden="true" />
            <span>Anggaran</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('wallets')}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'wallets' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-65'
            }`}
          >
            <WalletIcon className="h-5 w-5" aria-hidden="true" />
            <span>Dompet</span>
          </button>
        </div>
      </nav>

      {/* Native <dialog> Modals */}
      <TransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        wallets={data.wallets}
        categories={data.categories}
        onSave={(tx) => {
          addTransaction(tx);
          showToast('Transaksi tersimpan!');
        }}
      />

      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSave={(w) => {
          addWallet(w);
          showToast(`Dompet "${w.name}" ditambahkan!`);
        }}
      />

      <InstallmentModal
        open={installmentModalOpen}
        onClose={() => setInstallmentModalOpen(false)}
        onSave={(inst) => {
          addInstallment(inst);
          showToast(`Cicilan "${inst.name}" ditambahkan!`);
        }}
      />
    </div>
  );
}

export default App;
