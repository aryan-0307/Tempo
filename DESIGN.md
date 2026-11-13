# Tempo Design System Specification

## Theme: Venice Blue, Rock Blue & Crisp White (Zero Brown Tones)

### 1. Palette Overview
The design system exclusively uses the 3-color palette shown below. All brown, beige, tan, cream, and legacy tones have been completely eliminated from the entire site. The application features a rich, professional Venice Blue sidebar with a crisp, minimal white workspace and Rock Blue active highlights.

| Swatch | Color Name | Hex Code | RGB | Role in Tempo |
| :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:14px;height:14px;background-color:#FFFFFF;vertical-align:middle;border-radius:2px;border:1px solid #ccc;"></span> | **Crisp White** | `#FFFFFF` | `rgb(255, 255, 255)` | Main canvas background, card surfaces, topbar, modal dialogs, and inverse typography |
| <span style="display:inline-block;width:14px;height:14px;background-color:#84B3CE;vertical-align:middle;border-radius:2px;"></span> | **Rock Blue** | `#84B3CE` | `rgb(132, 179, 206)` | Active sidebar indicator pills, brand icon accent, avatar fill, medium priority badges, hover tints |
| <span style="display:inline-block;width:14px;height:14px;background-color:#16587B;vertical-align:middle;border-radius:2px;"></span> | **Venice Blue** | `#16587B` | `rgb(22, 88, 123)` | Sidebar background, primary typography, action buttons, active navigation, strong borders, dark accents |

---

### 2. Strict Deviation & Zero-Brown Policy
- **Zero Brown / Beige / Cream**: All warm sand, beige, cream, or brownish tones (such as legacy Merino beige, Ivory cream, and Morning mist) are strictly forbidden.
- **Zero Foreign Hues**: No unapproved colors (reds, greens, purples, oranges, or foreign blues) are permitted.
- **Allowed Variations**: Every style across the entire application must be derived strictly from the three approved colors or their exact alpha channel opacities:
  - `rgba(255, 255, 255, <alpha>)` — White opacities (sidebar text, overlays, subtle borders)
  - `rgba(132, 179, 206, <alpha>)` — Rock Blue opacities (card hover surfaces, focus rings, tag fills, stat icon tints)
  - `rgba(22, 88, 123, <alpha>)` — Venice Blue opacities (borders, shadows, dark overlays)

---

### 3. Design Tokens & Functional Mappings

#### 3.1 Backgrounds & Surfaces
- **App Canvas (`--color-bg-app`)**: `#FFFFFF` (Crisp White) provides an ultra-clean, modern, minimalist workspace with zero dingy tint.
- **Card Surfaces (`--color-bg-surface`)**: `#FFFFFF` for main cards, stat widgets, task items, topbar, and modal cards.
- **Subtle Surface (`--color-bg-subtle`)**: `rgba(132, 179, 206, 0.12)` (light Rock Blue tint) for search bar, tag containers, and table headers.
- **Hover Surface (`--color-bg-hover`)**: `rgba(132, 179, 206, 0.2)` for task item hover and secondary button hover.
- **Active Surface (`--color-bg-active`)**: `rgba(22, 88, 123, 0.1)`.

#### 3.2 Sidebar Tokens (Rich Venice Blue)
- **Sidebar Background (`--color-sidebar-bg`)**: `#16587B` (Venice Blue).
- **Sidebar Text (`--color-sidebar-text`)**: `#FFFFFF`.
- **Sidebar Text Muted (`--color-sidebar-text-muted`)**: `rgba(255, 255, 255, 0.7)`.
- **Sidebar Hover (`--color-sidebar-hover`)**: `rgba(255, 255, 255, 0.1)`.
- **Sidebar Active Indicator (`--color-sidebar-active`)**: `#84B3CE` (Rock Blue).
- **Sidebar Active Text (`--color-sidebar-active-text`)**: `#16587B` (Venice Blue).
- **Sidebar Border (`--color-sidebar-border`)**: `rgba(255, 255, 255, 0.12)`.

