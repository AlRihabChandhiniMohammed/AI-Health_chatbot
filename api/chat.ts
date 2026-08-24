import type {VercelRequest, VercelResponse} from '@vercel/node';

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({
      error: 'API key not configured. Please add GEMINI_API_KEY in Vercel Settings → Environment Variables.',
      text: 'I apologize, but the AI service is not configured yet. Please set up the GEMINI_API_KEY environment variable in your Vercel dashboard.'
    });
  }

  try {
    const {GoogleGenAI} = await import('@google/genai');
    const {message, previousMessages = [], language = 'en'} = req.body;
    if (!message) return res.status(400).json({error: 'Message content is required'});

    const ai = new GoogleGenAI({apiKey});

    const languageDirectives: Record<string, string> = {
      en: 'Please complete your response in clear English language.',
      hi: 'कृपया हिंदी भाषा में अपनी प्रतिक्रिया दें।',
      te: 'దయచేసి మీ సమాధానాన్ని తెలుగులో అందించండి.',
    };

    const sysInstruction = `You are a highly qualified AI Clinical Assistant.
Answer health-related questions in clear language with structured Markdown using ### headings.

### 🩺 Clinical considerations
Brief explanations of symptoms.

### 🚦 Recommended Triage Pathway
Choose one: REST_AT_HOME, VISIT_CLINIC, VISIT_SPECIALIST, or SEEK_EMERGENCY.

### 📋 Practical Self-Care & Support Steps
3-4 actionable bullet points.

### ⚠️ Important Safety Notice
AI responses are informational only and are not a substitute for professional medical advice.

Language: ${languageDirectives[language] || languageDirectives.en}`;

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {systemInstruction: sysInstruction, temperature: 0.3},
    });

    for (const msg of previousMessages) {
      try {
        await chat.sendMessage({message: msg.text});
      } catch (e) {
        console.warn('Could not reload history chunk:', e);
      }
    }

    const response = await chat.sendMessage({message});
    res.status(200).json({text: response.text});
  } catch (err: any) {
    console.error('Chat Error:', err);
    res.status(500).json({error: 'Could not generate answer', details: err.message});
  }
}
