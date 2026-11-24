import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Category, TransactionType, Wallet } from '../types';
import { getTodayISO } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSave: (tx: {
    type: TransactionType;
    amount: number;
    walletId: string;
    toWalletId?: string;
    categoryId?: string;
    note: string;
    date: string;
  }) => void;
}

const QUICK_AMOUNTS = [15000, 25000, 50000, 100000, 250000];

export function TransactionModal({
  open,
  onClose,
  wallets,
  categories,
  onSave,
}: TransactionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? wallets[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayISO);
  const [error, setError] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setType('expense');
      setRawAmount('');
      setWalletId(wallets[0]?.id ?? '');
      setToWalletId(wallets[1]?.id ?? wallets[0]?.id ?? '');
      const firstExp = categories.find((c) => c.type === 'expense');
      setCategoryId(firstExp?.id ?? '');
      setNote('');
      setDate(getTodayISO());
      setError('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, wallets, categories]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleClose);

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) dialog.close();
    };
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [onClose]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setError('');
    if (nextType !== 'transfer') {
      const first = categories.find((c) => c.type === nextType);
      setCategoryId(first?.id ?? '');
    }
  };

  const formattedDisplay = rawAmount
    ? new Intl.NumberFormat('id-ID').format(Number(rawAmount))
    : '';

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setRawAmount(digits);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(rawAmount);
    if (!amount || amount <= 0) {
      setError('Masukkan nominal lebih dari Rp 0.');
      return;
    }
    if (!walletId) {
      setError('Pilih dompet terlebih dahulu.');
      return;
    }
    if (type === 'transfer') {
      if (!toWalletId || toWalletId === walletId) {
        setError('Dompet tujuan harus berbeda dari dompet asal.');
        return;
      }
    } else if (!categoryId) {
      setError('Pilih kategori terlebih dahulu.');
      return;
    }

    onSave({
      type,
      amount,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      categoryId: type === 'transfer' ? undefined : categoryId,
      note: note.trim(),
      date,
    });
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tx-modal-title"
      className="m-auto w-[min(100%-1.5rem,28rem)] rounded-2xl border p-0 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 id="tx-modal-title" className="text-lg font-bold">
          Catat Transaksi
        </h1>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Tutup dialog"
          className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <fieldset className="grid grid-cols-3 gap-1.5 rounded-2xl p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <legend className="sr-only">Jenis Transaksi</legend>
          {(
            [
              { id: 'expense', label: 'Keluar' },
              { id: 'income', label: 'Masuk' },
              { id: 'transfer', label: 'Transfer' },
            ] as const
          ).map((item) => {
            const active = type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeChange(item.id)}
                className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? item.id === 'expense'
                      ? 'bg-rose-600 text-white'
                      : item.id === 'income'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-600 text-white'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </fieldset>

        <div>
          <label htmlFor="tx-amount" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Nominal (Rp)
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-4 text-lg font-bold" style={{ color: 'var(--text-muted)' }}>
              Rp
            </span>
            <input
              id="tx-amount"
              name="amount"
              type="text"
              inputMode="numeric"
              enterKeyHint="next"
              autoFocus
              required
              value={formattedDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              aria-invalid={error ? 'true' : undefined}
              className="min-h-13 w-full rounded-2xl border pl-12 pr-4 text-2xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAmountChange(String(amt))}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:border-emerald-500"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                +{amt / 1000}rb
              </button>
            ))}
          </div>
        </div>

        <div className={type === 'transfer' ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label htmlFor="tx-wallet" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
            </label>
            <select
              id="tx-wallet"
              name="walletId"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="min-h-12 w-full rounded-lg border px-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {type === 'transfer' && (
            <div>
              <label htmlFor="tx-to-wallet" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Ke Dompet
              </label>
              <select
                id="tx-to-wallet"
                name="toWalletId"
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="min-h-12 w-full rounded-lg border px-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {type !== 'transfer' && (
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Kategori
            </span>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border p-1.5 text-center transition-colors ${
                      selected
                        ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                        : 'hover:border-emerald-500/40'
                    }`}
                    style={
                      selected
                        ? undefined
                        : {
                            backgroundColor: 'var(--bg-elevated)',
                            borderColor: 'var(--border-subtle)',
                          }
                    }
                  >
                    <CategoryIcon name={cat.icon} className="h-4 w-4" />
                    <span className="mt-1 line-clamp-1 text-[11px] font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-note" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Catatan
            </label>
            <input
              id="tx-note"
              name="note"
              type="text"
              enterKeyHint="done"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: Kopi susu"
              className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            />
          </div>
          <div>
            <label htmlFor="tx-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tanggal
            </label>
            <input
              id="tx-date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-semibold text-white transition-colors active:bg-emerald-700 hover:bg-emerald-500"
        >
          Simpan Transaksi
        </button>
      </form>
    </dialog>
  );
}
