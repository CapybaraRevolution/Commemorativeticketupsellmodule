/**
 * Tessitura Client Interface
 * 
 * This interface defines the contract for interacting with Tessitura APIs.
 * Two implementations are provided:
 * - mockTessituraClient.ts: For local development with hardcoded data
 * - realTessituraClient.ts: For production with actual API calls
 */

import type {
  Cart,
  Address,
  TessituraContributionRequest,
  TessituraContributionResult,
} from '@/types';

/**
 * Interface for Tessitura API client operations needed for commemorative tickets
 */
export interface TessituraClient {
  /**
   * Fetch the current cart/order for a session
   * 
   * Tessitura Endpoint: GET /Web/Cart/{sessionKey}
   * 
   * @param sessionKey - The Tessitura session key (from cookie/auth)
   * @returns Cart object with seats and session info
   */
  getCart(sessionKey: string): Promise<Cart>;

  /**
   * Add a contribution (donation) to the cart
   * 
   * Tessitura Endpoint: POST /Web/Cart/{sessionKey}/Contributions
   * 
   * This is used to add the commemorative ticket as a donation line item.
   * The actual physical fulfillment is handled separately via WWL after checkout.
   * 
   * @param sessionKey - The Tessitura session key
   * @param contribution - Contribution details (fund, amount, notes)
   * @returns Result with contribution ID or error
   */
  addContribution(
    sessionKey: string,
    contribution: TessituraContributionRequest
  ): Promise<TessituraContributionResult>;

  /**
   * Get the primary address on file for a constituent
   * 
   * Tessitura Endpoint: GET /CRM/Addresses?constituentId={id}&primaryOnly=true
   * 
   * @param constituentId - The constituent's Tessitura ID
   * @returns Primary address or null if none on file
   */
  getPrimaryAddress(constituentId: number): Promise<Address | null>;
}

/**
 * Configuration for the Tessitura client
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
 * Factory function to create the appropriate Tessitura client
 * based on environment
 */
export async function createTessituraClient(): Promise<TessituraClient> {
  // In production, use the real client; in development, use mock
  if (process.env.NODE_ENV === 'production' && process.env.TESSITURA_BASE_URL) {
    const { RealTessituraClient } = await import('./realTessituraClient');
    return new RealTessituraClient({
      baseUrl: process.env.TESSITURA_BASE_URL,
      apiKey: process.env.TESSITURA_API_KEY,
    });
  }

  // Default to mock client for development
  const { MockTessituraClient } = await import('./mockTessituraClient');
  return new MockTessituraClient();
}
