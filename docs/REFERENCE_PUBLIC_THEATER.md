# Reference: Public Theater Configuration

> **This file is an archive.** The demo has been generalized so it can be shown
> to any Tessitura client. The Public Theater-specific values that were originally
> in the codebase are preserved here for reference.

---

## Branding

| Token | Value |
|-------|-------|
| Org name | The Public Theater |
| Logo text | `PUBLIC.` |
| Primary color | `#DC143C` (crimson red) |
| Primary dark | `#B8102F` |

## Copy

| Context | Original text |
|---------|--------------|
| Module title | `2025–26 PUBLIC THEATER COMMEMORATIVE TICKET` |
| Donation line | `Includes a donation to support Public Theater.` |
| Modal: "What You Get" | A physical commemorative ticket for the 2025–26 Public Theater season, featuring exclusive artwork celebrating our productions. |
| Modal: "Supporting" section title | `Supporting The Public` |
| Modal: "Supporting" body | Your commemorative ticket purchase includes a donation to support Public Theater. As a nonprofit organization, your contribution helps us continue producing world-class theater and serving our community. |
| Modal: "Refund" | Commemorative tickets are non-refundable as they constitute a charitable donation to Public Theater. |
| Modal: "Design Selection" | Choose from three exclusive designs celebrating the 2025–26 season. |
| Support email | `support@publictheater.org` |

## Demo Data

| Field | Value |
|-------|-------|
| Event name | ULYSSES |
| Venue | Martinson Hall |
| Performance date | Friday, January 23 \| 7:30 PM |
| Seat section | Orchestra |
| Demo constituent name | Kyle Lastname |
| Demo address | 123 Main St, Apt 4B, New York, NY 10001 |

## Org Config (if restoring for PT demo)

To restore Public Theater branding for a demo, update `lib/config/orgConfig.ts`:

```typescript
export const ORG_CONFIG = {
  orgName: 'The Public Theater',
  seasonLabel: '2025–26 Season',
  moduleTitle: '2025–26 Public Theater Commemorative Ticket',
  tagline: 'Get a physical souvenir ticket mailed to you.',
  donationCopy: 'Includes a donation to support Public Theater.',
  supportEmail: 'support@publictheater.org',
  ticketPrice: 20,
  fundId: 1001,       // Replace with actual PT fund ID
  appealId: undefined,
  wwlSku: 'COMM-TICKET-2025',
  wwlVariantMap: {
    'design-a': 'SEASON-2025',
    'design-b': 'CLASSIC',
    'design-c': 'LIMITED-ED',
  },
};
```

And update `app/globals.css` primary colors:

```css
--color-primary: #DC143C;
--color-primary-dark: #B8102F;
```
