/**
 * Mock Tessitura Client
 *
 * Fake Tessitura that lives on localhost. Returns hardcoded data so the
 * module can run without a real Tessitura instance in sight.
 *
 * The mock data is deliberately generic — "THE NUTCRACKER" at "Main Stage"
 * could be any performing arts org. This used to say "ULYSSES" at
 * "Martinson Hall" but Kyle wanted the demo de-branded.
 *
 * If you're a dev looking at this and wondering why the data is so
 * simple — it's on purpose. This isn't a test fixture; it's a prototype
 * that just needs enough data to make the UI look real. — Tabs
 */

import type {
  Cart,
  Address,
  TessituraContributionRequest,
  TessituraContributionResult,
} from '@/types';
import { DEMO_CART } from '@/lib/config/orgConfig';
import type { TessituraClient } from './tessituraClient';

export class MockTessituraClient implements TessituraClient {
  /**
   * Returns a mock cart with 3 seats.
   * The data comes from DEMO_CART in orgConfig so it stays in sync
   * with the fallback data on the cart page.
   */
  async getCart(sessionKey: string): Promise<Cart> {
    await this.delay(200);

    console.log(`[MockTessitura] getCart called with sessionKey: ${sessionKey}`);

    return {
      sessionKey,
      constituentId: 12345,
      eventName: DEMO_CART.eventName,
      performanceDate: DEMO_CART.performanceDate,
      venue: DEMO_CART.venue,
      seats: DEMO_CART.seats.map((s, i) => ({
        ...s,
        seatId: 100001 + i,
      })),
      ticketTotal: DEMO_CART.ticketTotal,
    };
  }

  /**
   * Pretends to add a contribution. Always succeeds because optimism.
   */
  async addContribution(
    sessionKey: string,
    contribution: TessituraContributionRequest
  ): Promise<TessituraContributionResult> {
    await this.delay(500); // Realistic-ish latency

    console.log(`[MockTessitura] addContribution called:`, {
      sessionKey,
      contribution,
    });

    return {
      success: true,
      contributionId: Math.floor(Math.random() * 100000) + 200000,
    };
  }

  /**
   * Returns a mock address. Generic name + Chicago address because
   * Kyle didn't want "New York" baked in everywhere either.
   */
  async getPrimaryAddress(constituentId: number): Promise<Address | null> {
    await this.delay(150);

    console.log(`[MockTessitura] getPrimaryAddress called for constituent: ${constituentId}`);

    return { ...DEMO_CART.address };
  }

  /** Simulates network latency so the loading states actually render. */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
