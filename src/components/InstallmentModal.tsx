import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Installment } from '../types';
import { formatIDR } from '../utils/format';

interface InstallmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (inst: Omit<Installment, 'id'>) => void;
}

export function InstallmentModal({ open, onClose, onSave }: InstallmentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [rawMonthly, setRawMonthly] = useState('');
  const [totalMonths, setTotalMonths] = useState('12');
  const [paidMonths, setPaidMonths] = useState('0');
  const [dueDay, setDueDay] = useState('5');
  const [rawPrincipal, setRawPrincipal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName('');
      setRawMonthly('');
      setTotalMonths('12');
      setPaidMonths('0');
      setDueDay('5');
      setRawPrincipal('');
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

  const interestPreview = useMemo(() => {
    const monthly = Number(rawMonthly || '0');
    const tenor = Number(totalMonths || '0');
    const principal = Number(rawPrincipal || '0');
    if (!monthly || !tenor || !principal) return null;
    const totalPay = monthly * tenor;
    const interest = totalPay - principal;
    const pct = principal > 0 ? ((interest / principal) * 100).toFixed(1) : '0';
    return { totalPay, interest, pct };
  }, [rawMonthly, totalMonths, rawPrincipal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyAmount = Number(rawMonthly || '0');
    const tenor = Number(totalMonths || '0');
    const paid = Number(paidMonths || '0');
    const due = Number(dueDay || '1');
    const principal = rawPrincipal ? Number(rawPrincipal) : undefined;

    if (!name.trim()) {
      setError('Nama cicilan wajib diisi.');
      return;
    }
    if (!monthlyAmount || monthlyAmount <= 0) {
      setError('Nominal cicilan per bulan harus lebih dari Rp 0.');
      return;
    }
    if (!tenor || tenor < 1) {
      setError('Tenor minimal 1 bulan.');
      return;
    }
    if (paid < 0 || paid > tenor) {
      setError('Jumlah bulan terbayar harus antara 0 dan total tenor.');
      return;
    }
    if (due < 1 || due > 31) {
      setError('Tanggal jatuh tempo harus antara 1 sampai 31.');
      return;
    }

    onSave({
      name: name.trim(),
      monthlyAmount,
      totalMonths: tenor,
      paidMonths: paid,
      dueDay: due,
      principalAmount: principal && principal > 0 ? principal : undefined,
    });
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="inst-modal-title"
      className="m-auto w-[min(100%-1.5rem,28rem)] rounded-2xl border p-0 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 id="inst-modal-title" className="text-lg font-bold">
          Tambah Cicilan / Hutang
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
          <label htmlFor="inst-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Nama Cicilan
          </label>
          <input
            id="inst-name"
            name="name"
            type="text"
            autoFocus
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Misal: SPayLater HP, Cicilan Motor"
            className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        <div>
          <label htmlFor="inst-monthly" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Cicilan per Bulan (Rp)
          </label>
          <input
            id="inst-monthly"
            name="monthlyAmount"
            type="text"
            inputMode="numeric"
            required
            value={rawMonthly ? new Intl.NumberFormat('id-ID').format(Number(rawMonthly)) : ''}
            onChange={(e) => {
              setRawMonthly(e.target.value.replace(/\D/g, ''));
              if (error) setError('');
            }}
            placeholder="0"
            className="min-h-12 w-full rounded-lg border px-3 font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="inst-tenor" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tenor (Bln)
            </label>
            <input
              id="inst-tenor"
              name="totalMonths"
              type="text"
              inputMode="numeric"
              value={totalMonths}
              onChange={(e) => setTotalMonths(e.target.value.replace(/\D/g, ''))}
              className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div>
            <label htmlFor="inst-paid" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Terbayar
            </label>
            <input
              id="inst-paid"
              name="paidMonths"
              type="text"
              inputMode="numeric"
              value={paidMonths}
              onChange={(e) => setPaidMonths(e.target.value.replace(/\D/g, ''))}
              className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div>
            <label htmlFor="inst-due" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Jatuh Tempo
            </label>
            <input
              id="inst-due"
              name="dueDay"
              type="text"
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ''))}
              placeholder="Tgl"
              className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="inst-principal" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Pokok Pinjaman (Opsional, untuk hitung bunga)
          </label>
          <input
            id="inst-principal"
            name="principalAmount"
            type="text"
            inputMode="numeric"
            value={rawPrincipal ? new Intl.NumberFormat('id-ID').format(Number(rawPrincipal)) : ''}
            onChange={(e) => setRawPrincipal(e.target.value.replace(/\D/g, ''))}
            placeholder="Kosongkan jika tidak perlu hitung bunga"
            className="min-h-12 w-full rounded-lg border px-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        {interestPreview && (
          <div
            className="rounded-lg border px-3 py-2.5 text-xs"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Total Bayar ({totalMonths} bln)</span>
              <span className="font-semibold tabular-nums">{formatIDR(interestPreview.totalPay)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Estimasi Bunga</span>
              <span className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                {interestPreview.interest >= 0 ? formatIDR(interestPreview.interest) : 'Rp 0'} ({interestPreview.pct}%)
              </span>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Simpan Cicilan
        </button>
      </form>
    </dialog>
  );
}
