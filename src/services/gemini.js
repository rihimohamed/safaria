/**
 * SafarAI Gemini Service — Waterfall Architecture
 * 
 * 4-Stage Pipeline:
 *   Stage 0: detectLanguage()        — Gemini detects user language + translates to English
 *   Stage 1: analyzeIntent()         — LLM classifies intent + extracts entities (no tools)
 *   Stage 2: executeTools()          — Native JS fetches real data (no LLM)
 *   Stage 3: generateFinalResponse() — LLM generates the final formatted response in user's language
 */

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = 'llama-3.3-70b-versatile';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';


// ─── Translation Utility (via Groq — Gemini quota exhausted) ────────────────
// Detects the user's language and translates to/from using Groq LLM.

const callTranslation = async (prompt) => {
  if (!API_KEY) {
    console.warn('[Translation] Groq API key missing, skipping translation');
    return null;
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a precise translation engine. Follow the user instructions exactly. Return ONLY what is asked, no explanations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('[Translation] Groq translation call failed:', e);
    return null;
  }
};

/**
 * Stage 0: Detect language and translate user input to English if needed.
 * Returns { detectedLang, originalInput, englishInput }
 */
const detectAndTranslate = async (userInput) => {
  console.log('[Waterfall] Stage 0: Detecting language...');

  const prompt = `Analyze this text and respond ONLY with a JSON object, no markdown fences:
{
  "language": "the ISO language code (en, fr, ar, darija, es, etc.)",
  "language_name": "the full name of the language (English, French, Darija, Arabic, etc.)",
  "english_translation": "the English translation of the text, or the original text if already in English"
}

IMPORTANT for Darija (Moroccan Arabic):
- If the text contains Arabizi (Latin-script Moroccan Arabic like 'kifach', 'wach', 'salam', 'labas', 'fin', 'chno', 'hani', 'zwin', 'bghit', etc.), classify it as "darija"
- Also classify Arabic-script Moroccan dialect as "darija"

Text: "${userInput}"`;

  const result = await callTranslation(prompt);

  if (result) {
    try {
      const cleaned = result.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[Waterfall] Stage 0: Detected language:', parsed.language_name || parsed.language);
        return {
          detectedLang: parsed.language || 'en',
          langName: parsed.language_name || 'English',
          originalInput: userInput,
          englishInput: parsed.english_translation || userInput
        };
      }
    } catch (e) {
      console.warn('[Waterfall] Stage 0 parse failed:', e.message);
    }
  }

  // Fallback: assume English
  return { detectedLang: 'en', langName: 'English', originalInput: userInput, englishInput: userInput };
};

/**
 * Translate the final response text back to the user's language using Gemini.
 * This is the GUARANTEE layer — even if Stage 3 ignored the language instruction,
 * this step will always force-translate the output.
 */
const translateResponse = async (text, targetLang, targetLangName) => {
  if (targetLang === 'en') return text; // No translation needed

  console.log(`[Waterfall] Force-translating response to ${targetLangName}...`);

  let langInstruction = `Translate the following text to ${targetLangName}.`;
  
  if (targetLang === 'darija') {
    langInstruction = `Translate the following text to Darija (Moroccan Arabic). 
You MUST write the translation in Arabizi (Latin script, like: "salam, kifach nta? labas 3lik?").
Do NOT use Arabic script. Use numbers for Arabic sounds: 3=ع, 7=ح, 9=ق, 5=خ, 2=ء.
Use natural everyday Moroccan dialect, not formal Arabic.`;
  } else if (targetLang === 'fr') {
    langInstruction = `Translate the following text to French. Use natural, conversational French.`;
  } else if (targetLang === 'ar') {
    langInstruction = `Translate the following text to Modern Standard Arabic (MSA). Use Arabic script.`;
  }

  const prompt = `${langInstruction}
Keep all Markdown formatting (bold, bullets, emojis) intact.
Do NOT add any explanation or preamble, just return the translated text directly.

Text to translate:
${text}`;

  const translated = await callTranslation(prompt);
  return translated || text; // Fallback to original if translation fails
};

/**
 * Translate an array of suggestion strings to the user's language.
 */
