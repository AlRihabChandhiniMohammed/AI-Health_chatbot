import type {VercelRequest, VercelResponse} from '@vercel/node';

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({
      error: 'API key not configured',
      results: 'The AI symptom checker is not configured yet. Please add GEMINI_API_KEY in Vercel Settings → Environment Variables.'
    });
  }

  try {
    const {GoogleGenAI} = await import('@google/genai');
    const {symptoms, age, gender, duration, severity, language = 'en'} = req.body;
    if (!symptoms) return res.status(400).json({error: 'Symptom description is required'});

    const ai = new GoogleGenAI({apiKey});

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText + '\n\n' + promptSchema,
      config: {
        systemInstruction: 'You are a professional clinical triage specialist.',
        temperature: 0.15,
      },
    });

    res.status(200).json({results: response.text});
  } catch (err: any) {
    console.error('Symptom Check Error:', err);
    res.status(500).json({error: 'Failed to compile symptom analysis', details: err.message});
  }
}
