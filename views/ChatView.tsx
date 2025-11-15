import React, { useState, useEffect, useRef, useCallback } from 'react';
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
            <h1 className="text-2xl font-bold">Solo AI</h1>
            <p>Your futuristic AI assistant.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl text-base ${msg.role === 'user' ? 'bg-brand-blue/80 text-white rounded-br-none' : 'bg-dark-card text-gray-300 rounded-bl-none'}`}>
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
};