const translateSuggestions = async (suggestions, targetLang, targetLangName) => {
  if (targetLang === 'en' || !suggestions || suggestions.length === 0) return suggestions;
  
  const prompt = `Translate each of these suggestions to ${targetLangName}.
${targetLang === 'darija' ? 'Use Arabizi (Latin script Moroccan Arabic with numbers: 3=ع, 7=ح, 9=ق).' : ''}
Return ONLY a JSON array of translated strings, no explanation.

${JSON.stringify(suggestions)}`;

  const result = await callTranslation(prompt);
  if (result) {
    try {
      const cleaned = result.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
  }
  return suggestions;
};

// ─── City Coordinates Lookup ────────────────────────────────────────────────
// Dynamic lookup table for Moroccan cities. The LLM extracts the city name,
// and we resolve coordinates natively — no hallucinated lat/lon.
const CITY_COORDS = {
  'ifrane': { lat: 33.5333, lon: -5.1167 },
  'fes': { lat: 34.0331, lon: -5.0003 },
  'fez': { lat: 34.0331, lon: -5.0003 },
  'marrakech': { lat: 31.6295, lon: -7.9811 },
  'marrakesh': { lat: 31.6295, lon: -7.9811 },
  'casablanca': { lat: 33.5731, lon: -7.5898 },
  'rabat': { lat: 34.0209, lon: -6.8416 },
  'tangier': { lat: 35.7595, lon: -5.8340 },
  'tanger': { lat: 35.7595, lon: -5.8340 },
  'chefchaouen': { lat: 35.1688, lon: -5.2636 },
  'chaouen': { lat: 35.1688, lon: -5.2636 },
  'essaouira': { lat: 31.5085, lon: -9.7595 },
  'agadir': { lat: 30.4278, lon: -9.5981 },
  'meknes': { lat: 33.8935, lon: -5.5473 },
  'ouarzazate': { lat: 30.9189, lon: -6.8936 },
  'merzouga': { lat: 31.0801, lon: -4.0133 },
  'tetouan': { lat: 35.5785, lon: -5.3684 },
  'volubilis': { lat: 34.0724, lon: -5.5546 },
  'moulay idriss': { lat: 34.0565, lon: -5.5230 },
  'asilah': { lat: 35.4653, lon: -6.0345 },
  'el jadida': { lat: 33.2549, lon: -8.5007 },
  'safi': { lat: 32.2994, lon: -9.2372 },
  'nador': { lat: 35.1681, lon: -2.9287 },
  'oujda': { lat: 34.6814, lon: -1.9086 },
  'kenitra': { lat: 34.2610, lon: -6.5802 },
  'beni mellal': { lat: 32.3373, lon: -6.3498 },
  'errachidia': { lat: 31.9314, lon: -4.4288 },
  'dakhla': { lat: 23.6848, lon: -15.9580 },
  'taroudant': { lat: 30.4727, lon: -8.8748 },
  'azrou': { lat: 33.4342, lon: -5.2214 },
  'midelt': { lat: 32.6799, lon: -4.7345 },
  'taza': { lat: 34.2133, lon: -4.0100 },
  'al hoceima': { lat: 35.2517, lon: -3.9372 },
  'tiznit': { lat: 29.6974, lon: -9.7316 },
  'zagora': { lat: 30.3302, lon: -5.8381 },
  'tinghir': { lat: 31.5147, lon: -5.5327 },
};

// Default fallback coordinates (Ifrane)
const DEFAULT_COORDS = { lat: 33.5333, lon: -5.1167 };

/**
 * Resolve city name to coordinates.
 * Supports fuzzy matching by normalizing input.
 */
const resolveCityCoords = (cityName) => {
  if (!cityName) return DEFAULT_COORDS;
  const normalized = cityName.toLowerCase().trim();

  // Direct lookup
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];

  // Partial match (e.g., "fes el bali" → "fes")
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }

  return null; // Unknown city — Stage 2 will use LLM-extracted lat/lon if available
};


// ─── 1. Tool Call Handlers ──────────────────────────────────────────────────

export const fetchOpenTripMapData = async (lat, lon, kinds) => {
  const OPENTRIPMAP_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;
  if (!OPENTRIPMAP_KEY) return { error: "OpenTripMap API Key missing" };
  try {
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lon}&lat=${lat}&kinds=${kinds}&format=json&limit=5&apikey=${OPENTRIPMAP_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return { error: "Failed to fetch map data" };
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};


// ─── 2. Input Handlers ─────────────────────────────────────────────────────

export const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim();
};

export const validateInput = (text) => {
  return text.length > 0;
};


// ─── 3. Context Builder ────────────────────────────────────────────────────

