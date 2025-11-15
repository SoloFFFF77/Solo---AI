import React from 'react';
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
                className={`w-full flex justify-center items-center gap-2 p-3 rounded-lg text-sm transition-all duration-300 transform ${
                  personality === p
                    ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-glow-blue scale-105'
                    : 'bg-dark-accent text-gray-400 hover:bg-dark-accent/70 hover:text-white'
                }`}
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
};
