# Design Assets

> **This folder holds commemorative ticket design artwork.**
>
> Currently empty because we're in prototype mode. When a client provides
> their artwork, it goes here. The module picks it up via the `imageUrl`
> field in `lib/config/orgConfig.ts`.

## Image Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Aspect ratio** | ~2:3 portrait (e.g., 400x600) | Mimics a physical ticket shape. The module crops via `object-fit: cover` so slight variations are fine. |
| **Minimum size** | 400px wide | Displayed at ~140px in the gallery, but needs to look sharp on retina. |
| **Format** | PNG or WebP preferred | PNG for transparency support. WebP for smaller file size. JPEG works too. |
| **File naming** | Match the design ID: `design-a.png`, `design-b.png`, etc. | Keeps the mapping obvious. |
| **Background** | Full bleed, no transparency needed | The image fills the entire preview area. |

## How It Works

1. Client provides artwork
2. Save images here with the naming convention above
3. Update `DESIGN_OPTIONS` in `lib/config/orgConfig.ts`:

```typescript
{
  id: 'design-a',
  name: 'Season Design',
  description: '2025–26 Season',
  imageUrl: '/assets/designs/design-a.png',  // ← add this
  fallbackColor: '#60a5fa',                   // ← kept as fallback if image fails to load
  available: true,
}
```

4. The module renders the image instead of the colored placeholder

## Number of Designs

The module supports any number of designs (1–4+ is reasonable). The gallery
layout wraps responsively. Add or remove entries from `DESIGN_OPTIONS` in
the config — the module adapts.

| Count | Layout behavior |
|-------|----------------|
| 1 | Centered single card |
| 2 | Two cards side by side |
| 3 | Three cards in a row (the default) |
| 4+ | Wraps to multiple rows if needed |

## Open Questions

These are things we don't have answers for yet. Whoever handles the
first real client deployment will need to nail these down:

- **Who provides the artwork?** The client? Their marketing team? WWL?
  Kyle thinks the client provides it during onboarding. Tabs thinks WWL
  might have templates. We don't know yet.

- **Aspect ratio confirmation:** The ~2:3 ratio is based on typical
  physical ticket proportions. WWL may have specific dimensions for
  their print templates — those should be the source of truth.

- **Thumbnail vs full image:** Should we use separate assets for the
  small gallery previews vs. a larger detail view? For now we use one
  image at both sizes. If performance matters, we can add a `thumbnailUrl`
  field later.

— Tabs
