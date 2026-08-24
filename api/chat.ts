import type {VercelRequest, VercelResponse} from '@vercel/node';
import {GoogleGenAI} from '@google/genai';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({apiKey});
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errStr = String(error.message || error);
    const isTransient = ['503', 'UNAVAILABLE', '429', 'high demand', 'overloaded', 'temporary'].some(s => errStr.includes(s));
    if (isTransient && retries > 1) {
      await new Promise(r => setTimeout(r, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  try {
    const {message, previousMessages = [], language = 'en'} = req.body;
    if (!message) return res.status(400).json({error: 'Message content is required'});

    const ai = getClient();

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
        await retryWithBackoff(() => chat.sendMessage({message: msg.text}));
      } catch (e) {
        console.warn('Could not reload history chunk:', e);
      }
    }

    const response = await retryWithBackoff(() => chat.sendMessage({message}));
    res.status(200).json({text: response.text});
  } catch (err: any) {
    console.error('Chat Error:', err);
    res.status(500).json({error: 'Could not generate answer', details: err.message});
  }
}
