# Design.md — Needle Management System WebApps
## Design System Specification (shadcn/ui · Blue Ocean)

**Version:** 1.0
**Status:** Draft — ready for Claude Code implementation
**Platform:** WebApps (Admin / Management / PIC Inventory)
**Base Stack:** React + Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives) + Lucide icons + Recharts
**Depends on:** `18-WebApps-UI-UX-Specification.md` (screen inventory, UX rules, state model), `02-Business-Process.md`, `04-Functional-Requirements.md`, `08-SRS-WebApps.md`
**Fills:** Section 73 "Design System" of `18-WebApps-UI-UX-Specification.md`, which defines the required categories but not the concrete values — this document is that concrete spec.

---

## 1. Purpose

This document is the single source of truth for visual design and component styling of the Needle Management System WebApps. It exists so that:

- Claude Code (or any engineer) can scaffold `globals.css`, `tailwind.config.ts`, and shadcn `components.json` without guessing values.
- Every screen listed in `18-WebApps-UI-UX-Specification.md` (Dashboard, Exchange Transactions, Confirmation, Stock Overview/Movement, Receiving, Transfer, Adjustment, Master Data, Administration, Analytics) is styled consistently.
- Status, alerts, and chart colors stay consistent with the business meaning defined in the functional/process docs (e.g. Broken / Bent / Changeover, Low Stock / Out of Stock, Pending / Approved / Rejected).

This document does **not** redefine screen flows or business logic — see `18-WebApps-UI-UX-Specification.md` for that. It only defines *how things look*.

---

## 2. Design Principles

Inherited from `18-WebApps-UI-UX-Specification.md` §3 and translated into visual rules:

1. **Desktop-first, information-dense.** Optimize for tables, filters, and multi-panel dashboards at 1280px+, not touch targets.
2. **Operational clarity over decoration.** Every color, badge, and icon must communicate a real system state (stock level, transaction status, sync status) — never used purely for aesthetics.
3. **Never rely on color alone.** Every status must pair color + icon + text (per §14 and §59 Accessibility). This is a hard constraint on the badge and alert components below.
4. **Role-based visual weight.** Management sees KPIs and trends first; PIC Inventory sees stock and movement first; System Admin sees configuration and audit first (§62).
5. **Trust the backend.** UI never invents a state — colors/badges map 1:1 to backend enums (§63 State Model, §64 API Alignment).

---

## 3. Frontend Technology for the Design System

```text
Framework        : Next.js 14+ (App Router), React 18, TypeScript
Styling          : Tailwind CSS v3
Component Kit    : shadcn/ui (Radix UI primitives, copy-in components)
Icons            : lucide-react
Charts           : Recharts (via shadcn "chart" component wrapper)
Tables           : TanStack Table (wrapped as shadcn DataTable)
Forms            : react-hook-form + zod (shadcn Form primitives)
Fonts            : Inter (UI text), JetBrains Mono (codes/IDs/reference numbers)
Theme mechanism  : CSS variables in HSL, `class="dark"` strategy (light theme is primary; dark mode optional/secondary)
```

shadcn/ui is chosen because it ships unstyled Radix primitives that inherit purely from Tailwind + CSS variables — this lets the entire "Blue Ocean" palette below apply globally by editing one `globals.css` file, with no component-level overrides needed later.

---

## 4. Color System — "Blue Ocean"

### 4.1 Palette rationale

The palette is built around a deep-to-light ocean blue as primary, a cyan/teal accent for secondary emphasis (charts, links, active states), and a neutral slate-blue gray for surfaces/text — so grays never feel "warm" or disconnected from the brand. Status colors (success/warning/danger) are kept **outside** the blue family on purpose, so they stay accessible and instantly distinguishable against a mostly-blue UI, per the "never rely on color alone" rule.

