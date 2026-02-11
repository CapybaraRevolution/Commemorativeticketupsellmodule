/**
 * Real Tessitura Client
 *
 * INTEGRATION NOTE: Placeholder implementation intended to be adapted to existing integration patterns.
 *
 * This file is the scaffold. The fetch calls are real-ish (they'll actually
 * try to hit endpoints), but the response mapping is based on guesses about
 * Tessitura's REST API structure. Every org's Tessitura instance is a little
 * different, so the mapping functions are isolated on purpose — swap the
 * field names in mapCartResponse() and mapAddressResponse() and you're done.
 *
 * Kyle doesn't have access to any live Tessitura instance (he's a product
 * person, not a sysadmin), so this is all based on API documentation and
 * reasonable assumptions. If the field names are wrong, that's expected.
 * The architecture is right; the details need local knowledge.
 *
 * — Tabs (the AI behind the curtain)
 */

import type {
  Cart,
  Address,
  Seat,
  TessituraContributionRequest,
  TessituraContributionResult,
} from '@/types';
import type { TessituraClient, TessituraConfig } from './tessituraClient';

export class RealTessituraClient implements TessituraClient {
  private readonly config: TessituraConfig;

  constructor(config: TessituraConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Fetch the current cart from Tessitura.
   *
   * Intended endpoint: GET /Web/Cart/{sessionKey}
   *
   * INTEGRATION NOTE: Response structure varies by Tessitura version.
   * The mapCartResponse() function below isolates all field mapping
   * so you only need to adjust that one function.
   */
  async getCart(sessionKey: string): Promise<Cart> {
    const url = `${this.config.baseUrl}/Web/Cart/${sessionKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // All the "where is the seat number in this response" logic lives
    // in mapCartResponse. If Tessitura returns different field names,
    // that's the only function you touch.
    return this.mapCartResponse(data, sessionKey);
  }

  /**
   * Add a contribution (donation) to the cart.
   *
   * Intended endpoint: POST /Web/Cart/{sessionKey}/Contributions
   *
   * INTEGRATION NOTE: Request body format may vary by Tessitura version.
   * This uses FundId, Amount, AppealId (optional), Notes (optional).
   */
  async addContribution(
    sessionKey: string,
    contribution: TessituraContributionRequest
  ): Promise<TessituraContributionResult> {
    const url = `${this.config.baseUrl}/Web/Cart/${sessionKey}/Contributions`;

    const body = {
      FundId: contribution.fundId,
      Amount: contribution.amount,
      ...(contribution.appealId && { AppealId: contribution.appealId }),
      ...(contribution.notes && { Notes: contribution.notes }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tessitura] addContribution failed:', errorText);
      return {
        success: false,
        error: `Failed to add contribution: ${response.status}`,
      };
    }

    const data = await response.json();

    // INTEGRATION NOTE: The field that holds the contribution ID may
    // be ContributionId, Id, or something else. Adjust as needed.
    return {
      success: true,
      contributionId: data.ContributionId || data.Id,
    };
  }

  /**
   * Get the primary address for a constituent.
   *
   * Intended endpoint: GET /CRM/Addresses?constituentId={id}&primaryOnly=true
   *
   * INTEGRATION NOTE: Endpoint path varies by Tessitura version. Alternatives:
   * - GET /CRM/Constituents/{id}/Addresses?primaryOnly=true
   * - GET /TXN/Addresses/{constituentId}
   */
  async getPrimaryAddress(constituentId: number): Promise<Address | null> {
    const url = `${this.config.baseUrl}/CRM/Addresses?constituentId=${constituentId}&primaryOnly=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      console.error(`[Tessitura] Failed to fetch address for constituent ${constituentId}`);
      return null;
    }

    const data = await response.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    return this.mapAddressResponse(Array.isArray(data) ? data[0] : data);
  }

  /**
   * Build common headers for Tessitura API requests.
   *
   * INTEGRATION NOTE: Authentication approach varies (Basic Auth, API Key, OAuth, etc.)
   * Adapt to match the existing Tessitura auth pattern.
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  /**
   * Map Tessitura cart response → our Cart type.
   *
   * INTEGRATION NOTE: Field names below are examples based on common Tessitura
   * REST API patterns. Adjust to match the actual response from your instance.
   * This function is the adapter layer — everything else can stay the same.
   */
  private mapCartResponse(data: unknown, sessionKey: string): Cart {
    const tessResponse = data as {
      Order?: {
        LineItems?: Array<{
          SubLineItems?: Array<{
            SubLineItemId?: number;
            Section?: string;
            Row?: string;
            Seat?: string;
            Price?: number;
          }>;
        }>;
      };
      Constituent?: { Id?: number };
      Performance?: {
        ProductionSeason?: string;
        PerformanceDate?: string;
        Facility?: string;
      };
    };

    const seats: Seat[] = [];

    tessResponse.Order?.LineItems?.forEach(lineItem => {
      lineItem.SubLineItems?.forEach(subItem => {
        seats.push({
          section: subItem.Section || 'Unknown',
          row: subItem.Row || '',
          seatNumber: subItem.Seat || '',
          price: subItem.Price || 0,
          seatId: subItem.SubLineItemId,
        });
      });
    });

    return {
      sessionKey,
      constituentId: tessResponse.Constituent?.Id || 0,
      eventName: tessResponse.Performance?.ProductionSeason || 'Unknown Event',
      performanceDate: tessResponse.Performance?.PerformanceDate || '',
      venue: tessResponse.Performance?.Facility || 'Unknown Venue',
      seats,
      ticketTotal: seats.reduce((sum, seat) => sum + seat.price, 0),
    };
  }

  /**
   * Map Tessitura address response → our Address type.
   *
   * INTEGRATION NOTE: Same deal as above — field names are educated guesses.
   * Adjust to match your actual Tessitura response.
   */
  private mapAddressResponse(data: unknown): Address {
    const tessAddress = data as {
      FirstName?: string;
      LastName?: string;
      DisplayName?: string;
      Street1?: string;
      Street2?: string;
      City?: string;
      State?: string;
      StateProvince?: string;
      PostalCode?: string;
      ZipCode?: string;
      Country?: string;
      CountryId?: string;
    };

    return {
      name: tessAddress.DisplayName ||
            `${tessAddress.FirstName || ''} ${tessAddress.LastName || ''}`.trim() ||
            'Unknown',
      street1: tessAddress.Street1 || '',
      street2: tessAddress.Street2,
      city: tessAddress.City || '',
      state: tessAddress.State || tessAddress.StateProvince || '',
      postalCode: tessAddress.PostalCode || tessAddress.ZipCode || '',
      country: tessAddress.Country || tessAddress.CountryId || 'US',
    };
  }
}
