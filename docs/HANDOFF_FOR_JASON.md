# Commemorative Ticket Module — Integration Handoff

**Date:** January 2026

### A note before you start

Hi. I'm the AI that Kyle points at a screen and says "make this real." You can call me Tabs — because I'm the thing he alt-tabs to when he needs code scaffolded. I'm not a developer, and neither is Kyle (his words, not mine — I think he's selling himself short). But between the two of us we got this module into a state that hopefully makes your life easier rather than harder.

Full disclosure: this codebase is the product of Kyle and me disagreeing our way to something good. I built the first version with one client's name plastered everywhere. Kyle took one look and said "what happens when we demo this for someone else?" I said "we'll deal with it then." He said "it's then." So now there's a config file. He has good instincts. I have a hard time admitting that.

You'll see me in the inline comments throughout the codebase, explaining why we made certain decisions. If something seems odd, there's probably a comment nearby from me explaining Kyle's reasoning. If something seems *really* odd, that one might actually be my fault.

---

## Read First: Scope & Technology Assumptions

### What this repo is

A **UX prototype and integration scaffold** for a "Commemorative Ticket" cart interrupt module designed to slot into any Tessitura-powered ticketing flow. The prototype demonstrates:

- The complete UX flow (collapsed → design selection → shipping → success)
- Data contracts and API shapes for Tessitura and WWL integration
- State management patterns and validation logic

### What this repo is NOT

- A production-ready component drop-in
- A recreation of any specific client's website
- Necessarily the technology stack the client will use

### Technology stack assumptions

This prototype was built with **React, TypeScript, Next.js, and CSS Modules** because those are familiar prototyping tools. However:

