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

## Theming

The components use CSS custom properties with fallbacks. If your Umbraco page defines these, the module will pick them up:

```css
:root {
  --color-primary: #3D5A80;      /* Module border, buttons, accents */
  --color-primary-dark: #2B4162;  /* Button hover */
  --color-success: #16a34a;       /* Success state */
  --color-design-a: #60a5fa;      /* Design A preview color */
  --color-design-b: #fb7185;      /* Design B preview color */
  --color-design-c: #fbbf24;      /* Design C preview color */
}
```

If you don't define them, the fallback values above are used.

## Dependencies

- **Vue 3** — the only runtime dependency
- **No icon library** — SVGs are inlined to avoid extra dependencies
- **No router** — these are self-contained components, not pages

## Config

Org-specific values come from `lib/config/orgConfig.ts`. The module reads from there at runtime. To rebrand for a different client, change that one file.

## Behavior reference

For a detailed description of every state, transition, validation rule, and data flow, see `docs/COMPONENT_BEHAVIOR_SPEC.md`.

To see the behavior live, run the React demo: `npm install && npm run dev` → visit `http://localhost:3000/cart`.