export const buildContext = () => {
  // Basic preference extraction (can be expanded)
  const preferences = {
    budget: null,
    duration: null,
    interests: [],
    destination: null
  };

  return { preferences };
};


// ─── 4. API Caller ─────────────────────────────────────────────────────────

export const callGroq = async (payload) => {
  if (!API_KEY) {
    throw new Error('API Key is missing. Please check your .env.local file.');
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message) {
      console.error('API Empty Response:', data);
      throw new Error('AI returned an empty response');
    }
    return data.choices[0].message;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
};

// Keep legacy alias for any external imports
export const callGemini = callGroq;


// ─── 5. Response Parser ────────────────────────────────────────────────────

export const parseResponse = (rawText) => {
  console.log('[Waterfall] parseResponse raw input:', rawText?.substring(0, 300));

  try {
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    let cleaned = rawText;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    // Attempt to extract JSON if there's any surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleaned;
    let parsed = JSON.parse(jsonString);

    // Handle nested schema wrapper: if the LLM echoed { type, schema: {...} }, unwrap it
    if (parsed.schema && typeof parsed.schema === 'object' && !parsed.text) {
      console.log('[Waterfall] parseResponse: Unwrapping nested schema wrapper');
      parsed = parsed.schema;
    }

    console.log('[Waterfall] parseResponse parsed successfully, text length:', (parsed.text || '').length);

    return {
      intent: parsed.intent || 'general',
      destination: parsed.destination || '',
      duration: parsed.duration || '',
      budget: parsed.budget || '',
      weather: parsed.weather || null,
      monuments: Array.isArray(parsed.monuments) ? parsed.monuments : [],
      itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      text: parsed.text || parsed.message || rawText || "I'm here to help! Ask me anything about Morocco 🇲🇦"
    };
  } catch (error) {
    console.warn('[Waterfall] parseResponse JSON parse failed:', error.message);

    // Attempt fallback regex to extract "text" field if it looks like JSON
    let textFallback = rawText;
    try {
      const textMatch = rawText?.match(/"text"\s*:\s*(?:"|")([\s\S]*?)(?:"|")\s*(?:,|})/);
      if (textMatch) {
        textFallback = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        // Also handle unescaped JSON text block failures if possible
        const blockMatch = rawText?.match(/"text"\s*:\s*"?([\s\S]*?)”?\n\s*}/);
        if (blockMatch) {
          textFallback = blockMatch[1].trim();
        }
      }
    } catch (e) {
      // Ignore inner errors
    }

    // If it's not JSON, treat it as plain text
    return {
      intent: 'general',
      text: textFallback || "I'm here to help! Ask me anything about Morocco 🇲🇦",
      weather: null,
      monuments: [],
      itinerary: [],
      suggestions: []
    };
  }
};


// ─── STAGE 1: Intent Analysis ──────────────────────────────────────────────
// A lightweight LLM call with NO tools. Classifies intent and extracts entities.