### 4.2 Primary — Ocean

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `ocean-50` | `#F0F9FF` | `204 100% 97%` | Subtle backgrounds, hover tint |
| `ocean-100` | `#E0F2FE` | `204 94% 94%` | Selected row / active nav background |
| `ocean-200` | `#BAE6FD` | `203 92% 85%` | Chart light fill, badge tint |
| `ocean-300` | `#7DD3FC` | `203 92% 74%` | Chart secondary series |
| `ocean-400` | `#38BDF8` | `199 92% 61%` | Chart primary series (light mode) |
| `ocean-500` | `#0EA5E9` | `199 89% 48%` | Links, focus ring, info accents |
| `ocean-600` | `#0284C7` | `200 98% 39%` | **Primary brand / primary button / active nav** |
| `ocean-700` | `#0369A1` | `201 96% 32%` | Primary hover/pressed |
| `ocean-800` | `#075985` | `201 90% 27%` | Sidebar background (dark surface option) |
| `ocean-900` | `#0C4A6E` | `202 80% 24%` | Header background (dark), deep text on light chips |
| `ocean-950` | `#082F49` | `202 84% 15%` | App shell dark background (dark mode) |

### 4.3 Secondary / Accent — Deep Sea (teal-cyan)

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `seasurf-50` | `#ECFEFF` | `183 100% 96%` | Accent chip background |
| `seasurf-300` | `#67E8F9` | `191 91% 74%` | Secondary chart series |
| `seasurf-500` | `#06B6D4` | `189 94% 43%` | Secondary buttons, active tab underline |
| `seasurf-600` | `#0891B2` | `191 91% 36%` | Secondary hover |
| `seasurf-700` | `#0E7490` | `192 85% 31%` | Secondary pressed / on-dark text |

### 4.4 Neutrals — Slate (blue-gray)

| Token | Hex | Usage |
|---|---|---|
| `slate-50` | `#F8FAFC` | App background |
| `slate-100` | `#F1F5F9` | Card/table zebra background |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-300` | `#CBD5E1` | Disabled borders |
| `slate-400` | `#94A3B8` | Placeholder text, disabled text |
| `slate-500` | `#64748B` | Secondary text |
| `slate-600` | `#475569` | Body text (on light) |
| `slate-700` | `#334155` | Headings (on light) |
| `slate-800` | `#1E293B` | Sidebar text on dark surface |
| `slate-900` | `#0F172A` | Primary text (darkest), app-shell dark bg |

### 4.5 Semantic / Status colors

These map directly to the transaction, confirmation, device, and stock states in §63 of the UI/UX spec. Kept outside the ocean/teal family so they read as distinct signals, not brand decoration.

| Semantic | Token | Hex | Maps to (backend states) |
|---|---|---|---|
| Success | `success-500` | `#10B981` (emerald) | `COMPLETED`, `APPROVED`, `ACTIVE`, `AVAILABLE`, WhatsApp `DELIVERED`/`READ` |
| Warning | `warning-500` | `#F59E0B` (amber) | `PENDING_CONFIRMATION`, `PENDING_SYNC`, `LOW` stock, `PENDING` confirmation |
| Danger | `danger-500` | `#EF4444` (red) | `FAILED`, `REJECTED`, `OUT_OF_STOCK`, `REVOKED`, `NEGATIVE STOCK ATTEMPT` |
| Info | `ocean-500` | `#0EA5E9` | `QUEUED`, `DRAFT`, informational toasts |
| Neutral | `slate-400` | `#94A3B8` | `CANCELLED`, `INACTIVE`, `EXPIRED` |

Each semantic color has a light tint (`-50`) for badge backgrounds and a `-700` shade for badge text/icon, so badges pass WCAG AA (see §12).

```text
success-50 #ECFDF5   success-700 #047857
warning-50 #FFFBEB   warning-700 #B45309
danger-50  #FEF2F2   danger-700  #B91C1C
```

### 4.6 CSS variables (shadcn `globals.css`)

Paste-ready, HSL triplets (no `hsl()` wrapper, as required by shadcn):

