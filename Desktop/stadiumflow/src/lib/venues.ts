// Known venue coordinates for instant, reliable map centering
// This bypasses the need for Places API to be enabled
export interface VenueCoords {
  lat: number;
  lng: number;
  zoom?: number;
}

const KNOWN_VENUES: Record<string, VenueCoords> = {
  // Indian Cricket Stadiums
  'wankhede stadium': { lat: 18.9388, lng: 72.8258, zoom: 17 },
  'eden gardens': { lat: 22.5646, lng: 88.3433, zoom: 17 },
  'chinnaswamy stadium': { lat: 12.9788, lng: 77.5996, zoom: 17 },
  'm chinnaswamy stadium': { lat: 12.9788, lng: 77.5996, zoom: 17 },
  'narendra modi stadium': { lat: 23.0914, lng: 72.5967, zoom: 17 },
  'motera stadium': { lat: 23.0914, lng: 72.5967, zoom: 17 },
  'arun jaitley stadium': { lat: 28.6377, lng: 77.2433, zoom: 17 },
  'feroz shah kotla': { lat: 28.6377, lng: 77.2433, zoom: 17 },
  'ma chidambaram stadium': { lat: 13.0627, lng: 80.2792, zoom: 17 },
  'chepauk stadium': { lat: 13.0627, lng: 80.2792, zoom: 17 },
  'rajiv gandhi international cricket stadium': { lat: 17.4065, lng: 78.5506, zoom: 17 },
  'uppal stadium': { lat: 17.4065, lng: 78.5506, zoom: 17 },
  'maharashtra cricket association stadium': { lat: 18.6773, lng: 73.8738, zoom: 17 },
  'mca stadium pune': { lat: 18.6773, lng: 73.8738, zoom: 17 },
  'mca stadium': { lat: 18.6773, lng: 73.8738, zoom: 17 },
  'is bindra stadium': { lat: 30.6893, lng: 76.7378, zoom: 17 },
  'pca stadium mohali': { lat: 30.6893, lng: 76.7378, zoom: 17 },
  'pca stadium': { lat: 30.6893, lng: 76.7378, zoom: 17 },
  'sawai mansingh stadium': { lat: 26.8931, lng: 75.8054, zoom: 17 },
  'holkar cricket stadium': { lat: 22.7244, lng: 75.8651, zoom: 17 },
  'barabati stadium': { lat: 20.4686, lng: 85.8818, zoom: 17 },
  'greenfield international stadium': { lat: 8.5308, lng: 76.9193, zoom: 17 },
  'saurashtra cricket association stadium': { lat: 22.2724, lng: 70.7708, zoom: 17 },
  'vidarbha cricket association stadium': { lat: 21.1096, lng: 79.0687, zoom: 17 },
  'jsca international stadium complex': { lat: 23.3505, lng: 85.3208, zoom: 17 },
  'ekana cricket stadium': { lat: 26.8469, lng: 80.9404, zoom: 17 },
  'atal bihari vajpayee ekana stadium': { lat: 26.8469, lng: 80.9404, zoom: 17 },
  'himachal pradesh cricket association stadium': { lat: 32.0998, lng: 76.5421, zoom: 17 },
  'dharamsala stadium': { lat: 32.0998, lng: 76.5421, zoom: 17 },
  'aca stadium barsapara': { lat: 26.1188, lng: 91.8017, zoom: 17 },

  // International Stadiums
  'lords cricket ground': { lat: 51.5294, lng: -0.1728, zoom: 17 },
  "lord's": { lat: 51.5294, lng: -0.1728, zoom: 17 },
  'melbourne cricket ground': { lat: -37.8200, lng: 144.9834, zoom: 17 },
  'mcg': { lat: -37.8200, lng: 144.9834, zoom: 17 },
  'sydney cricket ground': { lat: -33.8916, lng: 151.2247, zoom: 17 },
  'scg': { lat: -33.8916, lng: 151.2247, zoom: 17 },
  'the oval': { lat: 51.4838, lng: -0.1147, zoom: 17 },
  'old trafford cricket ground': { lat: 53.4565, lng: -2.2873, zoom: 17 },
  'newlands cricket ground': { lat: -33.9271, lng: 18.4125, zoom: 17 },
  'wanderers stadium': { lat: -26.1384, lng: 28.0584, zoom: 17 },
  'gaddafi stadium': { lat: 31.5139, lng: 74.3356, zoom: 17 },
  'shere bangla stadium': { lat: 23.8105, lng: 90.3625, zoom: 17 },

  // Football / Multi-purpose Stadiums
  'wembley stadium': { lat: 51.5560, lng: -0.2795, zoom: 17 },
  'camp nou': { lat: 41.3809, lng: 2.1228, zoom: 17 },
  'santiago bernabeu': { lat: 40.4531, lng: -3.6883, zoom: 17 },
  'old trafford': { lat: 53.4631, lng: -2.2913, zoom: 17 },
  'anfield': { lat: 53.4308, lng: -2.9608, zoom: 17 },
  'allianz arena': { lat: 48.2188, lng: 11.6247, zoom: 17 },
  'maracana': { lat: -22.9121, lng: -43.2302, zoom: 17 },
  'salt lake stadium': { lat: 22.5722, lng: 88.4028, zoom: 17 },
  'jawaharlal nehru stadium': { lat: 28.5813, lng: 77.2336, zoom: 17 },
};

export function lookupVenue(venueName: string): VenueCoords | null {
  const key = venueName.toLowerCase().trim();
  
  // Exact match
  if (KNOWN_VENUES[key]) return KNOWN_VENUES[key];

  // Fuzzy match: check if venue name contains any known key or vice versa
  for (const [knownKey, coords] of Object.entries(KNOWN_VENUES)) {
    if (key.includes(knownKey) || knownKey.includes(key)) {
      return coords;
    }
  }

  return null;
}
