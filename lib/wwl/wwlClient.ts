/**
 * WWL (World Wide Logistics) Client
 *
 * INTEGRATION NOTE: Placeholder implementation intended to be adapted to existing integration patterns.
 *
 * TIMING (one more time for the people in the back):
 * This client gets called AFTER payment is confirmed. Post-checkout. Not before.
 *
 * Flow:
 * 1. User picks commemorative tickets → donation added to Tessitura cart
 * 2. User completes checkout → Tessitura processes payment
 * 3. Payment confirmed → THIS client sends the order to WWL
 * 4. WWL prints the tickets and ships them
 *
 * The prototype doesn't implement step 3's trigger because that lives in
 * whatever post-checkout hook the client already has. We just provide the
 * payload builder (wwlPayload.ts) and this client stub so the integration
 * dev has something to work with.
 *
 * — Tabs (I type, Kyle thinks, everybody wins)
 */

import type { WWLOrderPayload } from '@/types';
import { validateWWLPayload } from './wwlPayload';

export interface WWLSubmitResult {
  success: boolean;
  wwlOrderId?: string;
  estimatedShipDate?: string;
  error?: string;
  validationErrors?: string[];
}

export interface WWLConfig {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  timeout?: number;
}

/**
 * WWL API Client
 *
 * INTEGRATION NOTE: Stub client with placeholder implementations.
 * The submitOrder() method is the one that matters — replace its guts
 * with a real fetch call based on WWL's API documentation.
 */
export class WWLClient {
  private readonly config: WWLConfig;

  constructor(config: WWLConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Submit a commemorative ticket order to WWL for fulfillment.
   *
   * INTEGRATION NOTE: This is a stub. It validates the payload (that part
   * is real and reusable) and then pretends to submit it. Replace the
   * console.log + fake response with an actual fetch call.
   */
  async submitOrder(payload: WWLOrderPayload): Promise<WWLSubmitResult> {
    const validationErrors = validateWWLPayload(payload);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Payload validation failed',
        validationErrors,
      };
    }

    // INTEGRATION NOTE: Replace this stub with the actual WWL API call.
    // You'll want something like:
    //   const response = await fetch(`${this.config.baseUrl}/api/orders`, { ... })
    // But we don't have WWL's docs, so we just log and return success.
    console.log('[WWL Stub] submitOrder called with payload:', JSON.stringify(payload, null, 2));

    return {
      success: true,
      wwlOrderId: `WWL-${Date.now()}`,
      estimatedShipDate: this.calculateEstimatedShipDate(),
    };
  }

  /**
   * Check order status (stub).
   * INTEGRATION NOTE: Implement if WWL provides a status endpoint.
   */
  async getOrderStatus(wwlOrderId: string): Promise<{
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'error';
    trackingNumber?: string;
    estimatedDelivery?: string;
    error?: string;
  }> {
    console.log('[WWL Stub] getOrderStatus called for:', wwlOrderId);
    return { status: 'pending' };
  }

  /**
   * Cancel an order (stub).
   * INTEGRATION NOTE: Implement if WWL supports cancellation.
   */
  async cancelOrder(wwlOrderId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    console.log('[WWL Stub] cancelOrder called for:', wwlOrderId);
    return { success: true };
  }

  private calculateEstimatedShipDate(): string {
    const shipDate = new Date();
    shipDate.setDate(shipDate.getDate() + 14);
    return shipDate.toISOString().split('T')[0];
  }
}

/**
 * Create a WWL client instance.
 *
 * INTEGRATION NOTE: Reads config from environment variables.
 * In production, set WWL_API_URL, WWL_API_KEY, WWL_CLIENT_ID.
 */
export function createWWLClient(): WWLClient {
  const config: WWLConfig = {
    baseUrl: process.env.WWL_API_URL || 'https://api.wwl.example.com',
    apiKey: process.env.WWL_API_KEY || 'dev-api-key',
    clientId: process.env.WWL_CLIENT_ID || 'dev-client',
    timeout: 30000,
  };

  return new WWLClient(config);
}
