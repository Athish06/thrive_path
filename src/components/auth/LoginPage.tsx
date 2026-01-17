import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FaceAvatar, faceAvatarStyles } from './FaceAvatar';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [characterState, setCharacterState] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Check for registration success message
    if (location.state?.registrationSuccess) {
      setSuccessMessage(location.state.message);
      if (location.state.email) {
        setEmail(location.state.email);
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, [location.state]);

  const handleEmailFocus = () => {
    setCharacterState('waving');
  };

  const handlePasswordFocus = () => {
    setCharacterState('waving');
  };

  const handleInputBlur = () => {
    setCharacterState('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    setShowRegisterPrompt(false);
    
    try {
      // Use AuthContext login method
      await login(email, password);
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle different error scenarios
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      if (errorMessage.includes('User not found')) {
        setLoginError('User not found. Would you like to register?');
        setShowRegisterPrompt(true);
      } else if (errorMessage.includes('Invalid email or password') || errorMessage.includes('Invalid password')) {
        setLoginError('Invalid email or password. Please check your credentials.');
      } else if (errorMessage.includes('fetch')) {
        setLoginError('Unable to connect to server. Please check your internet connection.');
      } else {
        setLoginError(errorMessage || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpClick = () => {
    navigate('/register');
  };

  return (
    <>
      <style>{`
        ${faceAvatarStyles}
      `}</style>

      {successMessage && (
        <div className="fixed top-6 left-1/2 z-50 w-[min(420px,90vw)] -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50/95 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-[0_14px_35px_rgba(16,185,129,0.25)] backdrop-blur-sm">
          {successMessage}
        </div>
      )}
      <div className="relative flex min-h-screen items-center justify-center bg-[#f4f5f8] px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-sky-100 via-white to-purple-100 opacity-70 blur-2xl" />
          <div className="pointer-events-none absolute right-[-120px] bottom-[-100px] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-indigo-100 via-white to-cyan-100 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 inset-y-24 rounded-[54px] border border-white/60" />
        </div>
        <div className="relative w-full max-w-5xl">
          <div className="rounded-[36px] border border-white/75 bg-white/85 px-6 py-10 shadow-[0_38px_72px_rgba(15,23,42,0.16)] backdrop-blur md:px-12">
            <div className="grid gap-10 md:grid-cols-[310px,1fr] md:items-start">
              <div className="flex justify-center md:justify-start">
                <div className="flex flex-col items-center gap-5 text-center md:sticky md:top-16 md:items-start md:text-left">
                  <FaceAvatar mood={characterState} />
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Welcome back to ThrivePath.
                    </h1>
                    <p className="max-w-xs text-sm text-slate-600 sm:max-w-sm sm:text-base">
                      Drop back into your shared workspace, continue journaling learner wins, and keep every collaborator aligned.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col gap-8">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
                  aria-label="Back to home"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>

                <div className="pt-12 space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={handleEmailFocus}
                        onBlur={handleInputBlur}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                        placeholder="you@clinic.co"
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          className="text-[0.75rem] font-semibold text-slate-600 transition hover:text-slate-900"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={handlePasswordFocus}
                          onBlur={handleInputBlur}
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 pr-12 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in…' : 'Login'}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </form>

                  {loginError && (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
                      {loginError}
                    </div>
                  )}

                  {showRegisterPrompt && (
                    <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between">
                      <span>Don&apos;t have an account yet?</span>
                      <button
                        onClick={handleSignUpClick}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-amber-700"
                      >
                        Register now
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 text-center text-sm text-slate-600">
                    New to ThrivePath?{' '}
                    <button
                      onClick={handleSignUpClick}
                      className="font-semibold text-slate-900 underline-offset-4 transition hover:underline"
                    >
                      Create an account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};