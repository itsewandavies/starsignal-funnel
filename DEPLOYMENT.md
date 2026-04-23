# Star Signal Funnel Deployment Guide

## Overview

Star Signal is a complete funnel for selling cosmic blueprint readings via Stripe. The funnel is deployed to **starsignal.co** via Vercel and tracks all conversions via the EarnHive tracking bridge.

## Architecture

### Pages

1. **index.html** — Landing page with hero, benefits, testimonials, and primary CTA
   - Tracks: PageView
   - CTA: "Reveal My Cosmic Blueprint" → quiz.html

2. **quiz.html** — 9-question interactive quiz with psychological commitment architecture
   - Tracks: Lead (on quiz completion)
   - Questions: Q1-Q8 gather data, Q9 captures email
   - Output: Generates custom results URL with all quiz answers as params

3. **results.html** — Personalized results page with dynamic content
   - Tracks: ViewContent (implicitly via tracking.js)
   - Dynamic variables pulled from URL params:
     * `[firstName]` from email
     * `[lifePath]` calculated from birth date
     * `[birthDate]` formatted for display
     * `[thresholdMonth]` auto-calculated 2-4 months out
     * Segmented content based on Q6 (life area)
   - CTA: "Send Me My Full Blueprint For $19" → checkout.html

4. **checkout.html** — Stripe payment collection
   - Tracks: AddToCart (implicit), Purchase (on submit)
   - Payment: 1x $19 charge via Stripe
   - Output: Redirects to thank-you.html after success

5. **thank-you.html** — Confirmation and next steps
   - Tracks: Purchase confirmation
   - Message: Reassurance that blueprint is coming, next steps

### Tracking Integration

**File: tracking.js**

The tracking system handles two flows:

#### Flow 1: Meta Pixel (Client-Side)
- Fetches affiliate's `pixel_id` from the bridge
- Loads Meta Pixel SDK
- Fires events: PageView, Lead, Purchase

#### Flow 2: CAPI (Server-Side via Bridge)
- All events sent to `https://app.earnhive.com/api/track`
- Bridge converts to CAPI and fires to Meta Business Account
- Affiliate's CAPI token used for server-side conversion attribution

**Event Flow:**
```
User Action → tracking.js → EarnHive Bridge → Meta Pixel + CAPI
```

### Conversion Path

```
Landing (index.html)
  ↓ [Click CTA]
Quiz (quiz.html)
  ↓ [Answer Q1-Q9, Click Submit]
  └→ Track: Lead (email, life area, relationship status)
Results (results.html)
  ↓ [Dynamic personalization based on quiz answers]
  ↓ [Click "Send Me My Blueprint"]
Checkout (checkout.html)
  ↓ [Enter payment info]
  └→ Track: Purchase ($19)
Thank You (thank-you.html)
  └→ Send Blueprint PDF via email
```

## Deployment to Vercel

### Prerequisites

- GitHub repository: `itsewandavies/starsignal-funnel`
- Vercel account linked to GitHub
- Domain: `starsignal.co` (configured in Vercel)

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select repository: `itsewandavies/starsignal-funnel`
4. Framework preset: **"Other" (static HTML)**
5. Root directory: `.` (project root)
6. Build command: (leave empty or use `npm run build`)
7. Output directory: `.` (serve all HTML files from root)
8. Click "Deploy"

### Step 2: Configure Custom Domain

1. In Vercel project settings, go to **Domains**
2. Add domain: `starsignal.co`
3. Point nameservers from domain registrar to Vercel
4. SSL certificate auto-provisioned

### Step 3: Verify Deployment

1. Visit `https://starsignal.co`
2. Confirm landing page loads
3. Test quiz → results → checkout flow
4. Check browser console for tracking.js errors

## Tracking Configuration

### For Your Affiliate (Test)

**Affiliate ID:** `ewandvs` (from EarnHive)
**Pixel ID:** `969519965418523`
**CAPI Token:** (stored in Supabase)

**Test URL:**
```
https://starsignal.co?ref=ewandvs
```

### For Other Affiliates

Simply append `?ref=[affiliate_id]` to any page:
```
https://starsignal.co?ref=sarah_coaching
https://starsignal.co/quiz.html?ref=john_123
```

The `ref` parameter is carried through the entire funnel and used for:
- Fetching the correct Meta Pixel ID
- Attributing conversions to the right affiliate
- Recording data in EarnHive's attribution system

## Event Data Sent to Bridge