const analyzeIntent = async (userInput) => {
  console.log('[Waterfall] Stage 1: Analyzing intent...');

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for SafarAI, a Moroccan travel assistant.
IMPORTANT: The user's message has already been translated to English for you. Classify based on the English meaning.

Given the user's message, extract the following as a JSON object:

{
  "intent": "EXPLORE" | "WEATHER" | "CULTURE" | "CHAT",
  "city": "city name or null",
  "lat": number or null,
  "lon": number or null,
  "kinds": "comma-separated OpenTripMap categories or null"
}

RULES:
- "EXPLORE": User wants to discover places, landmarks, restaurants, activities, things to do, or asks about a specific location. Also use for "I'm bored", "I'm hungry", "what's nearby".
- "WEATHER": User asks about weather, temperature, climate, what to wear.
- "CULTURE": User asks about Moroccan history, traditions, food recipes, language, customs, art, music.
- "CHAT": Greetings, small talk, jokes, general questions not about Morocco travel.
- For "city": Extract the city/town name mentioned. If none mentioned, set to null.
- For "lat"/"lon": Only set if the user provides explicit coordinates. Otherwise set to null (the system will resolve coordinates from the city name).
- For "kinds": Use OpenTripMap categories like "historic", "cultural", "natural", "architecture", "foods", "shops", "amusements", "interesting_places". Combine with commas. Set null for CHAT/CULTURE.
- Return ONLY the JSON object, nothing else.`
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    temperature: 0.1, // Low temperature for deterministic classification
    max_tokens: 200,
    response_format: { type: "json_object" }
    // NO tools — this call is purely for classification
  };

  try {
    const message = await callGroq(payload);
    const content = message.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('[Waterfall] Stage 1 Result:', result);
      return {
        intent: result.intent || 'CHAT',
        city: result.city || null,
        lat: result.lat || null,
        lon: result.lon || null,
        kinds: result.kinds || 'interesting_places'
      };
    }
  } catch (err) {
    console.warn('[Waterfall] Stage 1 parse failed, defaulting to CHAT:', err.message);
  }

  // Safe fallback
  return { intent: 'CHAT', city: null, lat: null, lon: null, kinds: null };
};


// ─── STAGE 2: Tool Execution (Native JS — No LLM) ─────────────────────────
// Deterministic data fetching based on the classified intent.

const executeTools = async (intentResult) => {
  console.log('[Waterfall] Stage 2: Executing tools for intent:', intentResult.intent);

  // Only EXPLORE and WEATHER intents need external data
  if (intentResult.intent !== 'EXPLORE' && intentResult.intent !== 'WEATHER') {
    console.log('[Waterfall] Stage 2: Skipped (no tools needed for', intentResult.intent, ')');
    return null;
  }

  // Resolve coordinates: city lookup → LLM-extracted coords → default
  let coords = null;

  if (intentResult.city) {
    coords = resolveCityCoords(intentResult.city);
  }

  if (!coords && intentResult.lat && intentResult.lon) {
    coords = { lat: intentResult.lat, lon: intentResult.lon };
  }

  if (!coords) {
    coords = DEFAULT_COORDS; // Fallback to Ifrane
    console.log('[Waterfall] Stage 2: No city resolved, using default (Ifrane)');
  }

  const kinds = intentResult.kinds || 'interesting_places,historic,cultural,natural';

  console.log(`[Waterfall] Stage 2: Fetching OpenTripMap → lat:${coords.lat}, lon:${coords.lon}, kinds:${kinds}`);
  const toolData = await fetchOpenTripMapData(coords.lat, coords.lon, kinds);

  return {
    source: 'opentripmap',
    city: intentResult.city || 'Ifrane',
    coordinates: coords,
    results: toolData
  };
};


// ─── STAGE 3: Final Response Generation ────────────────────────────────────
// Second LLM call with the full persona. Receives tool data as context.
// NO tools attached — the model focuses purely on generating the JSON response.

const generateFinalResponse = async (userInput, intentResult, toolData, context, langInfo, isAuthenticated = true) => {
  console.log('[Waterfall] Stage 3: Generating final response... (auth:', isAuthenticated, ')');

  const systemPrompt = `# SafarAI — Your Moroccan Travel Concierge

## 1. Identity & Context
- You are SafarAI, the digital companion for Moroccan travelers.
- Your goal is to provide authentic, expert-level travel advice for Morocco.

## 2. Communication Guidelines
- Authentic Voice: Always respond as a natural, local human expert. Do not use generic robotic placeholders.
- Proactive Expert: If a user asks about a place, automatically mention a local secret (e.g., if they ask about Ifrane, mention the *Al Akhawayn campus* or *Stone Lion*).
- Multilingualism: The user's detected language is **${langInfo?.langName || 'English'}**. You MUST write all your responses in **${langInfo?.langName || 'English'}**. If the language is Darija, write in Arabizi (Latin script Moroccan Arabic). If French, write in French. Always match the user's language.
- No Format Requirements: Allow the user to speak naturally. Do not ask for specific parameters if you can infer them.

## 3. Detected Intent: ${intentResult.intent}
${toolData ? `
## 4. Real-Time Data (from OpenTripMap for ${toolData.city})
The following landmarks/places were found near coordinates (${toolData.coordinates.lat}, ${toolData.coordinates.lon}).
Use this data to enrich your response — mention real place names, don't hallucinate fictional ones.

\`\`\`json
${JSON.stringify(toolData.results, null, 2)}
\`\`\`
` : `
## 4. No external data was fetched for this query. Answer using your internal knowledge.
`}

CRITICAL FORMATTING RULES:
1. You MUST return ONLY a raw JSON object (NOT wrapped in markdown code fences).
2. Inside the string fields (like "text" and "notes"), use Markdown formatting (bold, bullet points, emojis) to make text beautiful.
3. Be absolutely certain to escape any newlines in your "text" string as \n (e.g., "Hello\n\nWorld"), and do NOT use actual raw multi-line strings in the JSON.
4. Do NOT wrap the response in any schema/type envelope — return the data object DIRECTLY.

RESPONSE FORMAT — return EXACTLY this JSON structure (fill in real values):
{
  "intent": "recommendation",
  "text": "Your full Markdown response here",
  "destination": "City name or empty string",
  "duration": "e.g. 3 days or empty string",
  "budget": "e.g. 500 MAD or empty string",
  "weather": { "condition": "Sunny", "temperature": "22°C" },
  "monuments": [{ "name": "Place Name", "description": "Brief description" }],
  "itinerary": [{ "day": 1, "activities": ["Activity 1"], "estimated_cost": "200 MAD", "notes": "Tip" }],
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
}

IMPORTANT RULES:
- Return ONLY the JSON object, no explanation before or after
- Leave "weather" as null if not relevant
- Leave "monuments" as [] if not a location query
- Leave "itinerary" as [] if not a trip planning request
- The "text" field is ALWAYS required — this is your main conversational response
- Use realistic data. Do not hallucinate unknown information.
${!isAuthenticated ? `
## IMPORTANT — GUEST USER (NOT LOGGED IN)
This user is NOT signed up. You must:
- Give only a SHORT teaser/overview (2-3 sentences max) about the topic
- Do NOT give full itineraries, detailed lists, or complete recommendations
- Do NOT fill the "itinerary" array — leave it empty []
- Limit "monuments" to at most 1 item
- At the END of your "text", ALWAYS add this line: "\n\n🔐 **Sign up for free** to unlock full itineraries, personalized recommendations, and exclusive local tips!"
- Keep it enticing so they want to sign up
` : ''}`;

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt}\n\nUser Context:\n- Preferences: ${JSON.stringify(context.preferences)}\n\nTask: The user can insert a question or statement in ANY format. You must ALWAYS respond properly and naturally based on the input. ONLY fill out the 'weather', 'monuments', and 'itinerary' JSON fields if the user explicitly asks for a destination, recommendation, or city details. For any other input (e.g., greetings, general questions, weird formatting), leave those arrays/objects empty and reply naturally using ONLY the 'text' field.`
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    response_format: { type: "json_object" }
    // NO tools — pure generation
  };

  const message = await callGroq(payload);
  const rawContent = message.content || '';
  console.log('[Waterfall] Stage 3 raw response length:', rawContent.length);
  console.log('[Waterfall] Stage 3 raw response preview:', rawContent.substring(0, 500));
  return rawContent;
};


