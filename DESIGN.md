# DESIGN.md — A-wallet

## Product Identity
- **Name:** A-wallet
- **Purpose:** Personal mobile-first money & budget tracker for iPhone (PWA, offline-first).
- **Dials:** `ENERGY 2` (crisp financial clarity) / `RHYTHM 2` (consistent card & list rhythm anchored by a solid net-worth card) / `MOTION 1` (subtle press/transition states only, no loops).

## Color Palette (R-01, R-29)
- **Neutrals:** Light surface `#f6f7f5` / `#ffffff`; Dark surface `#0b0f14` / `#131922`.
- **Core & Accent:**
  - Primary Accent (Income / Positive / Primary CTA): Emerald (`#059669` light, `#10b981` dark)
  - Secondary Core (Wallet / Secondary): Deep Teal (`#0f766e`)
  - Semantic Destructive / Expense: Rose (`#e11d48`)
  - Neutral / Transfer: Slate (`#475569`)

## Typography (R-06)
- System UI stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`) for native iOS legibility and zero webfont layout shift, with `tabular-nums` on all currency values.

## Radius, Elevation & Glassmorphism (R-10, R-11, R-12)
- **Radius Scale:** `rounded-lg` (8px) for compact inputs/chips, `rounded-2xl` (16px) for cards, buttons, and dialogs, `rounded-full` reserved for the primary `+` FAB and color swatches.
- **Shadows:** Flat bordered surfaces by default; `shadow-lg` reserved strictly for the floating `+` FAB and `<dialog>` modals.
- **Glassmorphism:** `backdrop-blur-md` on the fixed bottom `<nav>` only (1 element).

## Iconography & Assets (R-04, R-23)
- **Icons:** `lucide-react` (1.75px stroke) chosen for consistent Retina clarity across iOS Safari; no decorative emoji or generic AI icons (`Sparkles`).
- **App Icon:** Geometric `A` monogram in emerald (`#059669`) as a clean placeholder until a custom brand mark is requested.
