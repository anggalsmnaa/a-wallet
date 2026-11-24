import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { WalletType } from '../types';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (wallet: { name: string; type: WalletType; initialBalance: number; color: string }) => void;
}

// 3 core palette colors aligned with DESIGN.md (R-29)
const WALLET_COLORS = ['#059669', '#0f766e', '#475569'];

export function WalletModal({ open, onClose, onSave }: WalletModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [rawBalance, setRawBalance] = useState('');
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName('');
      setType('bank');
      setRawBalance('');
      setColor(WALLET_COLORS[0]);
      setError('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama dompet wajib diisi.');
      return;
    }
    onSave({
      name: name.trim(),
      type,
      initialBalance: Number(rawBalance || '0'),
      color,
    });
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="wallet-modal-title"
      className="m-auto w-[min(100%-1.5rem,24rem)] rounded-2xl border p-0 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 id="wallet-modal-title" className="text-lg font-bold">
          Tambah Dompet
        </h1>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Tutup dialog"
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="w-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Nama Dompet
          </label>
          <input
            id="w-name"
            name="name"
            type="text"
            autoFocus
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Misal: BCA, GoPay, Tabungan"
            className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        <div>
          <label htmlFor="w-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tipe
          </label>
          <select
            id="w-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as WalletType)}
            className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <option value="bank">Rekening Bank</option>
            <option value="ewallet">E-Wallet / QRIS</option>
            <option value="cash">Tunai</option>
            <option value="credit">Kartu Kredit</option>
          </select>
        </div>

        <div>
          <label htmlFor="w-balance" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Saldo Awal (Rp)
          </label>
          <input
            id="w-balance"
            name="initialBalance"
            type="text"
            inputMode="numeric"
            value={rawBalance ? new Intl.NumberFormat('id-ID').format(Number(rawBalance)) : ''}
            onChange={(e) => setRawBalance(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="min-h-12 w-full rounded-lg border px-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Warna Kartu
          </span>
          <div className="flex gap-2.5">
            {WALLET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Pilih warna ${c}`}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-500"
        >
          Simpan Dompet
        </button>
      </form>
    </dialog>
  );
}
