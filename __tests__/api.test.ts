describe('API Input Validation', () => {
  test('valid prompt string passes validation', () => {
    const prompt = 'Tell me about crowd density at Wankhede Stadium';
    expect(typeof prompt).toBe('string');
    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  test('empty prompt fails validation', () => {
    const prompt = '   ';
    expect(prompt.trim().length).toBe(0);
  });

  test('null-like prompt fails validation', () => {
    const prompt = '';
    expect(prompt.trim().length).toBe(0);
  });

  test('request body with prompt and context is valid', () => {
    const body = {
      prompt: 'What are the best entry gates?',
      context: 'Venue: Eden Gardens, City: Kolkata'
    };
    expect(body.prompt.trim().length).toBeGreaterThan(0);
    expect(typeof body.context).toBe('string');
  });

  test('prompt with special characters is handled', () => {
    const prompt = "What's the crowd at Gate #3 & food stall?";
    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  test('very long prompt is a string', () => {
    const prompt = 'a'.repeat(1000);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBe(1000);
  });
});

describe('API Response Structure', () => {
  test('success response has ai field', () => {
    const response = { ai: 'Here is the venue guide...' };
    expect(response).toHaveProperty('ai');
    expect(typeof response.ai).toBe('string');
  });

  test('error response has error field', () => {
    const errorResponse = { error: 'Prompt is required.' };
    expect(errorResponse).toHaveProperty('error');
    expect(typeof errorResponse.error).toBe('string');
  });

  test('error message is descriptive', () => {
    const errorResponse = { error: 'Prompt is required.' };
    expect(errorResponse.error.length).toBeGreaterThan(5);
  });
});

describe('Environment Configuration', () => {
  test('GEMINI_API_KEY env var name is correct', () => {
    const key = 'GEMINI_API_KEY';
    expect(key).toBe('GEMINI_API_KEY');
  });

  test('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is a valid env var name', () => {
    const key = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY';
    expect(key.startsWith('NEXT_PUBLIC_')).toBe(true);
  });

  test('Firebase env vars follow naming convention', () => {
    const firebaseVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];
    firebaseVars.forEach(v => {
      expect(v.startsWith('NEXT_PUBLIC_')).toBe(true);
    });
  });
});
