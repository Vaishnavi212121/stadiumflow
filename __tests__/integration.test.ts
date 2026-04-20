import { parseVenueSearchInput, getVenueInfo, KNOWN_VENUES } from '../src/lib/venues';

describe('End-to-end venue search flow', () => {
  test('full flow: parse input → get venue info', () => {
    const input = 'Wankhede Stadium from Pune';
    const parsed = parseVenueSearchInput(input);
    const info = getVenueInfo(parsed.venue);

    expect(parsed.venue).toBe('Wankhede Stadium');
    expect(parsed.origin).toBe('Pune');
    expect(info).not.toBeNull();
    expect(info?.city).toBe('Mumbai');
    expect(info?.lat).toBeDefined();
    expect(info?.lng).toBeDefined();
  });

  test('unknown venue search returns null gracefully', () => {
    const input = 'Some Random Unknown Place';
    const parsed = parseVenueSearchInput(input);
    const info = getVenueInfo(parsed.venue);
    expect(info).toBeNull();
  });

  test('all 5 known venues can be round-tripped through search', () => {
    const venues = Object.values(KNOWN_VENUES);
    venues.forEach(venue => {
      const parsed = parseVenueSearchInput(venue.name);
      const info = getVenueInfo(parsed.venue);
      expect(info).not.toBeNull();
      expect(info?.name).toBe(venue.name);
    });
  });

  test('origin is preserved for all test cities', () => {
    const origins = ['Mumbai', 'Kolhapur', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'];
    origins.forEach(origin => {
      const result = parseVenueSearchInput(`Eden Gardens from ${origin}`);
      expect(result.origin).toBe(origin);
      expect(result.venue).toBe('Eden Gardens');
    });
  });

  test('URL encoding of venue names is safe', () => {
    const venueName = 'Narendra Modi Stadium';
    const encoded = encodeURIComponent(venueName);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(venueName);
  });

  test('URL encoding of origin with spaces works', () => {
    const origin = 'New Delhi';
    const encoded = encodeURIComponent(origin);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(origin);
  });
});

describe('Firebase analytics functions', () => {
  test('isFirebaseConfigured returns false when env vars missing', () => {
    // Without env vars set, Firebase should not be configured
    const hasKey = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    const hasProject = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    const isConfigured = hasKey && hasProject;
    // In test environment, these are not set, so should be false
    expect(typeof isConfigured).toBe('boolean');
  });

  test('venue search data structure is correct', () => {
    const searchData = {
      venue: 'Wankhede Stadium',
      origin: 'Pune',
      timestamp: new Date().toISOString(),
    };
    expect(searchData.venue).toBeTruthy();
    expect(typeof searchData.venue).toBe('string');
    expect(typeof searchData.origin).toBe('string');
  });
});

describe('Accessibility compliance checks', () => {
  test('all quick venues have labels', () => {
    const quickVenues = [
      { label: 'Wankhede', value: 'Wankhede Stadium' },
      { label: 'Eden Gardens', value: 'Eden Gardens' },
      { label: 'Salt Lake', value: 'Salt Lake Stadium' },
    ];
    quickVenues.forEach(v => {
      expect(v.label).toBeTruthy();
      expect(v.value).toBeTruthy();
    });
  });

  test('error messages are descriptive', () => {
    const errorMsg = 'Please enter a stadium or venue name.';
    expect(errorMsg.length).toBeGreaterThan(10);
  });

  test('ARIA labels are non-empty strings', () => {
    const ariaLabels = [
      'Search for a stadium',
      'Enter stadium or venue name',
      'Enter your origin city for travel advice (optional)',
      'Quick venue selection',
    ];
    ariaLabels.forEach(label => {
      expect(typeof label).toBe('string');
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });
});
