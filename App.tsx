import React, { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './views/ChatView';
import { ImageView } from './views/ImageView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';
import { VoiceView } from './views/VoiceView';
import { LiveView } from './views/LiveView';
import { useAuth } from './contexts/AuthContext';
import { LoginView } from './views/LoginView';

export type Tab = 'chat' | 'image' | 'voice' | 'camera' | 'settings' | 'profile';

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
      case 'camera':
        return <LiveView />;
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

export default App;
