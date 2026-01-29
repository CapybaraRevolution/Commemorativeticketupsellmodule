/**
 * Mock Tessitura Client
 * 
 * Provides hardcoded mock data for local development and testing.
 * This allows the commemorative ticket module to be developed and tested
 * without requiring a connection to a real Tessitura instance.
 */

import type {
  Cart,
  Address,
  TessituraContributionRequest,
  TessituraContributionResult,
} from '@/types';
import type { TessituraClient } from './tessituraClient';

/**
 * Mock implementation of the Tessitura client
 */
export class MockTessituraClient implements TessituraClient {
  /**
   * Returns a mock cart with 3 seats for demo purposes
   */
  async getCart(sessionKey: string): Promise<Cart> {
    // Simulate network delay
    await this.delay(200);

    console.log(`[MockTessitura] getCart called with sessionKey: ${sessionKey}`);

    return {
      sessionKey,
      constituentId: 12345,
      eventName: 'ULYSSES',
      performanceDate: 'Friday, January 23 | 7:30 PM',
      venue: 'Martinson Hall',
      seats: [
        {
          section: 'Orchestra',
          row: 'B',
          seatNumber: '13',
          price: 99,
          seatId: 100001,
        },
        {
          section: 'Orchestra',
          row: 'B',
          seatNumber: '14',
          price: 99,
          seatId: 100002,
        },
        {
          section: 'Orchestra',
          row: 'B',
          seatNumber: '15',
          price: 99,
          seatId: 100003,
        },
      ],
      ticketTotal: 297,
    };
  }

  /**
   * Simulates adding a contribution to the cart
   */
  async addContribution(
    sessionKey: string,
    contribution: TessituraContributionRequest
  ): Promise<TessituraContributionResult> {
    // Simulate network delay
    await this.delay(500);

    console.log(`[MockTessitura] addContribution called:`, {
      sessionKey,
      contribution,
    });

    // Simulate successful contribution
    return {
      success: true,
      contributionId: Math.floor(Math.random() * 100000) + 200000,
    };
  }

  /**
   * Returns a mock primary address
   */
  async getPrimaryAddress(constituentId: number): Promise<Address | null> {
    // Simulate network delay
    await this.delay(150);

    console.log(`[MockTessitura] getPrimaryAddress called for constituent: ${constituentId}`);

    // Return mock address
    return {
      name: 'Kyle Lastname',
      street1: '123 Main St',
      street2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    };
  }

  /**
   * Helper to simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
