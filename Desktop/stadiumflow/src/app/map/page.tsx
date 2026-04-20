'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { logVenueSearch } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, CloudRain, Users, Train, Send, Sparkles } from 'lucide-react';
import { lookupVenue } from '@/lib/venues';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  id: string;
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <Sparkles className="text-blue-400" />
        </div>
        <p className="text-gray-400 animate-pulse font-medium">Initializing Intelligence...</p>
      </div>
    </div>
  );
}

// Typewriter effect for AI messages
function TypewriterMessage({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{displayedText}</ReactMarkdown></div>;
}

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const venue = searchParams.get('venue') || 'Wankhede Stadium';
  const origin = searchParams.get('origin') || '';

  const mapRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [contextData, setContextData] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus chat input on load
  useEffect(() => {
    if (mapLoaded) {
      chatInputRef.current?.focus();
    }
  }, [mapLoaded]);

  // Simulated live metrics
  const [metrics] = useState({
    weather: '72°F, Clear',
    crowd: '84%',
    transit: 'Normal (No Delays)'
  });

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

        const map = new Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: darkMapStyle,
        });

        // Helper to place marker and crowd zones at a given location
        const placeMarkerAndZones = (lat: number, lng: number, zoomLevel: number) => {
          const pos = { lat, lng };
          map.setCenter(pos);
          map.setZoom(zoomLevel);

          new google.maps.Marker({
            position: pos,
            map,
            title: venue,
          });

          // Crowd density circles
          const crowdZones = [
            { offset: { lat: 0.001, lng: 0.001 }, color: '#EF4444' },
            { offset: { lat: -0.001, lng: 0.002 }, color: '#F97316' },
            { offset: { lat: 0.002, lng: -0.001 }, color: '#22C55E' },
          ];

          crowdZones.forEach(zone => {
            new google.maps.Circle({
              map,
              center: { lat: lat + zone.offset.lat, lng: lng + zone.offset.lng },
              radius: 60,
              fillColor: zone.color,
              fillOpacity: 0.3,
              strokeColor: zone.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
            });
          });
        };
        
        // Directions Service
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // We have our own marker
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          }
        });

        const calculateRoute = (start: string, end: { lat: number, lng: number }) => {
          directionsService.route(
            {
              origin: start,
              destination: end,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
                // If it's a long distance, zoom out a bit to show both
                const bounds = result.routes[0].bounds;
                map.fitBounds(bounds);
              }
            }
          );
        };

        // 1. Try hardcoded venue lookup first (instant, no API needed)
        const knownVenue = lookupVenue(venue);
        if (knownVenue) {
          placeMarkerAndZones(knownVenue.lat, knownVenue.lng, knownVenue.zoom || 17);
          if (origin) {
            calculateRoute(origin, { lat: knownVenue.lat, lng: knownVenue.lng });
          }
          setMapLoaded(true);
          return;
        }

        // 2. Fallback: use Places API textSearch
        try {
          const { PlacesService } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
          const service = new PlacesService(map);
          service.textSearch({ query: venue }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
              const loc = results[0].geometry?.location;
              if (loc) {
                const pos = { lat: loc.lat(), lng: loc.lng() };
                placeMarkerAndZones(pos.lat, pos.lng, 17);
                if (origin) {
                  calculateRoute(origin, pos);
                }
              }
            }
            setMapLoaded(true);
          });
        } catch {
          // Places API not available, map stays at default center
          setMapLoaded(true);
        }
      } catch {
        setMapError(true);
        setMapLoaded(true);
      }
    }).catch(() => {
      setMapError(true);
      setMapLoaded(true);
    });
  }, [venue, apiKey]);

  // Initial AI load
  useEffect(() => {
    const fetchInitialInsights = async () => {
      setChatLoading(true);
      try {
        const prompt = origin 
          ? `Provide a concise, 3-paragraph executive summary for attending ${venue} coming from ${origin}. Focus on crowd status, best gates, and travel tips.` 
          : `Provide a concise, 3-paragraph executive summary for attending ${venue}. Focus on crowd status, best gates, and general tips.`;
          
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        
        if (data.ai) {
          setChatHistory([{ role: 'ai', text: data.ai, id: 'initial' }]);
          setContextData(data.ai);
          logVenueSearch(venue, origin);
        }
      } catch (err) {
        setChatHistory([{ role: 'ai', text: "Systems offline. Couldn't fetch venue intelligence.", id: 'initial-error' }]);
      }
      setChatLoading(false);
    };

    fetchInitialInsights();
  }, [venue, origin]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    const msgId = Date.now().toString();
    setChatInput('');
    setChatLoading(true);
    setChatHistory(h => [...h, { role: 'user', text: userMsg, id: msgId }]);

    try {
      const context = `Venue: ${venue}. Context: ${contextData.slice(0, 500)}`;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, context }),
      });
      const data = await res.json();
      
      setChatHistory(h => [...h, { role: 'ai', text: data.ai || 'Error processing request.', id: msgId + '-ai' }]);
    } catch (err) {
      setChatHistory(h => [...h, { role: 'ai', text: 'Network connection lost.', id: msgId + '-err' }]);
    }
    
    setChatLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      
      {/* Header */}
      <header className="glassmorphism z-20 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            aria-label="Go back to homepage"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-400 hover:text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              {venue}
            </h1>
            {origin && <p className="text-xs text-gray-500">Routing from {origin}</p>}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden lg:flex-row flex-col relative">
        
        {/* Map Area */}
        <div className="flex-1 relative h-[50vh] lg:h-auto" role="region" aria-label="Interactive stadium map">
          <div ref={mapRef} className="w-full h-full" aria-label="Google Maps view of the venue" />
          
          {/* Live Metrics Floating Panels */}
          <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none z-10 hidden sm:flex">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glassmorphism px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full"><CloudRain size={16} className="text-blue-400" /></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Weather</p><p className="font-bold text-sm">{metrics.weather}</p></div>
            </motion.div>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glassmorphism px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-full"><Users size={16} className="text-purple-400" /></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Density</p><p className="font-bold text-sm">{metrics.crowd}</p></div>
            </motion.div>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="glassmorphism px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full"><Train size={16} className="text-green-400" /></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Transit</p><p className="font-bold text-sm">{metrics.transit}</p></div>
            </motion.div>
          </div>

          {!mapLoaded && (
            <div className="absolute inset-0 bg-[#09090b] flex items-center justify-center z-20">
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* AI Chat Area */}
        <aside className="w-full lg:w-[450px] flex flex-col border-l border-white/5 bg-[#09090b]/80 backdrop-blur-xl z-20 shadow-2xl relative" aria-label="AI Chat Assistant">
          
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            <h2 className="font-bold text-sm tracking-widest uppercase text-gray-300">Gemini Intelligence</h2>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth" role="log" aria-live="polite" aria-label="AI chat messages">
            <AnimatePresence>
              {chatHistory.map((msg, idx) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider px-1">
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.role === 'ai' && idx === chatHistory.length - 1 ? (
                      <TypewriterMessage text={msg.text} />
                    ) : msg.role === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {chatLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-purple-500/20 rounded-md">
                    <Sparkles size={12} className="text-purple-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gemini Intelligence</span>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-[11px] text-blue-300 italic animate-pulse">Gemini is analyzing gate congestion & live metrics...</p>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            {/* Quick Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar" role="group" aria-label="Suggested questions">
              {['Best entry gate?', 'Wait times?', 'Transit options', 'Parking status'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => { setChatInput(suggestion); chatInputRef.current?.focus(); }}
                  className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-blue-500/20 border border-white/10 rounded-full text-xs text-gray-400 hover:text-blue-300 transition-all active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleChat} className="relative flex items-center">
              <input
                id="chat-input"
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Gemini about the venue..."
                aria-label="Type a question for the AI assistant"
                disabled={chatLoading}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                aria-label="Send message to AI assistant"
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-700 transition-all active:scale-90"
              >
                <Send size={16} className={chatLoading ? 'animate-pulse' : ''} />
              </button>
            </form>
          </div>
        </aside>
      </div>
      <footer className="z-20 py-2 text-center text-gray-600 text-xs border-t border-white/5 bg-[#09090b]">
        <p>StadiumFlow — Built with Gemini AI &amp; Google Maps</p>
      </footer>
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
