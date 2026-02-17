/**
 * Organization Configuration
 *
 * THIS FILE is the reason the demo doesn't say "Public Theater" everywhere.
 *
 * Every org-specific string, color, price, SKU, and email lives here.
 * Want to demo this for Houston Ballet? Change this file. That's the
 * whole idea — one config swap, new demo. Kyle was very insistent on this
 * because he wants to show the module to multiple Tessitura clients
 * without rebuilding anything.
 *
 * If you're integrating for a real client, you'd likely pull some of
 * these values from environment variables or a CMS. We just hardcode
 * them here because it's a prototype and we're not monsters.
 *
 * — Tabs (see docs/HANDOFF_FOR_JASON.md if you're wondering who that is)
 */

// =============================================================================
// Organization Branding
// =============================================================================

export const ORG_CONFIG = {

  // -- Identity --
  /** Display name of the organization. Used in copy throughout the module. */
  orgName: 'Your Organization',

  /**
   * The season or event grouping label.
   * Kyle wanted this to be flexible — could be "2025-26 Season" or
   * "Summer Festival 2026" or whatever the client calls their thing.
   */
  seasonLabel: '2025–26 Season',

  /**
   * The big title that appears in the module header.
   * This gets uppercased in the UI, so don't worry about casing here.
   */
  moduleTitle: '2025–26 Season Commemorative Ticket',

  // -- Copy --
  /** One-liner describing what the ticket is. */
  tagline: 'Get a physical souvenir ticket mailed to you.',

  /** The donation messaging line. */
  donationCopy: 'Includes a donation to support your organization.',

  /**
   * Support email for fulfillment questions.
   * In a real deployment this comes from the org. We use a placeholder
   * because Kyle doesn't want anyone accidentally emailing a real inbox
   * from a demo. Smart.
   */
  supportEmail: 'support@example.org',

  // -- Pricing --
  /**
   * Price per commemorative ticket in dollars.
   * $20 was the number that came out of the original product conversation.
   * This might vary by org or by campaign — the module just reads it from here.
   */
  ticketPrice: 20,

  // -- Tessitura Integration --
  /**
   * Tessitura Fund ID for the commemorative ticket donation.
   * 1001 is a placeholder. The real value comes from the org's Tessitura admin.
   * Kyle doesn't have access to that (understandably), so we flag it here.
   */
  fundId: 1001,

  /**
   * Appeal ID for campaign tracking (optional).
   * Set to undefined if the org doesn't use appeal codes.
   */
  appealId: undefined as number | undefined,

  // -- WWL Fulfillment --
  /**
   * Product SKU that WWL uses to identify commemorative tickets.
   * Another "we don't have the real value yet" situation.
   */
  wwlSku: 'COMM-TICKET-2025',

  /**
   * Maps our internal design IDs to whatever codes WWL uses on their end.
   * These are placeholders. The real mapping depends on the specific
   * product setup between the org and WWL.
   */
  wwlVariantMap: {
    'design-a': 'SEASON-2025',
    'design-b': 'CLASSIC',
    'design-c': 'LIMITED-ED',
  } as Record<string, string>,

} as const;

// =============================================================================
// Design Options
// =============================================================================

/**
 * Available commemorative ticket designs.
 *
 * Kyle's instinct was three options — classic product design thinking.
 * Enough choice to feel personalized, not so many that it's paralyzing.
 *
 * The module supports 1–4+ designs. The gallery layout flex-wraps, so
 * it adapts whether a client wants two designs or four. The array length
 * IS the config — add a design here, it appears in the module.
 *
 * Each design can have:
 * - imageUrl: path to real artwork (when the client provides it)
 * - fallbackColor: colored placeholder (what we use until artwork arrives)
 *
 * Client artwork should be placed in assets/designs/ in ticket aspect
 * ratio (~2:3 portrait). See assets/designs/README.md for specs.
 *
 * Kyle asked "what if a client wants six designs?" I said the layout
 * handles it, but at some point you're giving someone too many choices.
 * That's a product decision, not a technical one. — Tabs
 */
export const DESIGN_OPTIONS = [
  {
    id: 'design-a',
    name: 'Design A',
    description: 'Season design',
    // imageUrl: '/assets/designs/design-a.png',  // Uncomment when artwork is available
    fallbackColor: '#60a5fa',
    available: true,
  },
  {
    id: 'design-b',
    name: 'Design B',
    description: 'Classic',
    // imageUrl: '/assets/designs/design-b.png',
    fallbackColor: '#fb7185',
    available: true,
  },
  {
    id: 'design-c',
    name: 'Design C',
    description: 'Limited edition',
    // imageUrl: '/assets/designs/design-c.png',
    fallbackColor: '#fbbf24',
    available: true,
  },
];

// =============================================================================
// US States / Territories
// =============================================================================

/**
 * US states, DC, and territories for the shipping address dropdown.
 *
 * Kyle said "can't we just let them type?" I said "sure, and then
 * enjoy debugging why someone typed 'Nwe York' and their tickets
 * shipped to nowhere." Dropdown it is. — Tabs
 *
 * Follows USWDS (US Web Design System) pattern: full names displayed,
 * abbreviations stored. If a future client is in Canada, replace this
 * with provinces or make it configurable per-org.
 */
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  // Territories
  { value: 'AS', label: 'American Samoa' },
  { value: 'GU', label: 'Guam' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'US Virgin Islands' },
  // Military
  { value: 'AA', label: 'Armed Forces Americas' },
  { value: 'AE', label: 'Armed Forces Europe' },
  { value: 'AP', label: 'Armed Forces Pacific' },
] as const;

// =============================================================================
// Demo Cart Data
// =============================================================================

/**
 * Fallback mock data for the demo cart page.
 *
 * This is what shows up when the API call fails or when someone is just
 * poking around locally. It's deliberately generic — "THE NUTCRACKER"
 * at "Main Stage" could be any performing arts org.
 */
export const DEMO_CART = {
  eventName: 'THE NUTCRACKER',
  performanceDate: 'Saturday, March 14 | 7:30 PM',
  venue: 'Main Stage',
  seats: [
    { section: 'Orchestra', row: 'B', seatNumber: '13', price: 99 },
    { section: 'Orchestra', row: 'B', seatNumber: '14', price: 99 },
    { section: 'Orchestra', row: 'B', seatNumber: '15', price: 99 },
  ],
  ticketTotal: 297,
  address: {
    name: 'Alex Johnson',
    street1: '456 Elm St',
    street2: 'Suite 200',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'US',
  },
} as const;
