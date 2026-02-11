/**
 * Core type definitions for the Commemorative Ticket Module
 *
 * These types are the data contracts. They define the shapes that flow
 * between the front-end module, the API layer, Tessitura, and WWL.
 *
 * If you're re-implementing this in a different framework (Umbraco, vanilla JS,
 * etc.), these types are your reference for what data goes where. The names
 * are TypeScript-specific, but the shapes are universal — you can read them
 * as documentation even if you're writing C# or Python.
 *
 * — Tabs (Kyle's AI. I generate types. It's kind of my whole thing.)
 */

// =============================================================================
// Seat & Cart Types
// =============================================================================

export interface Seat {
  /** Section identifier (e.g., "Orchestra", "Balcony") */
  section: string;
  /** Row identifier (e.g., "B", "AA") */
  row: string;
  /** Seat number (e.g., "13", "14") */
  seatNumber: string;
  /** Price paid for this seat */
  price: number;
  /** Tessitura seat ID for order correlation */
  seatId?: number;
}

export interface Cart {
  /** Tessitura session key */
  sessionKey: string;
  /** Constituent ID of the logged-in user */
  constituentId: number;
  /** Performance/event name */
  eventName: string;
  /** Performance date/time */
  performanceDate: string;
  /** Venue name */
  venue: string;
  /** Seats in the cart */
  seats: Seat[];
  /** Total ticket price (before fees/donations) */
  ticketTotal: number;
}

// =============================================================================
// Address Types
// =============================================================================

export interface Address {
  /** Full name of recipient */
  name: string;
  /** Address line 1 (street) */
  street1: string;
  /** Address line 2 (apt, suite, etc.) - optional */
  street2?: string;
  /** City */
  city: string;
  /** State/Province */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country code (e.g., "US") */
  country: string;
}

// =============================================================================
// Commemorative Ticket Design Types
// =============================================================================

export interface Design {
  /** Unique design identifier */
  id: string;
  /** Display name (e.g., "Design A") */
  name: string;
  /** Description/subtitle (e.g., "Season design") */
  description: string;
  /** URL to design preview image */
  imageUrl?: string;
  /** Whether this design is currently available */
  available: boolean;
}

export const AVAILABLE_DESIGNS: Design[] = [
  {
    id: 'design-a',
    name: 'Design A',
    description: 'Season design',
    available: true,
  },
  {
    id: 'design-b',
    name: 'Design B',
    description: 'Classic',
    available: true,
  },
  {
    id: 'design-c',
    name: 'Design C',
    description: 'Limited edition',
    available: true,
  },
];

// =============================================================================
// Selection Types (User choices in the module)
// =============================================================================

export interface SeatDesignSelection {
  /** The seat being customized */
  seat: Seat;
  /** The selected design ID (or null if "None") */
  designId: string | null;
}

export interface CommemorativeOrderRequest {
  /** Selected seats with their design choices */
  selections: SeatDesignSelection[];
  /** Optional special message to print on tickets */
  specialMessage?: string;
  /** Shipping option chosen */
  shippingOption: 'address-on-file' | 'different-address';
  /** Custom shipping address (if shippingOption is 'different-address') */
  customAddress?: Address;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface GetCartResponse {
  cart: Cart;
  addressOnFile: Address | null;
}

export interface AddToOrderRequest {
  /** Cart session key for correlation */
  sessionKey: string;
  /** The commemorative ticket selections */
  selections: Array<{
    seatId?: number;
    section: string;
    row: string;
    seatNumber: string;
    designId: string;
  }>;
  /** Special message (optional) */
  specialMessage?: string;
  /** Shipping address */
  shippingAddress: Address;
  /** Total price being charged */
  totalPrice: number;
}

export interface AddToOrderResponse {
  success: boolean;
  /** Tessitura contribution ID (if applicable) */
  contributionId?: number;
  /** Error message if failed */
  error?: string;
  /** Line item added to cart summary */
  lineItem?: {
    description: string;
    quantity: number;
    total: number;
  };
}

// =============================================================================
// Tessitura-specific Types
// =============================================================================

export interface TessituraContributionRequest {
  /** Fund ID for commemorative ticket donations */
  fundId: number;
  /** Contribution amount */
  amount: number;
  /** Appeal code (if applicable) */
  appealId?: number;
  /** Notes/memo for the contribution */
  notes?: string;
}

export interface TessituraContributionResult {
  success: boolean;
  contributionId?: number;
  error?: string;
}

// =============================================================================
// WWL (World Wide Logistics) Types
// =============================================================================

export interface WWLOrderItem {
  /** WWL product SKU for commemorative ticket */
  productId: string;
  /** Section from the ticket */
  section: string;
  /** Row from the ticket */
  row: string;
  /** Seat number from the ticket */
  seat: string;
  /** Design variant selected */
  designVariant: string;
  /** Special message line 1 */
  specialMessage1?: string;
}

export interface WWLOrderPayload {
  /** Tessitura order ID (after checkout completes) */
  orderId: string;
  /** Customer information */
  customer: {
    constituentId: number;
    email: string;
    name: string;
  };
  /** Ship-to address */
  shipToAddress: Address;
  /** Line items to fulfill */
  items: WWLOrderItem[];
  /** Order metadata */
  metadata?: {
    eventName?: string;
    performanceDate?: string;
    orderDate: string;
  };
}

// =============================================================================
// Module State Types
// =============================================================================

export type ModuleState = 
  | 'collapsed'
  | 'expanded_step1'
  | 'expanded_step2'
  | 'success';

export interface CommemorativeModuleState {
  /** Current UI state */
  currentState: ModuleState;
  /** Design selections keyed by "row-seatNumber" */
  seatSelections: Record<string, string | null>;
  /** Whether to include a special message */
  includeSpecialMessage: boolean;
  /** The special message text */
  specialMessage: string;
  /** Selected shipping option */
  shippingOption: 'address-on-file' | 'different-address';
  /** Custom shipping address form data */
  customAddress: Partial<Address>;
  /** Whether the module is loading (API call in progress) */
  isLoading: boolean;
  /** Error message (if any) */
  error: string | null;
}

// =============================================================================
// Utility Constants
//
// These are legacy exports kept for backward compatibility. The real source
// of truth is now lib/config/orgConfig.ts — that's where Kyle (and Tabs)
// centralized all the org-specific values. If you're reading this and
// wondering "should I use these or the config?" — use the config.
// =============================================================================

/** Price per commemorative ticket — see also ORG_CONFIG.ticketPrice */
export const COMMEMORATIVE_TICKET_PRICE = 20;

/** Maximum length for special message */
export const MAX_SPECIAL_MESSAGE_LENGTH = 80;

/** Tessitura Fund ID — see also ORG_CONFIG.fundId */
export const COMMEMORATIVE_FUND_ID = 1001;

/** WWL Product SKU — see also ORG_CONFIG.wwlSku */
export const WWL_COMMEMORATIVE_SKU = 'COMM-TICKET-2025';