### Lead Event (On Quiz Completion)

```json
{
  "event": "Lead",
  "email": "user@example.com",
  "firstName": "Jane",
  "customData": {
    "lifeArea": "love|money|purpose|spiritual",
    "relationshipStatus": "single|relationship|heartbreak|complicated",
    "birthMonth": "03"
  },
  "sessionId": "ss_1704067200000_abc123xyz",
  "affiliate": "ewandvs",
  "product": "starsignal"
}
```

### Purchase Event (On Checkout Completion)

```json
{
  "event": "Purchase",
  "value": 19,
  "currency": "USD",
  "email": "user@example.com",
  "firstName": "Jane",
  "contentName": "Cosmic Blueprint",
  "sessionId": "ss_1704067200000_abc123xyz",
  "affiliate": "ewandvs",
  "product": "starsignal",
  "customData": {
    "orderId": "ss_1704067200000"
  }
}
```

## Environment Variables (if needed)

Currently, no env vars are required. Affiliate `ref` is passed via URL parameter.

If you want to hardcode a pixel ID or override the bridge endpoint, you can modify `tracking.js`:

```javascript
const BRIDGE_DOMAIN = 'https://app.earnhive.com'; // Change if needed
const PRODUCT_ID = 'starsignal'; // Used in all events
```

## Stripe Configuration

### Current Status: Placeholder

The checkout.html currently has a placeholder Stripe key:
```javascript
const stripe = Stripe('pk_test_YOUR_STRIPE_KEY');
```

**Before going live, update:**

1. Get your **Publishable Key** from Stripe Dashboard
2. Replace `pk_test_YOUR_STRIPE_KEY` in checkout.html
3. Create a backend endpoint to handle payment creation (or use Stripe Checkout)

### Recommended: Use Stripe Hosted Checkout

Instead of building custom payment form, use Stripe's Checkout:

1. Create a payment intent on your backend
2. Redirect to `https://checkout.stripe.com/pay/[session_id]`
3. After success, redirect to thank-you.html

This is simpler and more secure than the custom form approach.

## Monitoring & Testing

### Test Checklist

- [ ] Landing page loads at starsignal.co
- [ ] Quiz tracks Lead event in Meta Ads Manager
- [ ] Results page personalizes based on quiz answers
- [ ] Checkout form submits (test Stripe key set)
- [ ] Thank you page displays correctly
- [ ] Browser console has no tracking.js errors
- [ ] Affiliate tracking works: `?ref=ewandvs`

### Debugging Tracking

1. Open browser DevTools → Network tab
2. Submit quiz → look for POST request to `app.earnhive.com/api/track`
3. Verify response status is 200
4. Check Meta Ads Manager → Events for pixel firing

### Common Issues

| Issue | Solution |
|-------|----------|
| Tracking requests fail | Check `BRIDGE_DOMAIN` in tracking.js, verify CORS enabled on bridge |
| Pixel not firing | Ensure `pixel_id` is returned from bridge, check fbq initialization |
| Stripe errors | Verify publishable key is correct, check Stripe dashboard for test mode |
| Results page blank | Check browser console for JavaScript errors, verify URL params passed correctly |

## Maintenance

### Update Pricing

Edit `checkout.html`:
- Change `$19` to new price in multiple places:
  - Order summary
  - Button text
  - CTA section on results.html

### Update Testimonials

Edit `results.html` and `index.html`:
- Replace testimonial cards
- Update avatar background gradients
- Ensure diverse representation

### Add New Quiz Questions

Edit `quiz.html`:
- Add to `QUESTIONS` array
- Update `quizData` object
- Pass new params to results.html in `submitQuiz()`

### Modify Results Content

Edit `results.html`:
- Update revelation cards
- Add/remove value stack items
- Adjust segmented content for Q6 variants

## Security Notes

⚠️ **Important:**

1. **Stripe Keys:** Use test keys during development, live keys for production
2. **CORS:** Bridge must allow requests from starsignal.co
3. **Email:** Store hashed in database, never log plaintext
4. **Data:** Do NOT store full credit card data (PCI compliance)
5. **Privacy:** Include privacy policy and terms at footer

## Support

- **Tracking Issues:** Check EarnHive Bridge logs
- **Stripe Issues:** Stripe Dashboard → Developers → Logs
- **Deployment Issues:** Vercel Dashboard → Deployments
- **Domain Issues:** Check Vercel DNS settings

---

**Last Updated:** 2026-04-24
**Deployed:** starsignal.co
