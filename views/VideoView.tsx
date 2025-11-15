import React, { useState, useEffect, useRef } from 'react';
import { Video, Loader2, Download, Share2, KeyRound } from 'lucide-react';
import { generateVideo } from '../services/geminiService';


const loadingMessages = [
    "Warming up the digital director...",
    "Scripting the first scene...",
    "Casting pixel actors...",
    "Rolling the virtual camera...",
    "Processing dailies...",
    "Editing the first cut...",
    "Adding special effects...",
    "Rendering the final masterpiece...",
];

export const VideoView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const loadingIntervalRef = useRef<number | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    const checkApiKey = async () => {
        setIsCheckingApiKey(true);
        // Ensure window.aistudio is available
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } else {
            // Fallback for environments where aistudio is not present
            console.warn('window.aistudio not found. Assuming API key is set via environment variable.');
            setApiKeySelected(true); 
        }
        setIsCheckingApiKey(false);
    };

    useEffect(() => {
        checkApiKey();
    }, []);

    useEffect(() => {
        if (isLoading) {
            loadingIntervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        } else {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
                loadingIntervalRef.current = null;
            }
        }
        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
    }, [isLoading]);

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);
        
        try {
            const videoUri = await generateVideo(prompt);
            const response = await fetch(videoUri);
            if (!response.ok) throw new Error(`Failed to fetch video data. Status: ${response.status}`);
            const blob = await response.blob();
            const videoDataUrl = URL.createObjectURL(blob);
            setVideoUrl(videoDataUrl);
        } catch (err) {
            console.error(err);
            let errorMessage = (err as Error).message || 'An unknown error occurred during video generation.';
            if (errorMessage.includes("Requested entity was not found")) {
                errorMessage = "API Key not valid. Please select a valid key.";
                setApiKeySelected(false); // Prompt user to select key again
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = 'solo-ai-video.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleShare = async () => {
        if (!videoUrl || !navigator.share) {
            alert("Your browser doesn't support the Share API.");
            return;
        }
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const file = new File([blob], 'solo-ai-video.mp4', { type: blob.type });
            await navigator.share({
                title: 'AI Video from Solo AI',
                text: `Generated with prompt: "${prompt}"`,
                files: [file],
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        } else {
            alert('API key selection is not available in this environment.');
        }
    };

    if (isCheckingApiKey) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Loader2 size={48} className="animate-spin text-brand-blue" />
                <p className="mt-4 text-gray-400">Verifying API key status...</p>
            </div>
        );
    }

    if (!apiKeySelected) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-6">
                <div className="p-4 bg-dark-accent rounded-full border-2 border-brand-purple shadow-glow-purple">
                    <KeyRound size={48} className="text-brand-purple" />
                </div>
                <h1 className="text-2xl font-bold">API Key Required</h1>
                <p className="text-gray-400 max-w-sm">
                    Video generation with Veo requires you to select your own API key.
                    Please ensure your project is set up for billing.
                </p>
                <button 
                    onClick={handleSelectKey}
                    className="bg-brand-blue px-6 py-3 rounded-lg text-white font-semibold hover:shadow-glow-blue transition-shadow flex items-center gap-2"
                >
                    <KeyRound size={20} /> Select API Key
                </button>
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-gray-500 hover:text-brand-blue underline"
                >
                    Learn more about billing
                </a>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col p-4 space-y-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-purple text-transparent bg-clip-text text-center pt-4">Video Generator</h1>
            
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="w-full max-w-lg p-2 bg-dark-card rounded-xl border border-dark-accent shadow-lg">
                    {videoUrl ? (
                        <video src={videoUrl} controls autoPlay loop className="rounded-lg w-full aspect-video" />
                    ) : (
                        <div className="w-full aspect-video bg-dark-accent/50 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                           {isLoading ? (
                                <>
                                    <Loader2 size={48} className="animate-spin text-brand-blue mb-4" />
                                    <p>{loadingMessage}</p>
                                </>
                            ) : (
                                <>
                                    <Video size={48} className="mb-4" />
                                    <p>Your generated video will appear here</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                
                {error && <p className="text-red-500 text-center">{error}</p>}

                {videoUrl && !isLoading && (
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
                        placeholder="A cinematic shot of..."
                        className="flex-1 bg-transparent focus:outline-none placeholder-gray-500"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="bg-brand-purple px-5 py-2 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-purple transition-shadow">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
};