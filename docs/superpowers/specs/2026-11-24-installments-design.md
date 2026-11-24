# Design Doc: Fitur Hutang & Cicilan (A-wallet)

**Tanggal:** 2026-11-24
**Ukuran Pekerjaan:** Perubahan kecil-menengah (penambahan 1 entitas data, 1 modal input, sub-tab di Dompet, dan kartu ringkasan di Beranda)

## Tujuan & Prinsip
- Mencatat hutang/cicilan dengan **nominal cicilan per bulan yang sudah ditentukan** dari aplikasi pinjaman/paylater pengguna.
- **Dipisah dari Total Saldo Bersih:** sisa hutang tidak mengurangi saldo dompet secara otomatis; saldo dompet hanya berkurang saat pengguna menekan tombol **Bayar Bulan Ini**.
- Menghitung **total bunga (Rp & %)** secara otomatis bila pengguna mengisi **Pokok Pinjaman (opsional)** melalui rumus `(Cicilan Bulanan × Tenor) - Pokok`.

## Pendekatan yang Dipilih (Opsi 1)
- **Navigasi Bawah tetap 5 slot** (`Beranda`, `Transaksi`, `+`, `Anggaran`, `Dompet`).
- **Tab `Dompet`** memiliki sub-tab segmented: **`Dompet`** | **`Cicilan`**.
- **Tab `Beranda`** menampilkan kartu ringkas **"Tagihan Cicilan Bulan Ini"** (total sisa tagihan bulan berjalan & jumlah cicilan aktif) yang bisa di-tap untuk langsung menuju sub-tab `Cicilan`.
- *Alasan tidak memilih Opsi 2 (6 tab di bottom nav):* 6 tombol di layar iPhone membuat target sentuh terlalu sempit dan padat.

## Struktur Data (`Installment`)
Disimpan di `localStorage` bersama `WalletData` (dan ikut ter-backup/restore di Export/Import JSON):
- `id`: string
- `name`: string (misal: *"SPayLater HP"*)
- `monthlyAmount`: number (nominal cicilan per bulan dalam Rp)
- `totalMonths`: number (tenor total, misal `12`)
- `paidMonths`: number (jumlah bulan yang sudah dibayar, default `0`)
- `dueDay`: number (tanggal jatuh tempo tiap bulan, `1–31`)
- `principalAmount?`: number (opsional, untuk menghitung total bunga & persentase bunga)
- `lastPaidMonth?`: string (`YYYY-MM`, opsional, untuk menandai apakah bulan berjalan sudah dibayar)

## Alur Utama
1. **Tambah Cicilan (`InstallmentModal`):** Menggunakan `<dialog>` native sesuai standar `modern-web-guidance` dan palet `DESIGN.md` (`#059669`, `#0f766e`, `#475569`, `#e11d48`).
2. **Bayar Cicilan (`Bayar Bulan Ini`):** Memilih dompet sumber dana, otomatis membuat transaksi `expense` baru (dengan kategori `Tagihan` dan catatan nama cicilan + angsuran ke-X/Y), serta menaikkan `paidMonths` + mencatat `lastPaidMonth`.
3. **Status Lunas:** Jika `paidMonths >= totalMonths`, cicilan ditandai **Lunas** dan dipisahkan/diarsipkan rapi di bagian bawah daftar.
