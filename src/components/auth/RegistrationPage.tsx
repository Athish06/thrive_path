import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  HeartPulse,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FaceAvatar, faceAvatarStyles } from './FaceAvatar';

export const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent' as 'therapist' | 'parent',
    phone: '',
    address: '',
    emergencyContact: '',
    agreeToTerms: false,
    privacyConsent: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [characterState, setCharacterState] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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
    if (!formData.agreeToTerms || !formData.privacyConsent) return;
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    setPasswordError('');
    setIsLoading(true);
    
    try {
      // Send registration data to backend API
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          address: formData.address,
          emergencyContact: formData.emergencyContact
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const userData = await response.json();
      console.log('User registered successfully:', userData);
      
      // Navigate to login page with success notification
      navigate('/login', { 
        state: { 
          registrationSuccess: true, 
          message: 'Account created successfully! Please log in with your credentials.',
          email: formData.email 
        } 
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setPasswordError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <>
      <style>{`
        ${faceAvatarStyles}
      `}</style>

      <div className="relative flex min-h-screen items-center justify-center bg-[#f4f5f8] px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-purple-100 via-white to-sky-100 opacity-70 blur-2xl" />
          <div className="pointer-events-none absolute right-[-120px] bottom-[-90px] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-cyan-100 via-white to-indigo-100 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-12 inset-y-20 rounded-[54px] border border-white/60" />
        </div>

        <div className="relative w-full max-w-5xl">
          <div className="rounded-[36px] border border-white/80 bg-white/85 px-6 py-10 shadow-[0_40px_90px_rgba(15,23,42,0.18)] backdrop-blur md:px-12">
            <div className="grid gap-10 md:grid-cols-[320px,1fr] md:items-start">
              <div className="flex justify-center md:justify-start">
                <div className="flex flex-col items-center gap-5 text-center md:sticky md:top-16 md:items-start md:text-left">
                  <FaceAvatar mood={characterState} />
                  <div className="space-y-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Create your ThrivePath workspace.
                    </h1>
                    <p className="max-w-xs text-sm text-slate-600 sm:max-w-sm sm:text-base">
                      Invite caregivers, align therapists, and bring existing insights into a calmer shared hub.
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

                <div className="pt-12 space-y-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Joining as</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label
                          className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-4 transition ${
                            formData.role === 'parent'
                              ? 'border-slate-900 bg-slate-900/6 shadow-sm'
                              : 'border-slate-200 bg-white/85 hover:border-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value="parent"
                            checked={formData.role === 'parent'}
                            onChange={handleInputChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleInputBlur}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-slate-900">Parent / Caregiver</span>
                          <span className="text-xs text-slate-600">
                            Track progress, share reflections, and coordinate with therapists.
                          </span>
                        </label>
                        <label
                          className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-4 transition ${
                            formData.role === 'therapist'
                              ? 'border-slate-900 bg-slate-900/6 shadow-sm'
                              : 'border-slate-200 bg-white/85 hover:border-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value="therapist"
                            checked={formData.role === 'therapist'}
                            onChange={handleInputChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleInputBlur}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-slate-900">Therapist / Clinician</span>
                          <span className="text-xs text-slate-600">
                            Build sessions, log fidelity notes, and share evidence with families.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                          First name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          onFocus={handleEmailFocus}
                          onBlur={handleInputBlur}
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                          placeholder="Jordan"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                          Last name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          onFocus={handleEmailFocus}
                          onBlur={handleInputBlur}
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                          placeholder="Lee"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={handleEmailFocus}
                        onBlur={handleInputBlur}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                        placeholder="you@clinic.co"
                        autoComplete="email"
                      />
                    </div>

                    {formData.role === 'therapist' && (
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                          Phone number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          onFocus={handleEmailFocus}
                          onBlur={handleInputBlur}
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    )}

                    {formData.role === 'parent' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                            Phone number (optional)
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleInputBlur}
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="address" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                            Home address
                          </label>
                          <input
                            id="address"
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleInputChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleInputBlur}
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            placeholder="Street, city"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label
                            htmlFor="emergencyContact"
                            className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
                          >
                            Emergency contact
                          </label>
                          <input
                            id="emergencyContact"
                            name="emergencyContact"
                            type="text"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleInputBlur}
                            placeholder="Name and phone number"
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            onFocus={handlePasswordFocus}
                            onBlur={handleInputBlur}
                            required
                            minLength={8}
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 pr-12 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
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
                      <div className="space-y-2">
                        <label
                          htmlFor="confirmPassword"
                          className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
                        >
                          Confirm password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onFocus={handlePasswordFocus}
                            onBlur={handleInputBlur}
                            required
                            minLength={8}
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 pr-12 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            placeholder="Repeat password"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordError && (
                          <p className="text-xs font-semibold text-rose-600">{passwordError}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <label htmlFor="agreeToTerms">
                          I agree to the <span className="font-semibold text-slate-900">ThrivePath Terms of Service</span>.
                        </label>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                        <input
                          id="privacyConsent"
                          name="privacyConsent"
                          type="checkbox"
                          checked={formData.privacyConsent}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <label htmlFor="privacyConsent">
                          I consent to secure storage of sensitive learner data according to the Privacy Policy.
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !formData.agreeToTerms || !formData.privacyConsent}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isLoading ? 'Creating account…' : 'Create account'}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </form>

                  <div className="rounded-3xl border border-slate-200 bg-white/90 px-5 py-5 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                        <HeartPulse className="h-5 w-5" />
                      </div>
                      <p>
                        Our team migrates notes, goals, and assessment data within 48 hours so every victory carries over.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <button
                      onClick={handleLoginClick}
                      className="font-semibold text-slate-900 underline-offset-4 transition hover:underline"
                    >
                      Sign in
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

export default RegistrationPage;