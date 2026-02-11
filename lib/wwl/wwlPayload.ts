/**
 * WWL (World Wide Logistics) Payload Builder
 *
 * Builds the payload for submitting commemorative ticket fulfillment orders to WWL.
 *
 * TIMING MATTERS: This should only be used AFTER payment is confirmed in Tessitura.
 * Not at "add to order" time. Not at "click checkout" time. After. Payment. Confirmed.
 * Kyle made me put this in three places. He's right to be paranoid — you don't want
 * to kick off a print run for an order that might not get paid for. — Tabs
 *
 * The payload builder takes our internal types and maps them to whatever shape
 * WWL expects. The actual variant codes (SEASON-2025, CLASSIC, etc.) are
 * placeholders that live in orgConfig — they depend on the specific product
 * setup between the org and WWL.
 */

import type {
  Address,
  SeatDesignSelection,
  WWLOrderPayload,
  WWLOrderItem,
} from '@/types';
import { ORG_CONFIG } from '@/lib/config/orgConfig';

/**
 * Input data needed to build a WWL order.
 */
export interface WWLOrderInput {
  /** Tessitura order ID (obtained after checkout completes) */
  tessituraOrderId: string;
  /** Customer info */
  customer: {
    constituentId: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  /** Ship-to address */
  shippingAddress: Address;
  /** Commemorative ticket selections */
  selections: SeatDesignSelection[];
  /** Optional special message */
  specialMessage?: string;
  /** Event details for metadata */
  eventDetails?: {
    eventName: string;
    performanceDate: string;
  };
}

/**
 * Build the WWL order payload from our internal data.
 *
 * This is a pure function — takes data in, returns a payload out.
 * No side effects, no API calls. Just data transformation.
 */
export function buildWWLPayload(input: WWLOrderInput): WWLOrderPayload {
  const {
    tessituraOrderId,
    customer,
    shippingAddress,
    selections,
    specialMessage,
    eventDetails,
  } = input;

  // Only include seats where a design was actually selected
  const selectedItems = selections.filter(s => s.designId !== null);

  const items: WWLOrderItem[] = selectedItems.map(selection => ({
    // SKU comes from orgConfig — each org/product has its own.
    productId: ORG_CONFIG.wwlSku,
    section: selection.seat.section,
    row: selection.seat.row,
    seat: selection.seat.seatNumber,
    designVariant: mapDesignIdToWWLVariant(selection.designId!),
    ...(specialMessage && { specialMessage1: specialMessage }),
  }));

  return {
    orderId: tessituraOrderId,
    customer: {
      constituentId: customer.constituentId,
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
    },
    shipToAddress: shippingAddress,
    items,
    metadata: {
      ...(eventDetails?.eventName && { eventName: eventDetails.eventName }),
      ...(eventDetails?.performanceDate && { performanceDate: eventDetails.performanceDate }),
      orderDate: new Date().toISOString(),
    },
  };
}

/**
 * Map internal design IDs → WWL variant codes.
 *
 * The mapping lives in orgConfig because it's org/product-specific.
 * "design-a" is our internal label; "SEASON-2025" (or whatever) is
 * what WWL calls it on their end. Nobody asked me if this naming
 * convention is ideal. I just work here. — Tabs
 */
function mapDesignIdToWWLVariant(designId: string): string {
  return ORG_CONFIG.wwlVariantMap[designId] || 'UNKNOWN';
}

/**
 * Validate the WWL payload before submission.
 * Returns an array of error messages (empty = valid).
 */
export function validateWWLPayload(payload: WWLOrderPayload): string[] {
  const errors: string[] = [];

  if (!payload.orderId) errors.push('Order ID is required');
  if (!payload.customer.email) errors.push('Customer email is required');
  if (!payload.customer.name) errors.push('Customer name is required');

  if (!payload.shipToAddress.street1) errors.push('Shipping address line 1 is required');
  if (!payload.shipToAddress.city) errors.push('Shipping city is required');
  if (!payload.shipToAddress.state) errors.push('Shipping state is required');
  if (!payload.shipToAddress.postalCode) errors.push('Shipping postal code is required');

  if (!payload.items || payload.items.length === 0) {
    errors.push('At least one item is required');
  }

  payload.items.forEach((item, index) => {
    if (!item.productId) errors.push(`Item ${index + 1}: Product ID is required`);
    if (!item.designVariant) errors.push(`Item ${index + 1}: Design variant is required`);
  });

  return errors;
}

/**
 * Format the special message for WWL.
 * Enforces character limits and strips characters that might cause
 * problems with WWL's printing system.
 *
 * INTEGRATION NOTE: We don't actually know which characters WWL supports.
 * The regex below is conservative. Adjust once someone confirms the spec.
 */
export function formatSpecialMessage(message: string): string {
  let formatted = message.trim();

  if (formatted.length > 80) {
    formatted = formatted.substring(0, 80);
  }

  // Conservative character filter — letters, numbers, basic punctuation.
  formatted = formatted.replace(/[^\w\s.,!?'-]/g, '');

  return formatted;
}
