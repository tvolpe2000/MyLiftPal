# Design Document

**Product Name:** MyLiftPal  
**Version:** 1.0  
**Author:** Design Team  
**Last Updated:** December 2024  

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Iconography](#6-iconography)
7. [Motion & Animation](#7-motion--animation)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility](#9-accessibility)
10. [Theme Variants](#10-theme-variants)

---

## 1. Design Principles

### 1.1 Core Principles

**1. Gym-First**
> Design for one-handed use with sweaty hands in poor lighting.

- Large touch targets (minimum 44×44px)
- High contrast for readability
- Simple, focused screens
- Minimal required inputs per action

**2. Glanceable**
> Critical information should be understood in under 2 seconds.

- Volume status visible at all times during workout
- Color-coded indicators over text labels
- Progress states immediately obvious
- No hunting for information

**3. Flow State**
> Never interrupt the user's workout momentum.

- Auto-save everything
- Minimal confirmations
- Smart defaults
- Quick recovery from errors

**4. Progressive Disclosure**
> Show only what's needed now; reveal complexity on demand.

- Collapsed exercise cards by default
- Expandable volume details
- Optional advanced settings
- Help text on hover/tap, not inline

### 1.2 Design Goals

| Goal | Implementation |
|------|----------------|
| Speed | Pre-filled inputs, one-tap actions |
| Confidence | Clear feedback, undo available |
| Focus | Minimal chrome, content-first |
| Trust | Transparent calculations, data always saved |

---

## 2. Color System

### 2.1 Primary Theme: Emerald Dark

The primary theme uses an emerald green accent against a dark, desaturated green-black background. This creates a cohesive, growth-oriented aesthetic distinct from competitor apps.

#### Core Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a120f;      /* Main app background */
  --bg-secondary: #0f1a16;    /* Cards, panels, modals */
  --bg-tertiary: #162420;     /* Inputs, elevated elements */
  --bg-hover: #1c2e28;        /* Hover states */
  
  /* Accent */
  --accent-primary: #10b981;  /* Primary buttons, active states */
  --accent-hover: #34d399;    /* Button hover */
  --accent-muted: #065f46;    /* Subtle accent backgrounds */
  
  /* Semantic */
  --success: #22c55e;         /* Completed, positive */
  --warning: #eab308;         /* Caution, approaching limits */
  --error: #ef4444;           /* Errors, exceeded limits */
  --info: #3b82f6;            /* Informational */
  
  /* Text */
  --text-primary: #ffffff;    /* Primary text */
  --text-secondary: #a1a1aa;  /* Secondary text */
  --text-muted: #71717a;      /* Disabled, hints */
  --text-inverse: #0a120f;    /* Text on light backgrounds */
  
  /* Borders */
  --border-default: #1f2f29;  /* Default borders */
  --border-subtle: #162420;   /* Subtle dividers */
  --border-focus: #10b981;    /* Focus rings */
}
```

#### Color Usage Guidelines

| Element | Color Token | Notes |
|---------|-------------|-------|
| App background | `--bg-primary` | Always |
| Cards | `--bg-secondary` | Slight elevation |
| Input fields | `--bg-tertiary` | Distinguishable from cards |
| Primary buttons | `--accent-primary` | Main CTAs only |
| Secondary buttons | `--bg-tertiary` | With border |
| Completed checkboxes | `--success` | Green checkmark |
| Volume "good" | `--success` | Within MAV |
| Volume "caution" | `--warning` | Below MEV or near MRV |
| Volume "problem" | `--error` | Below MV or exceeds MRV |
| Links | `--accent-primary` | Underline on hover |
| Disabled elements | `--text-muted` | 50% opacity |

### 2.2 Volume Status Colors

Volume indicators use a traffic light system:

```css
.volume-status {
  /* Optimal range (MEV to MAV) */
  --volume-good: #22c55e;      /* Green */
  
  /* Caution (Below MEV or MAV to MRV) */
  --volume-caution: #eab308;   /* Yellow */
  
  /* Problem (Below MV or exceeds MRV) */
  --volume-problem: #ef4444;   /* Red */
}
```

| Status | Color | Emoji | Meaning |
|--------|-------|-------|---------|
| `below_mv` | Red | 🔴 | Critically low volume |
| `at_mev` | Yellow | 🟡 | Below optimal, may want more |
| `in_mav` | Green | 🟢 | Optimal volume range |
| `approaching_mrv` | Yellow | 🟡 | High volume, watch fatigue |
| `exceeds_mrv` | Red | 🔴 | Too much volume |

### 2.3 Muscle Group Colors

Each muscle group has an assigned color for tags and badges:

```css
:root {
  /* Upper Body */
  --muscle-chest: #ef4444;      /* Red */
  --muscle-back: #3b82f6;       /* Blue */
  --muscle-shoulders: #f97316;  /* Orange */
  --muscle-biceps: #22c55e;     /* Green */
  --muscle-triceps: #14b8a6;    /* Teal */
  --muscle-forearms: #84cc16;   /* Lime */
  
  /* Lower Body */
  --muscle-quads: #8b5cf6;      /* Purple */
  --muscle-hamstrings: #a855f7; /* Violet */
  --muscle-glutes: #ec4899;     /* Pink */
  --muscle-calves: #d946ef;     /* Fuchsia */
  
  /* Core */
  --muscle-abs: #06b6d4;        /* Cyan */
  --muscle-obliques: #0ea5e9;   /* Sky */
  
  /* Traps */
  --muscle-traps: #6366f1;      /* Indigo */
}
```

### 2.4 Dark Mode Contrast Ratios

All text must meet WCAG AA standards:

| Text Type | Foreground | Background | Ratio | Pass |
|-----------|------------|------------|-------|------|
| Primary text | #ffffff | #0a120f | 18.1:1 | ✅ AAA |
| Secondary text | #a1a1aa | #0a120f | 7.2:1 | ✅ AAA |
| Muted text | #71717a | #0a120f | 4.6:1 | ✅ AA |
| Accent on bg | #10b981 | #0a120f | 8.4:1 | ✅ AAA |
| Text on accent | #0a120f | #10b981 | 8.4:1 | ✅ AAA |

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 
               monospace;
}
```

**Primary Font:** Inter
- Clean, modern sans-serif
- Excellent legibility at small sizes
- Variable font support for performance

**Monospace Font:** JetBrains Mono
- Used for numbers in inputs
- Clear distinction between similar characters

### 3.2 Type Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.3 Type Styles

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Page Title | 24px | 700 | 1.25 | Screen headers |
| Section Title | 18px | 600 | 1.25 | Card headers, sections |
| Body | 16px | 400 | 1.5 | Default text |
| Body Bold | 16px | 600 | 1.5 | Emphasis |
| Small | 14px | 400 | 1.5 | Secondary info |
| Caption | 12px | 400 | 1.5 | Labels, hints |
| Overline | 12px | 600 | 1.25 | Section labels, ALL CAPS |
| Number (Input) | 18px | 500 | 1 | Form inputs |
| Number (Display) | 20px | 600 | 1 | Stats, counts |

### 3.4 Typography Examples

```css
/* Page Title */
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Exercise Name */
.exercise-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Set Input */
.set-input {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  text-align: center;
}

/* Volume Label */
.volume-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on 4px base unit:

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### 4.2 Layout Containers

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}
```

### 4.3 Component Spacing

| Context | Padding | Gap |
|---------|---------|-----|
| Page | 16px horizontal | - |
| Card | 16px all sides | - |
| Card header to content | - | 12px |
| Between cards | - | 12px |
| Form field to label | - | 8px |
| Between form fields | - | 16px |
| Button padding | 12px vertical, 16px horizontal | - |
| Input padding | 10px vertical, 12px horizontal | - |
| Bottom nav | 12px vertical | - |

### 4.4 Border Radius

```css
:root {
  --radius-sm: 6px;     /* Small elements, tags */
  --radius-md: 8px;     /* Buttons, inputs */
  --radius-lg: 12px;    /* Cards */
  --radius-xl: 16px;    /* Modals, large cards */
  --radius-full: 9999px; /* Pills, avatars */
}
```

---

## 5. Components

### 5.1 Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  transition: background 150ms ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--accent-primary);
  padding: 12px 16px;
}

.btn-ghost:hover {
  background: var(--accent-muted);
}
```

### 5.2 Input Fields

```css
.input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: border-color 150ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.input::placeholder {
  color: var(--text-muted);
}

/* Number input (weight/reps) */
.input-number {
  font-family: var(--font-mono);
  text-align: center;
  width: 70px;
}
```

### 5.3 Cards

```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.card-elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 2px 4px -2px rgba(0, 0, 0, 0.2);
}
```

### 5.4 Exercise Card

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐    │
│  │ Incline DB Press                   ▶️ ℹ️│    │  Header
│  │ [Chest] [Triceps] [Front Delts]        │    │  Tags
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Last: 80 lbs × 12, 12, 11, 10                 │  Previous
│  Today: 85 lbs × 8-10, 4 sets, RIR 2          │  Recommended
│                                                 │
│  ┌─────┬─────────────┬─────────────┬─────┐    │
│  │  1  │ [85] lbs    │ [12] reps   │ ☑️  │    │  Set Row
│  ├─────┼─────────────┼─────────────┼─────┤    │
│  │  2  │ [85] lbs    │ [10] reps   │ ☑️  │    │
│  ├─────┼─────────────┼─────────────┼─────┤    │
│  │  3  │ [85] lbs    │ [  ] reps   │ ☐   │    │
│  ├─────┼─────────────┼─────────────┼─────┤    │
│  │  4  │ [85] lbs    │ [  ] reps   │ ☐   │    │
│  └─────┴─────────────┴─────────────┴─────┘    │
│                                                 │
│  + Add Set                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.5 Set Row

```css
.set-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 44px;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.set-number {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
}

