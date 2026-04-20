import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = "You are StadiumFlow AI — a specialist in stadium logistics and fan safety. Provide accurate, safety-conscious navigation for sports fans. Only answer venue-related queries.";

const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT" as any,
    threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
    threshold: "BLOCK_ONLY_HIGH" as any,
  },
];

export async function getAIResponse(prompt: string, context: string = ''): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings,
    });

    const fullPrompt = context
      ? `Current venue context:\n${context}\n\nUser: ${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes('404') || message.includes('model not found')) {
      return "System Error: The AI model configuration is temporarily unavailable. Please check project deployment settings.";
    }
    
    return "The stadium assistant is temporarily experiencing high traffic. Please try asking again in a moment.";
  }
}
