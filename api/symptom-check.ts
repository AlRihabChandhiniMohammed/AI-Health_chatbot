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
    const {symptoms, age, gender, duration, severity, language = 'en'} = req.body;
    if (!symptoms) return res.status(400).json({error: 'Symptom description is required'});

    const ai = getClient();

    const promptText = `Clinical diagnostic analysis:
    - Symptoms: ${symptoms}
    - Age: ${age}
    - Gender: ${gender}
    - Duration: ${duration}
    - Severity: ${severity}
    - Language: ${language}`;

    const promptSchema = `Analyze and format as:

### 🔍 Clinical Differential Assessment
2-4 conditions with Confidence, Severity, Pathology.

### 🏠 Self-Treatable & Preventive Care
3 practical recommendations.

### 🩺 Recommended Clinical Consultation Pathway
Healthcare touchpoints and timeline.

### 🚨 Critical Red Flags
Urgent emergency symptoms.

Disclaimer: "AI responses are informational only and are not a substitute for professional medical advice."`;

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: promptText + '\n\n' + promptSchema,
        config: {
          systemInstruction: 'You are a professional clinical triage specialist.',
          temperature: 0.15,
        },
      })
    );

    res.status(200).json({results: response.text});
  } catch (err: any) {
    console.error('Symptom Check Error:', err);
    res.status(500).json({error: 'Failed to compile symptom analysis', details: err.message});
  }
}
