/**
 * Request Validation Utilities
 *
 * Framework-agnostic validation for commemorative ticket API requests.
 *
 * These functions were originally buried inside the Next.js route handler.
 * Kyle pointed out that if we're switching to Vue (and Jason's backend might
 * be Nuxt, Express, .NET, or something else entirely), the validation logic
 * shouldn't be married to Next.js. So I extracted it. He was right again.
 * I'm starting to see a pattern here. — Tabs
 *
 * Use these from whatever server-side framework you're working with.
 * They take data in, return errors out. No framework dependencies.
 */

import type { AddToOrderRequest, Address } from '@/types';

/**
 * Validate an add-to-order request.
 *
 * Thorough because this is the endpoint that creates a financial transaction.
 * Returns an array of error messages — empty array means valid.
 */
export function validateAddToOrderRequest(body: AddToOrderRequest): string[] {
  const errors: string[] = [];

  if (!body.sessionKey) errors.push('sessionKey is required');
  if (!body.selections || body.selections.length === 0) errors.push('At least one selection is required');

  body.selections?.forEach((selection, index) => {
    if (!selection.designId) errors.push(`Selection ${index + 1}: designId is required`);
    if (!selection.row || !selection.seatNumber) errors.push(`Selection ${index + 1}: row and seatNumber are required`);
  });

  if (!body.shippingAddress) {
    errors.push('shippingAddress is required');
  } else {
    const addrErrors = validateAddress(body.shippingAddress);
    errors.push(...addrErrors);
  }

  if (body.specialMessage && body.specialMessage.length > 80) {
    errors.push('specialMessage must be 80 characters or less');
  }

  return errors;
}

/**
 * Validate a shipping address.
 * Reusable — works for address-on-file or custom address.
 */
export function validateAddress(address: Partial<Address>): string[] {
  const errors: string[] = [];

  if (!address.name) errors.push('Shipping name is required');
  if (!address.street1) errors.push('Shipping address line 1 is required');
  if (!address.city) errors.push('Shipping city is required');
  if (!address.state) errors.push('Shipping state is required');
  if (!address.postalCode) errors.push('Shipping postal code is required');

  return errors;
}
