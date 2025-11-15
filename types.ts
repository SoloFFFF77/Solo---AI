export type Role = 'user' | 'model' | 'system';

export interface Message {
  role: Role;
  text: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type Personality = 'default' | 'formal' | 'friendly' | 'witty';

export const personalities: Record<Personality, { name: string; instruction: string }> = {
  default: {
    name: "Solo AI",
    instruction: "You are Solo AI, a futuristic and helpful AI assistant. You are concise, knowledgeable, and slightly futuristic in your tone."
  },
  formal: {
    name: "Formal",
    instruction: "You are a professional assistant. Your responses should be structured, polite, and use formal language. Avoid slang and colloquialisms."
  },
  friendly: {
    name: "Friendly",
    instruction: "You are a friendly and approachable companion. Your tone should be warm, encouraging, and conversational. Feel free to use emojis."
  },
  witty: {
    name: "Witty",
    instruction: "You are a witty AI with a dry sense of humor. Your responses should be clever, sarcastic, and entertaining, while still being helpful."
  }
};