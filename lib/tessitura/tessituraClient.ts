/**
 * Tessitura Client Interface
 *
 * This is the contract. Any implementation of TessituraClient — mock or real —
 * must provide these three methods. That's it. The module doesn't care HOW
 * you talk to Tessitura; it cares about the SHAPE of what comes back.
 *
 * Kyle's thinking: the front-end module should be blissfully ignorant of
 * whether it's talking to a real Tessitura instance, a mock, or a hamster
 * running on a wheel that happens to return JSON. As long as the data
 * conforms to these types, the UI works.
 *
 * Two implementations exist:
 * - mockTessituraClient.ts → hardcoded data for local dev (what you see in the demo)
 * - realTessituraClient.ts → placeholder fetch calls for production (the integration scaffold)
 *
 * — Tabs (Kyle's AI. I write the code. He tells me what the code should do.)
 */

import type {
  Cart,
  Address,
  TessituraContributionRequest,
  TessituraContributionResult,
} from '@/types';

/**
 * Interface for Tessitura API operations needed by the commemorative ticket module.
 *
 * Three operations, deliberately scoped to what this module actually needs:
 * 1. Get the cart (to know which seats need commemorative tickets)
 * 2. Add a contribution (the donation line item)
 * 3. Get the address (so we can show "ship to address on file")
 *
 * We're not trying to wrap all of Tessitura. Just the parts that matter here.
 */
export interface TessituraClient {
  /**
   * Fetch the current cart/order for a session
   *
   * Tessitura Endpoint: GET /Web/Cart/{sessionKey}
   */
  getCart(sessionKey: string): Promise<Cart>;

  /**
   * Add a contribution (donation) to the cart
   *
   * Tessitura Endpoint: POST /Web/Cart/{sessionKey}/Contributions
   *
   * This is how the commemorative ticket becomes a line item — it's modeled
   * as a donation to a fund. The physical fulfillment (printing, shipping)
   * happens separately via WWL after checkout.
   */
  addContribution(
    sessionKey: string,
    contribution: TessituraContributionRequest
  ): Promise<TessituraContributionResult>;

  /**
   * Get the primary address on file for a constituent
   *
   * Tessitura Endpoint: GET /CRM/Addresses?constituentId={id}&primaryOnly=true
   */
  getPrimaryAddress(constituentId: number): Promise<Address | null>;
}

/**
 * Configuration for the real Tessitura client.
 */
export interface TessituraConfig {
  /** Base URL for Tessitura API (e.g., https://tessitura.example.org/TessituraService) */
  baseUrl: string;
  /** API key or authentication header value */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Factory function — returns mock client in dev, real client in production.
 *
 * This is a lazy import pattern so the mock client doesn't get bundled
 * into a production build and vice versa. Probably over-engineering it
 * for a prototype, but Kyle said "do it right" and who am I to argue.
 */
export async function createTessituraClient(): Promise<TessituraClient> {
  if (process.env.NODE_ENV === 'production' && process.env.TESSITURA_BASE_URL) {
    const { RealTessituraClient } = await import('./realTessituraClient');
    return new RealTessituraClient({
      baseUrl: process.env.TESSITURA_BASE_URL,
      apiKey: process.env.TESSITURA_API_KEY,
    });
  }

  const { MockTessituraClient } = await import('./mockTessituraClient');
  return new MockTessituraClient();
}
