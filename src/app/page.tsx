'use client';
import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseVenueSearchInput } from '@/lib/venues';
import { logVenueSearch } from '@/lib/analytics';

const QUICK_VENUES = [
  { label: 'Wankhede', value: 'Wankhede Stadium', city: 'Mumbai', img: 'Aerial view of Wankhede Stadium in Mumbai' },
  { label: 'Eden Gardens', value: 'Eden Gardens', city: 'Kolkata', img: 'Aerial view of Eden Gardens cricket stadium in Kolkata' },
  { label: 'Salt Lake', value: 'Salt Lake Stadium', city: 'Kolkata', img: 'Aerial view of Salt Lake Stadium football ground in Kolkata' },
  { label: 'Narendra Modi', value: 'Narendra Modi Stadium', city: 'Ahmedabad', img: 'Aerial view of Narendra Modi Stadium in Ahmedabad' },
  { label: 'Old Trafford', value: 'Old Trafford', city: 'Manchester', img: 'Aerial view of Old Trafford football stadium in Manchester' },
  { label: 'Eden from Kolhapur', value: 'Eden Gardens from Kolhapur', city: 'Kolkata', img: 'Eden Gardens stadium with travel route from Kolhapur' },
];

export default function Home() {
  const [venue, setVenue] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const venueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    venueInputRef.current?.focus();
  }, []);

  const searchVenue = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!venue.trim()) {
      setError('Please enter a stadium or venue name.');
      venueInputRef.current?.focus();
      return;
    }
    const parsed = parseVenueSearchInput(venue);
    const venueName = parsed.venue || venue || 'Wankhede Stadium';
    const originValue = origin || parsed.origin || '';
    await logVenueSearch(venueName, originValue);
    const originQuery = originValue ? `&origin=${encodeURIComponent(originValue)}` : '';
    router.push(`/map?venue=${encodeURIComponent(venueName)}${originQuery}`);
  };

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex flex-col">
      <nav aria-label="Main Navigation" className="w-full text-center py-6">
        <img
          src="/favicon.ico"
          alt="StadiumFlow official logo - a stylized stadium icon representing smart venue intelligence and fan safety"
          className="w-12 h-12 mx-auto mb-4"
          width={48}
          height={48}
        />
      </nav>

      <section id="hero" className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-white w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            StadiumFlow
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-md mx-auto leading-relaxed">
            AI-powered stadium navigation — crowd density, queue times &amp; travel advice.
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Powered by <span className="font-semibold">Google Gemini 1.5 Flash</span> &amp; <span className="font-semibold">Google Maps</span>
          </p>
        </div>

        <section aria-labelledby="search-heading" className="w-full max-w-md">
          <h2 id="search-heading" className="sr-only">Search for a Stadium</h2>

          <form
            onSubmit={searchVenue}
            noValidate
            aria-describedby={error ? 'form-error' : undefined}
            className="space-y-4"
            role="search"
          >
            {error && (
              <div
                id="form-error"
                role="alert"
                aria-live="assertive"
                className="bg-red-500 bg-opacity-90 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span aria-hidden="true">⚠️</span>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="venue-input" className="block text-sm font-medium text-blue-100 mb-2">
                Stadium or Venue Name <span aria-label="required" className="text-yellow-300">*</span>
              </label>
              <input
                ref={venueInputRef}
                id="venue-input"
                type="text"
                name="venue"
                placeholder="e.g., Eden Gardens, Wankhede Stadium"
                value={venue}
                onChange={(e) => { setVenue(e.target.value); setError(''); }}
                className="w-full p-4 rounded-xl text-gray-900 text-base placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 shadow-lg"
                required
                aria-required="true"
                aria-label="Enter stadium name to search for venue insights"
                aria-invalid={!!error}
                aria-describedby={error ? 'form-error' : 'venue-hint'}
                autoComplete="off"
              />
              <p id="venue-hint" className="text-xs text-blue-200 mt-1 ml-1">
                Enter any stadium name worldwide
              </p>
            </div>

            <div>
              <label htmlFor="origin-input" className="block text-sm font-medium text-blue-100 mb-2">
                Your City <span className="text-blue-300 font-normal">(optional — for travel advice)</span>
              </label>
              <input
                id="origin-input"
                type="text"
                name="origin"
                placeholder="e.g., Kolhapur, Pune, Mumbai"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-4 rounded-xl text-gray-900 text-base placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 shadow-lg"
                aria-label="Enter your origin city for personalised travel directions to the venue"
                aria-describedby="origin-hint"
                autoComplete="off"
              />
              <p id="origin-hint" className="text-xs text-blue-200 mt-1 ml-1">
                Get personalised travel directions to the venue
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white p-4 rounded-xl text-lg font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 shadow-lg flex items-center justify-center gap-2"
              aria-label="Generate stadium insights with Gemini AI — search for venue"
            >
              <span aria-hidden="true">🔍</span>
              Search Venue
            </button>
          </form>
        </section>

        <nav aria-label="Quick venue selection — popular stadiums" className="mt-8 w-full max-w-md">
          <p className="text-sm text-blue-200 text-center mb-3 font-medium" id="quick-select-label">
            Or pick a popular venue:
          </p>
          <ul role="list" className="flex flex-wrap gap-2 justify-center" aria-labelledby="quick-select-label">
            {QUICK_VENUES.map(({ label, value, city, img }) => (
              <li key={value} role="listitem">
                <button
                  type="button"
                  onClick={() => setVenue(value)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  aria-label={`Select ${label} stadium in ${city}. Description: ${img}`}
                  aria-pressed={venue === value}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Key features of StadiumFlow" className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          {[
            { icon: '👥', title: 'Crowd Density', desc: 'Live crowd zones per gate' },
            { icon: '⏱️', title: 'Queue Times', desc: 'Food stalls & entry gates' },
            { icon: '🚂', title: 'Travel Guide', desc: 'Directions from your city' },
            { icon: '🤖', title: 'Gemini AI', desc: 'Smart real-time insights' },
          ].map(({ icon, title, desc }) => (
            <article
              key={title}
              className="bg-white bg-opacity-10 rounded-xl p-3 text-center border border-white border-opacity-20"
              aria-label={`Feature: ${title} — ${desc}`}
            >
              <div aria-hidden="true" className="text-2xl mb-1">{icon}</div>
              <h3 className="text-xs font-bold text-white">{title}</h3>
              <p className="text-xs text-blue-200">{desc}</p>
            </article>
          ))}
        </section>
      </section>

      <footer role="contentinfo" className="text-center py-4 text-blue-200 text-xs">
        <p>StadiumFlow — Built with Google Gemini AI, Google Maps &amp; Firebase</p>
      </footer>
    </main>
  );
}
