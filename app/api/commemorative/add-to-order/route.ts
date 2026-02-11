/**
 * API Route: POST /api/commemorative/add-to-order
 *
 * Adds commemorative tickets to the cart as a donation line item.
 *
 * What this does:
 * 1. Validates the selections (design chosen, address provided, etc.)
 * 2. Re-calculates the total server-side (never trust the client's math)
 * 3. Adds a contribution to Tessitura via the cart's session
 * 4. Returns success with line item details
 *
 * What this does NOT do:
 * - Call WWL. That happens post-checkout, after payment is confirmed.
 *   Kyle asked me (Tabs) to make this very clear because the timing
 *   matters: you don't send a print job to a fulfillment house before
 *   the customer has actually paid.
 *
 * — Tabs (I'm the AI. Kyle is the product brain. We're a package deal.)
 */

import { NextResponse } from 'next/server';
import { createTessituraClient } from '@/lib/tessitura';
import { ORG_CONFIG } from '@/lib/config/orgConfig';
import type {
  AddToOrderRequest,
  AddToOrderResponse,
} from '@/types';

// INTEGRATION ASSUMPTION: sessionKey derived from existing Tessitura session/cookie/header strategy.
// Pull price and fund ID from the org config so they stay in sync with the module UI.
const TICKET_PRICE = ORG_CONFIG.ticketPrice;
const FUND_ID = ORG_CONFIG.fundId;

export async function POST(request: Request) {
  try {
    const body: AddToOrderRequest = await request.json();

    // Validate everything. We're defensive here because this is the
    // endpoint that actually creates a financial transaction.
    const validationErrors = validateRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Calculate total server-side. If the client sent a different number,
    // we log it but use OUR number. Trust but verify (mostly verify).
    const quantity = body.selections.length;
    const calculatedTotal = quantity * TICKET_PRICE;

    if (body.totalPrice !== calculatedTotal) {
      console.warn(
        `[API] Price mismatch: client sent $${body.totalPrice}, server calculated $${calculatedTotal}. Using server value.`
      );
    }

    // Build the notes that get stored in Tessitura alongside the contribution.
    // This is a human-readable string so someone looking at the order in
    // Tessitura's admin can see exactly what was ordered.
    const designSummary = body.selections
      .map(s => `Row ${s.row} Seat ${s.seatNumber}: ${formatDesignName(s.designId)}`)
      .join('; ');

    const notes = [
      'Commemorative Ticket',
      designSummary,
      body.specialMessage ? `Message: "${body.specialMessage}"` : null,
      `Ship to: ${formatAddress(body.shippingAddress)}`,
    ]
      .filter(Boolean)
      .join(' | ');

    // Add the contribution to Tessitura
    const tessituraClient = await createTessituraClient();

    const contributionResult = await tessituraClient.addContribution(
      body.sessionKey,
      {
        fundId: FUND_ID,
        amount: calculatedTotal,
        notes: notes.substring(0, 500), // Tessitura notes fields have limits
      }
    );

    if (!contributionResult.success) {
      return NextResponse.json(
        { success: false, error: contributionResult.error || 'Failed to add contribution' },
        { status: 500 }
      );
    }

    const response: AddToOrderResponse = {
      success: true,
      contributionId: contributionResult.contributionId,
      lineItem: {
        description: `Commemorative Tickets x${quantity}`,
        quantity,
        total: calculatedTotal,
      },
    };

    // INTEGRATION ASSUMPTION: Selection data needs to be persisted here for later WWL submission.
    // In production, store this to whatever persistence layer the client uses (database, cache,
    // session) so that the post-checkout hook can retrieve it and send to WWL. The prototype
    // just logs it because we don't have a database and Kyle doesn't want to over-engineer
    // something that depends on the client's infrastructure choices.
    console.log('[API] Commemorative order — store this for post-checkout WWL submission:', {
      sessionKey: body.sessionKey,
      quantity,
      total: calculatedTotal,
      contributionId: contributionResult.contributionId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/commemorative/add-to-order] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add commemorative tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** Validate the request body. Thorough because money is involved. */
function validateRequest(body: AddToOrderRequest): string[] {
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
    if (!body.shippingAddress.name) errors.push('shippingAddress.name is required');
    if (!body.shippingAddress.street1) errors.push('shippingAddress.street1 is required');
    if (!body.shippingAddress.city) errors.push('shippingAddress.city is required');
    if (!body.shippingAddress.state) errors.push('shippingAddress.state is required');
    if (!body.shippingAddress.postalCode) errors.push('shippingAddress.postalCode is required');
  }

  if (body.specialMessage && body.specialMessage.length > 80) {
    errors.push('specialMessage must be 80 characters or less');
  }

  return errors;
}

function formatDesignName(designId: string): string {
  const names: Record<string, string> = {
    'design-a': 'Design A (Season)',
    'design-b': 'Design B (Classic)',
    'design-c': 'Design C (Limited Edition)',
  };
  return names[designId] || designId;
}

function formatAddress(address: AddToOrderRequest['shippingAddress']): string {
  return [address.name, address.street1, address.street2, `${address.city}, ${address.state} ${address.postalCode}`]
    .filter(Boolean)
    .join(', ');
}
