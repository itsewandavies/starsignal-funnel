# Star Signal - Cosmic Blueprint Funnel

Production funnel for the Star Signal cosmic reading product at **starsignal.co**.

## Architecture

### Pages

1. **Landing Page (index.html)** - Initial hero page with testimonials and CTAs
2. **Quiz Page** - 9-question personality & preference quiz (to be built)
3. **Results Page** - Dynamic personalized results based on quiz answers (to be built)
4. **Checkout Page** - $19 offer with payment processing (to be built)

### Deployment

- **Domain**: starsignal.co
- **Host**: Vercel
- **Repo**: itsewandavies/starsignal-funnel

## Development

```bash
# Local development
npm run dev

# Visit http://localhost:3000
```

## Key Features

- **100% Static First Section** - index.html renders perfectly as-is
- **Quiz System** - Captures birth date, time, location, and life preferences
- **Dynamic Results** - Personalized reading generated based on quiz answers
- **Segmentation** - Routes users to different OTO (One-Time Offer) sequences based on life area selection (Love, Money, Purpose, Spiritual)

## Build & Deploy

Deployed automatically to Vercel on push to `main` branch.

---

**Status**: Core landing page complete. Quiz & results pages in development.
