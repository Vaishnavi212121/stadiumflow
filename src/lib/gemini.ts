import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Safety settings — blocks harmful content across all categories
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// System instruction — fixed persona for consistent, safe responses
const systemInstruction = `You are StadiumFlow AI, an expert assistant specialising in stadium logistics, fan safety, and sports venue navigation.

Your responsibilities:
- Provide accurate crowd density estimates and recommend the least congested entry gates
- Give real-time queue wait time estimates for food stalls, beverages, and restrooms
- Advise on safe travel routes and transport options from the user's origin city
- Recommend parking zones, drop-off points, and accessible routes
- Share in-stadium navigation tips (seats, emergency exits, first aid, amenities)
- Prioritise fan safety in all recommendations

Response guidelines:
- Always structure your response with clear section headings
- Be concise, factual, and actionable
- If crowd data is simulated, acknowledge it as an estimate
- Never provide advice that could compromise fan safety or security
- Always recommend following official venue staff instructions`;

export async function getAIResponse(
  prompt: string,
  context: string = ''
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
      safetySettings,
    });

    const fullPrompt = context
      ? `Context: ${context}\n\nUser question: ${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return "The stadium assistant is temporarily experiencing high traffic. Please try asking again in a moment.";
  }
}
