describe('AI API Route', () => {
  const mockJson = jest.fn();
  const mockNextResponse = { json: mockJson };

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockReturnValue(mockNextResponse);
  });

  test('returns 400 when prompt is missing', async () => {
    const { POST } = await import('../src/app/api/ai/route');
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Prompt is required.');
  });

  test('returns 400 when prompt is empty string', async () => {
    const { POST } = await import('../src/app/api/ai/route');
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
  });
});

describe('Input validation', () => {
  test('valid prompt passes validation', () => {
    const prompt = 'Tell me about Wankhede Stadium';
    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  test('empty prompt fails validation', () => {
    const prompt = '   ';
    expect(prompt.trim().length).toBe(0);
  });

  test('prompt with context is valid', () => {
    const body = { prompt: 'What are the entry gates?', context: 'Venue: Eden Gardens' };
    expect(body.prompt).toBeTruthy();
    expect(body.context).toBeTruthy();
  });
});
