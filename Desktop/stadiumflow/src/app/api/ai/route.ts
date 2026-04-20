import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body?.prompt?.toString().trim();
  const context = body?.context?.toString() ?? '';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  try {
    const ai = await getAIResponse(prompt, context);
    return NextResponse.json({ ai });
  } catch (error) {
    console.error('AI route error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
  }
}
