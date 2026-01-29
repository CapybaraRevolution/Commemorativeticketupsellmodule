/**
 * API Route: GET /api/cart
 * 
 * Fetches the current cart contents and address on file for the user.
 * 
 * In production, this will:
 * 1. Extract sessionKey from cookies/headers
 * 2. Call Tessitura to get cart contents
 * 3. Call Tessitura to get address on file
 * 
 * For demo purposes, returns mock data.
 */

import { NextResponse } from 'next/server';
import { createTessituraClient } from '@/lib/tessitura';
import type { GetCartResponse } from '@/types';

export async function GET(request: Request) {
  try {
    // INTEGRATION ASSUMPTION: sessionKey derived from existing Tessitura session/cookie/header strategy.
    // The prototype reads from query param for demo purposes; adapt to your session management pattern.
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get('sessionKey') || 'demo-session-12345';

    // Create the Tessitura client (uses mock in development)
    const tessituraClient = await createTessituraClient();

    // Fetch cart and address in parallel
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
