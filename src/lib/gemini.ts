import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getAIResponse(prompt: string, context: string = ''): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "Error: GEMINI_API_KEY is not configured.";
    }

    // Using gemini-1.5-flash which is the current standard
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const systemInstruction = "You are StadiumFlow AI, an expert in stadium logistics and fan safety. Provide advice on crowd density, gates, and travel.";

    // Incorporate system instruction directly into the prompt for better compatibility with older API versions
    const fullPrompt = `System: ${systemInstruction}\n\n${context ? `Context: ${context}\n\n` : ''}User Question: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return "The AI returned an empty response. Please try a different question.";
    }

    return text;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    
    // If 1.5-flash fails with 404, try falling back to gemini-pro
    if (msg.includes('404') || msg.includes('not found')) {
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (fallbackError) {
        return `AI Model Error (404): The requested model was not found in your API region. Please ensure "Generative Language API" is enabled in your Google Cloud Console for project ${process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client'}.`;
      }
    }
    
    return `AI Service Error: ${msg}. Please check your API key and quota.`;
  }
}