.set-checkbox {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-default);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.set-checkbox.completed {
  background: var(--success);
  border-color: var(--success);
  color: white;
}
```

### 5.6 Volume Bar

```css
.volume-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.volume-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.volume-emoji {
  font-size: 12px;
}

.volume-muscle {
  color: var(--text-secondary);
}

.volume-count {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}
```

### 5.7 Muscle Tag

```css
.muscle-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.muscle-tag-primary {
  background: var(--tag-color);
  color: white;
}

.muscle-tag-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}
```

### 5.8 Bottom Navigation

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: var(--space-3) 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  /* Safe area for notched phones */
  padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-muted);
  cursor: pointer;
  transition: color 150ms ease;
}

.nav-item.active {
  color: var(--accent-primary);
}

.nav-icon {
  font-size: 20px;
}
```

---

## 6. Iconography

### 6.1 Icon Library

Use **Lucide Icons** (open source, consistent style).

```
npm install lucide-svelte
```

### 6.2 Icon Sizing

| Context | Size | Usage |
|---------|------|-------|
| Navigation | 24px | Bottom nav, side nav |
| Button icon | 20px | Icon buttons |
| Inline | 16px | Within text, lists |
| Large | 32px | Empty states, modals |
| Extra Large | 48px | Onboarding, errors |

