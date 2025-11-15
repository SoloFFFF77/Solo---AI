import React, { useState, useEffect, useRef } from 'react';
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
                className={`w-full text-left flex items-center gap-2 p-2 rounded-md transition-colors ${
                  activeFile === file ? 'bg-brand-blue/20 text-brand-blue' : 'hover:bg-dark-accent'
                }`}
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
              <div key={index} className={`flex items-start gap-3 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-blue/80 text-white' : 'bg-dark-card'}`}>
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
};