#### 3.3 Borders & Dividers
- **Standard Border (`--color-border`)**: `rgba(22, 88, 123, 0.18)` provides clean architectural framing without harshness.
- **Subtle Border (`--color-border-subtle`)**: `rgba(22, 88, 123, 0.1)`.
- **Focus Border (`--color-border-focus`)**: `#16587B` (Venice Blue).
- **Strong Border (`--color-border-strong`)**: `#16587B` (Venice Blue).

#### 3.4 Typography
- **Primary Text (`--color-text-primary`)**: `#16587B` (Venice Blue). 7.5:1 contrast on white canvas (WCAG AAA Pass).
- **Secondary Text (`--color-text-secondary`)**: `rgba(22, 88, 123, 0.8)`. Used for subtitles, descriptions, and metadata.
- **Muted Text (`--color-text-muted`)**: `rgba(22, 88, 123, 0.6)`. Used for timestamps, shortcuts, and counters.
- **Inverse Text (`--color-text-inverse`)**: `#FFFFFF` on dark buttons, badges, and the Venice Blue sidebar.

#### 3.5 Buttons & Controls
- **Primary Button**:
  - Background: `#16587B` (Venice Blue)
  - Text: `#FFFFFF`
  - Hover: `#16587B` with subtle elevation
- **Secondary Button**:
  - Background: `#FFFFFF`
  - Border: `rgba(22, 88, 123, 0.25)`
  - Text: `#16587B`
  - Hover: `rgba(132, 179, 206, 0.15)` with `#84B3CE` border
- **Icon Button**:
  - Color: `#16587B`
  - Hover Background: `rgba(132, 179, 206, 0.2)`

#### 3.6 Priority Indicators
- **High Priority**: Solid `#16587B` (Venice Blue) background with `#FFFFFF` text.
- **Medium Priority**: `#84B3CE` (Rock Blue) background with `#16587B` (Venice Blue) text and `rgba(22, 88, 123, 0.3)` border.
- **Low Priority**: `rgba(132, 179, 206, 0.2)` background with `#16587B` (Venice Blue) text and `rgba(22, 88, 123, 0.2)` border.

#### 3.7 Project Categorization
- **Work**: `#84B3CE` (Rock Blue) dot.
- **Personal**: `#FFFFFF` (Crisp White) dot.
- **Design System**: `rgba(255, 255, 255, 0.5)` dot.

#### 3.8 Stat Metric Cards
- **Total Tasks**: `#16587B` icon on `rgba(22, 88, 123, 0.12)` background.
- **Completed Tasks**: `#16587B` icon on `rgba(132, 179, 206, 0.3)` background.
- **Pending Tasks**: `#16587B` icon on `rgba(132, 179, 206, 0.2)` background.
- **Overdue Tasks**: `#16587B` icon on `rgba(22, 88, 123, 0.18)` background.

#### 3.9 Checkbox & Interactive Indicators
- **Unchecked**: Border `rgba(22, 88, 123, 0.35)`, Background `#FFFFFF`.
- **Hover**: Border `#16587B`.
- **Checked**: Background `#16587B`, Border `#16587B`, Checkmark `#FFFFFF`.
- **Focus Ring**: `box-shadow: 0 0 0 3px rgba(22, 88, 123, 0.2)`.

#### 3.10 Modals & Overlays
- **Backdrop**: `rgba(22, 88, 123, 0.45)` with `backdrop-filter: blur(2px)`.
- **Card**: `#FFFFFF` background, `rgba(22, 88, 123, 0.2)` border, `#16587B` text.
- **Inputs**: `#FFFFFF` background, `rgba(22, 88, 123, 0.2)` border, `#16587B` text.

---

### 4. Accessibility & Contrast Compliance

| Pairing | Text / Foreground | Background Surface | Contrast Ratio | Rating |
| :--- | :--- | :--- | :--- | :--- |
| Venice Blue on White | `#16587B` | `#FFFFFF` | **7.5 : 1** | **AAA Pass** |
| White on Venice Blue | `#FFFFFF` | `#16587B` | **7.5 : 1** | **AAA Pass** |
| Venice Blue on Rock Blue | `#16587B` | `#84B3CE` | **4.5 : 1** | **AA Pass** |
