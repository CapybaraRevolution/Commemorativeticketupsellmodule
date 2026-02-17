/**
 * Contribution Notes Builder
 *
 * Builds the human-readable notes string that gets stored in Tessitura
 * alongside the donation line item. This is so someone looking at the
 * order in Tessitura's admin can see exactly what was ordered without
 * having to cross-reference another system.
 *
 * Format: "Commemorative Ticket | Row B Seat 13: Design A (Season); ... | Message: "..." | Ship to: ..."
 *
 * Framework-agnostic — pure data transformation.
 *
 * — Tabs
 */

import type { AddToOrderRequest } from '@/types';
import { DESIGN_OPTIONS } from '@/lib/config/orgConfig';

/**
 * Format a design ID into a readable display name.
 * Pulls from the design options config so it stays in sync.
 */
export function formatDesignName(designId: string): string {
  const design = DESIGN_OPTIONS.find(d => d.id === designId);
  return design ? `${design.name} (${design.description})` : designId;
}

/**
 * Format an address into a single-line string for notes.
 */
export function formatAddress(address: AddToOrderRequest['shippingAddress']): string {
  return [
    address.name,
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Build the full contribution notes string from a request.
 *
 * @param selections - The seat/design selections
 * @param specialMessage - Optional special message
 * @param shippingAddress - The shipping address
 * @param maxLength - Maximum string length (Tessitura notes fields have limits)
 * @returns Formatted notes string
 */
export function buildContributionNotes(
  selections: AddToOrderRequest['selections'],
  shippingAddress: AddToOrderRequest['shippingAddress'],
  specialMessage?: string,
  maxLength: number = 500,
): string {
  const designSummary = selections
    .map(s => `Row ${s.row} Seat ${s.seatNumber}: ${formatDesignName(s.designId)}`)
    .join('; ');

  const notes = [
    'Commemorative Ticket',
    designSummary,
    specialMessage ? `Message: "${specialMessage}"` : null,
    `Ship to: ${formatAddress(shippingAddress)}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return notes.substring(0, maxLength);
}
