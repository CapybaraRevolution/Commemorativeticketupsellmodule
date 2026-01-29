# Commemorative Ticket Upsell Module

A **UX prototype and integration scaffold** for a commemorative ticket cart interrupt module designed for Tessitura-powered ticketing flows.

## What This Is

This repo demonstrates:
- **UX flow**: Collapsed → design selection → shipping → success states
- **Data contracts**: TypeScript types defining the shapes for cart, address, selections, and API requests/responses
- **Integration patterns**: Example Tessitura and WWL (World Wide Logistics) integration points

## Technology Note

This prototype is built with **React, TypeScript, Next.js, and CSS Modules** as convenient prototyping tools. However, the actual implementation may need to be adapted to the client's technology stack (commonly Umbraco CMS with .NET, or other frameworks).

**What transfers to any stack:**
- The UX behavior (run the demo to see it)
- Data contracts (`types/index.ts`)
- API request/response shapes
- Tessitura endpoint patterns
- WWL payload structure

**What may need rewrite:**
- React component code
- CSS (adapt to client's design system)
- Backend implementation (adapt to client's server framework)

See [docs/HANDOFF_FOR_JASON.md](docs/HANDOFF_FOR_JASON.md) for detailed integration notes.

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
2. The commemorative ticket module (red-bordered box)
3. Click "Add commemorative tickets" to expand
4. Walk through Step 1 (design selection) and Step 2 (shipping)
5. Click "Add to order" to see success state

**The running demo is the UX specification.** Behavior should match regardless of implementation technology.

---

## Project Structure

```
├── components/
│   ├── CommemorativeTicketModule/     ← The main module (React implementation)
│   └── DetailsModal/                  ← Policy modal
│
├── types/
│   └── index.ts                       ← Data contracts (framework-agnostic)
│
├── lib/
│   ├── tessitura/
│   │   ├── tessituraClient.ts         ← Interface definition
│   │   ├── realTessituraClient.ts     ← Placeholder implementation
│   │   └── mockTessituraClient.ts     ← Mock for local dev
│   └── wwl/
│       ├── wwlPayload.ts              ← Payload builder
│       └── wwlClient.ts               ← Stub client
│
├── app/
│   ├── api/                           ← Example API routes
│   │   ├── cart/route.ts
│   │   └── commemorative/add-to-order/route.ts
│   └── cart/page.tsx                  ← Demo page (scaffolding only)
│
└── docs/
    └── HANDOFF_FOR_JASON.md           ← Integration documentation
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

---

## Integration Documentation

See [docs/HANDOFF_FOR_JASON.md](docs/HANDOFF_FOR_JASON.md) for:
- Technology stack assumptions
- Tessitura integration points
- WWL integration patterns
- Integration checklist
- File reference guide

---

## License

Proprietary - All rights reserved.
