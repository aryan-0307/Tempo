# Tempo Design System Specification

## Theme: Neo-Brutalist Light (Default)

### 1. Overview & Aesthetic
Tempo features a **Modern Neo-Brutalist UI** inspired by high-contrast, structured poster art and modern engineering interfaces:
- **Thick Black Borders**: Consistent 2px (and 3px for elevated modals) solid `#111111` borders on every interactive element.
- **Sharp Rectangular Geometry**: 0px border-radii for cards, buttons, badges, and modals.
- **Hard Offset Shadows**: Unblurred offset drop-shadows (`3px 3px 0px #111111` and `4px 4px 0px #111111`).
- **Tactile Micro-Interactions**: Mechanical button clicks translating down-right by 2px with shrinking offset shadow.
- **Subtle Technical Grid**: Architectural 24px grid pattern overlaid on an off-white `#F7F7F5` workspace canvas.
- **High-Contrast Typography**: Bold grotesque headings (`font-weight: 800`) with uppercase section trackers.
- **Vibrant Accent Colors**:
  - **Lime Green** (`#C6F55A`): Primary actions, active navigation items, completed checkboxes.
  - **Vibrant Pink** (`#FA779C`): Overdue cards, danger states, alert tags, urgent highlights.
  - **Vibrant Purple** (`#8051F5`): Completed metrics, callout banners, Design System project dot.
  - **Off-White** (`#F7F7F5`): Main application canvas and structural background.
  - **Near-Black** (`#111111`): Structural borders, hard offset shadows, high-contrast headings and body text.
  - **Pure White** (`#FFFFFF`): Inner card surfaces and input fields for pristine readability.

| Element | Hex Code | Role |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F7F5` | Off-white main canvas with 24px subtle grid |
| **Card Surface** | `#FFFFFF` | Crisp white cards and inputs for high contrast |
| **Borders & Shadows** | `#111111` | 2px solid structural borders and hard offset shadows |
| **Primary Text** | `#111111` | High-contrast bold typography |
| **Secondary Text** | `#555555` | Supporting labels, descriptions, and timestamps |
| **Lime Green Accent** | `#C6F55A` | Primary buttons, active nav, Total tasks card |
| **Pink Accent** | `#FA779C` | Overdue card, high priority tag, urgent badges |
| **Purple Accent** | `#8051F5` | Completed card, view indicators, callout blocks |

---

## Theme: Neo-Brutalist Dark

### 1. Overview & Aesthetic
The **Neo-Brutalist Dark Theme** provides an inverted high-contrast workspace with near-black charcoal surfaces, 2px white borders, and vibrant accents:
- **Near-Black Canvas**: `#111111` main background with subtle white grid.
- **Charcoal Card Surfaces**: `#222226` and `#18181B` with 2px solid `#FFFFFF` borders.
- **Sharp Typography**: Pure `#FFFFFF` headings with `#A3ACAA` secondary text.
- **Hard Offset Shadows**: Unblurred `4px 4px 0px #111111` shadows.
- **Vibrant Highlights**: Lime green (`#C6F55A`), pink (`#FA779C`), and purple (`#8051F5`).

| Element | Hex Code | Role |
| :--- | :--- | :--- |
| **Canvas Background** | `#111111` | Near-black canvas with 24px grid |
| **Card Surface** | `#222226` | Deep charcoal cards with `#FFFFFF` 2px borders |
| **Sidebar & Header** | `#18181B` | Structural dark containers |
| **Primary Text** | `#FFFFFF` | High-contrast crisp white typography |
| **Secondary Text** | `#A3ACAA` | Subtitles, descriptions, muted details |
| **Lime Green Accent** | `#C6F55A` | Active states, primary buttons, Total tasks card |
| **Pink Accent** | `#FA779C` | Overdue card, urgent tags |
| **Purple Accent** | `#8051F5` | Completed metrics, category tags |

---

## Theme: Carbon & Sage Teal

### 1. Overview & Aesthetic
Tempo uses the **Carbon & Sage Teal** design system — a modern, minimal, sophisticated dark theme inspired by the clean, focused interfaces of Linear, Slack, and Notion.

The interface emphasizes:
- Soft carbon and graphite surfaces
- Muted sage-teal accents
- Minimal visual clutter
- Clear task and project hierarchy
- Comfortable contrast for extended working sessions
- Subtle interactions and animations (150ms–200ms)

Avoid saturated blue, neon cyan, pure black (`#000000`), and large pure-white surfaces.

---

### 2. Core Color Palette

| UI Element | Hex Code | Role in Tempo |
| :--- | :--- | :--- |
| **Main background** | `#151719` | Main application canvas and outer workspace |
| **Sidebar background** | `#202426` | Soft carbon-grey sidebar and sticky topbar |
| **Card background** | `#303739` | Dashboard cards, task cards, search bar, modals |
| **Elevated surfaces** | `#373F40` | Hover states, secondary buttons, toast container |
| **Primary sage teal** | `#6BAFA4` | Primary buttons, active checkmarks, focus rings |
| **Light sage teal** | `#A2D2C9` | Active navigation labels, icon accents, stat indicators |
| **Primary text** | `#E7EAE9` | Headings, card metric values, task titles |
| **Secondary text** | `#A3ACAA` | Subtitles, supporting labels, form labels, search placeholder |
| **Muted text** | `#84918E` | Completed task text, timestamps, status bar |
| **Borders** | `#3B4444` | Subtle graphite borders on cards, inputs, and dividers |
| **Active navigation** | `#344A46` | Active navigation background pill |
| **Hover background** | `#303A39` | Navigation item hover, subtle tag backgrounds |