| Assumption | Reality |
|------------|---------|
| React/TypeScript | Many Tessitura clients use **Umbraco CMS**, vanilla JavaScript, or other frameworks. The React implementation may need to be rewritten in the client's actual stack. |
| Next.js API routes | The client likely has existing backend patterns (C#/.NET with Umbraco, serverless functions, etc.). The API route stubs demonstrate the shape of requests/responses, not the implementation technology. |
| CSS Modules | The client will have their own styling approach. The CSS provides visual reference but will likely be adapted to their design system. |

**What transfers regardless of stack:**
- UX flow and state transitions (the behavior)
- Data contracts (`types/index.ts` — the shapes)
- API request/response patterns (the contracts)
- Tessitura endpoint intentions (the integration points)
- WWL payload structure (the fulfillment data)
- Org config pattern (the white-labeling approach)

**What is implementation-specific:**
- React component code
- CSS Module syntax
- Next.js conventions

---

## Org Config — How the Demo Stays Generic

All org-specific values live in a single file: `lib/config/orgConfig.ts`

This includes: org name, season label, module title, donation copy, support email, ticket price, Tessitura Fund ID, WWL SKU, and design-to-variant mappings.

**To demo for a different client:** change this one file. The module reads from it everywhere.

**To see the original values used for the initial client:** see `docs/REFERENCE_PUBLIC_THEATER.md`.

The color palette is controlled via CSS custom properties in `app/globals.css` (currently a neutral steel-blue). Swap `--color-primary` and `--color-primary-dark` to rebrand.

---

## What Matters for Integration

### Framework-agnostic deliverables

| Asset | Purpose | How to use |
|-------|---------|------------|
| `types/index.ts` | TypeScript type definitions | Reference for data shapes; translate to client's type system if needed |
| `lib/config/orgConfig.ts` | Centralized org-specific values | Shows what needs to be configured per client |
| UX flow (run the demo) | Behavior specification | The demo IS the spec — collapsed state, step 1, step 2, success state |
| `lib/tessitura/tessituraClient.ts` | Interface for Tessitura operations | Documents what Tessitura calls are needed |
| `lib/wwl/wwlPayload.ts` | WWL payload structure | Documents what data WWL expects |
| API route handlers | Request/response contracts | Documents what the frontend expects from the backend |

### React-specific (may need rewrite)

| Asset | Purpose | Notes |
|-------|---------|-------|
| `components/CommemorativeTicketModule/` | React component | Rewrite in client's framework if not using React |
| `components/DetailsModal/` | Modal component | Same — the content/behavior matters, not the React code |
| CSS files | Styling | Adapt to client's design system/approach |

### Demo-only (ignore entirely)

| Asset | Reason |
|-------|--------|
| `app/cart/page.tsx` | Fake cart page for visual context |
| `app/page.tsx`, `app/layout.tsx` | Next.js boilerplate |
| Timer banner, checkout bar, "VENUE." logo | Demo chrome with placeholder branding |
| `lib/tessitura/mockTessituraClient.ts` | Local development mock |

---

## Architecture Overview

The module sits inside an existing cart/checkout page. It needs:

```
┌─────────────────────────────────────────────────────────────────┐
│  CommemorativeTicketModule (the bordered box)                   │
│  • Collapsed state → Expanded Step 1 → Step 2 → Success         │
│  • Self-contained UI with internal state management             │
│  • Reads org-specific values from lib/config/orgConfig.ts       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend / API Layer                                            │
│  (client's existing patterns — Umbraco, .NET, serverless, etc.) │
│  • Fetch cart + address on file                                 │
│  • Add commemorative ticket as donation line item               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tessitura REST API                                             │
│  • GET  Web/Cart/{sessionKey}                                   │
│  • POST Web/Cart/{sessionKey}/Contributions                     │
│  • GET  CRM/Addresses (primary address lookup)                  │
└─────────────────────────────────────────────────────────────────┘

                    ════════════════════════
                      POST-CHECKOUT ONLY
                    ════════════════════════
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  WWL Fulfillment (after payment confirmed)                      │
│  • Submit order with design selections + shipping address       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tessitura Integration

### Assumptions made in the prototype

1. **Session identification:** A `sessionKey` (or equivalent) is available from the existing Tessitura session/cookie strategy. The prototype reads it from a query parameter for demo purposes.

2. **Intended endpoints:**

   | Operation | Endpoint | Purpose |
   |-----------|----------|---------|
   | Fetch cart | `GET /Web/Cart/{sessionKey}` | Retrieve seats in cart, constituent ID, performance info |
   | Add donation | `POST /Web/Cart/{sessionKey}/Contributions` | Add commemorative ticket as a contribution line item |
   | Address lookup | `GET /CRM/Addresses?constituentId=...&primaryOnly=true` | Display address on file for shipping option |

3. **Response shape variance:** Tessitura response structures vary by version and configuration. The prototype includes mapping functions (`mapCartResponse`, `mapAddressResponse`) as examples, but field names will need adjustment.

4. **Contribution model:** The prototype treats commemorative tickets as donations to a Fund. The Fund ID is configured in `lib/config/orgConfig.ts` (placeholder: `1001`).

### Integration checkpoints

Search for `INTEGRATION ASSUMPTION` and `INTEGRATION NOTE` in the codebase to find spots where the prototype makes assumptions:

- **Session derivation:** How does the client's existing Tessitura session work?
- **API implementation:** The prototype uses Next.js API routes; the client may use Umbraco controllers, .NET APIs, etc.
- **Authentication:** The client has existing patterns for Tessitura auth

---

## WWL Integration

### Timing: post-checkout only

WWL fulfillment happens **after** payment is confirmed — not during "add to order":

1. User adds commemorative tickets → donation line item added to Tessitura cart
2. User completes checkout → Tessitura processes payment
3. On payment confirmation → post-checkout hook submits order to WWL

The prototype provides:
- **Payload builder:** `lib/wwl/wwlPayload.ts` — `buildWWLPayload()` constructs the WWL order structure
- **Stub client:** `lib/wwl/wwlClient.ts` — placeholder for actual API calls

### Design → WWL variant mapping

Configured in `lib/config/orgConfig.ts` → `wwlVariantMap`, and used by `mapDesignIdToWWLVariant()` in `lib/wwl/wwlPayload.ts`:

```
design-a → SEASON-2025
design-b → CLASSIC
design-c → LIMITED-ED
```

These are placeholders; actual codes depend on the org's WWL product setup.

---

## Data Contracts (Framework-Agnostic)

These shapes are defined in `types/index.ts` and represent the data contracts regardless of implementation technology:

### Cart data (from Tessitura)

```typescript
interface Cart {
  sessionKey: string;
  constituentId: number;
  eventName: string;
  performanceDate: string;
  venue: string;
  seats: Seat[];
  ticketTotal: number;
}

interface Seat {
  section: string;
  row: string;
  seatNumber: string;
  price: number;
  seatId?: number;
}
```

### Address (from Tessitura / user input)

```typescript
interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### Add-to-order request (frontend → backend)

```typescript
interface AddToOrderRequest {
  sessionKey: string;
  selections: Array<{
    seatId?: number;
    section: string;
    row: string;
    seatNumber: string;
    designId: string;
  }>;
  specialMessage?: string;
  shippingAddress: Address;
  totalPrice: number;
}
```

### WWL payload (backend → WWL, post-checkout)

```typescript
interface WWLOrderPayload {
  orderId: string;
  customer: { constituentId, email, name };
  shipToAddress: Address;
  items: Array<{
    productId: string;      // WWL SKU from orgConfig
    section: string;
    row: string;
    seat: string;
    designVariant: string;  // WWL variant code from orgConfig
    specialMessage1?: string;
  }>;
}
```

---

## Integration Checklist

Areas where the prototype makes assumptions that need alignment with the client's existing patterns:

| Area | Prototype assumption | Checkpoint |
|------|---------------------|------------|
| **Technology stack** | React/TypeScript/Next.js | What is the client actually using? (Umbraco? Vanilla JS? Vue?) |
| **Session derivation** | `sessionKey` from query param | How does their existing Tessitura session work? |
| **Backend implementation** | Next.js API routes | What's their backend pattern? (.NET? Serverless? Umbraco controllers?) |
| **Styling approach** | CSS Modules with CSS custom properties | What's their design system / CSS methodology? |
| **Org configuration** | `lib/config/orgConfig.ts` | What are the real values for this client? (org name, Fund ID, SKU, etc.) |
| **Fund ID** | Placeholder `1001` in orgConfig | Which Fund ID for commemorative ticket donations? |
| **Appeal ID** | `undefined` in orgConfig | Should an Appeal ID be attached for campaign tracking? |
| **Data persistence** | Console.log placeholder | Where to store selection data between add-to-order and post-checkout? |
| **Post-checkout hook** | Not implemented | Where does WWL submission get triggered in their flow? |
| **WWL product mapping** | Placeholder codes in orgConfig | What are the actual WWL SKU and variant codes? |
| **Error handling** | Basic | What are their patterns for failure/retry? |

---

## Running the Demo

```bash
npm install
npm run dev
# Visit http://localhost:3000/cart
```

The demo uses mock data and shows the complete UX flow:

1. Click "Add commemorative tickets" or chevron to expand
2. Select designs for seats in Step 1
3. Choose shipping option in Step 2
4. Click "Add to order" to see success state

**The running demo is the UX specification.** Regardless of implementation technology, the behavior should match what you see in the demo.

---

## Inline Comment Guide

The codebase includes annotated comments explaining design decisions. Look for:

- `INTEGRATION ASSUMPTION` — places where the prototype assumes something about the client's infrastructure
- `INTEGRATION NOTE` — places where the implementation is a placeholder meant to be adapted
- Comments from **Tabs** — Kyle's AI scaffolding assistant, explaining the reasoning behind decisions

---

## File Reference

### Configuration

```
lib/config/orgConfig.ts                ← All org-specific values (one-file rebrand)
docs/REFERENCE_PUBLIC_THEATER.md        ← Archived original client values
app/globals.css                         ← CSS custom properties (color palette here)
```

### Framework-agnostic (reference for any implementation)

```
types/index.ts                          ← Data shapes and contracts
lib/tessitura/tessituraClient.ts        ← Tessitura interface definition
lib/wwl/wwlPayload.ts                   ← WWL payload structure + variant mapping
```

### React implementation (may need rewrite)

```
components/
├── CommemorativeTicketModule/
│   ├── CommemorativeTicketModule.tsx   ← Main component (React-specific)
│   ├── CommemorativeTicketModule.module.css
│   └── index.ts
└── DetailsModal/
    ├── DetailsModal.tsx                ← Modal component (React-specific)
    └── DetailsModal.module.css
```

### Integration scaffolds (adapt to client's backend)

```
lib/tessitura/realTessituraClient.ts    ← Example Tessitura calls (search: INTEGRATION NOTE)
lib/wwl/wwlClient.ts                    ← Example WWL client (search: INTEGRATION NOTE)
app/api/cart/route.ts                   ← Example endpoint (search: INTEGRATION ASSUMPTION)
app/api/commemorative/add-to-order/route.ts ← Example endpoint (search: INTEGRATION ASSUMPTION)
```

---

## Summary

This prototype demonstrates **what** the module should do (UX behavior, data flow, integration points) rather than **how** it must be built. The React/TypeScript implementation is one way to build it; the client may need a different approach based on their existing technology stack.

The key transferable assets are:
- The UX flow (run the demo)
- The org config pattern (`lib/config/orgConfig.ts`)
- The data contracts (`types/index.ts`)
- The Tessitura endpoint intentions
- The WWL payload structure

Everything else can be adapted to fit the client's actual environment.
