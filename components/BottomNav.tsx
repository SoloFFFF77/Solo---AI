import React from 'react';
import { MessageSquare, Image as ImageIcon, Settings, User, Radio, Camera, Video } from 'lucide-react';
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
      className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}
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
    { id: 'camera', icon: Camera, label: 'Camera' },
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
};
