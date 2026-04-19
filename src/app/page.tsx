'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseVenueSearchInput } from '@/lib/venues';

export default function Home() {
  const [venue, setVenue] = useState('');
  const [origin, setOrigin] = useState('');
  const router = useRouter();

  const searchVenue = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseVenueSearchInput(venue);
    const venueName = parsed.venue || venue || 'Wankhede Stadium';
    const originValue = origin || parsed.origin || '';
    const originQuery = originValue ? `&origin=${encodeURIComponent(originValue)}` : '';
    router.push(`/map?venue=${encodeURIComponent(venueName)}${originQuery}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-8 text-white">
      <h1 className="text-5xl font-bold mb-8">🏟️ StadiumFlow</h1>
      <p className="text-xl mb-12 max-w-md text-center">AI assistant for seamless stadium navigation, queues & crowds.</p>
      <form onSubmit={searchVenue} className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="e.g., Eden Gardens or Wankhede Stadium"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full p-4 rounded-lg text-black text-lg"
          required
        />
        <input
          type="text"
          placeholder="Optional: origin (e.g., Kolhapur)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full p-4 rounded-lg text-black text-lg"
        />
        <button type="submit" className="w-full bg-green-500 p-4 rounded-lg text-xl font-bold hover:bg-green-600">
          Search Venue
        </button>
      </form>
      <div className="mt-8 space-x-4 flex flex-wrap gap-2">
        <button onClick={() => setVenue('Wankhede Stadium')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Wankhede</button>
        <button onClick={() => setVenue('Eden Gardens')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Eden Gardens</button>
        <button onClick={() => setVenue('Salt Lake Stadium')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Salt Lake</button>
        <button onClick={() => setVenue('Narendra Modi Stadium')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Narendra Modi</button>
        <button onClick={() => setVenue('Old Trafford')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Old Trafford</button>
        <button onClick={() => setVenue('Eden Gardens from Kolhapur')} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">Eden from Kolhapur</button>
      </div>
    </main>
  );
}