/**
 * API Route: POST /api/commemorative/add-to-order
 * 
 * Adds commemorative tickets to the cart as a donation line item.
 * 
 * This endpoint:
 * 1. Validates the selections
 * 2. Calculates the total price
 * 3. Adds a contribution to Tessitura
 * 4. Returns success with line item details
 * 
 * Note: The actual WWL fulfillment order is NOT created here.
 * WWL should be called after checkout/payment is confirmed.
 */

import { NextResponse } from 'next/server';
import { createTessituraClient } from '@/lib/tessitura';
import type {
  AddToOrderRequest,
  AddToOrderResponse,
  COMMEMORATIVE_TICKET_PRICE,
  COMMEMORATIVE_FUND_ID,
} from '@/types';

// INTEGRATION ASSUMPTION: sessionKey derived from existing Tessitura session/cookie/header strategy.
// Constants (imported from types but defined here for clarity)
const TICKET_PRICE = 20; // $20 per commemorative ticket
const FUND_ID = 1001; // INTEGRATION ASSUMPTION: Replace with actual Tessitura Fund ID for commemorative ticket donations

export async function POST(request: Request) {
  try {
    const body: AddToOrderRequest = await request.json();

    // Validate required fields
    const validationErrors = validateRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Calculate total price
    const quantity = body.selections.length;
    const calculatedTotal = quantity * TICKET_PRICE;

    // Verify the total matches what was sent
    if (body.totalPrice !== calculatedTotal) {
      console.warn(
        `[API] Price mismatch: sent ${body.totalPrice}, calculated ${calculatedTotal}`
      );
      // Continue with calculated total for safety
    }

    // Build the contribution notes
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

    // Create Tessitura client and add contribution
    const tessituraClient = await createTessituraClient();
    
    const contributionResult = await tessituraClient.addContribution(
      body.sessionKey,
      {
        fundId: FUND_ID,
        amount: calculatedTotal,
        notes: notes.substring(0, 500), // Truncate if too long
      }
    );

    if (!contributionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: contributionResult.error || 'Failed to add contribution',
        },
        { status: 500 }
      );
    }

    // Build response
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
    // The prototype logs to console; in production, store to your preferred persistence layer
    // (database, cache, session) so post-checkout can retrieve and send to WWL.
    console.log('[API] Commemorative order stored for post-checkout WWL submission:', {
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

/**
 * Validate the add-to-order request
 */
function validateRequest(body: AddToOrderRequest): string[] {
  const errors: string[] = [];

  if (!body.sessionKey) {
    errors.push('sessionKey is required');
  }

  if (!body.selections || body.selections.length === 0) {
    errors.push('At least one selection is required');
  }

  // Validate each selection
  body.selections?.forEach((selection, index) => {
    if (!selection.designId) {
      errors.push(`Selection ${index + 1}: designId is required`);
    }
    if (!selection.row || !selection.seatNumber) {
      errors.push(`Selection ${index + 1}: row and seatNumber are required`);
    }
  });

  // Validate shipping address
  if (!body.shippingAddress) {
    errors.push('shippingAddress is required');
  } else {
    if (!body.shippingAddress.name) {
      errors.push('shippingAddress.name is required');
    }
    if (!body.shippingAddress.street1) {
      errors.push('shippingAddress.street1 is required');
    }
    if (!body.shippingAddress.city) {
      errors.push('shippingAddress.city is required');
    }
    if (!body.shippingAddress.state) {
      errors.push('shippingAddress.state is required');
    }
    if (!body.shippingAddress.postalCode) {
      errors.push('shippingAddress.postalCode is required');
    }
  }

  // Validate special message length
  if (body.specialMessage && body.specialMessage.length > 80) {
    errors.push('specialMessage must be 80 characters or less');
  }

  return errors;
}

/**
 * Format design ID to display name
 */
function formatDesignName(designId: string): string {
  const names: Record<string, string> = {
    'design-a': 'Design A (Season)',
    'design-b': 'Design B (Classic)',
    'design-c': 'Design C (Limited Edition)',
  };
  return names[designId] || designId;
}

/**
 * Format address for notes
 */
function formatAddress(address: AddToOrderRequest['shippingAddress']): string {
  return [
    address.name,
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ]
    .filter(Boolean)
    .join(', ');
}
