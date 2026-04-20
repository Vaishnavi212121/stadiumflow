import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';

export interface VenueSearch {
  venue: string;
  origin?: string;
  timestamp?: unknown;
  userAgent?: string;
}

export interface RecentSearch {
  id: string;
  venue: string;
  origin?: string;
  timestamp: string;
}

/**
 * Logs a venue search to Firestore for analytics
 */
export async function logVenueSearch(venue: string, origin?: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getDb();
    const searchData: VenueSearch = {
      venue,
      origin: origin || '',
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'server',
    };
    await addDoc(collection(db, 'venue_searches'), searchData);
  } catch (error) {
    // Fail silently — analytics should never break the app
    console.warn('Analytics log failed:', error);
  }
}

/**
 * Fetches recent popular searches from Firestore
 */
export async function getRecentSearches(limitCount = 5): Promise<RecentSearch[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const db = getDb();
    const q = query(
      collection(db, 'venue_searches'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      venue: doc.data().venue,
      origin: doc.data().origin,
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || '',
    }));
  } catch (error) {
    console.warn('Failed to fetch recent searches:', error);
    return [];
  }
}