### 6.3 Common Icons

| Action | Icon | Name |
|--------|------|------|
| Home | 🏠 | `Home` |
| Training Blocks | 📋 | `ClipboardList` |
| Exercises | 💪 | `Dumbbell` |
| Settings | ⚙️ | `Settings` |
| Add | + | `Plus` |
| Edit | ✏️ | `Pencil` |
| Delete | 🗑️ | `Trash2` |
| Back | ← | `ArrowLeft` |
| Play video | ▶️ | `Play` |
| Info | ℹ️ | `Info` |
| Check | ✓ | `Check` |
| Download | 📥 | `Download` |
| Mic | 🎤 | `Mic` |
| Camera | 📷 | `Camera` |
| Calendar | 📅 | `Calendar` |
| Clock | ⏱️ | `Clock` |
| Offline | 📶✕ | `WifiOff` |

---

## 7. Motion & Animation

### 7.1 Timing Functions

```css
:root {
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 7.2 Duration Scale

| Duration | Usage |
|----------|-------|
| 75ms | Micro-interactions (checkbox) |
| 150ms | Buttons, hover states |
| 200ms | Expand/collapse |
| 300ms | Modal open/close |
| 500ms | Page transitions |

### 7.3 Animation Patterns

**Checkbox Completion**
```css
.set-checkbox {
  transition: all 75ms var(--ease-out);
}

.set-checkbox.completed {
  animation: checkmark 150ms var(--ease-out);
}

