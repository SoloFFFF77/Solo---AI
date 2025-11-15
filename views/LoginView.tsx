import React, { useState } from 'react';
import { Bot, Mail, Lock } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

type FormMode = 'signin' | 'signup';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.904,36.218,44,30.687,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email address is already in use.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

export const LoginView: React.FC = () => {
    const [mode, setMode] = useState<FormMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            const authError = err as AuthError;
            console.error(authError.code);
            setError(getFriendlyErrorMessage(authError.code));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      setError(null);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const authError = err as AuthError;
        console.error(authError.code);
        setError(getFriendlyErrorMessage(authError.code));
      } finally {
        setIsGoogleLoading(false);
      }
    };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-dark-accent rounded-full border-2 border-brand-purple shadow-glow-purple mb-4">
                <Bot size={40} className="text-brand-purple" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                Solo AI
            </h1>
            <p className="text-gray-400">Sign in to continue</p>
        </div>

        <div className="bg-dark-card border border-dark-accent rounded-xl p-4 mb-6">
            <div className="flex border-b border-dark-accent mb-4">
                <button onClick={() => { setMode('signin'); setError(null); }} className={`flex-1 p-3 text-center font-semibold transition-colors ${mode === 'signin' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Sign In</button>
                <button onClick={() => { setMode('signup'); setError(null); }} className={`flex-1 p-3 text-center font-semibold transition-colors ${mode === 'signup' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-500'}`}>Sign Up</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                    <input 
                        type="email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-dark-accent border border-transparent focus:border-brand-blue rounded-lg p-3 pl-10 transition-colors focus:outline-none"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-dark-accent border border-transparent focus:border-brand-purple rounded-lg p-3 pl-10 transition-colors focus:outline-none"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                <button 
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full p-3 font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-dark-accent"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs">OR</span>
                <div className="flex-grow border-t border-dark-accent"></div>
            </div>

             <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full p-3 font-semibold text-gray-300 bg-dark-accent rounded-lg hover:bg-dark-accent/70 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
            >
                {isGoogleLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><GoogleIcon /> Continue with Google</>}
            </button>
        </div>
      </div>
    </div>
  );
};