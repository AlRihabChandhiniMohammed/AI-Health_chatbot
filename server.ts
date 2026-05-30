/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup failures on missing environment secrets
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GEMMA_API_KEY is not defined. Please configure your API Key in Settings > Secrets.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to retry Gemini API calls if they experience transient errors (503, overloads, high demand)
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errStr = String(error.message || error);
    const isTransient = 
      errStr.includes("503") || 
      errStr.includes("UNAVAILABLE") || 
      errStr.includes("429") || 
      errStr.includes("high demand") || 
      errStr.includes("overloaded") ||
      errStr.includes("temporary") ||
      errStr.includes("try again later");
      
    if (isTransient && retries > 1) {
      console.warn(`[Gemini API] Transient collision detected. Retrying in ${delay}ms... (${retries - 1} retries left). Error: ${errStr}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 1. Health Status API
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiConfigured: !!(process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY)
  });
});

// 2. Multilingual Clinical Virtual Assistant Chat API
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, previousMessages = [], language = "en" } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const ai = getGeminiClient();

    // Context instructions in different native languages
    const languageDirectives: Record<string, string> = {
      en: "Please complete your response in clear English language.",
      hi: "कृपया हिंदी भाषा में अपनी प्रतिक्रिया दें। (Provide translation/retaining key medical terminology in clear, easy-to-read Hindi script).",
      te: "దయచేసి మీ సమాధానాన్ని తెలుగులో అందించండి. (Provide response in Telugu script with clear spacing and terms)."
    };

    const sysInstruction = `You are a highly qualified, professional, and compassionate AI Clinical Assistant and Medical Knowledge Specialist.
Your task is to answer health-related questions, explain complex medical concepts or symptoms in clear layman's language, suggest likely considerations, and recommend precise, safe pathways of action.

Your response MUST be beautifully structured with clear headings (using ###), clear lists, and bold critical phrases. Please split your advice into the following sections:

### 🩺 Clinical considerations
(Provide brief, reassuring, and highly accurate explanations of the symptoms or topic. Mention 2-3 potential considerations or issues without diagnosing definitively.)

### 🚦 Recommended Triage Pathway
(Choose exactly one of the pathways below to explicitly highlight and bold, explaining clearly why this path is appropriate):
- **REST_AT_HOME**: For self-treatable, minor symptoms like mild fatigue, standard soreness, or a standard common cold.
- **VISIT_CLINIC**: For persistent or moderate symptoms requiring non-urgent consultation with a primary care doctor.
- **VISIT_SPECIALIST**: For localized or systemic conditions requiring specialized experts (e.g. Cardiologist, Neurologist, Orthopedic, Dermatologist).
- **SEEK_EMERGENCY**: Urgent red flags like chest pain, extreme breathing difficulties, high trauma, or severe acute deficits.

### 📋 Practical Self-Care & Support Steps
(Give 3-4 bullet-point actionable lifestyle adjustments, general home-care recommendations, hydration advice, or safety guards.)

### ⚠️ Important Safety Notice
AI responses are informational only and are not a substitute for professional medical advice. Always consult a healthcare professional.

Language constraint: ${languageDirectives[language] || languageDirectives.en}`;

    // Map history to the required format
    // We construct standard chat history for Gemini 3
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.3,
      }
    });

    // Populate previous conversational context
    for (const historicMsg of previousMessages) {
      try {
        await retryWithBackoff(() => chat.sendMessage({ message: historicMsg.text }));
      } catch (e) {
        console.warn("Could not reload history chunk: ", e);
      }
    }

    const response = await retryWithBackoff(() => chat.sendMessage({ message }));
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("AI Assistant Error: ", err);
    res.status(500).json({
      error: "Could not generate conversational answer",
      details: err.message || String(err)
    });
  }
});

// 3. Clinical Auto-Symptom Scoping Checker
app.post("/api/symptom-check", async (req: Request, res: Response) => {
  try {
    const { symptoms, age, gender, duration, severity, language = "en" } = req.body;

    if (!symptoms) {
      res.status(400).json({ error: "Symptom description is required" });
      return;
    }

    const ai = getGeminiClient();

    const promptText = `Please perform a clinical diagnostic analysis for the following patient presentation:
    - Symptoms: ${symptoms}
    - Age: ${age}
    - Gender: ${gender}
    - Duration: ${duration}
    - Severity: ${severity}
    - Preferred Output Language: ${language}`;

    const promptSchema = `Analyze the patient symptoms and compile a beautifully designed differential assessment:

### 🔍 Clinical Differential Assessment
For each possible clinical consideration (min 2, max 4), format strictly as follows:
- **[Condition Name]**:
  - *Confidence*: [Low / Medium / High]
  - *Typical Severity*: [Mild / Moderate / Severe]
  - *Pathology Definition*: [Provide 2-3 sentences explaining the pathology and how it aligns with the symptoms.]

### 🏠 Self-Treatable & Preventive Care
Provide 3 structured, practical home management recommendations (diet, rest, observation logs).

### 🩺 Recommended Clinical Consultation Pathway
Highlight standard healthcare touchpoints (primary physician, special medical sub-disciplines) and recommended timeline.

### 🚨 Critical Red Flags (Emergency Triggers)
Detail urgent symptoms that warrant an immediate visit to an emergency room.

Always insert a strict professional warning box. Use the exact disclaimer: "AI responses are informational only and are not a substitute for professional medical advice."`;

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText + "\n\n" + promptSchema,
        config: {
          systemInstruction: "You are a professional, highly precise clinical triage specialist. Synthesize patient metrics and compile them them into premium structured healthcare advisories.",
          temperature: 0.15
        }
      })
    );

    res.json({ results: response.text });
  } catch (err: any) {
    console.error("Clinical Symptom Checker Error: ", err);
    res.status(500).json({
      error: "Failed to compile symptom telemetry",
      details: err.message || String(err)
    });
  }
});

// 4. Clinical Text-to-Speech Assist API (uses gemini-3.1-flash-tts-preview)
app.post("/api/speak", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required for TTS synthesis." });
      return;
    }

    const sanitizedText = text.replace(/[*_#\-`]/g, "").slice(0, 1000); // Strip basic markdown nodes and cap size

    const ai = getGeminiClient();

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Read this medical statement clearly: ${sanitizedText}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              // 'Fenrir' is clean and humanlike
              prebuiltVoiceConfig: { voiceName: "Fenrir" },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: "Speech synthesis was empty." });
      return;
    }

    res.json({ audio: base64Audio });
  } catch (err: any) {
    console.error("TTS Generator error: ", err);
    res.status(500).json({
      error: "Failed to generate vocal synthetic response.",
      details: err.message || String(err)
    });
  }
});

// 5. Medical Knowledge Base Categories Detail Fetch API
app.post("/api/knowledge-base", async (req: Request, res: Response) => {
  try {
    const { category, language = "en" } = req.body;
    if (!category) {
      res.status(400).json({ error: "Category key is required" });
      return;
    }

    const ai = getGeminiClient();

    const promptKB = `Generate a comprehensive medical knowledge factsheet on the category: "${category}".
    Include:
    - Overview & Definition
    - Common Symptoms / Warning signs
    - Key Diagnostic Checks & Metrics
    - Lifestyle changes & Preventive Nutrition
    - Standard medication classes (strictly noting consultation with a pharmacist/physician)

    Ensure the response is formatted as highly structured Markdown with bullet points, brief and scannable paragraphs. Use language: ${language}.
    Display a medical safety warning footer at the bottom.`;

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptKB,
        config: {
          temperature: 0.2
        }
      })
    );

    res.json({ results: response.text });
  } catch (err: any) {
    console.error("Knowledge Base Fetching Error: ", err);
    res.status(500).json({
      error: "Could not compile category encyclopedia",
      details: err.message || String(err)
    });
  }
});

// Vite server middleware load or static client serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Health Platform Engine] Listening on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Fatal Server Startup Error: ", e);
});