#### Status & Semantic Accents
| Accent | Hex Code | Role |
| :--- | :--- | :--- |
| **Status Success** | `#80B9A0` | Completed status, online dot, Personal project dot |
| **Status Warning** | `#D2AD70` | Warning notifications, medium indicators |
| **Status Danger** | `#D98B83` | Overdue indicators, delete action hover |
| **Status Info** | `#88AFC2` | Pending indicators, Design System project dot |
| **Primary Button Text** | `#14211E` | High-contrast dark text on sage-teal buttons |

#### Priority Badges
| Priority | Text | Background | Border |
| :--- | :--- | :--- | :--- |
| **High** | `#E5A49D` | `#513A39` | `#3B4444` |
| **Medium** | `#E0BC80` | `#514638` | `#3B4444` |
| **Low** | `#A5C4D0` | `#35464C` | `#3B4444` |

---

### 3. Global CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-main: #151719;
  --bg-sidebar: #202426;
  --bg-header: #202426;
  --bg-card: #303739;
  --bg-elevated: #373F40;
  --bg-hover: #303A39;

  /* Typography */
  --text-primary: #E7EAE9;
  --text-secondary: #A3ACAA;
  --text-muted: #84918E;

  /* Sage Teal */
  --accent-primary: #6BAFA4;
  --accent-light: #A2D2C9;
  --accent-hover: #83C3B7;
  --accent-subtle: #344A46;

  /* Borders */
  --border-default: #3B4444;
  --border-focus: #6BAFA4;

  /* Status */
  --status-success: #80B9A0;
  --status-warning: #D2AD70;
  --status-danger: #D98B83;
  --status-info: #88AFC2;

  /* Priority Badges */
  --priority-high-text: #E5A49D;
  --priority-high-bg: #513A39;
  --priority-med-text: #E0BC80;
  --priority-med-bg: #514638;
  --priority-low-text: #A5C4D0;
  --priority-low-bg: #35464C;

  /* Shadows */
  --shadow-card: 0 2px 10px rgba(0, 0, 0, 0.10);

  /* Motion */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}
```

---

### 4. Component Guidelines

#### 4.1 Sidebar
- Background: `#202426`
- Primary text: `#E7EAE9`, Secondary text & icons: `#A3ACAA`
- Active nav item: Background `#344A46`, text `#A2D2C9`
- Hover state: Background `#303A39`
- Dividers: `#3B4444`

#### 4.2 Topbar & Header
- Background: `#202426`, Bottom border: `#3B4444`
- Search bar: Background `#303739`, Border `#3B4444`, Text `#E7EAE9`, Focus border `#6BAFA4`
- Icons: `#A3ACAA`, Icon hover: `#A2D2C9`

#### 4.3 Dashboard Metric Cards
- Background: `#303739`, Border: `1px solid #3B4444`, Radius: `12px`
- Numbers: `#E7EAE9`, Labels: `#A3ACAA`, Icons: `#A2D2C9`

#### 4.4 Task Cards & Lists
- Background: `#303739`, Hover: `#373F40`, Border: `#3B4444`
- Title: `#E7EAE9`, Metadata: `#A3ACAA`
- Completed task text: `#84918E` (with strike-through)
- Checkbox accent: `#6BAFA4` (checked with `#14211E` mark)

#### 4.5 Buttons & Forms
- Primary button: Background `#6BAFA4`, Text `#14211E`, Hover `#83C3B7`, Radius `8px`
- Secondary button: Background `#303739`, Text `#E7EAE9`, Border `#3B4444`, Hover `#373F40`
- Form inputs: Background `#151719`, Border `#3B4444`, Text `#E7EAE9`, Focus `#6BAFA4`

#### 4.6 Modals, Dialogs & Overlays
- Backdrop: `rgba(21, 23, 25, 0.75)` with `backdrop-filter: blur(4px)`
- Card: Background `#303739`, Border `#3B4444`, Radius `12px`

---

### 5. Accessibility & Motion
- All text meets **WCAG AA** contrast requirements on their respective surfaces.
- Focus outlines remain distinct and accessible (`--border-focus: #6BAFA4`).
- All transitions are subtle (150ms–200ms) with `prefers-reduced-motion` support.

---

### 6. Handcrafted Multi-Theme Architecture (10 Presets)

Tempo includes a built-in theme engine enabling users to select their preferred appearance from the **Settings & Preferences** page. Selection is applied instantly via `[data-theme="..."]` and persisted to `localStorage ('tempo_theme')`.

| Theme ID | Theme Name | Primary Aesthetic | Dominant Accents |
| :--- | :--- | :--- | :--- |
| `carbon-teal` | **Carbon & Sage Teal** (Default) | Graphite dark theme | Soft Sage Teal (`#6BAFA4`) |
| `midnight-navy` | **Midnight Navy** | Deep oceanic slate | Electric Cyan (`#38BDF8`) |
| `obsidian-amber` | **Obsidian Amber** | Dark charcoal canvas | Warm Radiant Amber (`#F59E0B`) |
| `forest-emerald` | **Forest Emerald** | Botanical moss surfaces | Vibrant Emerald (`#10B981`) |
| `nordic-frost` | **Nordic Frost** | Cool arctic slate | Ice Glacier Blue (`#60A5FA`) |
| `sunset-crimson` | **Sunset Crimson** | Deep plum & graphite | Coral Rose & Crimson (`#FB7185`) |
| `cyberpunk-violet` | **Cyberpunk Violet** | Ultra-deep violet canvas | Electric Purple (`#A855F7`) |
| `monochrome-slate` | **Monochrome Slate** | Minimal high-contrast graphite | Platinum Silver (`#E4E4E7`) |
| `warm-sepia` | **Warm Sepia** | Roasted espresso & caramel | Warm Caramel (`#D97706`) |
| `paper-light` | **Paper Light** | Architectural clean light mode | Precision Sky Blue (`#0EA5E9`) |