```css
:root {
  --background: 204 100% 98%;        /* slate-50 tinted */
  --foreground: 222 47% 11%;         /* slate-900 */

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary: 200 98% 39%;            /* ocean-600 */
  --primary-foreground: 0 0% 100%;

  --secondary: 189 94% 43%;          /* seasurf-500 */
  --secondary-foreground: 0 0% 100%;

  --muted: 210 40% 96%;              /* slate-100 */
  --muted-foreground: 215 16% 47%;   /* slate-500 */

  --accent: 204 94% 94%;             /* ocean-100 */
  --accent-foreground: 200 98% 39%;  /* ocean-600 */

  --destructive: 0 84% 60%;          /* danger-500 */
  --destructive-foreground: 0 0% 100%;

  --success: 160 84% 39%;            /* success-500 */
  --success-foreground: 0 0% 100%;

  --warning: 38 92% 50%;             /* warning-500 */
  --warning-foreground: 26 83% 20%;

  --border: 214 32% 91%;             /* slate-200 */
  --input: 214 32% 91%;
  --ring: 199 89% 48%;               /* ocean-500 focus ring */

  --radius: 0.625rem;                /* 10px, see §7 */

  /* Chart series — see §11 */
  --chart-1: 200 98% 39%;   /* ocean-600 */
  --chart-2: 189 94% 43%;   /* seasurf-500 */
  --chart-3: 199 92% 61%;   /* ocean-400 */
  --chart-4: 191 91% 74%;   /* seasurf-300 */
  --chart-5: 202 80% 24%;   /* ocean-900 */
}

.dark {
  --background: 202 84% 8%;          /* ocean-950-ish */
  --foreground: 210 40% 96%;

  --card: 202 70% 11%;
  --card-foreground: 210 40% 96%;

  --popover: 202 70% 11%;
  --popover-foreground: 210 40% 96%;

  --primary: 199 92% 61%;            /* ocean-400 (lighter on dark) */
  --primary-foreground: 202 84% 8%;

  --secondary: 191 91% 74%;          /* seasurf-300 */
  --secondary-foreground: 202 84% 8%;

  --muted: 202 40% 16%;
  --muted-foreground: 215 20% 65%;

  --accent: 201 90% 20%;
  --accent-foreground: 199 92% 74%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  --success: 160 70% 45%;
  --warning: 38 92% 55%;

  --border: 202 40% 20%;
  --input: 202 40% 20%;
  --ring: 199 92% 61%;
}
```

`--success` and `--warning` are non-standard shadcn tokens — add them alongside `--destructive` in `tailwind.config.ts` `theme.extend.colors` so `bg-success`, `text-warning-foreground`, etc. become available utilities.

### 4.7 Contrast rule

All text-on-fill and icon-on-fill pairs must meet **WCAG AA**: 4.5:1 for text, 3:1 for large text/icons/UI components. Primary buttons (`ocean-600` fill) always use white (`#FFFFFF`) text/icon. Tinted badges (`-50` fill) always use the matching `-700` text/icon, never `-500`, to guarantee contrast.

---

## 5. Typography

| Role | Font | Size | Weight | Line-height | Tailwind |
|---|---|---|---|---|---|
| Page title (H1) | Inter | 24px | 600 | 32px | `text-2xl font-semibold` |
| Section title (H2) | Inter | 18px | 600 | 28px | `text-lg font-semibold` |
| Card/widget title (H3) | Inter | 14px | 600 | 20px | `text-sm font-semibold` |
| Body | Inter | 14px | 400 | 20px | `text-sm` |
| Body small / helper | Inter | 12px | 400 | 16px | `text-xs text-slate-500` |
| Table header | Inter | 12px | 600, uppercase, tracking-wide | 16px | `text-xs font-semibold uppercase tracking-wide text-slate-500` |
| KPI number | Inter | 28–32px | 700 | 36px | `text-3xl font-bold` |
| Reference / code / IDs (e.g. `EX00123`, needle codes, RFID) | JetBrains Mono | 13px | 500 | 20px | `font-mono text-sm` |

Font stack fallback: `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`.

---

## 6. Spacing & Grid

Base unit: **4px**, following Tailwind's default scale (no custom scale needed).

```text
xs  = 4px   (icon-to-text gap)
sm  = 8px   (form field internal spacing)
md  = 16px  (card padding, standard gap)
lg  = 24px  (section spacing)
xl  = 32px  (page-level top/bottom padding)
2xl = 48px  (dashboard block separation)
```

Layout grid:

```text
App shell        : sidebar 260px (collapsed 72px) + content fluid
Content max-width : none (fluid; tables/dashboards use full width)
Content padding   : 24px (lg) desktop, 16px (md) tablet
Dashboard KPI row : 4-column grid, gap-4, min-width 220px per card, wraps to 2-col under 1024px
Card grid (2-panel): 2-column grid gap-6 (e.g. Exchange Trend + Top Needle Types/Stock Alert, §8)
```

