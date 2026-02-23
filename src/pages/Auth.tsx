import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot';

export function Auth({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (mode !== 'forgot' && !password) { setError('Please enter your password.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    if (!supabase) {
      setError('Supabase is not configured. Please add your environment variables.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
        onAuth();
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
        setSuccess('🎉 Account created! Check your email to confirm your account, then log in.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (err) throw err;
        setSuccess('📧 Password reset email sent! Check your inbox.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-pink-500 rounded-3xl shadow-2xl shadow-violet-900 mb-4 text-4xl">
            🚀
          </div>
          <h1 className="text-4xl font-black text-white mb-1">LeadPulse</h1>
          <p className="text-violet-300 text-sm">AI-Powered Lead Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6 bg-white/10 p-1 rounded-2xl">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                    : 'text-white/60'
                }`}
              >
                🔐 Log In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                    : 'text-white/60'
                }`}
              >
                ✨ Sign Up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-5">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="flex items-center gap-2 text-violet-300 text-sm font-semibold mb-3"
              >
                ← Back to Login
              </button>
              <h2 className="text-xl font-black text-white">🔑 Reset Password</h2>
              <p className="text-violet-300 text-xs mt-1">Enter your email and we'll send a reset link</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3">
            {/* Email */}
            <div>
              <label className="text-xs font-bold text-violet-200 block mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-violet-400 focus:outline-none focus:border-violet-400 text-sm"
              />
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label className="text-xs font-bold text-violet-200 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-violet-400 focus:outline-none focus:border-violet-400 text-sm pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 text-lg"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-violet-200 block mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Re-enter password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-violet-400 focus:outline-none focus:border-violet-400 text-sm"
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs text-violet-300 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-red-200 text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/20 border border-green-400/40 rounded-xl p-3 text-green-200 text-xs font-medium">
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-violet-900 disabled:opacity-60 active:scale-95 transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Logging in...' : mode === 'signup' ? 'Creating account...' : 'Sending email...'}
                </span>
              ) : (
                mode === 'login' ? '🔐 Log In' : mode === 'signup' ? '✨ Create Account' : '📧 Send Reset Email'
              )}
            </button>
          </div>
        </div>

        {/* Info about sync */}
        <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-white font-bold text-sm mb-1">Sync Across All Devices</div>
          <div className="text-violet-300 text-xs">
            Create an account to save your leads in the cloud and access them from any device — phone, tablet, or computer!
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-center text-violet-400 text-xs mt-4">
          🔒 Your data is private and secure. Only you can see your leads.
        </p>
      </div>
    </div>
  );
}
