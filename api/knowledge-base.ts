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
      results: 'Knowledge base is not configured yet. Please add GEMINI_API_KEY in Vercel Settings.'
    });
  }

  try {
    const {GoogleGenAI} = await import('@google/genai');
    const {category, language = 'en'} = req.body;
    if (!category) return res.status(400).json({error: 'Category is required'});

    const ai = new GoogleGenAI({apiKey});

    const promptKB = `Generate a medical knowledge factsheet on: "${category}".
Include: Overview, Common Symptoms, Diagnostic Checks, Lifestyle Changes, Medication Classes.
Format as structured Markdown. Language: ${language}.
Add a medical safety warning footer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptKB,
      config: {temperature: 0.2},
    });

    res.status(200).json({results: response.text});
  } catch (err: any) {
    console.error('Knowledge Base Error:', err);
    res.status(500).json({error: 'Could not fetch knowledge base', details: err.message});
  }
}