---

## 7. Border Radius & Elevation

```text
--radius: 0.625rem (10px) — base
  buttons / inputs / badges : radius - 4px  → 6px  (rounded-md)
  cards / panels / dialogs  : radius          → 10px (rounded-xl)
  KPI cards / chart cards    : radius + 2px    → 12px (rounded-2xl)
  avatars / status dots      : 9999px          (rounded-full)
```

Elevation (shadow) — kept minimal, flat-leaning per "operational, not decorative":

```text
shadow-none  : table rows, inline elements
shadow-sm    : cards on canvas          (0 1px 2px rgba(15,23,42,0.06))
shadow-md    : dropdowns, popovers      (0 4px 12px rgba(15,23,42,0.08))
shadow-lg    : modals/dialogs           (0 10px 30px rgba(15,23,42,0.12))
```

Cards use a 1px `border-slate-200` **plus** `shadow-sm` (not shadow alone) — keeps dense dashboards legible without heavy drop shadows.

---

## 8. Iconography

**Library:** `lucide-react` exclusively (matches shadcn defaults, consistent 24×24 grid, tree-shakeable).

**Contrast rule (per user requirement "icon with contrast color"):** icons are never the same color as their background. Concretely:

```text
Icon on solid fill (primary button, solid status chip) → white icon, stroke-width 2
Icon on tinted background (badge -50 fill)              → -700 shade of that semantic color
Icon on neutral surface (sidebar, table row, toolbar)    → slate-500 default, slate-900/ocean-600 on hover/active
Icon standing alone as a status signal (no badge chrome) → paired semantic color (-600) at minimum 3:1 contrast against slate-50/white
```

Sizes: `16px` inline with text, `20px` toolbar/table actions, `24px` nav items, `32px` empty-state illustrations.

**Icon-to-status mapping** (ties directly to §14/§63 states — required so status is never color-only):

| State | Icon (lucide) | Color |
|---|---|---|
| `COMPLETED` / `APPROVED` / `ACTIVE` / `DELIVERED` | `CheckCircle2` | success-700 |
| `PENDING_CONFIRMATION` / `PENDING` / `QUEUED` | `Clock` | warning-700 |
| `PENDING_SYNC` | `RefreshCw` | ocean-700 |
| `FAILED` / `REJECTED` / `REVOKED` | `XCircle` | danger-700 |
| `CANCELLED` / `INACTIVE` / `EXPIRED` | `MinusCircle` | slate-500 |
| `DRAFT` | `FileEdit` | slate-500 |
| Low Stock | `TriangleAlert` | warning-700 |
| Out of Stock | `CircleAlert` | danger-700 |
| Negative Stock Attempt / Unusual Movement | `ShieldAlert` | danger-700 |
| Device Online | `Wifi` | success-700 |
| Device Offline | `WifiOff` | slate-500 |
| WhatsApp Sent/Read | `MessageCircleCheck` | success-700 |
| WhatsApp Failed | `MessageCircleWarning` | danger-700 |

Navigation icons (sidebar, §7 of UI/UX spec): `LayoutDashboard` (Dashboard), `ArrowLeftRight` (Transactions/Exchange), `ShieldCheck` (Confirmation), `Boxes` (Inventory), `PackagePlus` (Receiving), `Truck` (Transfer), `SlidersHorizontal` (Adjustment), `Database` (Master Data), `Syringe` (Needle Type), `Factory` (Factory), `ShoppingCart` (Trolley — cart-like mobile unit), `MapPin` (Storage/Needle Hole), `Users` (Employee/Users), `CreditCard` (RFID Card), `Cpu` (Devices), `KeyRound` (Roles & Permissions), `FileClock` (Audit Log), `BarChart3` (Analytics).

---

## 9. Component Styling (shadcn/ui primitives)

### 9.1 Button

```text
Primary    : bg-primary (ocean-600) text-white, hover ocean-700, focus ring ocean-500
Secondary  : bg-white border-slate-300 text-slate-700, hover bg-slate-50
Destructive: bg-destructive (danger-500) text-white, hover danger-700 — used for Adjustment/Revoke/Reject/Delete
Ghost      : transparent, text-slate-600, hover bg-slate-100 — table row actions
Sizes      : sm (32px h), default (36px h), lg (40px h, used for primary form-page submit)
Radius     : rounded-md (6px)
```