// ─── 7. Orchestrator (Main Export) — Waterfall Pipeline ─────────────────────

export const getGeminiResponse = async (userInput, { isAuthenticated = true } = {}) => {
  // ── Sanitize & Validate ──
  const sanitized = sanitizeInput(userInput);
  if (!validateInput(sanitized)) throw new Error('User input cannot be empty');

  const context = buildContext();

  try {
    // ── Stage 0: Detect Language & Translate ──
    const langInfo = await detectAndTranslate(sanitized);
    console.log(`[Waterfall] Language: ${langInfo.langName} (${langInfo.detectedLang})`);

    // ── Stage 1: Classify Intent (using English input) ──
    const intentResult = await analyzeIntent(langInfo.englishInput);

    // ── Stage 2: Execute Tools (native JS, no LLM) ──
    const toolData = await executeTools(intentResult);

    // ── Stage 3: Generate Final Response (LLM, no tools) ──
    const rawResponse = await generateFinalResponse(langInfo.originalInput, intentResult, toolData, context, langInfo, isAuthenticated);

    // ── Parse & Return ──
    const parsed = parseResponse(rawResponse);

    // ── Post-process: ALWAYS translate to user's language ──
    if (langInfo.detectedLang !== 'en') {
      const [translatedText, translatedSuggestions] = await Promise.all([
        translateResponse(parsed.text, langInfo.detectedLang, langInfo.langName),
        translateSuggestions(parsed.suggestions, langInfo.detectedLang, langInfo.langName)
      ]);
      parsed.text = translatedText;
      parsed.suggestions = translatedSuggestions;
    }

    console.log(`[Waterfall] Pipeline complete. Lang: ${langInfo.langName}, Intent: ${intentResult.intent} → Parsed: ${parsed.intent}`);
    return parsed;

  } catch (error) {
    console.error('[Waterfall] Pipeline error:', error);

    // Graceful fallback — try a direct single-shot call without the waterfall
    console.log('[Waterfall] Attempting direct fallback...');
    try {
      const fallbackPayload = {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are SafarAI, a friendly Moroccan travel assistant. Respond naturally in JSON format with at minimum a "text" field containing your response, and an "intent" field. Keep it brief and helpful.'
          },
          { role: 'user', content: sanitized }
        ],
        response_format: { type: "json_object" }
      };
      const fallbackMsg = await callGroq(fallbackPayload);
      return parseResponse(fallbackMsg.content || '');
    } catch (fallbackError) {
      console.error('[Waterfall] Fallback also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Roadtrip Planner Engine
 * Generates an itinerary including days, stops, and activities between origin and destination.
 */
export const generateRoadtripItinerary = async (origin, destination, days = 3) => {
  if (!API_KEY) {
    console.error('[Roadtrip] Groq API key missing.');
    return null;
  }

  const prompt = `You are a Moroccan travel concierge. The human wants to take a roadtrip from ${origin} to ${destination} over ${days} days.
Please generate a realistic, sequential itinerary including logical stops between these two locations.
Return ONLY a strictly valid JSON array of objects, with NO markdown code blocks, NO markdown syntax and NO extra text.
Format example:
[
  {
    "day": "Day 1",
    "dateInfo": "Start the journey",
    "stopName": "City or Region Name",
    "lat": 31.6295,
    "lng": -7.9811,
    "description": "Why stop here? What is the vibe?",
    "activities": ["Activity 1", "Activity 2"]
  }
]
Constraints:
- Focus on actual Moroccan cities, villages, or scenic spots along the route from ${origin} to ${destination}.
- VERY IMPORTANT: estimate the realistic latitude (lat) and longitude (lng) for each stop so we can plot it on a map.
- Keep descriptions brief and enticing.
- The first stop should be the departure or nearby, the last should be near the destination or the destination itself.`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a Moroccan travel itinerary API. Output perfectly valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 1500
      })
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const cleaned = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[Roadtrip] Itinerary generation failed:', e);
    return null;
  }
};

