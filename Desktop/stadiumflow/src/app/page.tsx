'use client';
import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search, MapPin, Users, Clock, Train, Sparkles, Navigation, ChevronRight, LocateFixed } from 'lucide-react';
import Image from 'next/image';
import { logVenueSearch } from '@/lib/analytics';

const TRENDING_VENUES = [
  { id: 'wankhede', label: 'Wankhede Stadium', city: 'Mumbai', image: '/images/stadiums/night_glow.png' },
  { id: 'eden', label: 'Eden Gardens', city: 'Kolkata', image: '/images/stadiums/sunset_glass.png' },
];

export default function Home() {
  const [venue, setVenue] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const venueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    venueInputRef.current?.focus();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin(`${latitude}, ${longitude}`);
      },
      () => {
        alert("Unable to retrieve your exact location. Please ensure location permissions are granted.");
      }
    );
  };

  const startVoiceSearch = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVenue(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const searchVenue = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError('');

    if (!venue.trim()) {
      setError('Please enter a stadium or venue name.');
      venueInputRef.current?.focus();
      return;
    }

    const venueName = venue;
    await logVenueSearch(venueName, origin);

    const originQuery = origin ? `&origin=${encodeURIComponent(origin)}` : '';
    router.push(`/map?venue=${encodeURIComponent(venueName)}${originQuery}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative selection:bg-blue-500/30">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <nav className="relative z-20 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
          <span className="font-bold tracking-tight text-xl">StadiumFlow</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Safety</a>
          <a href="#" className="hover:text-white transition-colors">Logistics</a>
          <a href="#" className="hover:text-white transition-colors">AI Routing</a>
        </div>
      </nav>

      <main id="main-content" className="relative z-10 flex flex-col items-center min-h-screen px-6 py-12 md:py-20 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center w-full max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphism text-blue-400 text-sm font-medium mb-6">
            <Sparkles size={16} className="animate-pulse" />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Navigate the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-glow">Chaos</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Experience next-generation stadium intelligence. Real-time crowd density, queue times, and AI-powered travel optimization.
          </p>
        </motion.header>

        {/* Main Search Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-xl mb-20"
        >
          <div className="glassmorphism p-6 md:p-8 rounded-3xl relative bg-glow">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"
                >
                  <span>⚠️</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={searchVenue} className="space-y-5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  ref={venueInputRef}
                  type="text"
                  placeholder="Where are you heading? (e.g., Old Trafford)"
                  aria-label="Search for a stadium or venue"
                  value={venue}
                  onChange={(e) => { setVenue(e.target.value); setError(''); }}
                  className="w-full bg-white/5 border border-white/10 text-white px-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500 text-lg"
                />
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  aria-label="Search by voice"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                  title="Search by voice"
                >
                  <Mic size={20} />
                </button>
              </div>

              <div className="relative group flex gap-2">
                <div className="relative flex-1">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Your starting city (Optional)"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white px-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-gray-500 text-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={getUserLocation}
                  aria-label="Use current location"
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group-focus-within:border-purple-500/50"
                  title="Use exact current location"
                >
                  <LocateFixed size={20} />
                </button>
              </div>

              <button
                type="submit"
                aria-label="Start stadium analysis"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Launch Intelligence <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Trending Venues & Features Layout */}
        <div className="w-full grid md:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Trending Carousel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-6 text-gray-200 flex items-center gap-2">
              <MapPin className="text-blue-400" /> Trending Venues
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRENDING_VENUES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVenue(v.label); searchVenue(); }}
                  aria-label={`Navigate to ${v.label} in ${v.city}`}
                  role="button"
                  className="group relative h-40 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#09090b] text-left"
                >
                  <Image 
                    src={v.image} 
                    alt={`${v.label} stadium in ${v.city}`} 
                    fill 
                    priority 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm text-gray-300 mb-1">{v.city}</p>
                    <p className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">{v.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: <Users size={24} className="text-blue-400" />, title: 'Crowd Heatmaps', desc: 'Real-time density' },
              { icon: <Clock size={24} className="text-purple-400" />, title: 'Wait Times', desc: 'Gates & concessions' },
              { icon: <Train size={24} className="text-green-400" />, title: 'Transit Sync', desc: 'Live travel data' },
              { icon: <Sparkles size={24} className="text-yellow-400" />, title: 'AI Assistant', desc: 'Gemini insights' },
            ].map((feature, i) => (
              <div key={i} className="glassmorphism p-5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="mb-3 p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-200 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-gray-500 text-sm border-t border-white/5 mt-12">
        <p>© {new Date().getFullYear()} StadiumFlow — Built with <span className="text-purple-400 font-medium">Gemini AI</span> &amp; Google Maps</p>
      </footer>
    </div>
  );
}
