
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeRecording(base64Frame: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Frame,
            },
          },
          {
            text: "Based on this frame from a screen recording, generate a concise, professional title (3-6 words) and a short summary (1 sentence) of what the user is doing. Return as JSON."
          }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["title", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{"title": "Screen Recording", "summary": "No description available."}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { title: "Untitled Recording", summary: "Recording completed successfully." };
  }
}
