import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getAIResponse(prompt: string, context: string = ''): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemContext = `You are StadiumFlow AI — a smart assistant for stadium and sports venue navigation.
You help fans with:
- Crowd density and best entry gates
- Queue wait times for food, beverages, and restrooms
- Travel directions and transport options to the venue
- Parking and drop-off zones
- In-stadium navigation (seats, amenities, exits)
- Real-time advice based on match timing and crowds

Always respond in a structured, helpful manner. If asked for data, format it clearly.
${context ? `Current venue context:\n${context}` : ''}`;

  const fullPrompt = `${systemContext}\n\nUser: ${prompt}`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}
