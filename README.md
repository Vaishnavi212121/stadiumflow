# 🏟️ StadiumFlow — AI-Powered Smart Venue Navigator

> **Challenge Vertical: Smart Urban Mobility & Public Venues**
> Built with Google Gemini AI + Google Maps Platform + Next.js

---

## 📌 Chosen Vertical
**Smart Stadium & Venue Assistant** — helping fans navigate large sports venues intelligently using real-time AI reasoning and Google Maps.

---

## 🧠 Approach & Logic

StadiumFlow acts as a personal venue concierge. When a fan selects a stadium and optionally provides their travel origin, the app:

1. **Geocodes the venue** using Google Maps Places API to render an interactive map
2. **Overlays crowd density zones** (Gate A/B/C) as color-coded circles on the map
3. **Calls Google Gemini AI** with a structured prompt to generate contextual guidance covering:
   - Crowd density predictions
   - Best entry gates at current time
   - Food, beverage & restroom queue estimates
   - Travel directions from the user's origin city
   - Parking zones and drop-off advice
   - Fan tips specific to that stadium
4. **Parses the AI response** into clean sections rendered as cards in the UI
5. **Supports live chat** — fans can ask follow-up questions about the venue, and the AI maintains context

### Decision-Making Logic
- If an **origin city** is provided → Gemini generates travel-specific advice (trains, buses, distance, timing)
- If no origin → Gemini focuses entirely on in-venue navigation
- The chat system passes the initial AI response as context to all follow-up questions, enabling coherent multi-turn conversations

---

## 🔧 How the Solution Works

```
User searches venue → Google Maps Places API → Map renders with crowd zones
                                    ↓
                           Gemini AI generates venue insights
                                    ↓
                         Structured cards displayed in UI
                                    ↓
                     User can ask follow-up questions via chat
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Maps | Google Maps JavaScript API + Places API |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Deployment | Docker + Google Cloud Run |

---

## 🗺️ Google Services Used

| Service | How it's used |
|---|---|
| **Google Maps JavaScript API** | Renders the interactive venue map |
| **Google Maps Places API** | Geocodes stadium names to lat/lng coordinates |
| **Google Gemini AI (1.5 Flash)** | Generates all AI insights, crowd advice, and travel guidance |
| **Google Cloud Run** | Production deployment target |

---

## 🏟️ Supported Venues
- Wankhede Stadium (Mumbai)
- Eden Gardens (Kolkata)
- Salt Lake Stadium (Kolkata)
- Narendra Modi Stadium (Ahmedabad)
- Old Trafford (Manchester)
- Any stadium searchable via Google Maps

---

## ⚙️ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/stadiumflow.git
cd stadiumflow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Getting API Keys:**
- Gemini API Key: [Google AI Studio](https://aistudio.google.com/app/apikey)
- Maps API Key: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — enable **Maps JavaScript API** and **Places API**

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment (Google Cloud Run)

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy stadiumflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY,GOOGLE_MAPS_API_KEY=YOUR_KEY
```

See `CLOUD_RUN_DEPLOY.md` for full deployment guide including Docker-based deploy.

---

## 📁 Project Structure

```
stadiumflow/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home — venue search
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── map/
│   │   │   └── page.tsx          # Map + AI insights page
│   │   └── api/
│   │       └── ai/
│   │           └── route.ts      # Gemini AI API route
│   └── lib/
│       ├── gemini.ts             # Gemini AI client
│       └── venues.ts             # Venue data & input parsing
├── public/
│   └── favicon.ico
├── Dockerfile                    # Cloud Run ready
├── CLOUD_RUN_DEPLOY.md           # Deployment guide
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 💡 Assumptions Made

- Crowd density data is simulated (color-coded zones) since live crowd APIs are not publicly available for most Indian stadiums
- Travel time estimates are qualitative (from Gemini reasoning), not real-time transit data
- The app assumes a modern browser with JavaScript enabled
- Google Maps Places API may have usage limits — ensure billing is enabled on your GCP project

---

## 🔮 Planned Improvements
- Real-time crowd data via official venue APIs
- Google Directions API integration for turn-by-turn travel routes
- User authentication (Google Sign-In)
- Push notifications for gate open/close and queue updates
- Multi-language support (Hindi, Marathi, Bengali)
- Accessibility improvements (ARIA labels, screen reader support)

---

## 🔐 Security Notes
- API keys are stored in environment variables, never hardcoded
- `.env.local` is excluded via `.gitignore`
- The Gemini API key is server-side only; Maps key is scoped to allowed domains
