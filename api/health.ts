import type {VercelRequest, VercelResponse} from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiConfigured: !!(process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY),
  });
}
