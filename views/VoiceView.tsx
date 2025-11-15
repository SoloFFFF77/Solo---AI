import React, { useState, useRef, useEffect, useCallback } from 'react';
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
                <div className={`absolute w-full h-full bg-brand-purple rounded-full blur-2xl transition-opacity duration-1000 ${voiceState === 'active' ? 'opacity-40 animate-pulse' : 'opacity-0'}`}></div>
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
};