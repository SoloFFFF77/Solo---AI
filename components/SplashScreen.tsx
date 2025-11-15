
import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-dark-bg flex items-center justify-center z-50">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg blur opacity-75 animate-pulse"></div>
        <div className="relative px-7 py-4 bg-dark-card rounded-lg leading-none flex items-center">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
            Solo AI
          </span>
        </div>
      </div>
    </div>
  );
};
