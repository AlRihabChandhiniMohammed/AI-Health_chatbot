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
    return res.status(503).json({error: 'API key not configured. Please add GEMINI_API_KEY in Vercel Settings.'});
  }

  try {
    const {GoogleGenAI} = await import('@google/genai');
    const {text} = req.body;
    if (!text) return res.status(400).json({error: 'Text is required for TTS'});

    const sanitizedText = text.replace(/[*_#\-`]/g, '').slice(0, 1000);
    const ai = new GoogleGenAI({apiKey});

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-tts',
      contents: [{parts: [{text: `Read this medical statement clearly: ${sanitizedText}`}]}],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Fenrir'}},
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return res.status(500).json({error: 'Speech synthesis was empty'});

    res.status(200).json({audio: base64Audio});
  } catch (err: any) {
    console.error('TTS Error:', err);
    res.status(500).json({error: 'Failed to generate speech', details: err.message});
  }
}
