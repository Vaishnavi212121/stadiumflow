// Analytics service — logs searches when Firebase is configured at runtime
export interface RecentSearch {
  id: string;
  venue: string;
  origin?: string;
  timestamp: string;
}

export async function logVenueSearch(venue: string, origin?: string): Promise<void> {
  try {
    console.info('[StadiumFlow Analytics] Search:', { venue, origin, timestamp: new Date().toISOString() });
  } catch {
    // Fail silently
  }
}

export async function getRecentSearches(): Promise<RecentSearch[]> {
  return [];
}
