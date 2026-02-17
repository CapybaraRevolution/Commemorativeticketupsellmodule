# Commemorative Ticket Upsell Module

A **UX prototype and integration scaffold** for a commemorative ticket cart interrupt module designed for Tessitura-powered ticketing flows.

## What This Is

This repo demonstrates:
- **UX flow**: Collapsed → design selection → shipping → success states
- **Data contracts**: TypeScript types defining the shapes for cart, address, selections, and API requests/responses
- **Integration patterns**: Tessitura and WWL (World Wide Logistics) integration points
- **Business logic**: Extracted validation, pricing, and note-building utilities

## Migration Status: React → Vue.js

The prototype was built in React/Next.js. The production implementation will be in **Vue.js**.

The repo is structured so that the framework-agnostic layers transfer directly:

| Layer | Status | Notes |
|-------|--------|-------|
| `types/index.ts` | Ready to use | Data contracts — no framework dependencies |
| `lib/config/orgConfig.ts` | Ready to use | Org-specific configuration |
| `lib/api/` | Ready to use | Validation, pricing, contribution notes — pure TS |
| `lib/tessitura/` | Ready to use | Tessitura client interface + implementations |
| `lib/wwl/` | Ready to use | WWL payload builder + client stub |
| `components/` | Needs Vue rewrite | See `docs/COMPONENT_BEHAVIOR_SPEC.md` for blueprint |
| `app/api/` | Example only | Next.js handlers — use `lib/api/` utilities from your own backend |

**Key documents:**
- [docs/HANDOFF_FOR_JASON.md](docs/HANDOFF_FOR_JASON.md) — Integration handoff with full context
- [docs/COMPONENT_BEHAVIOR_SPEC.md](docs/COMPONENT_BEHAVIOR_SPEC.md) — Framework-neutral blueprint for rebuilding in Vue

---

## How to Run the Demo

### Prerequisites

- Node.js 18+
- npm

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the `/cart` demo page.

### What you'll see

1. A fake cart page with 3 seats (Row B, Seats 13-15)
2. The commemorative ticket module (bordered box)
3. Click "Add commemorative tickets" to expand
4. Walk through Step 1 (design selection) and Step 2 (shipping)
5. Click "Add to order" to see success state

**The running demo is the UX specification.** Behavior should match regardless of implementation technology.

---

## Project Structure

```
├── types/
│   └── index.ts                       ← Data contracts (framework-agnostic)
│
├── lib/
│   ├── config/
│   │   └── orgConfig.ts               ← All org-specific values (one-file rebrand)
│   ├── api/
│   │   ├── validation.ts              ← Request validation (framework-agnostic)
│   │   ├── pricing.ts                 ← Price calculation (framework-agnostic)
│   │   └── contributionNotes.ts       ← Tessitura notes builder (framework-agnostic)
│   ├── tessitura/
│   │   ├── tessituraClient.ts         ← Interface definition
│   │   ├── realTessituraClient.ts     ← Placeholder implementation
│   │   └── mockTessituraClient.ts     ← Mock for local dev
│   └── wwl/
│       ├── wwlPayload.ts              ← Payload builder
│       └── wwlClient.ts               ← Stub client
│
├── components/                         ← React implementation (Vue rewrite needed)
│   ├── CommemorativeTicketModule/
│   └── DetailsModal/
│
├── app/                                ← Next.js demo scaffolding
│   ├── api/                            ← Example API routes (use lib/api/ from your backend)
│   └── cart/page.tsx                   ← Demo page
│
└── docs/
    ├── HANDOFF_FOR_JASON.md            ← Integration handoff
    ├── COMPONENT_BEHAVIOR_SPEC.md      ← Framework-neutral UI spec
    └── REFERENCE_PUBLIC_THEATER.md     ← Archived original client values
```

---

## Key Data Contracts

Defined in `types/index.ts`:

### Cart (from Tessitura)

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
```

### Add-to-order request

```typescript
interface AddToOrderRequest {
  sessionKey: string;
  selections: Array<{
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

See `types/index.ts` for complete type definitions.

---

## API Patterns

### GET /api/cart

Returns cart contents and address on file.

```json
{
  "cart": {
    "sessionKey": "...",
    "constituentId": 12345,
    "seats": [...],
    "ticketTotal": 297
  },
  "addressOnFile": {
    "name": "...",
    "street1": "...",
    "city": "...",
    "state": "...",
    "postalCode": "..."
  }
}
```

### POST /api/commemorative/add-to-order

Adds commemorative tickets as a donation line item.

**Request:** selections, shipping address, total price
**Response:** success status, contribution ID, line item summary

Business logic is in `lib/api/` — use those utilities from whatever backend framework you're running.

---

## License

Proprietary - All rights reserved.
