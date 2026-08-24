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
    const isTransient = ['503', 'UNAVAILABLE', '429', 'high demand', 'overloaded'].some(s => errStr.includes(s));
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
    const {category, language = 'en'} = req.body;
    if (!category) return res.status(400).json({error: 'Category is required'});

    const ai = getClient();

    const promptKB = `Generate a medical knowledge factsheet on: "${category}".
Include: Overview, Common Symptoms, Diagnostic Checks, Lifestyle Changes, Medication Classes.
Format as structured Markdown. Language: ${language}.
Add a medical safety warning footer.`;

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: promptKB,
        config: {temperature: 0.2},
      })
    );

    res.status(200).json({results: response.text});
  } catch (err: any) {
    console.error('Knowledge Base Error:', err);
    res.status(500).json({error: 'Could not fetch knowledge base', details: err.message});
  }
}
