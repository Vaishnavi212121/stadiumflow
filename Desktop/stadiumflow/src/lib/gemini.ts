import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  FunctionDeclarationSchemaType,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Responsible AI: Safe Persona via System Instruction ──
const SYSTEM_INSTRUCTION = `You are StadiumFlow AI — a responsible, expert stadium navigation assistant built with Google Gemini.

Your core capabilities:
- Crowd density analysis and best entry gate recommendations
- Queue wait time estimates for food, beverages, and restrooms
- Travel directions and optimal transport options to venues
- Parking availability and drop-off zone guidance
- In-stadium navigation including seats, amenities, and emergency exits
- Real-time advice based on match timing, weather, and crowd patterns

Grounding Instructions:
- Only provide information related to stadium logistics, fan safety, and travel.
- If a user asks about topics unrelated to venues or logistics, politely redirect them back to stadium navigation.

Safety guidelines (you MUST follow these):
- You must NEVER provide medical advice. If someone reports an injury, direct them to on-site medical staff or call emergency services.
- You must NEVER disclose private security protocols, restricted access areas, or internal venue operations.
- You must NEVER generate content that is hateful, harassing, sexually explicit, or dangerous.
- You must NEVER assist with ticket scalping, unauthorized entry, or any illegal activity.
- Always prioritize user safety. If crowd density is dangerously high, recommend waiting or alternative routes.

Response guidelines:
- Be concise but thorough. Use bullet points and structured formatting with markdown.
- Provide actionable recommendations, not generic advice.
- When you use tool results, present them naturally in your response.`;

// ── Responsible AI: Safety Settings ──
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
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

// ── Advanced Capabilities: Function Calling (Tools) ──
// Simulated live data functions that Gemini can call
function getVenueLiveMetrics(venueName: string) {
  // Simulated real-time data — in production this would hit live APIs
  const metrics: Record<string, any> = {
    'wankhede stadium': {
      crowdDensity: 84, gateStatus: { A: 'moderate', B: 'heavy', C: 'light', D: 'moderate' },
      waitTimes: { food: '12 min', restroom: '8 min', merchandise: '5 min' },
      weather: { temp: 32, condition: 'Clear', humidity: 65 },
      parking: { available: 120, total: 800, nearestLot: 'Marine Drive Lot B' },
    },
    'eden gardens': {
      crowdDensity: 72, gateStatus: { North: 'light', South: 'moderate', East: 'heavy', West: 'light' },
      waitTimes: { food: '8 min', restroom: '5 min', merchandise: '3 min' },
      weather: { temp: 29, condition: 'Partly Cloudy', humidity: 78 },
      parking: { available: 250, total: 1200, nearestLot: 'Maidan Parking Zone' },
    },
  };
  const key = venueName.toLowerCase();
  for (const [k, v] of Object.entries(metrics)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return {
    crowdDensity: Math.floor(50 + Math.random() * 40),
    gateStatus: { Main: 'moderate', East: 'light', West: 'moderate' },
    waitTimes: { food: `${5 + Math.floor(Math.random() * 15)} min`, restroom: `${3 + Math.floor(Math.random() * 10)} min`, merchandise: `${2 + Math.floor(Math.random() * 8)} min` },
    weather: { temp: 28, condition: 'Clear', humidity: 60 },
    parking: { available: Math.floor(50 + Math.random() * 200), total: 500, nearestLot: 'Main Parking Area' },
  };
}

function getTransitOptions(venueName: string, origin: string) {
  return {
    recommended: 'Metro + Walk',
    options: [
      { mode: 'Metro', duration: '35 min', cost: '₹40', crowdLevel: 'moderate' },
      { mode: 'Taxi/Uber', duration: '25 min', cost: '₹250-400', crowdLevel: 'low' },
      { mode: 'Bus', duration: '50 min', cost: '₹15', crowdLevel: 'heavy' },
      { mode: 'Auto-rickshaw', duration: '30 min', cost: '₹150-200', crowdLevel: 'low' },
    ],
    tips: [
      'Arrive 90 minutes before the event for smooth entry',
      'Last metro service at 11:30 PM — plan your return',
      'Surge pricing expected on ride-share apps post-event',
    ],
  };
}

function getGateRecommendation(venueName: string) {
  return {
    bestGate: 'Gate C (West)',
    reason: 'Lowest crowd density, closest to metro station exit',
    alternateGate: 'Gate A (North)',
    estimatedWaitTime: '5-8 minutes',
    accessibleEntry: 'Gate D (South) — ramp access, wheelchair friendly',
    tips: [
      'Carry a printed/digital ticket — QR scanners at all gates',
      'Large bags not allowed — use venue cloakroom near Gate A',
      'Water bottles must be empty at entry (refill stations inside)',
    ],
  };
}

// Tool declarations for Gemini Function Calling
const tools = [
  {
    functionDeclarations: [
      {
        name: 'getVenueLiveMetrics' as const,
        description: 'Get real-time crowd density, gate status, wait times, weather, and parking data for a stadium or venue.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT as const,
          properties: {
            venueName: {
              type: FunctionDeclarationSchemaType.STRING as const,
              description: 'Name of the stadium or venue',
            },
          },
          required: ['venueName'] as const,
        },
      },
    ],
  },
  {
    functionDeclarations: [
      {
        name: 'getTransitOptions' as const,
        description: 'Get transit and travel options to reach a venue from a given origin location, including metro, taxi, bus routes with estimated times and costs.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT as const,
          properties: {
            venueName: {
              type: FunctionDeclarationSchemaType.STRING as const,
              description: 'Name of the destination stadium or venue',
            },
            origin: {
              type: FunctionDeclarationSchemaType.STRING as const,
              description: 'Starting location or city of the user',
            },
          },
          required: ['venueName'] as const,
        },
      },
    ],
  },
  {
    functionDeclarations: [
      {
        name: 'getGateRecommendation' as const,
        description: 'Get the best entry gate recommendation for a venue based on current crowd levels, accessibility needs, and proximity to transport.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT as const,
          properties: {
            venueName: {
              type: FunctionDeclarationSchemaType.STRING as const,
              description: 'Name of the stadium or venue',
            },
          },
          required: ['venueName'] as const,
        },
      },
    ],
  },
];

// Map function names to implementations
const functionMap: Record<string, Function> = {
  getVenueLiveMetrics,
  getTransitOptions,
  getGateRecommendation,
};

export async function getAIResponse(prompt: string, context: string = ''): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings,
    tools: tools as any,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
    },
  });

  const fullPrompt = context
    ? `Current venue context:\n${context}\n\nUser question: ${prompt}`
    : prompt;

  // Start chat for function calling support
  const chat = model.startChat();
  let result = await chat.sendMessage(fullPrompt);
  let response = result.response;

  // Handle function calls (tool use loop)
  let maxIterations = 3;
  while (response.functionCalls() && response.functionCalls()!.length > 0 && maxIterations > 0) {
    const functionCalls = response.functionCalls()!;
    const functionResponses = [];

    for (const call of functionCalls) {
      const fn = functionMap[call.name];
      if (fn) {
        const args = call.args as Record<string, string>;
        const fnResult = fn(args.venueName || '', args.origin || '');
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: fnResult },
          },
        });
      }
    }

    if (functionResponses.length > 0) {
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    } else {
      break;
    }
    maxIterations--;
  }

  return response.text();
}
// Safety Persona: StadiumFlow AI
