import { parseVenueSearchInput, getVenueInfo, KNOWN_VENUES } from '../src/lib/venues';

describe('parseVenueSearchInput', () => {
  test('parses venue with origin using "from" keyword', () => {
    const result = parseVenueSearchInput('Eden Gardens from Kolhapur');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Kolhapur');
  });

  test('parses venue without origin', () => {
    const result = parseVenueSearchInput('Wankhede Stadium');
    expect(result.venue).toBe('Wankhede Stadium');
    expect(result.origin).toBe('');
  });

  test('handles empty string gracefully', () => {
    const result = parseVenueSearchInput('');
    expect(result.venue).toBe('');
    expect(result.origin).toBe('');
  });

  test('handles whitespace-only string', () => {
    const result = parseVenueSearchInput('   ');
    expect(result.venue).toBe('');
    expect(result.origin).toBe('');
  });

  test('is case insensitive for from keyword', () => {
    const result = parseVenueSearchInput('Eden Gardens FROM Mumbai');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Mumbai');
  });

  test('trims whitespace from venue and origin', () => {
    const result = parseVenueSearchInput('  Eden Gardens  from  Kolkata  ');
    expect(result.venue).toBe('Eden Gardens');
    expect(result.origin).toBe('Kolkata');
  });

  test('handles multi-word origin cities', () => {
    const result = parseVenueSearchInput('Wankhede Stadium from New Delhi');
    expect(result.venue).toBe('Wankhede Stadium');
    expect(result.origin).toBe('New Delhi');
  });

  test('handles venue name with numbers', () => {
    const result = parseVenueSearchInput('Gate 4 Stadium from Pune');
    expect(result.venue).toBe('Gate 4 Stadium');
    expect(result.origin).toBe('Pune');
  });
});

describe('getVenueInfo', () => {
  test('returns correct info for Wankhede Stadium', () => {
    const info = getVenueInfo('Wankhede Stadium');
    expect(info).not.toBeNull();
    expect(info?.name).toBe('Wankhede Stadium');
    expect(info?.city).toBe('Mumbai');
    expect(info?.sport).toBe('Cricket');
    expect(info?.capacity).toBe(33108);
  });

  test('returns null for unknown venue', () => {
    expect(getVenueInfo('Unknown Stadium XYZ')).toBeNull();
    expect(getVenueInfo('')).toBeNull();
    expect(getVenueInfo('random text')).toBeNull();
  });

  test('is case insensitive', () => {
    expect(getVenueInfo('EDEN GARDENS')).not.toBeNull();
    expect(getVenueInfo('eden gardens')).not.toBeNull();
    expect(getVenueInfo('Eden Gardens')).not.toBeNull();
  });

  test('returns correct capacity for Narendra Modi Stadium', () => {
    const info = getVenueInfo('Narendra Modi Stadium');
    expect(info?.capacity).toBe(132000);
    expect(info?.city).toBe('Ahmedabad');
  });

  test('returns correct sport for Salt Lake Stadium', () => {
    const info = getVenueInfo('Salt Lake Stadium');
    expect(info?.sport).toBe('Football');
  });

  test('returns correct coordinates for Old Trafford', () => {
    const info = getVenueInfo('Old Trafford');
    expect(info?.lat).toBeCloseTo(53.46, 1);
    expect(info?.lng).toBeCloseTo(-2.29, 1);
  });
});

describe('KNOWN_VENUES data integrity', () => {
  test('contains exactly 5 stadiums', () => {
    expect(Object.keys(KNOWN_VENUES).length).toBe(5);
  });

  test('all venues have required fields', () => {
    Object.values(KNOWN_VENUES).forEach(venue => {
      expect(venue.name).toBeTruthy();
      expect(typeof venue.lat).toBe('number');
      expect(typeof venue.lng).toBe('number');
      expect(venue.city).toBeTruthy();
      expect(venue.capacity).toBeGreaterThan(0);
      expect(venue.sport).toBeTruthy();
    });
  });

  test('all venues have valid GPS coordinates', () => {
    Object.values(KNOWN_VENUES).forEach(venue => {
      expect(venue.lat).toBeGreaterThan(-90);
      expect(venue.lat).toBeLessThan(90);
      expect(venue.lng).toBeGreaterThan(-180);
      expect(venue.lng).toBeLessThan(180);
    });
  });

  test('Indian stadiums are within India bounds', () => {
    const indianVenues = ['Wankhede Stadium', 'Eden Gardens', 'Salt Lake Stadium', 'Narendra Modi Stadium'];
    indianVenues.forEach(name => {
      const info = getVenueInfo(name);
      expect(info?.lat).toBeGreaterThan(8);
      expect(info?.lat).toBeLessThan(37);
      expect(info?.lng).toBeGreaterThan(68);
      expect(info?.lng).toBeLessThan(97);
    });
  });

  test('largest stadium is Narendra Modi', () => {
    const capacities = Object.values(KNOWN_VENUES).map(v => v.capacity);
    const narendra = getVenueInfo('Narendra Modi Stadium');
    expect(narendra?.capacity).toBe(Math.max(...capacities));
  });
});