@keyframes checkmark {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

**Card Expand**
```css
.exercise-card-content {
  overflow: hidden;
  transition: max-height 200ms var(--ease-out);
}
```

**Toast Notification**
```css
.toast {
  animation: slideUp 300ms var(--ease-out);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 7.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### 8.2 Layout Adaptations

| Component | Mobile (<768px) | Desktop (≥768px) |
|-----------|-----------------|------------------|
| Navigation | Bottom tabs | Side navigation |
| Volume bar | Compact (icons + numbers) | Expanded with labels |
| Exercise card | Full width, stacked | Can show multiple columns |
| Set inputs | Side by side | Side by side with more spacing |
| Training Block wizard | Full screen steps | Modal or split view |
| Settings | Full screen | Contained panel |

### 8.3 Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Buttons | 44×44px | 48×48px |
| Checkboxes | 44×44px | 48×48px |
| Nav items | 44×44px | Full width |
| List items | 44px height | 56px height |
| Input fields | 44px height | 48px height |

### 8.4 Safe Areas

```css
/* iOS safe area support */
.bottom-nav {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.page-container {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 9. Accessibility

### 9.1 Focus States

```css
/* Visible focus for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Remove default outline (we're using focus-visible) */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 9.2 Screen Reader Support

| Element | ARIA Attributes |
|---------|-----------------|
| Volume indicator | `aria-label="Chest volume: 12 of 16 sets, optimal range"` |
| Checkbox | `role="checkbox"`, `aria-checked="true/false"` |
| Exercise card | `aria-expanded="true/false"` |
| Loading spinner | `aria-busy="true"`, `aria-label="Loading"` |
| Toast | `role="alert"`, `aria-live="polite"` |

### 9.3 Color Blindness

Volume status includes both color AND emoji:
- 🟢 Green (optimal) - also shown as filled circle
- 🟡 Yellow (caution) - also shown as warning triangle
- 🔴 Red (problem) - also shown as alert icon

### 9.4 Text Alternatives

| Visual Element | Alternative |
|----------------|-------------|
| Muscle color tag | Text label always visible |
| Status emoji | Status text available |
| Icon buttons | `aria-label` required |
| Video thumbnail | Title text |

---

## 10. Theme Variants

### 10.1 Future Theme Support

The app is designed to support user-selectable accent colors. The following themes are planned:

#### Emerald (Default)
```css
--accent-primary: #10b981;
--accent-hover: #34d399;
--accent-muted: #065f46;
--bg-primary: #0a120f;
--bg-secondary: #0f1a16;
```

#### Blue
```css
--accent-primary: #3b82f6;
--accent-hover: #60a5fa;
--accent-muted: #1e3a5f;
--bg-primary: #0a0a12;
--bg-secondary: #12121f;
```

#### Cyan
```css
--accent-primary: #06b6d4;
--accent-hover: #22d3ee;
--accent-muted: #0e4d5c;
--bg-primary: #0a1214;
--bg-secondary: #0f1a1d;
```

#### Indigo
```css
--accent-primary: #6366f1;
--accent-hover: #818cf8;
--accent-muted: #312e81;
--bg-primary: #0c0a14;
--bg-secondary: #14121f;
```

#### Orange
```css
--accent-primary: #f97316;
--accent-hover: #fb923c;
--accent-muted: #7c2d12;
--bg-primary: #0f0d0a;
--bg-secondary: #1a1610;
```

#### Slate (Minimal)
```css
--accent-primary: #3b82f6;
--accent-hover: #60a5fa;
--accent-muted: #1e3a5f;
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
```

### 10.2 Theme Implementation

```typescript
// Store user preference
interface UserPreferences {
  theme: 'emerald' | 'blue' | 'cyan' | 'indigo' | 'orange' | 'slate';
}

// Apply theme via CSS custom properties
function applyTheme(theme: string) {
  const root = document.documentElement;
  const themeColors = themes[theme];
  
  Object.entries(themeColors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
```

### 10.3 Theme Preview Component

```
┌─────────────────────────────────────┐
│ Choose Your Theme                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 🟢  │ │ 🔵  │ │ 🩵  │           │
│  │Emrld│ │Blue │ │Cyan │           │
│  └──●──┘ └─────┘ └─────┘           │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 🟣  │ │ 🟠  │ │ ⚪  │           │
│  │Indgo│ │Ornge│ │Slate│           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  Preview:                           │
│  ┌─────────────────────────────┐    │
│  │ [Sample Card with Theme]   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Appendix A: Design Checklist

Use this checklist when designing new screens:

- [ ] Uses correct background colors (`bg-primary`, `bg-secondary`)
- [ ] Text meets contrast requirements
- [ ] Touch targets are at least 44×44px
- [ ] Loading states are defined
- [ ] Error states are defined
- [ ] Empty states are defined
- [ ] Offline state is handled
- [ ] Focus states are visible
- [ ] Screen reader labels are present
- [ ] Animations respect reduced motion preference
- [ ] Safe areas are respected on mobile

---

## Appendix B: Asset Specifications

### App Icons

| Size | Usage |
|------|-------|
| 192×192 | Android, PWA manifest |
| 512×512 | Android splash, PWA manifest |
| 180×180 | iOS home screen |
| 167×167 | iPad Pro |
| 152×152 | iPad |
| 120×120 | iPhone |
| 32×32 | Favicon |
| 16×16 | Favicon |

### Splash Screens

Follow PWA splash screen guidelines using `theme_color` and app icon.

---

*End of Design Document*