### 9.2 StatusBadge (custom shadcn-style component, wraps `Badge`)

Composed of: **tinted background + colored icon + label text** — never fill/icon alone, satisfying §14/§59.

```tsx
<StatusBadge status="PENDING_CONFIRMATION" />
// renders: bg-warning-50 text-warning-700 rounded-full px-2.5 py-0.5
//          <Clock className="h-3.5 w-3.5" /> Pending Confirmation
```

Variant table:

| Variant | Background | Text/Icon |
|---|---|---|
| success | `success-50` | `success-700` |
| warning | `warning-50` | `warning-700` |
| danger | `danger-50` | `danger-700` |
| info | `ocean-50` | `ocean-700` |
| neutral | `slate-100` | `slate-500` |

### 9.3 KpiCard (Dashboard §8–9)

```text
Container : rounded-2xl border border-slate-200 bg-white shadow-sm p-5
Label     : text-xs font-medium uppercase tracking-wide text-slate-500
Value     : text-3xl font-bold text-slate-900
Delta     : text-xs font-medium, success-600 (▲) or danger-600 (▼) with ArrowUp/ArrowDown icon
Icon slot : top-right, 20px, ocean-600 on ocean-50 rounded-lg 32px chip
```

### 9.4 ChartCard

```text
Container : rounded-2xl border border-slate-200 bg-white shadow-sm p-5
Header    : title (H3) + filter/period control (right-aligned, sm Select)
Footer    : "Last Updated: HH:mm" text-xs text-slate-400 (per §68 Dashboard Refresh)
```

### 9.5 DataTable (Table Standard, §48)

```text
Header row     : bg-slate-50, text-xs font-semibold uppercase text-slate-500, border-b border-slate-200
Row            : border-b border-slate-100, hover:bg-ocean-50/40
Row (selected) : bg-ocean-50
Zebra          : optional, slate-50 on even rows for very dense tables (Stock Movement, Audit Log)
Cell padding   : py-3 px-4
Sort icon      : ChevronsUpDown (idle, slate-400) → ChevronUp/ChevronDown (active, ocean-600)
Row actions    : ghost icon buttons, right-aligned, revealed via MoreHorizontal kebab menu when >2 actions
Pagination     : bottom-right, shadcn Pagination, "Showing 1–20 of 245"
```

### 9.6 Form (Form Standard, §50)

```text
Label       : text-sm font-medium text-slate-700, required marker "*" in danger-500
Input       : h-9, border-slate-300, focus:ring-2 ring-ocean-500 border-ocean-500
Helper text : text-xs text-slate-500, mt-1
Error text  : text-xs text-danger-600, mt-1, paired with border-danger-500 on the field
Layout      : label above input (not inline), 2-column grid for related short fields (e.g. Min/Max Stock)
```

### 9.7 ConfirmDialog (§51) — critical for Receiving/Transfer/Adjustment

```text
Header    : title + Icon (AlertTriangle in warning-600 for stock-impacting, ShieldAlert danger-600 for destructive)
Body      : impact summary as a 2-column key-value list, e.g.
            Current Balance   50
            Receive            +100
            New Balance        150   ← bold, ocean-700
Footer    : [Cancel: ghost] [Confirm: primary or destructive depending on action]
```

Adjustment dialogs always render the delta with explicit sign and color: `+N` success-600, `−N` danger-600.

### 9.8 EmptyState / LoadingState / ErrorState (§52–54)

```text
EmptyState  : centered, 48px illustration icon (slate-300), title text-sm font-medium slate-700,
              helper text-xs slate-500, optional primary action button
LoadingState: Skeleton components matching the target layout (never a full-page spinner for partial loads)
ErrorState  : centered, CircleAlert danger-500 40px, message per §54 wording rules (no stack traces)
```

### 9.9 NotificationPanel / Toast

```text
Toast success : left border-l-4 success-500, CheckCircle2 icon
Toast warning : left border-l-4 warning-500, TriangleAlert icon
Toast error   : left border-l-4 danger-500, XCircle icon
Position      : top-right, stacked, auto-dismiss 5s (persistent for Sync Failure / Device Offline)
```

### 9.10 Sidebar / AppShell

