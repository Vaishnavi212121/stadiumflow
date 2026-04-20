'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { logVenueSearch } from '@/lib/analytics';
import { KNOWN_VENUES, getVenueInfo } from '@/lib/venues';

interface AISection {
  title: string;
  content: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  id: string;
}

function LoadingFallback() {
  return (
    <div
      className="min-h-screen bg-gray-900 text-white flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading venue information"
    >
      <div className="text-center">
        <div aria-hidden="true" className="text-4xl mb-4 animate-bounce">🏟️</div>
        <p className="text-gray-300 text-lg animate-pulse">Loading venue…</p>
      </div>
    </div>
  );
}

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const venue = searchParams.get('venue') || 'Wankhede Stadium';
  const origin = searchParams.get('origin') || '';

  const mapRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [sections, setSections] = useState<AISection[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((msg: string) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(msg), 50);
  }, []);

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setApiKey(data.googleMapsApiKey || ''))
      .catch(() => setApiKey(''));
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (apiKey === null) return;

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(async () => {
      if (!mapRef.current) return;
      try {
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        const { PlacesService } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

        const venueInfo = getVenueInfo(venue);
        const initialCenter = venueInfo ? { lat: venueInfo.lat, lng: venueInfo.lng } : { lat: 20.5937, lng: 78.9629 };
        const initialZoom = venueInfo ? 16 : 5;

        const map = new Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });

        if (venueInfo) {
          const loc = new google.maps.LatLng(venueInfo.lat, venueInfo.lng);
          placeVenueMarker(map, loc, venue);
          setMapLoaded(true);
          return;
        }

        const service = new PlacesService(map);
        service.textSearch({ query: venue }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
            const loc = results[0].geometry?.location;
            if (loc) {
              map.setCenter(loc);
              map.setZoom(16);
              placeVenueMarker(map, loc, venue);
            }
          }
          setMapLoaded(true);
        });
      } catch {
        setMapError(true);
        setMapLoaded(true);
      }
    }).catch(() => {
      setMapError(true);
      setMapLoaded(true);
    });

    function placeVenueMarker(map: google.maps.Map, loc: google.maps.LatLng, name: string) {
      const marker = new google.maps.Marker({
        map,
        position: loc,
        title: name,
        animation: google.maps.Animation.DROP,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div role="tooltip"><strong>${name}</strong><br/><small>Sports venue</small></div>`,
      });
      marker.addListener('click', () => infoWindow.open(map, marker));

      const crowdZones = [
        { offset: { lat: 0.001, lng: 0.001 }, color: '#EF4444', label: 'Gate A – High Crowd' },
        { offset: { lat: -0.001, lng: 0.002 }, color: '#F97316', label: 'Gate B – Medium Crowd' },
        { offset: { lat: 0.002, lng: -0.001 }, color: '#22C55E', label: 'Gate C – Low Crowd' },
      ];

      crowdZones.forEach(zone => {
        new google.maps.Circle({
          map,
          center: { lat: loc.lat() + zone.offset.lat, lng: loc.lng() + zone.offset.lng },
          radius: 80,
          fillColor: zone.color,
          fillOpacity: 0.5,
          strokeColor: zone.color,
          strokeOpacity: 0.8,
          strokeWeight: 1,
        });
      });

      announce(`Map loaded for ${name}`);
    }
  }, [venue, announce, apiKey]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchAI = useCallback(async (promptText: string, context?: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, context: context || '' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.ai as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return `Sorry, I couldn't get venue information right now. ${msg}`;
    }
  }, []);

  // Initial AI load
  useEffect(() => {
    const prompt = origin
      ? `Give me a complete stadium guide for ${venue}. I am travelling from ${origin}. Include sections on: 1) Crowd Status 2) Best Entry Gates 3) Queue Wait Times 4) Travel Advice from ${origin} 5) Parking Tips 6) Fan Tips`
      : `Give me a complete stadium guide for ${venue}. Include sections on: 1) Crowd Status 2) Best Entry Gates 3) Queue Wait Times 4) Food & Beverages 5) Parking Tips 6) Fan Tips`;

    setLoading(true);
    fetchAI(prompt).then(response => {
      setAiResponse(response);
      setSections(parseAISections(response));
      setLoading(false);
      announce('Venue insights loaded');
      logVenueSearch(venue, origin);
    });
  }, [venue, origin, fetchAI, announce]);

  function parseAISections(text: string): AISection[] {
    const lines = text.split('\n');
    const result: AISection[] = [];
    let current: AISection | null = null;

    for (const line of lines) {
      const heading = line.match(/^#{1,3}\s+(.+)/) || line.match(/^\d+\)\s+(.+)/) || line.match(/^\*\*(.+?)\*\*/);
      if (heading) {
        if (current) result.push(current);
        current = { title: heading[1].replace(/\*/g, '').trim(), content: '' };
      } else if (current) {
        current.content += line + '\n';
      } else if (line.trim()) {
        current = { title: 'Overview', content: line + '\n' };
      }
    }
    if (current) result.push(current);
    return result.filter(s => s.content.trim());
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    const msgId = Date.now().toString();
    setChatInput('');
    setChatLoading(true);
    setChatHistory(h => [...h, { role: 'user', text: userMsg, id: msgId }]);
    announce('Sending question to AI');

    const context = `Venue: ${venue}. ${origin ? `User is travelling from ${origin}.` : ''} Context: ${aiResponse.slice(0, 400)}`;
    const response = await fetchAI(userMsg, context);

    setChatHistory(h => [...h, { role: 'ai', text: response, id: msgId + '-ai' }]);
    setChatLoading(false);
    announce('AI response received');
    chatInputRef.current?.focus();
  }

  const SECTION_ICONS: Record<string, string> = {
    crowd: '👥', gate: '🚪', queue: '⏱️', travel: '🚂', parking: '🅿️',
    food: '🍕', restroom: '🚻', tip: '💡', transport: '🚌', entry: '🎟️',
    fan: '⭐', overview: '📋', beverage: '🥤',
  };

  function getSectionIcon(title: string): string {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(SECTION_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return '📌';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div id="map-content" tabIndex={-1} />
      <header role="banner" className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go back to home page"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate" aria-label={`Stadium: ${venue}`}>
            🏟️ {venue}
          </h1>
          {origin && (
            <p className="text-sm text-blue-400" aria-label={`Travelling from ${origin}`}>
              📍 From {origin}
            </p>
          )}
        </div>
        <div aria-hidden="true" className="text-xs text-gray-500 hidden md:block">
          Powered by Gemini AI
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <section aria-label={`Interactive map of ${venue}`} className="lg:w-1/2 h-64 lg:h-auto relative">
          <div
            ref={mapRef}
            className="w-full h-full"
            role="application"
            aria-label={`Google Maps showing ${venue} with crowd density zones`}
            tabIndex={0}
          />
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center" aria-hidden="true">
              <p className="text-gray-400 animate-pulse">Loading map…</p>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center" role="alert">
              <p className="text-gray-400 text-sm text-center px-4">
                Map unavailable — please check your Maps API key.
              </p>
            </div>
          )}
          <aside className="absolute bottom-4 left-4 bg-black bg-opacity-80 rounded-xl p-3 text-xs space-y-1.5" aria-label="Crowd density legend">
            <p className="font-semibold text-gray-300 mb-1">Crowd Zones</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block flex-shrink-0" aria-hidden="true" />
              <span>Gate A – High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block flex-shrink-0" aria-hidden="true" />
              <span>Gate B – Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block flex-shrink-0" aria-hidden="true" />
              <span>Gate C – Low</span>
            </div>
          </aside>
        </section>
        <section className="lg:w-1/2 flex flex-col overflow-hidden" aria-label="AI venue insights and chat">
          <div className="flex-1 overflow-y-auto p-4 space-y-3" role="feed" aria-label="AI generated venue insights" aria-busy={loading}>
            <h2 className="text-lg font-bold text-blue-400">
              🤖 AI Venue Insights
              {loading && <span className="sr-only">Loading insights…</span>}
            </h2>
            {loading && sections.length === 0 ? (
              <div role="status" aria-label="Loading venue insights" className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse" aria-hidden="true">
                    <div className="h-4 bg-gray-600 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-700 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : sections.length > 0 ? (
              sections.map((s, i) => (
                <article key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors" aria-label={s.title}>
                  <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <span aria-hidden="true">{getSectionIcon(s.title)}</span>
                    {s.title}
                  </h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {s.content.trim()}
                  </p>
                </article>
              ))
            ) : aiResponse ? (
              <article className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
              </article>
            ) : null}
            {chatHistory.length > 0 && (
              <div role="log" aria-label="Chat conversation" aria-live="polite" className="space-y-3 border-t border-gray-700 pt-3">
                <h3 className="text-sm font-semibold text-gray-400">💬 Chat</h3>
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-900 border border-blue-700 ml-8'
                        : 'bg-gray-800 border border-gray-700 mr-8'
                    }`}
                    role="article"
                    aria-label={msg.role === 'user' ? 'Your message' : 'AI response'}
                  >
                    <span className="text-xs text-gray-400 font-medium block mb-1">
                      {msg.role === 'user' ? '👤 You' : '🤖 StadiumFlow AI'}
                    </span>
                    <p className="whitespace-pre-wrap text-gray-200">{msg.text}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-gray-800 border border-gray-700 mr-8 p-3 rounded-xl" role="status" aria-label="AI is thinking">
                    <span className="text-xs text-gray-400 block mb-1">🤖 StadiumFlow AI</span>
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true" />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true" />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true" />
                      <span className="sr-only">AI is thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} tabIndex={-1} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-700 bg-gray-850">
            <form onSubmit={handleChat} className="flex gap-2" aria-label="Ask a question about this venue">
              <label htmlFor="chat-input" className="sr-only">Ask a question about {venue}</label>
              <input
                ref={chatInputRef}
                id="chat-input"
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={`Ask about ${venue}…`}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                aria-label={`Ask a question about ${venue}`}
                disabled={chatLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                aria-label="Send question to AI"
              >
                Ask
              </button>
            </form>
          </div>
        </section>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MapContent />
    </Suspense>
  );
}
