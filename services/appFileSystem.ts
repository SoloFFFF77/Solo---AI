// This file holds a virtual representation of the application's file system.
// It allows the AI to read and write files in memory.

interface AppFileSystem {
  files: Record<string, string>;
  getFiles: () => string[];
  readFile: (path: string) => string | undefined;
  writeFile: (path: string, content: string) => void;
}

const initialFiles: Record<string, string> = {
  'index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);`,
  'metadata.json': `{
  "name": "NeoManus AI",
  "description": "A modern AI assistant app with a futuristic UI, featuring AI chat with voice support and an AI image generator, inspired by Manus AI.",
  "requestFramePermissions": [
    "microphone"
  ]
}`,
  'index.html': `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NeoManus AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Poppins', 'sans-serif'],
            },
            colors: {
              'dark-bg': '#0D0B12',
              'dark-card': '#1A1625',
              'dark-accent': '#29243A',
              'brand-blue': '#00AFFF',
              'brand-purple': '#A700FF',
              'brand-pink': '#F42D87',
            },
            boxShadow: {
              'glow-blue': '0 0 20px rgba(0, 175, 255, 0.6), 0 0 30px rgba(0, 175, 255, 0.4)',
              'glow-purple': '0 0 20px rgba(167, 0, 255, 0.6), 0 0 30px rgba(167, 0, 255, 0.4)',
              'glow-orb': '0 0 40px rgba(167, 0, 255, 0.7), 0 0 60px rgba(0, 175, 255, 0.5)',
            }
          },
        }
      }
    </script>
  <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "lucide-react": "https://aistudiocdn.com/lucide-react@^0.546.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.27.0",
    "firebase/app": "https://aistudiocdn.com/firebase@^12.4.0/app",
    "firebase/auth": "https://aistudiocdn.com/firebase@^12.4.0/auth",
    "firebase/": "https://aistudiocdn.com/firebase@^12.4.0/"
  }
}
</script>
</head>
  <body class="bg-dark-bg bg-gradient-to-br from-dark-bg via-[#100E17] to-[#1A1625]">
    <div id="root"></div>
  </body>
</html>`,
  'App.tsx': `import React, { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './views/ChatView';
import { ImageView } from './views/ImageView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';
import { VoiceView } from './views/VoiceView';
import { BuildView } from './views/BuildView';
import { useAuth } from './contexts/AuthContext';
import { LoginView } from './views/LoginView';

export type Tab = 'chat' | 'image' | 'voice' | 'build' | 'settings' | 'profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatView />;
      case 'image':
        return <ImageView />;
      case 'voice':
        return <VoiceView />;
      case 'build':
        return <BuildView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <ChatView />;
    }
  };

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="font-sans antialiased text-gray-200 bg-transparent h-screen w-screen flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-28">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;`,
  'types.ts': `export type Role = 'user' | 'model' | 'system';

export interface Message {
  role: Role;
  text: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type Personality = 'default' | 'formal' | 'friendly' | 'witty';

export const personalities: Record<Personality, { name: string; instruction: string }> = {
  default: {
    name: "NeoManus",
    instruction: "You are NeoManus, a futuristic and helpful AI assistant. You are concise, knowledgeable, and slightly futuristic in your tone."
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
};`,
  'services/geminiService.ts': `import { GoogleGenAI, Chat, Modality, LiveServerMessage, LiveSession, Blob, Type } from "@google/genai";
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
        return \`data:image/png;base64,\${base64ImageBytes}\`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

export const connectLive = (
  systemInstruction: string,
  callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
  }
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
    },
  });

  return sessionPromise;
};

export const generateCodeChanges = async (
  prompt: string,
  files: Record<string, string>
): Promise<{ summary: string; changes: { filePath: string; newContent: string }[] }> => {
  if (!API_KEY) {
    throw new Error("API key not configured");
  }

  const systemInstruction = \`You are an expert senior frontend developer. Your task is to modify the provided application files based on the user's request.
The application is built with React, TypeScript, and Tailwind CSS, using lucide-react for icons.
You must respond ONLY with a single valid JSON object. Do not include any other text, markdown formatting, or code fences in your response.
The JSON object must have two keys: "summary" (a brief, user-friendly summary of the changes you made) and "changes" (an array of file modification objects).
Each file modification object must have two keys: "filePath" (the full path of the file to change) and "newContent" (the complete new content of that file as a string).
Ensure the new code is clean, correct, and adheres to the existing project structure and style.
Do not modify 'services/appFileSystem.ts'.\`;

  const fullPrompt = \`USER REQUEST: "\${prompt}"

CURRENT FILES:
\${JSON.stringify(files, null, 2)}
\`;

  try {
    const response = await ai.models.generateContent({
      model: codeModel,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });
    
    const jsonText = response.text.trim();
    // In case the model still wraps it in markdown
    const cleanedJson = jsonText.replace(/^\\\`\\\`\\\`json\\s*|\\\`\\\`\\\`\\s*$/g, '');
    return JSON.parse(cleanedJson);

  } catch (error) {
    console.error("Code generation error:", error);
    throw new Error("Failed to generate code changes. The AI might have returned an invalid response.");
  }
};`,
  'components/SplashScreen.tsx': `
import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-dark-bg flex items-center justify-center z-50">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg blur opacity-75 animate-pulse"></div>
        <div className="relative px-7 py-4 bg-dark-card rounded-lg leading-none flex items-center">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
            NeoManus AI
          </span>
        </div>
      </div>
    </div>
  );
};`,
  'components/BottomNav.tsx': `import React from 'react';
import { MessageSquare, Image as ImageIcon, Settings, User, Radio, Terminal } from 'lucide-react';
import { Tab } from '../App';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = 'text-brand-blue drop-shadow-[0_0_10px_rgba(0,175,255,0.8)]';
  const inactiveClasses = 'text-gray-400 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={\`flex flex-col items-center justify-center w-full transition-all duration-300 \${isActive ? activeClasses : inactiveClasses}\`}
      aria-label={label}
    >
      <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
    </button>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'voice', icon: Radio, label: 'Voice' },
    { id: 'build', icon: Terminal, label: 'Build' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-dark-card/50 backdrop-blur-xl border-t border-dark-accent z-10">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </div>
    </div>
  );
};`,
  'views/ChatView.tsx': `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Bot, User, Trash2 } from 'lucide-react';
import { Message } from '../types';
import { sendMessageStream, startChat } from '../services/geminiService';
import { useSettings } from '../hooks/useSettings';
import { personalities } from '../types';

declare const webkitSpeechRecognition: any;

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1 p-2">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
  </div>
);

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { personality } = useSettings();

  useEffect(() => {
    startChat(personalities[personality].instruction);
    setMessages([]);
  }, [personality]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;
    const userInput: Message = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userInput]);
    setInput('');
    setIsSending(true);

    const modelResponse: Message = { role: 'model', text: '' };
    setMessages((prev) => [...prev, modelResponse]);

    let fullResponse = '';
    await sendMessageStream(
      userInput.text,
      (chunk) => {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, text: fullResponse } : msg
          )
        );
      },
      (error) => {
         setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, text: error } : msg
          )
        );
      }
    );
    
    setIsSending(false);

    if ('speechSynthesis' in window && fullResponse) {
      const utterance = new SpeechSynthesisUtterance(fullResponse);
      speechSynthesis.speak(utterance);
    }
  }, [input, isSending]);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Your browser doesn't support speech recognition.");
        return;
    }
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Automatically send after voice input
        setTimeout(() => document.getElementById('orb-button')?.click(), 100);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };
  
  const clearChat = () => {
    startChat(personalities[personality].instruction);
    setMessages([]);
  };

  const handleOrbClick = () => {
    if (input.trim()) {
      handleSend();
    } else {
      handleVoiceInput();
    }
  };

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="flex-1 overflow-y-auto space-y-6 px-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <Bot size={48} className="mb-4 text-brand-purple" />
            <h1 className="text-2xl font-bold">NeoManus AI</h1>
            <p>Your futuristic AI assistant.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={\`flex items-start gap-3 w-full \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl text-base \${msg.role === 'user' ? 'bg-brand-blue/80 text-white rounded-br-none' : 'bg-dark-card text-gray-300 rounded-bl-none'}\`}>
              {msg.text || <TypingIndicator />}
            </div>
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>
      
      <div className="fixed bottom-24 left-0 right-0 px-4 z-20">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex-1 flex items-center bg-dark-card/80 backdrop-blur-sm p-1 pr-3 rounded-full border border-dark-accent">
            <button onClick={clearChat} className="p-2 rounded-full text-gray-400 hover:bg-dark-accent hover:text-white transition-colors">
                <Trash2 size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message..."
              className="w-full bg-transparent focus:outline-none placeholder-gray-500 pl-2"
              disabled={isSending}
            />
          </div>
          <button 
            id="orb-button"
            onClick={handleOrbClick} 
            disabled={isSending && !input.trim()} 
            className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-purple rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-orb hover:scale-105 transition-transform"
          >
            {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (input.trim() ? <Send size={24} /> : <Mic size={24} />)}
          </button>
        </div>
      </div>
    </div>
  );
};`,
  'views/ImageView.tsx': `import React, { useState } from 'react';
import { Download, Share2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { generateImage } from '../services/geminiService';

export const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    const result = await generateImage(prompt);
    if (result) {
      setImageUrl(result);
    } else {
      setError('Failed to generate image. Please try again.');
    }
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'neomanus-ai-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageUrl || !navigator.share) {
        alert("Your browser doesn't support the Share API.");
        return;
    }
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'neomanus-ai-image.png', { type: blob.type });
        await navigator.share({
            title: 'AI Image from NeoManus',
            text: \`Generated with prompt: "\${prompt}"\`,
            files: [file],
        });
    } catch (err) {
        console.error('Share failed:', err);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-purple text-transparent bg-clip-text text-center pt-4">Image Generator</h1>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-lg p-2 bg-dark-card rounded-xl border border-dark-accent shadow-lg">
          {imageUrl ? (
            <img src={imageUrl} alt="Generated by AI" className="rounded-lg w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-dark-accent/50 rounded-lg flex flex-col items-center justify-center text-gray-500">
              {isLoading ? (
                  <>
                    <Loader2 size={48} className="animate-spin text-brand-blue mb-4" />
                    <p>Generating your masterpiece...</p>
                  </>
              ) : (
                  <>
                    <ImageIcon size={48} className="mb-4" />
                    <p>Your generated image will appear here</p>
                  </>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {imageUrl && (
          <div className="flex items-center gap-4">
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-dark-accent text-white rounded-lg hover:bg-brand-blue transition-colors">
              <Download size={18} /> Download
            </button>
            {navigator.share && (
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-dark-accent text-white rounded-lg hover:bg-brand-purple transition-colors">
                  <Share2 size={18} /> Share
                </button>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 z-20">
        <div className="bg-dark-card/80 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3 border border-dark-accent max-w-lg mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image..."
            className="flex-1 bg-transparent focus:outline-none placeholder-gray-500"
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="bg-brand-purple px-5 py-2 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-purple transition-shadow">
            {isLoading ? <Loader2 className="animate-spin"/> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};`,
  'views/SettingsView.tsx': `import React from 'react';
import { Bot, Info, Code } from 'lucide-react';
import { personalities, Personality } from '../types';
import { useSettings } from '../hooks/useSettings';

interface SettingsViewProps {}

const SettingsCard: React.FC<{ children: React.ReactNode, title: string, icon: React.ElementType }> = ({ children, title, icon: Icon }) => (
    <div className="bg-dark-card border border-dark-accent rounded-xl p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
            <Icon className="text-brand-purple" size={20} />
            {title}
        </h2>
        {children}
    </div>
);

export const SettingsView: React.FC<SettingsViewProps> = () => {
    const { personality, setPersonality } = useSettings();

  return (
    <div className="h-full p-4 space-y-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-purple text-transparent bg-clip-text text-center pt-4">Settings</h1>

      <SettingsCard title="AI Personality" icon={Bot}>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(personalities).map((key) => {
            const p = key as Personality;
            return (
              <button
                key={p}
                onClick={() => setPersonality(p)}
                className={\`w-full flex justify-center items-center gap-2 p-3 rounded-lg text-sm transition-all duration-300 transform \${
                  personality === p
                    ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-glow-blue scale-105'
                    : 'bg-dark-accent text-gray-400 hover:bg-dark-accent/70 hover:text-white'
                }\`}
              >
                <span>{personalities[p].name}</span>
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="About" icon={Info}>
        <div className="space-y-3 text-gray-400">
            <div className="flex items-center gap-3">
                <Info size={20} className="text-brand-blue"/>
                <span>Version: 1.1.0</span>
            </div>
            <div className="flex items-center gap-3">
                <Code size={20} className="text-brand-pink"/>
                <span>Developer: Prabesh Malla</span>
            </div>
        </div>
      </SettingsCard>

    </div>
  );
};`,
  'views/ProfileView.tsx': `import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';


export const ProfileView: React.FC = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 space-y-6 text-center">
      <div className="p-6 bg-dark-accent rounded-full border-2 border-brand-purple shadow-glow-purple">
        <User size={64} className="text-brand-purple" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-brand-blue mt-1">{user?.email}</p>
      </div>
      <p className="text-gray-400 max-w-md">
        Future updates will include profile customization, saved history, and more personalized features.
      </p>
      <button 
        onClick={handleSignOut} 
        className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-pink/20 border border-brand-pink text-brand-pink rounded-lg hover:bg-brand-pink hover:text-white transition-colors duration-300">
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
};`,
  'hooks/useSettings.ts': `import { useState, useEffect, useCallback } from 'react';
import { Personality } from '../types';

export const useSettings = () => {
  const [personality, setPersonalityState] = useState<Personality>('default');

  useEffect(() => {
    const storedPersonality = (localStorage.getItem('personality') as Personality) || 'default';
    setPersonalityState(storedPersonality);
  }, []);

  const setPersonality = (newPersonality: Personality) => {
    localStorage.setItem('personality', newPersonality);
    setPersonalityState(newPersonality);
  };

  return { personality, setPersonality };
};`,
  'services/firebase.ts': `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// IMPORTANT: Please replace this with your own Firebase project configuration.
// You can find this in your project's settings in the Firebase console.
// The current values are placeholders and will prevent the login/signup from working.
const firebaseConfig = {
  apiKey: "AIzaSyCOF7sxWB2uZHG-EhTMr8P7wQ6F1cuBtaI",
  authDomain: "solo-touup-hub.firebaseapp.com",
  databaseURL: "https://solo-touup-hub-default-rtdb.firebaseio.com",
  projectId: "solo-touup-hub",
  storageBucket: "solo-touup-hub.firebasestorage.app",
  messagingSenderId: "600041636173",
  appId: "1:600041636173:web:a1b2c3d4e5f6a7b8c9d0e1" // This is a generic/placeholder App ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);`,
  'contexts/AuthContext.tsx': `import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};`,
  'views/LoginView.tsx': `import React, { useState } from 'react';
import { Bot, Mail, Lock } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { auth } from '../services/firebase';

type FormMode = 'signin' | 'signup';

const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email address is already in use.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

export const LoginView: React.FC = () => {
    const [mode, setMode] = useState<FormMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            const authError = err as AuthError;
            console.error(authError.code);
            setError(getFriendlyErrorMessage(authError.code));
        } finally {
            setIsLoading(false);
        }
    };
    
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-dark-accent rounded-full border-2 border-brand-purple shadow-glow-purple mb-4">
                <Bot size={40} className="text-brand-purple" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                NeoManus AI
            </h1>
            <p className="text-gray-400">Sign in to continue</p>
        </div>

        <div className="bg-dark-card border border-dark-accent rounded-xl p-4 mb-6">
            <div className="flex border-b border-dark-accent mb-4">
                <button onClick={() => { setMode('signin'); setError(null); }} className={\`flex-1 p-3 text-center font-semibold transition-colors \${mode === 'signin' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}\`}>Sign In</button>
                <button onClick={() => { setMode('signup'); setError(null); }} className={\`flex-1 p-3 text-center font-semibold transition-colors \${mode === 'signup' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-500'}\`}>Sign Up</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                    <input 
                        type="email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-dark-accent border border-transparent focus:border-brand-blue rounded-lg p-3 pl-10 transition-colors focus:outline-none"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-dark-accent border border-transparent focus:border-brand-purple rounded-lg p-3 pl-10 transition-colors focus:outline-none"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-3 font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};`,
  'views/VoiceView.tsx': `import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Radio, Loader2, XCircle } from 'lucide-react';
import { connectLive } from '../services/geminiService';
import { useSettings } from '../hooks/useSettings';
import { personalities } from '../types';
import { LiveSession, LiveServerMessage, Blob, Modality } from '@google/genai';

// Audio Encoding & Decoding helpers
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

export const VoiceView: React.FC = () => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { personality } = useSettings();

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const cleanup = useCallback(() => {
        console.log('Cleaning up resources...');
        sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
        sessionPromiseRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;
        
        inputAudioContextRef.current?.close().catch(() => {});
        inputAudioContextRef.current = null;

        outputAudioContextRef.current?.close().catch(() => {});
        outputAudioContextRef.current = null;

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const handleStopChat = useCallback(() => {
        cleanup();
        setVoiceState('idle');
    }, [cleanup]);

    const handleStartChat = useCallback(async () => {
        setVoiceState('connecting');
        setErrorMessage('');

        try {
            // Get microphone permissions and stream
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Setup audio contexts
            // FIX: Cast window to any to support webkitAudioContext for older browsers.
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputAudioContext;
            // FIX: Cast window to any to support webkitAudioContext for older browsers.
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputAudioContext;
            nextStartTimeRef.current = outputAudioContext.currentTime;

            const sessionPromise = connectLive(
                personalities[personality].instruction,
                {
                    onopen: () => console.log('Live session opened'),
                    onmessage: async (message: LiveServerMessage) => {
                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64EncodedAudioString && outputAudioContextRef.current) {
                            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            source.start(nextStartTime);
                            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;

                            sourcesRef.current.add(source);
                            source.onended = () => sourcesRef.current.delete(source);
                        }
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setErrorMessage('Connection error. Please try again.');
                        setVoiceState('error');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed');
                        handleStopChat();
                    },
                }
            );
            sessionPromiseRef.current = sessionPromise;

            const source = inputAudioContext.createMediaStreamSource(streamRef.current);
            mediaStreamSourceRef.current = source;

            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            await sessionPromise;
            setVoiceState('active');

        } catch (err) {
            console.error("Failed to start voice chat:", err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setErrorMessage('Microphone access denied. Please allow it in your browser settings.');
                } else {
                    setErrorMessage(err.message || 'An unknown error occurred.');
                }
            }
            setVoiceState('error');
            cleanup();
        }
    }, [personality, cleanup, handleStopChat]);
    
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const toggleChat = () => {
        if (voiceState === 'active') {
            handleStopChat();
        } else if (voiceState === 'idle' || voiceState === 'error') {
            handleStartChat();
        }
    };

    const OrbIcon = () => {
        switch(voiceState) {
            case 'idle': return <Mic size={50} />;
            case 'connecting': return <Loader2 size={50} className="animate-spin text-brand-blue" />;
            case 'active': return <Radio size={50} className="text-brand-pink animate-pulse" />;
            case 'error': return <XCircle size={50} className="text-red-500" />;
            default: return null;
        }
    };

    const StatusText = () => {
        switch(voiceState) {
            case 'idle': return "Tap the orb to start";
            case 'connecting': return "Connecting...";
            case 'active': return "Conversation is live...";
            case 'error': return errorMessage || "An error occurred";
            default: return "";
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-brand-purple text-transparent bg-clip-text mb-4">
                Voice Chat
            </h1>
            <p className="text-gray-400 mb-12 max-w-xs">
                Engage in a real-time voice conversation with the AI.
            </p>

            <div className="relative flex items-center justify-center w-48 h-48">
                <div className={\`absolute w-full h-full bg-brand-purple rounded-full blur-2xl transition-opacity duration-1000 \${voiceState === 'active' ? 'opacity-40 animate-pulse' : 'opacity-0'}\`}></div>
                <button 
                    onClick={toggleChat} 
                    className="relative w-40 h-40 bg-dark-card border-2 border-dark-accent rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50" 
                    disabled={voiceState === 'connecting'}
                    aria-label={voiceState === 'active' ? 'Stop chat' : 'Start chat'}
                >
                    <OrbIcon />
                </button>
            </div>

            <p className="mt-8 text-lg text-gray-300 h-8 transition-opacity duration-300">
                <StatusText />
            </p>
        </div>
    );
};`,
  'views/BuildView.tsx': `import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { appFileSystem } from '../services/appFileSystem';
import { generateCodeChanges } from '../services/geminiService';
import { Message } from '../types';

export const BuildView: React.FC = () => {
  const [fileList, setFileList] = useState<string[]>(appFileSystem.getFiles());
  const [activeFile, setActiveFile] = useState<string | null>(fileList[0] || null);
  const [fileContent, setFileContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeFile) {
      setFileContent(appFileSystem.readFile(activeFile) || 'File not found.');
    }
  }, [activeFile]);
  
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const currentFiles = appFileSystem.files;
      const result = await generateCodeChanges(userMessage.text, currentFiles);
      
      result.changes.forEach(change => {
        appFileSystem.writeFile(change.filePath, change.newContent);
      });

      const aiMessage: Message = { role: 'model', text: result.summary };
      setMessages(prev => [...prev, aiMessage]);

      // Refresh file list and content if active file was changed
      setFileList(appFileSystem.getFiles());
      if (activeFile && result.changes.some(c => c.filePath === activeFile)) {
        setFileContent(appFileSystem.readFile(activeFile) || '');
      }
      
    } catch (error) {
        const errorMessage: Message = { role: 'model', text: (error as Error).message };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-row text-sm">
      {/* File Explorer */}
      <aside className="w-1/4 h-full bg-dark-card border-r border-dark-accent p-2 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-300 p-2 mb-2">File Explorer</h2>
        <ul>
          {fileList.map(file => (
            <li key={file}>
              <button
                onClick={() => setActiveFile(file)}
                className={\`w-full text-left flex items-center gap-2 p-2 rounded-md transition-colors \${
                  activeFile === file ? 'bg-brand-blue/20 text-brand-blue' : 'hover:bg-dark-accent'
                }\`}
              >
                <FileCode size={16} />
                <span>{file.split('/').pop()}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Code & Chat View */}
      <main className="w-3/4 h-full flex flex-col">
        {/* Code Viewer */}
        <div className="flex-grow h-1/2 relative">
            <div className="absolute top-2 right-3 p-2 bg-dark-accent rounded-lg text-xs text-gray-400 flex items-center gap-2">
                <RefreshCw size={14} /> 
                <span>Changes are virtual. Refresh app to reset.</span>
            </div>
            <pre className="h-full overflow-auto p-4 text-gray-300 bg-dark-bg">
                <code className="font-mono">{fileContent}</code>
            </pre>
        </div>

        {/* Chat Area */}
        <div className="flex-shrink-0 h-1/2 flex flex-col border-t border-dark-accent bg-dark-bg/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <Bot size={40} className="mb-4 text-brand-purple" />
                    <h1 className="text-xl font-bold">Code Builder AI</h1>
                    <p>Describe the changes you want to make to the code.</p>
                 </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={\`flex items-start gap-3 max-w-4xl mx-auto \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div className={\`p-3 rounded-lg \${msg.role === 'user' ? 'bg-brand-blue/80 text-white' : 'bg-dark-card'}\`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatScrollRef}></div>
          </div>
          <div className="p-4 border-t border-dark-accent">
            <div className="flex items-center gap-3 bg-dark-card p-2 rounded-lg border border-dark-accent/50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="e.g., 'Change the header in ImageView to be pink'"
                className="w-full bg-transparent focus:outline-none placeholder-gray-500"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-brand-purple rounded-lg text-white disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};`,
};

export const appFileSystem: AppFileSystem = {
  files: { ...initialFiles },

  getFiles() {
    return Object.keys(this.files).sort();
  },

  readFile(path) {
    return this.files[path];
  },

  writeFile(path, content) {
    if (this.files[path] !== undefined) {
      this.files[path] = content;
    } else {
      // In this simple model, we don't allow creating new files via AI
      // to prevent potential misuse.
      console.warn(`Attempted to write to a non-existent file: ${path}`);
    }
  },
};