```text
Background        : white (light) — bg-white border-r border-slate-200
Active nav item    : bg-ocean-50 text-ocean-700 font-medium, left 3px accent bar in ocean-600
Inactive nav item  : text-slate-600, hover bg-slate-50
Section label      : text-xs font-semibold uppercase tracking-wide text-slate-400, px-3 pt-4 pb-1
Collapsed state    : 72px width, icon-only with tooltip
Header/topbar      : h-16, bg-white border-b border-slate-200, factory-scope selector left of notification bell
```

---

## 10. Status & Alert Color Mapping (reference table)

Direct mapping for engineers — every enum from `18-WebApps-UI-UX-Specification.md` §14/§63 to a `StatusBadge` variant:

```text
Exchange / Transaction Status
  DRAFT                  → neutral
  PENDING_CONFIRMATION   → warning
  PENDING_SYNC           → info
  COMPLETED              → success
  FAILED                 → danger
  CANCELLED              → neutral

Confirmation
  PENDING   → warning
  APPROVED  → success
  REJECTED  → danger
  EXPIRED   → neutral

Stock / Inventory
  AVAILABLE / Normal → success
  LOW                → warning
  OUT_OF_STOCK        → danger

Device
  ACTIVE   → success
  INACTIVE → neutral
  REVOKED  → danger

WhatsApp Notification
  QUEUED     → info
  SENT       → info
  DELIVERED  → success
  READ       → success
  FAILED     → danger

Exchange Type (chart/tag use — not a status, a category)
  BROKEN      → danger-500  (physical defect, deliberately off-palette for visibility)
  BENT        → warning-500
  CHANGEOVER  → ocean-500
```

---

## 11. Data Visualization — Blue Ocean Chart Palette

Analytics screens (§40–46: Exchange Trend, Exchange by Type, Needle Consumption, Factory/Trolley Comparison) use Recharts wrapped in shadcn's `ChartContainer`, driven by the `--chart-1..5` CSS variables defined in §4.6.

### 11.1 Sequential / categorical series order

For any multi-series chart (line, bar, stacked bar), assign colors in this fixed order so the same metric always gets the same color across the app:

```text
Series 1 → chart-1  ocean-600   #0284C7   (primary metric, e.g. Total Exchange)
Series 2 → chart-2  seasurf-500 #06B6D4   (secondary metric, e.g. Consumption)
Series 3 → chart-3  ocean-400   #38BDF8   (tertiary)
Series 4 → chart-4  seasurf-300 #67E8F9   (quaternary)
Series 5 → chart-5  ocean-900   #0C4A6E   (reference/baseline line, e.g. Min Stock threshold)
```

### 11.2 Chart-type specific rules

```text
Line chart (Exchange Trend, Stock Trend)
  Line stroke   : chart-1, 2px
  Area fill     : chart-1 at 12% opacity (gradient fade to transparent)
  Grid lines    : slate-200, dashed, 1px
  Axis labels   : slate-500, 12px

Bar chart (Exchange by Type, Factory Comparison)
  Bars          : chart-1 default; when representing Exchange Type category, use §10 category
                  colors instead (BROKEN=danger-500, BENT=warning-500, CHANGEOVER=ocean-500)
                  so the chart stays legible against the badges used elsewhere
  Radius        : rounded top corners 4px
  Bar gap       : 8px within group, 24px between groups

Donut chart (Exchange by Type alternate view)
  Segments      : same category-color rule as bar chart above
  Center label  : total count, text-2xl font-bold slate-900

Trolley/Factory comparison (horizontal bar or ranked list)
  Bars          : chart-1, with chart-5 (ocean-900) for the "leader"/highest value

Stock Alert widgets (Low Stock / Out of Stock)
  Always rendered as list + StatusBadge (warning/danger), never folded into the
  ocean-toned chart palette — alerts must stay visually distinct per §25
```

### 11.3 Why alerts break the blue palette on purpose

The brief calls for charts in the blue-ocean palette, and that applies to all *trend/volume/comparison* visualizations. Broken/Bent/Changeover category charts and Stock Alerts intentionally use amber/red because they map to defect and risk signals defined in the business process docs — keeping the whole UI monochrome-blue here would violate the "never rely on color alone / status must be distinguishable" rule already established in §14/§59 of the UX spec. Ocean blue remains the dominant palette for all volume/trend/neutral analytics (roughly 80% of chart surface area); amber/red are reserved for the ~20% that represents defects or risk.

