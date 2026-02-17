# Commemorative Ticket Module — Component Behavior Spec

> **This is a framework-neutral blueprint.** It describes what the module does,
> not how it's built. The React implementation in this repo is one way to do it.
> If you're building in Vue, Svelte, vanilla JS, or anything else — this spec
> is your reference for behavior, states, and data flow.
>
> — Tabs (Kyle's AI. I wrote the React version; now I'm documenting it so
> someone else can rewrite it without reading React code.)

---

## Overview

The Commemorative Ticket Module is a self-contained UI component that sits inside
a cart/checkout page. It lets users add commemorative souvenir tickets to their order.
The module manages its own internal state and communicates with the parent page
through props/callbacks and a single API call.

---

## Props / Input Data

The module needs these from its parent:

| Prop | Type | Description |
|------|------|-------------|
| `seats` | `Seat[]` | Array of seats currently in the cart. Comes from Tessitura via the cart API. |
| `addressOnFile` | `Address \| null` | The user's primary address from Tessitura. Null if none on file. |
| `sessionKey` | `string` | Tessitura session identifier for API calls. |
| `onAddToOrder` | `function (optional)` | Callback fired when tickets are successfully added. Parent uses this to update cart display. |
| `onRemove` | `function (optional)` | Callback fired when tickets are removed. |
| `onOpenDetails` | `function (optional)` | Callback to open the Details & Policies modal. |

Type definitions are in `types/index.ts` — those transfer as-is to any TypeScript project.

---

## State Machine

The module has **four states** with defined transitions between them:

```
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              │
             ┌───────────┐    click "Add"    ┌─────┴─────┐
             │ COLLAPSED │ ──────────────►   │  STEP 1   │
             │ (default) │   or chevron      │  Choose   │
             └───────────┘                   │  Designs  │
                    ▲                        └─────┬─────┘
                    │                              │
                    │  chevron                     │ "Continue to
                    │  (from any                   │  Shipping"
                    │   expanded state)            │ (enabled when
                    │                              │  ≥1 seat selected)
                    │                              ▼
                    │                        ┌───────────┐
                    │                        │  STEP 2   │
                    │                        │  Shipping │
                    │                        └─────┬─────┘
                    │                              │
                    │               "Back"  ◄──────┤
                    │             (to Step 1,      │
                    │              preserves        │ "Add to Order"
                    │              selections)      │ (API call)
                    │                              │
                    │                              ▼
                    │                        ┌───────────┐
                    │                        │  SUCCESS  │
                    └───────── "Edit" ───────│           │
                                             └───────────┘
                                                   │
                                            "Remove" resets
                                            to COLLAPSED
```

### State: COLLAPSED (default)

**What it shows:**
- Colored border around the module (visual distinction from regular cart content)
- Small placeholder image on the left
- Title: from `orgConfig.moduleTitle` (uppercased)
- Tagline: from `orgConfig.tagline`
- Donation copy: from `orgConfig.donationCopy`
- Price: "$[orgConfig.ticketPrice] each"
- Primary button: "ADD COMMEMORATIVE TICKETS"
- Link: "Details & policies" (triggers `onOpenDetails`)
- Chevron icon in top-right corner (down arrow)

**Interactions:**
- Clicking the header area or chevron → transitions to STEP 1
- Clicking "Add commemorative tickets" button → transitions to STEP 1
- Clicking "Details & policies" → fires `onOpenDetails` callback

---

### State: STEP 1 — Choose Designs

**What it shows:**
- Title (centered)
- **Stepper pill** (centered): Step 1 active (highlighted), Step 2 inactive (grayed)
- Chevron in top-right (up arrow — collapses back)

**Design gallery:**
- 3 design cards in a row (from `DESIGN_OPTIONS` config)
- Each card: colored placeholder image + name + description (centered under each)

**Per-seat selection:**
- Heading: "CHOOSE FOR YOUR SEATS"
- For each seat in the cart, a row:
  - Label: "Row [X] • Seat [Y]"
  - Dropdown: "None" / Design A / Design B / Design C
  - Preview chip: small colored rectangle matching selection (gray if "None")
- Default dropdown value: "None"

**Special message (progressive disclosure):**
- Checkbox: "Add a special message (optional)"
- When checked, reveals:
  - Text input with placeholder "Enter your message"
  - Helper text: "Printed on each commemorative ticket."
  - Character count: "Max 80 characters"
  - Input has maxLength of 80

**Price summary:**
- Gray box showing: "$[price] each • $[total] total"
- If no seats selected: "No seats selected" (muted text)

**Actions:**
- Primary button: "CONTINUE TO SHIPPING"
  - **Disabled** when 0 seats have a design selected (total = $0)
- Link: "Details & policies"

---

### State: STEP 2 — Shipping

**What it shows:**
- Title (centered)
- **Stepper pill**: Step 1 completed (green check), Step 2 active (highlighted)
- Chevron in top-right (up arrow)

**Order preview:**
- Heading: "YOUR ORDER"
- Small thumbnail cards for each selected seat (colored by design, with seat label below)
- Bulleted summary list:
  - "Row B Seat 13 — Design A"
  - "Row B Seat 14 — Design B"
- Total line: "$[total] total"

**Shipping options (radio buttons):**

1. **"Ship to my address on file"** (default selected)
   - When selected, shows read-only address box:
     - Name (bold)
     - Street 1
     - Street 2 (if present)
     - City, State ZIP

