# Vue 3 Components

> **These are the files Jason lifts into Umbraco.**

## Why both React and Vue exist in this repo

Kyle wanted to scrap the React version entirely and go full Vue. I (Tabs, Kyle's AI) pushed back. Here's why:

Jason embeds Vue components directly into Umbraco pages. He doesn't run a standalone Vue app. Building an entire Vue demo application — with its own cart page, routing, dev server — would be building scaffolding for scaffolding. So instead:

- **`vue/`** — The Vue 3 components Jason actually uses. This folder.
- **React demo** (root `app/` + `components/`) — Still runs as a clickable UX spec. `npm run dev` → see the behavior.
- **`lib/`**, **`types/`** — Shared by both. Framework-agnostic TypeScript.

Kyle thought about it for a minute and said "fine, but document why." So here we are.

## Files

| File | Purpose |
|------|---------|
| `CommemorativeTicketModule.vue` | The main module — all four states (collapsed, step 1, step 2, success) |
| `DetailsModal.vue` | The "Details & policies" modal |
| `mount.ts` | Example showing how to mount these on an Umbraco page |

## How to use

### 1. Copy into your project

Copy `vue/`, `lib/`, and `types/` into your Umbraco project. Adjust import paths as needed.

### 2. Add a mount target to your Umbraco cart page

```html
<div id="commemorative-ticket-module"></div>
```

### 3. Mount after cart data is available

```typescript
import { mountCommemorativeTicketModule } from './vue/mount'

mountCommemorativeTicketModule('#commemorative-ticket-module', {
  seats: [
    { section: 'Orchestra', row: 'B', seatNumber: '13', price: 99, seatId: 100001 },
    { section: 'Orchestra', row: 'B', seatNumber: '14', price: 99, seatId: 100002 },
  ],
  addressOnFile: {
    name: 'Jane Doe',
    street1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  sessionKey: 'tessitura-session-from-cookie',
})
```

### 4. Listen for events

```javascript
document.querySelector('#commemorative-ticket-module')
  .addEventListener('commemorative-added', (e) => {
    console.log('Tickets added:', e.detail)
    // Update cart total, show line item, etc.
  })

document.querySelector('#commemorative-ticket-module')
  .addEventListener('commemorative-removed', () => {
    // Remove line item from cart display
  })
```

## Theming / Design Tokens

Every color in the components resolves through CSS custom properties. If your Umbraco page defines them, the module rebrands automatically. If not, fallback values keep it looking clean.

**Brand tokens:**
```css
:root {
  --color-primary: #3D5A80;       /* Module border, buttons, active stepper, accents */
  --color-primary-dark: #2B4162;  /* Button hover states */
}
```

**Feedback tokens:**
```css
:root {
  --color-success: #16a34a;       /* Success banner, completed stepper */
  --color-success-light: #dcfce7; /* Success banner background */
  --color-success-border: #16a34a;/* Success banner border */
  --color-error: #dc2626;         /* Error message text */
  --color-warning-bg: #fef3c7;    /* "Not valid for admission" box background */
  --color-warning-border: #f59e0b;/* Warning box border */
  --color-warning-text: #92400e;  /* Warning box text */
}
```

**Neutral tokens:**
```css
:root {
  --color-white: #ffffff;
  --color-black: #000000;
  --color-text: #111827;          /* Base text color */
  --color-gray-50: #f9fafb;      /* Subtle backgrounds */
  --color-gray-100: #f3f4f6;     /* Stepper pill background */
  --color-gray-200: #e5e7eb;     /* Borders, dividers */
  --color-gray-300: #d1d5db;     /* Input borders, inactive chips */
  --color-gray-400: #9ca3af;     /* Placeholder text, bullet dots */
  --color-gray-500: #6b7280;     /* Icon colors */
  --color-gray-600: #4b5563;     /* Secondary text */
}
```

**Design swatch tokens:**
```css
:root {
  --color-design-a: #60a5fa;     /* Design A preview color */
  --color-design-b: #fb7185;     /* Design B preview color */
  --color-design-c: #fbbf24;     /* Design C preview color */
}
```

**Typography & shape tokens:**
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --radius-md: 0.375rem;         /* Card corners, input corners */
  --radius-full: 9999px;         /* Stepper pill, step number circles */
}
```

Define any subset of these on your page; the module picks up what's there and falls back for the rest.

## Dependencies

- **Vue 3** — the only runtime dependency
- **No icon library** — SVGs are inlined to avoid extra dependencies
- **No router** — these are self-contained components, not pages

## Config

Org-specific values come from `lib/config/orgConfig.ts`. The module reads from there at runtime. To rebrand for a different client, change that one file.

## Behavior reference

For a detailed description of every state, transition, validation rule, and data flow, see `docs/COMPONENT_BEHAVIOR_SPEC.md`.

To see the behavior live, run the React demo: `npm install && npm run dev` → visit `http://localhost:3000/cart`.
