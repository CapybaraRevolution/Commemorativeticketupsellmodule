/**
 * WWL (World Wide Logistics) Payload Builder
 * 
 * Builds the payload structure required to submit commemorative ticket
 * fulfillment orders to WWL after checkout completes in Tessitura.
 * 
 * IMPORTANT: WWL orders should only be sent AFTER payment is confirmed
 * in Tessitura, not at the "add to order" step.
 */

import type {
  Address,
  SeatDesignSelection,
  WWLOrderPayload,
  WWLOrderItem,
  WWL_COMMEMORATIVE_SKU,
} from '@/types';

/**
 * Input data needed to build a WWL order
 */
export interface WWLOrderInput {
  /** Tessitura order ID (obtained after checkout completes) */
  tessituraOrderId: string;
  /** Customer information */
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
 * Build the WWL order payload from our internal data structures
 * 
 * @param input - The order input data
 * @returns The formatted WWL payload ready for submission
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

  // Filter to only selected seats (those with a design chosen)
  const selectedItems = selections.filter(s => s.designId !== null);

  // Build line items
  const items: WWLOrderItem[] = selectedItems.map(selection => ({
    // TODO: Jason - Verify the correct WWL product SKU
    productId: 'COMM-TICKET-2025', // WWL_COMMEMORATIVE_SKU from types
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
 * Map our internal design IDs to WWL's variant codes
 * 
 * TODO: Jason - Confirm the actual WWL variant codes with WWL
 */
function mapDesignIdToWWLVariant(designId: string): string {
  const variantMap: Record<string, string> = {
    'design-a': 'SEASON-2025',    // Season design variant
    'design-b': 'CLASSIC',        // Classic design variant
    'design-c': 'LIMITED-ED',     // Limited edition variant
  };

  return variantMap[designId] || 'UNKNOWN';
}

/**
 * Validate the WWL payload before submission
 * 
 * @param payload - The WWL payload to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateWWLPayload(payload: WWLOrderPayload): string[] {
  const errors: string[] = [];

  // Required fields
  if (!payload.orderId) {
    errors.push('Order ID is required');
  }

  if (!payload.customer.email) {
    errors.push('Customer email is required');
  }

  if (!payload.customer.name) {
    errors.push('Customer name is required');
  }

  // Shipping address validation
  if (!payload.shipToAddress.street1) {
    errors.push('Shipping address line 1 is required');
  }
  if (!payload.shipToAddress.city) {
    errors.push('Shipping city is required');
  }
  if (!payload.shipToAddress.state) {
    errors.push('Shipping state is required');
  }
  if (!payload.shipToAddress.postalCode) {
    errors.push('Shipping postal code is required');
  }

  // Must have at least one item
  if (!payload.items || payload.items.length === 0) {
    errors.push('At least one item is required');
  }

  // Validate each item
  payload.items.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Product ID is required`);
    }
    if (!item.designVariant) {
      errors.push(`Item ${index + 1}: Design variant is required`);
    }
  });

  return errors;
}

/**
 * Format the special message for WWL
 * Ensures it meets WWL's requirements (character limits, etc.)
 * 
 * @param message - The raw special message
 * @returns Formatted message ready for WWL
 */
export function formatSpecialMessage(message: string): string {
  // Trim whitespace
  let formatted = message.trim();

  // Enforce maximum length (80 characters)
  if (formatted.length > 80) {
    formatted = formatted.substring(0, 80);
  }

  // Remove any characters that might cause issues with WWL's printing
  // TODO: Jason - Confirm which characters WWL supports
  formatted = formatted.replace(/[^\w\s.,!?'-]/g, '');

  return formatted;
}
