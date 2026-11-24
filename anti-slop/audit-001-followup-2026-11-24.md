# Antislop UI Follow-Up Report — A-wallet (2026-11-24)

Audit reference: `anti-slop/audit-001-2026-11-24.md`
Approved items: **1–12 (all)**

## Summary of Fixes Applied

1. **R-37 (Design Direction):** Created `DESIGN.md` defining A-wallet's visual identity, dials (`ENERGY 2 / RHYTHM 2 / MOTION 1`), palette, radius scale, elevation rules, and iconography rationale.
2. **R-39 (Interaction Affordances & ARIA):** Added base CSS `cursor: pointer` for enabled controls and `cursor: not-allowed` for disabled controls in `src/index.css`; added `aria-hidden="true"` to decorative icons inside buttons and inputs.
3. **R-39 (Heading Hierarchy):** Added `<h2>Riwayat Transaksi</h2>` in the `Transaksi` tab before `<h3>` date group headings so heading levels no longer skip.
4. **R-23 (Visual Assets):** Documented the `A` geometric monogram icons (`favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) in `DESIGN.md` as an intentional placeholder until a custom logo is requested.
5. **R-27 (Error State):** Added `storageError` and `clearStorageError` in `src/store/useWalletStore.ts` and a dismissible `role="alert"` banner in `src/App.tsx`.
6. **R-10 (Glassmorphism Dose Cap):** Removed `backdrop-blur` from `<header>`, hero summary cards, and `dialog::backdrop`; retained `backdrop-blur-md` on the bottom `<nav>` only (1 element).
7. **R-04 (Icons & Emoji):** Replaced `Sparkles` with `PlusCircle`, removed decorative emoji from categories (`DEFAULT_CATEGORIES`, `TransactionModal`, `App`), and added `src/components/CategoryIcon.tsx` mapping categories to relevant `lucide-react` icons.
8. **R-01 (Color & Gradients):** Replaced the hero Net Worth gradient with a solid deep emerald (`#065f46`) surface for consistent contrast.
9. **R-12 (Shadow):** Removed unnecessary shadows from cards, submit buttons, and toasts; reserved `shadow-lg` strictly for the floating `+` FAB and modal `<dialog>` elements.
10. **R-29 (Color Palette):** Consolidated wallet and category colors to the 3 core palette colors (`#059669`, `#0f766e`, `#475569`).
11. **R-11 (Border Radius):** Standardized radii across the app to the 3-step scale (`rounded-lg`, `rounded-2xl`, `rounded-full` for FAB and swatches only).
12. **R-21 (Dark Mode Toggle):** Added an in-app `theme` toggle (`system` / `light` / `dark`) in `<header>` persisted to `localStorage` and wired to `:root[data-theme]`.
