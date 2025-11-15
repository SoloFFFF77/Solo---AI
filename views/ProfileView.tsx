import React from 'react';
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
};