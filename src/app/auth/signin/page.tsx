'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Mail, Zap, Shield, Keyboard, Layers } from 'lucide-react';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-r border-zinc-800">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Velocity</h1>
              <p className="text-sm text-zinc-400">Email at the speed of thought</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { icon: Layers, title: 'Multi-Account', desc: 'Connect all your Google and Microsoft accounts in one unified inbox' },
              { icon: Keyboard, title: 'Keyboard First', desc: 'Vim-style shortcuts for blazing fast email workflow. J/K to navigate, C to compose' },
              { icon: Shield, title: 'Split View', desc: 'Read and triage emails side-by-side with a Superhuman-inspired layout' },
              { icon: Zap, title: 'Command Palette', desc: 'Press Cmd+K to access any action instantly. Search, navigate, compose\u2014all from one place' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign In */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Velocity</h1>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome back</h2>
          <p className="text-zinc-400 text-center text-sm mb-8">Sign in with your email provider to get started</p>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={isLoading !== null}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">Continue with Google</p>
                <p className="text-xs text-zinc-500">Gmail & Google Workspace</p>
              </div>
              {isLoading === 'google' && (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </button>

            {/* Microsoft Sign In */}
            <button
              onClick={() => handleSignIn('azure-ad')}
              disabled={isLoading !== null}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00a4ef] flex items-center justify-center">
                <svg viewBox="0 0 23 23" className="w-4 h-4">
                  <path fill="white" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">Continue with Microsoft</p>
                <p className="text-xs text-zinc-500">Outlook & Microsoft 365</p>
              </div>
              {isLoading === 'azure-ad' && (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </button>
          </div>

          <p className="text-xs text-zinc-600 text-center mt-8">
            By signing in, you grant Velocity read and send access to your email.
            Your data is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
