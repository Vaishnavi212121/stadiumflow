import { parseVenueSearchInput, getVenueInfo, KNOWN_VENUES } from '../src/lib/venues';

describe('parseVenueSearchInput', () => {
  test('parses venue with origin correctly', () => {
    const result = parseVenueSearchInput('Eden Gardens from Kolhapur');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Kolhapur');
  });

  test('parses venue without origin', () => {
    const result = parseVenueSearchInput('Wankhede Stadium');
    expect(result.venue).toBe('Wankhede Stadium');
    expect(result.origin).toBe('');
  });

  test('handles empty string', () => {
    const result = parseVenueSearchInput('');
    expect(result.venue).toBe('');
    expect(result.origin).toBe('');
  });

  test('handles case insensitive from keyword', () => {
    const result = parseVenueSearchInput('Eden Gardens FROM Mumbai');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Mumbai');
  });

  test('trims whitespace from venue and origin', () => {
    const result = parseVenueSearchInput('  Eden Gardens  from  Kolkata  ');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Kolkata');
  });
});

describe('getVenueInfo', () => {
  test('returns venue info for known venue', () => {
    const info = getVenueInfo('Wankhede Stadium');
    expect(info).not.toBeNull();
    expect(info?.name).toBe('Wankhede Stadium');
    expect(info?.city).toBe('Mumbai');
    expect(info?.sport).toBe('Cricket');
  });

  test('returns null for unknown venue', () => {
    const info = getVenueInfo('Unknown Stadium XYZ');
    expect(info).toBeNull();
  });

  test('is case insensitive', () => {
    const info = getVenueInfo('EDEN GARDENS');
    expect(info).not.toBeNull();
    expect(info?.city).toBe('Kolkata');
  });

  test('returns correct capacity for Narendra Modi Stadium', () => {
    const info = getVenueInfo('Narendra Modi Stadium');
    expect(info?.capacity).toBe(132000);
  });
});

describe('KNOWN_VENUES', () => {
  test('contains all expected venues', () => {
    const venueNames = Object.values(KNOWN_VENUES).map(v => v.name);
    expect(venueNames).toContain('Wankhede Stadium');
    expect(venueNames).toContain('Eden Gardens');
    expect(venueNames).toContain('Salt Lake Stadium');
    expect(venueNames).toContain('Narendra Modi Stadium');
    expect(venueNames).toContain('Old Trafford');
  });

  test('all venues have required fields', () => {
    Object.values(KNOWN_VENUES).forEach(venue => {
      expect(venue.name).toBeTruthy();
      expect(venue.lat).toBeDefined();
      expect(venue.lng).toBeDefined();
      expect(venue.city).toBeTruthy();
      expect(venue.capacity).toBeGreaterThan(0);
      expect(venue.sport).toBeTruthy();
    });
  });

  test('all venues have valid coordinates', () => {
    Object.values(KNOWN_VENUES).forEach(venue => {
      expect(venue.lat).toBeGreaterThan(-90);
      expect(venue.lat).toBeLessThan(90);
      expect(venue.lng).toBeGreaterThan(-180);
      expect(venue.lng).toBeLessThan(180);
    });
  });
});
