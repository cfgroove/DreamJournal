
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DreamAnalysis, ChatMessage, ImageSize } from "../types";

// Helper to get fresh client since API keys can change via the select dialog
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Transcribes audio and performs deep psychological analysis using a high-reasoning model
export const transcribeAndAnalyzeDream = async (audioBase64: string): Promise<{ transcript: string; analysis: DreamAnalysis }> => {
  const ai = getAIClient();
  
  const prompt = `Transcribe the following dream recording exactly. 
  After transcription, perform a deep psychological analysis based on Jungian archetypes and dream symbolism.
  Return the results in a JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: audioBase64
            }
          },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          analysis: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              emotionalTheme: { type: Type.STRING },
              archetypes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['name', 'description']
                }
              },
              keySymbols: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    interpretation: { type: Type.STRING }
                  },
                  required: ['symbol', 'interpretation']
                }
              }
            },
            required: ['summary', 'emotionalTheme', 'archetypes', 'keySymbols']
          }
        },
        required: ['transcript', 'analysis']
      }
    }
  });

  // Ensure text output is trimmed to handle potential model whitespace
  return JSON.parse(response.text.trim());
};

// Generates dream-inspired imagery using the Gemini 3 Pro image model
export const generateDreamImage = async (analysis: DreamAnalysis, size: ImageSize): Promise<string> => {
  const ai = getAIClient();
  
  const prompt = `A vivid, surrealist oil painting representing a dream with the core emotional theme: "${analysis.emotionalTheme}". 
  The painting should feature these symbols: ${analysis.keySymbols.map(s => s.symbol).join(', ')}. 
  Style: Surrealism, deeply atmospheric, evocative of Salvador Dali and Rene Magritte, ethereal lighting, dreamlike proportions.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Provides an interactive chat experience focused on Jungian dream analysis
export const chatAboutDream = async (
  dreamContext: string,
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are a professional Jungian dream analyst. You are helping the user explore their dream symbols. 
      Context of the dream: ${dreamContext}. 
      Be insightful, encouraging, and psychological. Focus on the collective unconscious and individual growth.`,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
