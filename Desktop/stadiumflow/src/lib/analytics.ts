import { isFirebaseConfigured, getFirebaseDb } from './firebase';

export interface RecentSearch {
  id: string;
  venue: string;
  origin?: string;
  timestamp: string;
}

/**
 * Logs a venue search to Firestore for analytics.
 * Fails silently if Firebase is not configured or installed.
 */
export async function logVenueSearch(venue: string, origin?: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const db = await getFirebaseDb();
    if (!db) return;
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'venue_searches'), {
      venue,
      origin: origin || '',
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'server',
    });
  } catch (error) {
    // Never break the app for analytics
    console.warn('Analytics log failed:', error);
  }
}

/**
 * Fetches recent searches from Firestore.
 * Returns empty array if Firebase is not configured or installed.
 */
export async function getRecentSearches(limitCount = 5): Promise<RecentSearch[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const db = await getFirebaseDb();
    if (!db) return [];
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
    const q = query(collection(db, 'venue_searches'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      venue: doc.data().venue,
      origin: doc.data().origin,
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || '',
    }));
  } catch {
    return [];
  }
}
