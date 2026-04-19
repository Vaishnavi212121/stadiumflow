export interface VenueInfo {
  name: string;
  lat: number;
  lng: number;
  city: string;
  capacity: number;
  sport: string;
}

export const KNOWN_VENUES: Record<string, VenueInfo> = {
  'wankhede stadium': {
    name: 'Wankhede Stadium',
    lat: 18.9388,
    lng: 72.8258,
    city: 'Mumbai',
    capacity: 33108,
    sport: 'Cricket',
  },
  'eden gardens': {
    name: 'Eden Gardens',
    lat: 22.5645,
    lng: 88.3433,
    city: 'Kolkata',
    capacity: 66000,
    sport: 'Cricket',
  },
  'salt lake stadium': {
    name: 'Salt Lake Stadium',
    lat: 22.5785,
    lng: 88.4017,
    city: 'Kolkata',
    capacity: 85000,
    sport: 'Football',
  },
  'narendra modi stadium': {
    name: 'Narendra Modi Stadium',
    lat: 23.0902,
    lng: 72.0697,
    city: 'Ahmedabad',
    capacity: 132000,
    sport: 'Cricket',
  },
  'old trafford': {
    name: 'Old Trafford',
    lat: 53.4631,
    lng: -2.2913,
    city: 'Manchester',
    capacity: 74310,
    sport: 'Football',
  },
};

export interface ParsedVenueInput {
  venue: string;
  origin: string;
}

/**
 * Parses input like "Eden Gardens from Kolhapur" into
 * { venue: "Eden Gardens", origin: "Kolhapur" }
 */
export function parseVenueSearchInput(input: string): ParsedVenueInput {
  const fromMatch = input.match(/^(.+?)\s+from\s+(.+)$/i);
  if (fromMatch) {
    return {
      venue: fromMatch[1].trim(),
      origin: fromMatch[2].trim(),
    };
  }
  return { venue: input.trim(), origin: '' };
}

export function getVenueInfo(venueName: string): VenueInfo | null {
  const key = venueName.toLowerCase().trim();
  return KNOWN_VENUES[key] ?? null;
}