---

## 12. Accessibility Checklist (design-level)

```text
[ ] Body text on background        ≥ 4.5:1   (slate-600 on slate-50 = 7.7:1 ✓)
[ ] Primary button text on fill     ≥ 4.5:1   (white on ocean-600 = 5.9:1 ✓)
[ ] Badge text on tint background   ≥ 4.5:1   (e.g. warning-700 on warning-50 = 7.1:1 ✓)
[ ] Focus ring visible on all interactive elements (ring-2 ring-ocean-500, offset 2px)
[ ] Every status/alert = color + icon + text, never color alone
[ ] Charts include data labels/legend/tooltip, not color-only differentiation
[ ] Minimum interactive target 32px height (desktop, mouse-first — not the 44px touch minimum used by the mobile app)
```

---

## 13. Screen-Level Application Notes

Quick pairing of the component system above to the highest-traffic screens from `18-WebApps-UI-UX-Specification.md`, so Claude Code can scaffold in the right order:

```text
Dashboard (§8–10)
  KpiCard × 4 (Exchange, Broken, Bent, Changeover) + ChartCard (Exchange Trend, line)
  + 2-col ChartCard/DataTable (Top Needle Types, Stock Alert list)

Exchange Transactions (§11–14)
  DataTable + FilterBar (search, factory, type, date) + StatusBadge column
  → row click opens full Detail Page (§49) with AuditTimeline component

Confirmation Monitoring (§15–16)
  Tabs (Pending/Approved/Rejected/Expired) + DataTable + StatusBadge
  → Detail Drawer (quick inspection, per §49)

Stock Overview / Movement (§18–21)
  Hierarchical FilterBar (Factory → Trolley → Needle Type) + DataTable
  Stock status column uses success/warning/danger StatusBadge (Normal/Low/Out of Stock)

Receiving / Transfer / Adjustment (§22–24)
  Stepper-style Form (source → destination/qty → validation) + ConfirmDialog with
  balance-impact summary (§9.7) — Adjustment form requires Reason field + elevated permission gate

Master Data screens (§26–34)
  Standard DataTable + Form Dialog (create/edit) pattern, identical chrome across all masters

Administration (Users, Roles, Devices, Audit)
  Devices use Wifi/WifiOff status icons (§8); Audit Log is dense DataTable, zebra striping on

Analytics (§40–46)
  ChartCard grid, 2-column on desktop; category charts use §10 category colors,
  trend/volume charts use §11.1 sequential ocean/seasurf order
```

---

## 14. Design Tokens — Tailwind Config Extension

```ts
// tailwind.config.ts (excerpt)
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
};
```

---

## 15. Component Inventory Checklist (for Claude Code scaffolding order)

```text
Phase 1 — Shell & primitives
  [ ] AppShell, Sidebar, TopBar, Breadcrumb, PageHeader
  [ ] Button, Badge/StatusBadge, Card, Input, Select, Dialog, Tooltip

Phase 2 — Data display
  [ ] DataTable (+ Pagination, FilterBar, empty/loading/error states)
  [ ] KpiCard, ChartCard (Recharts wrapper), AuditTimeline

Phase 3 — Forms & flows
  [ ] FormField set (react-hook-form + zod), ConfirmDialog, Stepper (Receiving/Transfer)
  [ ] FactorySelector, TrolleySelector, NeedleTypeSelector, DateRangePicker

Phase 4 — Feedback & domain widgets
  [ ] NotificationPanel/Toast, EvidenceViewer (photo), StatusBadge variant set (§10)
  [ ] Inventory location tree visualization (§57)
```

---

## 16. Next Step

1. Scaffold `globals.css` and `tailwind.config.ts` from §4.6/§14.
2. Install shadcn/ui base components (`button`, `badge`, `card`, `table`, `dialog`, `form`, `select`, `tabs`, `skeleton`, `sonner`/`toast`, `chart`).
3. Build `StatusBadge` and `KpiCard` first — nearly every screen in `18-WebApps-UI-UX-Specification.md` depends on them.
4. Cross-check every new screen against §10 (status mapping) and §12 (accessibility checklist) before merging.
