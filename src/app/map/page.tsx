'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';

interface AISection {
  title: string;
  content: string;
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const venue = searchParams.get('venue') || 'Wankhede Stadium';
  const origin = searchParams.get('origin') || '';

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [sections, setSections] = useState<AISection[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  // Load Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(async () => {
      if (!mapRef.current) return;
      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
      const { PlacesService } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      const map = new Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
      });

      // Search for venue using Places
      const request: google.maps.places.TextSearchRequest = { query: venue };
      const service = new PlacesService(map);
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          const loc = place.geometry?.location;
          if (loc) {
            map.setCenter(loc);
            map.setZoom(16);
            new google.maps.Marker({
              map,
              position: loc,
              title: venue,
              animation: google.maps.Animation.DROP,
            });

            // Add heatmap-style crowd indicator circles
            const crowdSpots = [
              { lat: loc.lat() + 0.001, lng: loc.lng() + 0.001, label: '🔴 High Crowd - Gate A' },
              { lat: loc.lat() - 0.001, lng: loc.lng() + 0.002, label: '🟡 Medium Crowd - Gate B' },
              { lat: loc.lat() + 0.002, lng: loc.lng() - 0.001, label: '🟢 Low Crowd - Gate C' },
            ];

            crowdSpots.forEach(spot => {
              new google.maps.Circle({
                map,
                center: { lat: spot.lat, lng: spot.lng },
                radius: 80,
                fillColor: spot.label.includes('High') ? '#FF4444' : spot.label.includes('Medium') ? '#FFA500' : '#44BB44',
                fillOpacity: 0.5,
                strokeWeight: 0,
              });
            });
          }
        }
      });
      setMapLoaded(true);
    }).catch(console.error);
  }, [venue]);

  // Fetch AI insights
  const fetchAI = useCallback(async (promptText: string, context?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, context: context || '' }),
      });
      const data = await res.json();
      return data.ai as string;
    } catch {
      return 'Failed to get AI response. Please try again.';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const prompt = origin
      ? `Give me complete stadium guide for ${venue}. I am travelling from ${origin}. Include: crowd status, best entry gates, queue wait times, travel advice from ${origin}, parking tips, and must-know fan tips.`
      : `Give me a complete stadium guide for ${venue}. Include: crowd density status, recommended entry gates, food & beverage queue times, restroom availability, parking zones, and top fan tips.`;

    fetchAI(prompt).then(response => {
      setAiResponse(response);
      // Parse sections from the response
      const parsed = parseAISections(response);
      setSections(parsed);
    });
  }, [venue, origin, fetchAI]);

  function parseAISections(text: string): AISection[] {
    const lines = text.split('\n');
    const result: AISection[] = [];
    let current: AISection | null = null;
    for (const line of lines) {
      const heading = line.match(/^#{1,3}\s+(.+)/);
      const bold = line.match(/^\*\*(.+?)\*\*/);
      if (heading || bold) {
        if (current) result.push(current);
        current = { title: (heading?.[1] || bold?.[1] || '').replace(/\*/g, ''), content: '' };
      } else if (current) {
        current.content += line + '\n';
      } else if (line.trim()) {
        current = { title: '📋 Overview', content: line + '\n' };
      }
    }
    if (current) result.push(current);
    return result.filter(s => s.content.trim());
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    const context = `Venue: ${venue}. ${origin ? `User is from ${origin}.` : ''} Previous context: ${aiResponse.slice(0, 300)}`;
    const response = await fetchAI(userMsg, context);
    setChatHistory(h => [...h, { role: 'ai', text: response }]);
  }

  const sectionIcons: Record<string, string> = {
    crowd: '👥', gate: '🚪', queue: '⏱️', travel: '🚂', parking: '🅿️',
    food: '🍕', restroom: '🚻', tip: '💡', transport: '🚌', entry: '🎟️',
  };

  function getSectionIcon(title: string): string {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(sectionIcons)) {
      if (lower.includes(key)) return icon;
    }
    return '📌';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold">🏟️ {venue}</h1>
          {origin && <p className="text-sm text-blue-400">Travelling from {origin}</p>}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Map */}
        <div className="lg:w-1/2 h-64 lg:h-auto relative">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <p className="text-gray-400 animate-pulse">Loading map…</p>
            </div>
          )}
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-xs space-y-1">
            <p>🔴 High crowd zone</p>
            <p>🟡 Medium crowd zone</p>
            <p>🟢 Low crowd zone</p>
          </div>
        </div>

        {/* AI Panel */}
        <div className="lg:w-1/2 flex flex-col overflow-hidden">
          {/* AI Insights */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h2 className="text-lg font-bold text-blue-400">🤖 AI Venue Insights</h2>
            {loading && sections.length === 0 ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-600 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : sections.length > 0 ? (
              sections.map((s, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-yellow-400 mb-2">{getSectionIcon(s.title)} {s.title}</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{s.content.trim()}</p>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}

            {/* Chat history */}
            {chatHistory.length > 0 && (
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-400">Chat</h3>
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-900 text-right ml-8' : 'bg-gray-800 mr-8'}`}>
                    <span className="text-xs text-gray-400">{msg.role === 'user' ? 'You' : '🤖 AI'}</span>
                    <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat input */}
          <form onSubmit={handleChat} className="p-4 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask anything about this venue…"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
