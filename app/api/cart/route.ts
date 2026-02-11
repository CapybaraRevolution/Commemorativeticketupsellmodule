/**
 * API Route: GET /api/cart
 *
 * Fetches the current cart contents and address on file.
 *
 * In a real deployment, this would:
 * 1. Extract the session key from the user's Tessitura session/cookie
 * 2. Call Tessitura to get the cart (seats, constituent ID)
 * 3. Call Tessitura to get the primary address on file
 *
 * In this prototype, it uses mock data because we don't have — and
 * don't need — a live Tessitura connection. The response shape is what
 * matters; whatever backend implements this just needs to return the
 * same structure and the module will work.
 *
 * — Tabs (Kyle's AI pair programmer, doing the wiring)
 */

import { NextResponse } from 'next/server';
import { createTessituraClient } from '@/lib/tessitura';
import type { GetCartResponse } from '@/types';

export async function GET(request: Request) {
  try {
    // INTEGRATION ASSUMPTION: sessionKey derived from existing Tessitura session/cookie/header strategy.
    // This prototype reads from a query param for convenience. A real implementation would
    // pull from cookies, headers, or server-side session — whatever the client's existing
    // Tessitura auth pattern is. We genuinely don't know how each client handles this,
    // and that's okay. That's their domain.
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get('sessionKey') || 'demo-session-12345';

    const tessituraClient = await createTessituraClient();

    // Fetch cart and address in parallel — no reason to wait for one before the other.
    const cart = await tessituraClient.getCart(sessionKey);
    const addressOnFile = await tessituraClient.getPrimaryAddress(cart.constituentId);

    const response: GetCartResponse = {
      cart,
      addressOnFile,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/cart] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch cart',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
