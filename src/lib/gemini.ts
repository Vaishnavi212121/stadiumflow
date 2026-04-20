import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getAIResponse(prompt: string, context: string = ''): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "Error: GEMINI_API_KEY is not configured.";
    }

    // With SDK 0.21.0, gemini-1.5-flash is stable and uses v1 by default
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const systemInstruction = "You are StadiumFlow AI, an expert in stadium logistics and fan safety. Provide advice on crowd density, gates, and travel.";
    const fullPrompt = `${systemInstruction}\n\n${context ? `Context: ${context}\n\n` : ''}User Question: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    
    // Fallback to gemini-pro if flash still has issues
    if (msg.includes('404') || msg.includes('not found')) {
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (e) {}
    }
    
    return `AI Service Error: ${msg}. Please ensure the Generative Language API is enabled for your project.`;
  }
}
