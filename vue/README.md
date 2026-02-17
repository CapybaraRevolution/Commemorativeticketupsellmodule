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

**Spacing tokens:**
```css
:root {
  --spacing-1: 0.25rem;          /* 4px  — tight gaps, helper text margins */
  --spacing-2: 0.5rem;           /* 8px  — input padding, checkbox gaps */
  --spacing-3: 0.75rem;          /* 12px — section margins, button padding */
  --spacing-4: 1rem;             /* 16px — action gaps, default spacing */
  --spacing-6: 1.5rem;           /* 24px — container padding, section spacing */
  --spacing-8: 2rem;             /* 32px — modal footer button padding */
}
```

**Typography tokens:**
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;       /* 12px — helper text, design labels */
  --font-size-sm: 0.875rem;      /* 14px — body text, inputs, buttons */
  --font-size-lg: 1.125rem;      /* 18px — price display, modal section titles */
  --font-size-xl: 1.25rem;       /* 20px — module title */
  --font-size-2xl: 1.5rem;       /* 24px — modal title */
}
```

**Shape tokens:**
```css
:root {
  --radius-md: 0.375rem;         /* Card corners, input corners */
  --radius-full: 9999px;         /* Stepper pill, step number circles */
}
```

Define any subset of these on your page; the module picks up what's there and falls back for the rest.

**Field validation tokens:**
```css
:root {
  --color-field-error: #ef4444;    /* Error border + icon */
  --color-field-error-bg: #fef2f2; /* Error input background */
  --color-field-success: #22c55e;  /* Success border + icon */
}
```

Define any subset of these on your page; the module picks up what's there and falls back for the rest.

## Form Validation

The "Use a different address" form validates fields on blur (when the user clicks or tabs away from a field). This was Kyle's call from the start — "when they click out, that's when it happens." Clean, non-intrusive, gives the user space to finish typing before we judge them. — Tabs

**Field states:**
- **Default** — neutral border
- **Error** — red border, exclamation icon overlaid inside the input, error message below
- **Valid** — green border, check icon overlaid

**Validation rules:**
| Field | Rule | Error message |
|-------|------|---------------|
| Name | Required, min 2 chars | "This field is needed for shipping" / "Name should be at least 2 characters" |
| Address Line 1 | Required | "This field is needed for shipping" |
| Address Line 2 | Optional | (no validation) |
| City | Required | "This field is needed for shipping" |
| State | `<select>` dropdown | "Please select a state" |
| ZIP | US format: 5 digits or 5+4 | "That doesn't look like a valid ZIP code — US ZIPs are 5 digits (or 5+4 like 10001-1234)" |

**State dropdown** uses all 50 US states + DC + territories, following USWDS best practice. The data lives in `lib/config/orgConfig.ts` as `US_STATES` — overridable if a future client is in Canada.

## Address Autocomplete

The module supports an optional `addressAutocomplete` prop. Three design decisions worth understanding:

**1. Graceful degradation.** If the prop isn't passed, autocomplete is completely invisible. No broken dropdown, no empty state, no error. The fields just work as plain text inputs. If a client doesn't want to pay for an address service, or the dev doesn't want to integrate one — skip the prop. Nothing breaks.

**2. Fill-all-fields on selection.** When a user clicks a suggestion, ALL address fields populate at once (street1, street2, city, state, ZIP) and validation runs on each automatically. One click, full form, green checkmarks.

**3. Normalization layer.** The return type IS the normalization. Every provider has its own response format. The adapter function you write maps their format to ours. Swap providers without touching the component.

**We don't pick the provider** — you do. The prop accepts any async function that returns address suggestions in our normalized shape:

```typescript
mountCommemorativeTicketModule('#target', {
  seats: [...],
  addressOnFile: {...},
  sessionKey: '...',
  addressAutocomplete: async (query) => {
    // Wire this to Google Places, Smarty, Loqate, etc.
    // Each provider returns different field names — your adapter
    // normalizes them into our shape. That's the whole pattern.
    const results = await yourAddressService.search(query)
    return results.map(r => ({
      street1: r.line1,       // Google: formatted_address, Smarty: street_line
      street2: r.line2,       // Whatever the provider calls it
      city: r.city,           // Google: locality, Smarty: city_name
      state: r.stateCode,     // Google: administrative_area_level_1
      postalCode: r.zip,      // Google: postal_code
    }))
  },
})
```

If the prop is absent, address fields work as plain inputs. This is the default and it's a perfectly fine experience. — Tabs

## Skeleton Loading

Pass `loading: true` as a prop to show a pulsing skeleton placeholder while cart data is loading:

```typescript
mountCommemorativeTicketModule('#target', {
  seats: [],       // Empty initially
  addressOnFile: null,
  sessionKey: '',
  loading: true,   // Shows skeleton
})

// Later, when data arrives:
// Re-mount with loading: false and real data
```

The skeleton mimics the collapsed state's shape — preview image, title lines, button — so there's no layout shift when the real content appears.

## State Transitions

State changes (collapsed, step 1, step 2, success) animate with a fade + slide transition. Kyle builds his own Vue components to understand the framework, and the transition timing here is borrowed from his dropdown work: 100ms ease-out in, 75ms ease-in out. Snappy, not sluggish.

## Accessibility (WCAG 2.2)

- **Focus management**: When the module changes state, focus moves to the new content's heading (via `tabindex="-1"` + `nextTick` focus)
- **Live regions**: Error messages use `role="alert"` + `aria-live="assertive"`. Price summary uses `aria-live="polite"`. Success banner uses `role="status"`.
- **Form validation**: `aria-invalid` on error fields, `aria-describedby` linking inputs to error messages
- **Button states**: `aria-disabled` on the "Continue to shipping" button when no seats are selected
- **Modal**: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, ESC close, body scroll lock, Teleport to body

## Dependencies

- **Vue 3** — the only runtime dependency
- **No icon library** — SVGs are inlined to avoid extra dependencies
- **No CSS framework** — scoped styles with CSS custom property tokens
- **No router** — these are self-contained components, not pages
- **No address provider** — autocomplete is a bring-your-own-provider interface

## Config

Org-specific values come from `lib/config/orgConfig.ts`. The module reads from there at runtime. To rebrand for a different client, change that one file. See also `US_STATES` in the same file for the state dropdown data.

## Behavior reference

For a detailed description of every state, transition, validation rule, and data flow, see `docs/COMPONENT_BEHAVIOR_SPEC.md`.

To see the behavior live, run the React demo: `npm install && npm run dev` → visit `http://localhost:3000/cart`.