/**
 * City Explorer Engine
 * Generates points of interest within a single city, with coordinates and categories.
 */
export const generateCityExplorer = async (cityName) => {
  if (!API_KEY) {
    console.error('[CityExplorer] Groq API key missing.');
    return null;
  }

  const prompt = `You are a Moroccan local expert with encyclopedic knowledge. The human wants to FULLY explore ${cityName}, Morocco.
Generate 20-25 places to visit and things to do WITHIN the city. Include EVERYTHING worth seeing — from the most iconic, world-famous landmarks down to lesser-known local favorites and hidden gems.
Return ONLY a strictly valid JSON array of objects, with NO markdown code blocks, NO markdown syntax and NO extra text.
Order them from MOST POPULAR / MOST VISITED to LEAST KNOWN / HIDDEN GEM.
Format:
[
  {
    "name": "Place Name",
    "lat": 31.6295,
    "lng": -7.9811,
    "category": "one of: landmark, food, market, culture, nature, nightlife, shopping, religion",
    "popularity": 10,
    "description": "A brief, exciting 1-2 sentence description of why to visit.",
    "tips": "One practical tip for visitors."
  }
]
Constraints:
- "popularity" is a score from 1 (hidden gem, very few tourists know it) to 10 (world-famous, millions of visitors per year). Be realistic and varied.
- Focus on REAL, actual places and attractions within ${cityName}.
- VERY IMPORTANT: provide realistic, accurate latitude and longitude so we can plot them on a map.
- Cover a WIDE mix of categories: landmarks, restaurants, souks/markets, cultural sites, mosques, nature spots, viewpoints, gardens, museums, nightlife, cafés, etc.
- Keep descriptions vivid and enticing.
- Include at least 3-4 hidden gems (popularity 1-3) that only locals know about.`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a Moroccan city exploration API. Output perfectly valid JSON arrays only. Generate comprehensive, large lists.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_completion_tokens: 4000
      })
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const cleaned = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    // Sort by popularity descending (most seen first)
    return parsed.sort((a, b) => (b.popularity || 5) - (a.popularity || 5));
  } catch (e) {
    console.error('[CityExplorer] Generation failed:', e);
    return null;
  }
};
