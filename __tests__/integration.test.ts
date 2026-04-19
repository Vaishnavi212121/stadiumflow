import { parseVenueSearchInput, getVenueInfo } from '../src/lib/venues';

describe('Venue Search Integration', () => {
  test('full flow: parse input and get venue info', () => {
    const input = 'Wankhede Stadium from Pune';
    const parsed = parseVenueSearchInput(input);
    const venueInfo = getVenueInfo(parsed.venue);

    expect(parsed.venue).toBe('Wankhede Stadium');
    expect(parsed.origin).toBe('Pune');
    expect(venueInfo).not.toBeNull();
    expect(venueInfo?.city).toBe('Mumbai');
  });

  test('unknown venue returns null gracefully', () => {
    const input = 'Random Unknown Stadium';
    const parsed = parseVenueSearchInput(input);
    const venueInfo = getVenueInfo(parsed.venue);
    expect(venueInfo).toBeNull();
  });

  test('all known venues can be searched and found', () => {
    const searches = [
      'Wankhede Stadium',
      'Eden Gardens',
      'Salt Lake Stadium',
      'Narendra Modi Stadium',
      'Old Trafford',
    ];
    searches.forEach(name => {
      const parsed = parseVenueSearchInput(name);
      const info = getVenueInfo(parsed.venue);
      expect(info).not.toBeNull();
      expect(info?.name).toBe(name);
    });
  });

  test('origin city is preserved through parsing', () => {
    const origins = ['Mumbai', 'Kolhapur', 'Pune', 'Delhi', 'Manchester'];
    origins.forEach(origin => {
      const result = parseVenueSearchInput(`Eden Gardens from ${origin}`);
      expect(result.origin).toBe(origin);
    });
  });
});

describe('Venue Data Integrity', () => {
  test('Indian stadiums have Indian coordinates', () => {
    const indiaLatRange = { min: 8, max: 37 };
    const indiaLngRange = { min: 68, max: 97 };

    const indianVenues = ['Wankhede Stadium', 'Eden Gardens', 'Salt Lake Stadium', 'Narendra Modi Stadium'];
    indianVenues.forEach(name => {
      const info = getVenueInfo(name);
      expect(info?.lat).toBeGreaterThan(indiaLatRange.min);
      expect(info?.lat).toBeLessThan(indiaLatRange.max);
      expect(info?.lng).toBeGreaterThan(indiaLngRange.min);
      expect(info?.lng).toBeLessThan(indiaLngRange.max);
    });
  });

  test('Old Trafford has UK coordinates', () => {
    const info = getVenueInfo('Old Trafford');
    expect(info?.lat).toBeGreaterThan(50);
    expect(info?.lat).toBeLessThan(56);
    expect(info?.lng).toBeLessThan(0);
  });
});
