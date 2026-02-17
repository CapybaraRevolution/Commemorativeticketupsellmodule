/**
 * API Route: POST /api/commemorative/add-to-order
 *
 * Next.js-specific handler that wraps the framework-agnostic business logic
 * from lib/api/. If you're building in Nuxt, Express, or .NET, ignore this
 * file and call the lib/api/ utilities directly from your own handler.
 *
 * — Tabs
 */

import { NextResponse } from 'next/server';
import { createTessituraClient } from '@/lib/tessitura';
import { ORG_CONFIG } from '@/lib/config/orgConfig';
import { validateAddToOrderRequest, verifyPrice, buildContributionNotes } from '@/lib/api';
import type { AddToOrderRequest, AddToOrderResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body: AddToOrderRequest = await request.json();

    // Validate using the extracted utility
    const validationErrors = validateAddToOrderRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Server-side price calculation
    const quantity = body.selections.length;
    const { total: calculatedTotal } = verifyPrice(body.totalPrice, quantity);

    // Build Tessitura contribution notes
    const notes = buildContributionNotes(
      body.selections,
      body.shippingAddress,
      body.specialMessage,
    );

    // Add contribution to Tessitura
    const tessituraClient = await createTessituraClient();
    const contributionResult = await tessituraClient.addContribution(
      body.sessionKey,
      {
        fundId: ORG_CONFIG.fundId,
        amount: calculatedTotal,
        notes,
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

    // INTEGRATION ASSUMPTION: Selection data needs to be persisted for later WWL submission.
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
      { success: false, error: 'Failed to add commemorative tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
