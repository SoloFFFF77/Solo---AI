import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Video, Loader2, XCircle, SwitchCamera } from 'lucide-react';
import { connectLive } from '../services/geminiService';
import { LiveSession, LiveServerMessage, Blob } from '@google/genai';

// --- Helper Functions ---
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
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

function createAudioBlob(data: Float32Array): Blob {
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- Component ---
type LiveState = 'idle' | 'connecting' | 'active' | 'error';
const FRAME_RATE = 2; // frames per second
const JPEG_QUALITY = 0.7;

export const LiveView: React.FC = () => {
  const [liveState, setLiveState] = useState<LiveState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcription, setTranscription] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;

    sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
    sessionPromiseRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if(videoRef.current) videoRef.current.srcObject = null;

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
    setLiveState('idle');
    setTranscription('');
  }, [cleanup]);

  const handleStartChat = useCallback(async (mode: 'user' | 'environment') => {
    setLiveState('connecting');
    setErrorMessage('');
    setTranscription('');
    let currentOutputTranscription = '';

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: mode } });
      if(videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;
      nextStartTimeRef.current = outputAudioContext.currentTime;

      const sessionPromise = connectLive(
        "You are Solo AI, a helpful AI assistant. Your task is to observe the user's surroundings through their camera and describe what you see. Respond to their questions and comments about the objects and environment in the video feed. Keep your descriptions concise and engaging.",
        {
            onopen: () => {
                if (!videoRef.current || !canvasRef.current) return;
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                const ctx = canvasEl.getContext('2d');
                if(!ctx) return;

                frameIntervalRef.current = window.setInterval(() => {
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                    ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                    canvasEl.toBlob(
                        async (blob) => {
                            if (blob) {
                                const base64Data = await blobToBase64(blob);
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                                });
                            }
                        }, 'image/jpeg', JPEG_QUALITY);
                }, 1000 / FRAME_RATE);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscription += text;
                    setTranscription(currentOutputTranscription);
                }
                if (message.serverContent?.turnComplete) {
                    currentOutputTranscription = '';
                }

                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (audioData && outputAudioContextRef.current) {
                    const audioContext = outputAudioContextRef.current;
                    const audioBuffer = await decodeAudioData(decode(audioData), audioContext);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    
                    const nextStartTime = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                    source.start(nextStartTime);
                    nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                    sourcesRef.current.add(source);
                    source.onended = () => sourcesRef.current.delete(source);
                }
            },
            onerror: (e: ErrorEvent) => {
                setErrorMessage('Connection error. Please try again.');
                setLiveState('error');
                cleanup();
            },
            onclose: (e: CloseEvent) => handleStopChat(),
        },
        { outputAudioTranscription: {} }
      );
      sessionPromiseRef.current = sessionPromise;

      const source = inputAudioContext.createMediaStreamSource(streamRef.current);
      mediaStreamSourceRef.current = source;
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;
      scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmBlob = createAudioBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);

      await sessionPromise;
      setLiveState('active');
    } catch (err) {
      console.error("Failed to start live chat:", err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setErrorMessage('Camera/Mic access denied.');
      } else {
        setErrorMessage('Failed to start session.');
      }
      setLiveState('error');
      cleanup();
    }
  }, [cleanup, handleStopChat]);

  const handleSwitchCamera = useCallback(() => {
    if (liveState !== 'active') return;

    cleanup();

    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    handleStartChat(newMode);
  }, [liveState, cleanup, facingMode, handleStartChat]);

  useEffect(() => () => cleanup(), [cleanup]);

  const toggleChat = () => {
    if (liveState === 'active') {
      handleStopChat();
    } else if (liveState === 'idle' || liveState === 'error') {
      handleStartChat(facingMode);
    }
  };
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative bg-black">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end items-center p-8">
        {transcription && liveState === 'active' && (
          <p className="text-xl font-medium text-white mb-6 text-center drop-shadow-lg p-2 bg-black/30 rounded-lg">
            {transcription}
          </p>
        )}
        
        <div className="flex items-center justify-center gap-8 w-full max-w-sm">
            <div className="flex-1 flex justify-end">
                {/* Reserved for future controls */}
            </div>

            <div className="relative flex items-center justify-center w-32 h-32">
              <div className={`absolute w-full h-full bg-brand-purple rounded-full blur-2xl transition-opacity duration-1000 ${liveState === 'active' ? 'opacity-40 animate-pulse' : 'opacity-0'}`}></div>
              <button onClick={toggleChat} disabled={liveState === 'connecting'} className="relative w-24 h-24 bg-dark-card border-2 border-dark-accent rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                {liveState === 'idle' && <Camera size={40} />}
                {liveState === 'connecting' && <Loader2 size={40} className="animate-spin text-brand-blue" />}
                {liveState === 'active' && <Video size={40} className="text-brand-pink animate-pulse" />}
                {liveState === 'error' && <XCircle size={40} className="text-red-500" />}
              </button>
            </div>
            
            <div className="flex-1 flex justify-start">
                {liveState === 'active' && (
                    <button
                        onClick={handleSwitchCamera}
                        className="w-16 h-16 bg-dark-card/70 backdrop-blur-sm border border-dark-accent rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-brand-blue transition-all"
                        aria-label="Switch camera"
                    >
                        <SwitchCamera size={26} />
                    </button>
                )}
            </div>
        </div>
        
        <p className="mt-4 text-lg text-gray-300 h-8">
          {liveState === 'idle' && "Tap to start Camera View"}
          {liveState === 'connecting' && "Connecting..."}
          {liveState === 'active' && "Camera session active"}
          {liveState === 'error' && errorMessage}
        </p>
      </div>
    </div>
  );
};