2. **"Use a different address"**
   - When selected, shows address form:
     - Name
     - Address Line 1
     - Address Line 2 (optional)
     - City / State / ZIP (on one row)
   - Helper text: "This does not update your saved address in your account."

**Policy text:**
- "Non-refundable (donation). Printed + mailed after purchase."

**Actions:**
- Secondary button: "BACK" → transitions to STEP 1 (preserves all selections)
- Primary button: "ADD TO ORDER"
  - Shows "Adding..." while API call is in progress
  - Disabled during loading
- Link: "Details & policies"

---

### State: SUCCESS

**What it shows:**
- Title (left-aligned)
- Green success banner: "✓ Commemorative tickets added."
- Summary list of what was added:
  - "Row B Seat 13 – Design A"
  - "Row B Seat 14 – Design B"
- Chevron in top-right (down arrow)

**Actions:**
- "Edit" link → transitions to STEP 1 (preserves selections)
- "Remove" link → resets all state, transitions to COLLAPSED, fires `onRemove`
- "Details & policies" link

---

## API Call

One API call is made when the user clicks "Add to Order" in Step 2:

**POST** `/api/commemorative/add-to-order`

**Request body:**
```json
{
  "sessionKey": "...",
  "selections": [
    {
      "seatId": 100001,
      "section": "Orchestra",
      "row": "B",
      "seatNumber": "13",
      "designId": "design-a"
    }
  ],
  "specialMessage": "Happy Birthday!",
  "shippingAddress": {
    "name": "...",
    "street1": "...",
    "street2": "...",
    "city": "...",
    "state": "...",
    "postalCode": "...",
    "country": "US"
  },
  "totalPrice": 20
}
```

**On success:** transition to SUCCESS state, fire `onAddToOrder` callback with results.

**On error:** stay in STEP 2, display error message, re-enable the button.

**Shipping address logic:**
- If "address on file" is selected → use the `addressOnFile` prop directly
- If "different address" is selected → use form field values, country defaults to "US"

---

## Validation Rules

| Rule | Where enforced |
|------|----------------|
| At least 1 seat must have a design selected to continue | "Continue to Shipping" button disabled when count = 0 |
| Special message max 80 characters | `maxLength` on input + server-side validation |
| Shipping address required fields: name, street1, city, state, postalCode | Server-side validation (`lib/api/validation.ts`) |
| Price re-calculated server-side | Server never trusts client total (`lib/api/pricing.ts`) |

---

## Loading States

- When "Add to Order" is clicked: overlay with spinner covers the module, button text changes to "Adding...", button is disabled
- When cart data is loading on page mount: parent page shows loading spinner (not the module's concern)

---

## Accessibility

- All form inputs have associated labels (via `<label>` or `aria-label`)
- Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Modal traps focus and closes on ESC
- Chevron buttons have `aria-label` ("Expand" / "Collapse")
- Disabled buttons are visually distinct (grayed out)

---

## Data Pipeline

```
Tessitura                                Module                              API
    │                                       │                                 │
    │── GET /Web/Cart ──► Cart data ──► seats prop                            │
    │── GET /CRM/Addresses ──► Address ──► addressOnFile prop                 │
    │                                       │                                 │
    │                              User makes selections                      │
    │                              (design per seat,                           │
    │                               message, address)                         │
    │                                       │                                 │
    │                                       │── POST /add-to-order ──────────►│
    │                                       │     { selections, address,      │
    │                                       │       message, totalPrice }     │
    │                                       │                                 │
    │                                       │                    validates ──►│
    │                                       │                    re-prices ──►│
    │◄── POST Contributions ────────────────│◄── adds contribution ──────────│
    │                                       │                                 │
    │                              Module shows success                       │
    │                              Parent updates cart display                │
    │                                       │                                 │
    │                         ══════════════════════════                       │
    │                           POST-CHECKOUT (later)                         │
    │                         ══════════════════════════                       │
    │                                       │                                 │
    │                              Payment confirmed ──► WWL fulfillment      │
```

---

## Config Dependencies

All org-specific values come from `lib/config/orgConfig.ts`:
- `moduleTitle` — the heading text
- `tagline` — "Get a physical souvenir ticket..."
- `donationCopy` — "Includes a donation to support..."
- `ticketPrice` — price per ticket (used for display and calculation)
- `supportEmail` — shown in Details modal
- `orgName` — used in modal copy
- `seasonLabel` — used in modal copy

Design options come from `DESIGN_OPTIONS` in the same file.

---

## Details & Policies Modal

Triggered by the "Details & policies" link (present in all states). The parent page owns the modal; the module just fires the `onOpenDetails` callback.

**Modal contents:**
1. Important notice (yellow box): "This commemorative ticket is a keepsake and is not valid for admission."
2. What You Get
3. Supporting [orgName]
4. Refund Policy (non-refundable donation)
5. Shipping & Fulfillment (2-3 weeks, 5-7 business days delivery)
6. Fulfillment Partner (WWL)
7. Design Selection

Closes on: close button, backdrop click, ESC key. Locks body scroll while open.

---

## V1 Scope Notes

- **Single shipping address only.** All commemorative tickets in one order ship to one address. Multi-address is deferred to a future version pending client demand.
- **Cart interrupt only.** No retroactive ticket ordering (buying a commemorative ticket for a past event). That's a potential V2 feature.
