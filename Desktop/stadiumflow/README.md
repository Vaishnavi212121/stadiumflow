# 🏟️ StadiumFlow — AI-Powered Smart Venue Navigator

> **Google Prompt Wars Hackathon — Smart Urban Mobility Vertical**
> Built with Google Gemini AI · Google Maps Platform · Firebase · Next.js 14

[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20AI-blue)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Google-Firebase-orange)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Google-Maps-green)](https://developers.google.com/maps)
[![Cloud Run](https://img.shields.io/badge/Google-Cloud%20Run-lightblue)](https://cloud.google.com/run)

---

## 📌 Chosen Vertical
**Smart Stadium & Venue Assistant** — helping sports fans navigate large venues intelligently using real-time AI reasoning, Google Maps, and Firebase cloud storage.

---

## 🧠 Approach & Logic

StadiumFlow acts as a personal venue concierge. When a fan selects a stadium:

1. **Google Maps Places API** geocodes the venue name → renders an interactive map
2. **Crowd density zones** overlaid as color-coded circles (Red/Orange/Green per gate)
3. **Google Gemini 1.5 Flash** generates structured guidance covering:
   - Real-time crowd density predictions
   - Best entry gates by current time
   - Food, beverage & restroom queue estimates
   - Travel directions from the user's origin city
   - Parking zones and drop-off advice
   - Stadium-specific fan tips
4. **Firebase Firestore** logs each venue search for analytics & trending data
5. **Live AI chat** — fans ask follow-up questions with full context retention

### Decision Logic
- With **origin city** → Gemini generates travel-specific advice (trains, distance, timing)
- Without origin → focuses on in-venue navigation
- Firebase only writes when configured — app degrades gracefully without it

---

## 🔧 How It Works

```
User searches venue
      ↓
Google Maps Places API → geocode + render map + crowd circles
      ↓
Firebase Firestore → log search analytics
      ↓
Gemini AI API → generate structured venue guide (6 sections)
      ↓
Render as accessible cards in UI
      ↓
User asks follow-up → Gemini responds with context
```

---

## 🗺️ Google Services Used

| Service | Integration |
|---|---|
| **Google Gemini AI 1.5 Flash** | All AI insights, crowd advice, travel guidance, chat |
| **Google Maps JavaScript API** | Interactive venue map with markers |
| **Google Maps Places API** | Geocodes stadium names to coordinates |
| **Firebase Firestore** | Stores venue search analytics (Google Storage) |
| **Google Analytics (GA4)** | Page view and event tracking |
| **Google Cloud Run** | Production deployment |

---

## ♿ Accessibility Features (WCAG 2.1)

- Skip-to-content link for keyboard users
- All interactive elements have `aria-label` attributes
- `role="banner"`, `role="main"`, `role="contentinfo"`, `role="navigation"` landmarks
- `aria-live` regions for dynamic content announcements
- `aria-busy` on loading states
- `role="feed"` for AI insight cards
- `role="log"` for chat conversation
- `role="status"` for screen reader announcements
- Form labels linked via `htmlFor`/`id`
- `aria-required` and `aria-invalid` on form inputs
- `aria-pressed` state on quick-select buttons
- Keyboard navigable — full Tab/Enter support
- Focus management after actions
- Color contrast compliant text
- Text alternatives for all emoji/icons

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

**Test coverage:**
- `venues.test.ts` — 12 tests: parseVenueSearchInput, getVenueInfo, data integrity
- `api.test.ts` — 9 tests: input validation, response structure, env config
- `integration.test.ts` — 10 tests: end-to-end flows, Firebase, accessibility

---

## ⚙️ Local Setup

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/stadiumflow.git
cd stadiumflow
npm install
```

### 2. Environment variables
Create `.env.local`:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Optional — enables Firebase analytics
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional — enables Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🚀 Deploy to Google Cloud Run

```bash
gcloud run deploy stadiumflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="KEY",NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="KEY",GOOGLE_MAPS_API_KEY="KEY"
```

---

## 📁 Project Structure

```
stadiumflow/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home — venue search (fully accessible)
│   │   ├── layout.tsx            # Root layout with GA4 + skip links
│   │   ├── globals.css
│   │   ├── map/page.tsx          # Map + AI insights + chat
│   │   └── api/ai/route.ts       # Gemini AI API route
│   └── lib/
│       ├── gemini.ts             # Gemini AI client
│       ├── venues.ts             # Venue data & parsing
│       ├── firebase.ts           # Firebase configuration
│       └── analytics.ts          # Firestore search logging
├── __tests__/
│   ├── venues.test.ts            # 12 unit tests
│   ├── api.test.ts               # 9 validation tests
│   └── integration.test.ts       # 10 integration tests
├── Dockerfile
└── package.json
```

---

## 💡 Assumptions
- Crowd density zones are AI-simulated (no public live crowd API exists for Indian stadiums)
- Firebase is optional — app fully works without it
- Google Analytics requires a GA4 Measurement ID environment variable

## 🔐 Security
- All API keys in environment variables only
- `.env.local` excluded via `.gitignore`
- Gemini key is server-side only (in API route)
- Firebase client config uses restricted public keys only
