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
    const {text} = req.body;
    if (!text) return res.status(400).json({error: 'Text is required for TTS'});

    const sanitizedText = text.replace(/[*_#\-`]/g, '').slice(0, 1000);
    const ai = getClient();

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-tts',
        contents: [{parts: [{text: `Read this medical statement clearly: ${sanitizedText}`}]}],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Fenrir'}},
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return res.status(500).json({error: 'Speech synthesis was empty'});

    res.status(200).json({audio: base64Audio});
  } catch (err: any) {
    console.error('TTS Error:', err);
    res.status(500).json({error: 'Failed to generate speech', details: err.message});
  }
}
