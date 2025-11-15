import { GoogleGenAI, Chat, Modality, LiveServerMessage, LiveSession, Blob, Type } from "@google/genai";
import { Message } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want a better way to handle this,
  // but for this example, we'll throw an error.
  // The UI should gracefully handle the absence of the key.
  console.warn("API_KEY environment variable not set. App will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';
// Fix: Add codeModel for the code generation functionality.
const codeModel = 'gemini-2.5-pro';

let chat: Chat | null = null;

export const startChat = (systemInstruction: string) => {
  if (!API_KEY) return;
  chat = ai.chats.create({
    model: textModel,
    history: [],
    config: {
      systemInstruction: systemInstruction
    }
  });
};

export const sendMessageStream = async (
  message: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void
): Promise<void> => {
  if (!chat) {
    onError("Chat not initialized. Please select a personality in settings.");
    return;
  }
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    onError("Sorry, I couldn't process that. Please try again.");
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  if (!API_KEY) return null;
  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

// Fix: Add the missing generateVideo function for the VideoView.
export const generateVideo = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API key not configured");
  }

  // Per guidelines, create a new instance before API call to ensure it uses the most up-to-date API key.
  const aiForVideo = new GoogleGenAI({ apiKey: API_KEY! });
  
  let operation = await aiForVideo.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await aiForVideo.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation failed: no download link found.");
  }
  
  // The component will fetch this URL with the appended API key.
  return `${downloadLink}&key=${API_KEY}`;
};


export const connectLive = (
  systemInstruction: string,
  callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
  },
  extraConfig: Record<string, any> = {}
): Promise<LiveSession> => {
  if (!API_KEY) {
    // This will be caught by the calling component
    return Promise.reject(new Error("API key not configured"));
  }

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: systemInstruction,
      ...extraConfig,
    },
  });

  return sessionPromise;
};

// Fix: Add the missing generateCodeChanges function.
export const generateCodeChanges = async (
  prompt: string,
  files: Record<string, string>
): Promise<{ summary: string; changes: { filePath: string; newContent: string }[] }> => {
  if (!API_KEY) {
    throw new Error("API key not configured");
  }

  const systemInstruction = `You are an expert senior frontend developer. Your task is to modify the provided application files based on the user's request.
The application is built with React, TypeScript, and Tailwind CSS, using lucide-react for icons.
You must respond ONLY with a single valid JSON object. Do not include any other text, markdown formatting, or code fences in your response.
The JSON object must have two keys: "summary" (a brief, user-friendly summary of the changes you made) and "changes" (an array of file modification objects).
Each file modification object must have two keys: "filePath" (the full path of the file to change) and "newContent" (the complete new content of that file as a string).
Ensure the new code is clean, correct, and adheres to the existing project structure and style.
Do not modify 'services/appFileSystem.ts'.`;

  const fullPrompt = `USER REQUEST: "${prompt}"

CURRENT FILES:
${JSON.stringify(files, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: codeModel,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });
    
    let jsonText = response.text.trim();
    
    // Safeguard to handle if the model wraps the JSON in markdown fences
    if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Code generation error:", error);
    throw new Error("Failed to generate code changes. The AI might have returned an invalid response.");
  }
};