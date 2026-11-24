export function formatIDR(amount: number, hide = false): string {
  if (hide) return 'Rp ••••••';
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatCompactIDR(amount: number, hide = false): string {
  if (hide) return '•••';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
  if (abs >= 1_000) return `${sign}Rp ${Math.round(abs / 1_000)}rb`;
  return `${sign}Rp ${abs}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function formatDateLabel(dateStr: string): string {
  const today = getTodayISO();
  if (dateStr === today) return 'Hari Ini';
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
  if (dateStr === yStr) return 'Kemarin';

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonthTitle(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
}
