/**
 * Pricing Utilities
 *
 * Server-side price calculation for commemorative tickets.
 *
 * Golden rule: never trust the client's math. The front-end calculates
 * a total for display purposes, but the server re-calculates from scratch
 * before creating the Tessitura contribution. If they don't match, we
 * log a warning and use the server's number.
 *
 * This is framework-agnostic — call it from Nuxt, Express, .NET, wherever.
 *
 * — Tabs
 */

import { ORG_CONFIG } from '@/lib/config/orgConfig';

/**
 * Calculate the total price for a given number of commemorative tickets.
 */
export function calculateTotal(quantity: number): number {
  return quantity * ORG_CONFIG.ticketPrice;
}

/**
 * Verify that the client-submitted price matches the server-calculated price.
 * Returns the server-calculated total (always use this, not the client value).
 */
export function verifyPrice(clientTotal: number, quantity: number): {
  total: number;
  mismatch: boolean;
} {
  const serverTotal = calculateTotal(quantity);
  const mismatch = clientTotal !== serverTotal;

  if (mismatch) {
    console.warn(
      `[Pricing] Price mismatch: client sent $${clientTotal}, server calculated $${serverTotal}. Using server value.`
    );
  }

  return { total: serverTotal, mismatch };
}
