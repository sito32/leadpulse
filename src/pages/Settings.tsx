import { useState } from 'react';
import type { AppSettings } from '../types';
import { callGeminiAPI } from '../utils/gemini';

interface Props {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  userEmail?: string | null;
  synced?: boolean;
  isSupabaseConfigured?: boolean;
  onSignOut?: () => void;
}

export function Settings({ settings, onUpdate, userEmail, synced, isSupabaseConfigured, onSignOut }: Props) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [serviceDesc, setServiceDesc] = useState(settings.serviceDescription);
  const [followUpDays, setFollowUpDays] = useState(settings.followUpDays);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');

  const handleSave = () => {
    onUpdate({
      geminiApiKey: apiKey.trim(),
      serviceDescription: serviceDesc.trim(),
      followUpDays,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestApi = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const result = await callGeminiAPI(apiKey.trim(), 'Reply with exactly: "LeadPulse AI ready!"');
      if (result) {
        setTestResult('success');
      } else {
        setTestResult('error');
        setTestError('Empty response received');
      }
    } catch (e: any) {
      setTestResult('error');
      setTestError(e?.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-gradient-to-r from-slate-700 to-slate-900">
        <h1 className="text-2xl font-black text-white">⚙️ Settings</h1>
        <p className="text-slate-300 text-sm mt-0.5">Configure AI and app preferences</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Gemini API Card */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
            <div>
              <div className="font-black text-base">Google Gemini AI</div>
              <div className="text-purple-200 text-xs">Powers your message generation</div>
            </div>
            <div className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
              apiKey.trim() ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
            }`}>
              {apiKey.trim() ? '✅ Set' : '❌ Missing'}
            </div>
          </div>

          <label className="text-xs font-bold text-purple-200 block mb-1.5">
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-white/50 text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-200 text-sm"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            onClick={handleTestApi}
            disabled={testing || !apiKey.trim()}
            className="mt-2.5 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {testing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              '🔌 Test Connection'
            )}
          </button>

          {testResult === 'success' && (
            <div className="mt-2 bg-green-500/30 border border-green-400 rounded-xl p-2.5 text-green-200 text-xs font-bold">
              ✅ API key is working! AI generation is ready.
            </div>
          )}
          {testResult === 'error' && (
            <div className="mt-2 bg-red-500/30 border border-red-400 rounded-xl p-2.5 text-red-200 text-xs space-y-1">
              <div className="font-bold">❌ Connection failed.</div>
              {testError && <div className="opacity-80 font-mono break-all">{testError}</div>}
              <div className="opacity-70">Check your API key is correct and has Gemini access.</div>
            </div>
          )}

          <div className="mt-3 bg-white/5 rounded-xl p-3 text-xs text-purple-200 space-y-1">
            <div className="font-bold text-purple-100 mb-1">🔑 Get your free API key:</div>
            <div>1. Go to <span className="font-mono bg-white/10 px-1 rounded">aistudio.google.com</span></div>
            <div>2. Sign in with Google</div>
            <div>3. Click "Get API Key" → Copy it</div>
            <div className="text-purple-300 mt-1">🔒 Your key is stored locally only</div>
          </div>
        </div>

        {/* Service Description */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💼</span>
            <div>
              <div className="font-black text-slate-800">Your Service / Niche</div>
              <div className="text-xs text-slate-400">AI uses this to write better messages for you</div>
            </div>
          </div>
          <textarea
            value={serviceDesc}
            onChange={e => setServiceDesc(e.target.value)}
            placeholder={`Describe what you offer and who you help.\n\nExample:\n"I offer professional video editing services for content creators and business coaches. I help them grow their audience with high-quality, engaging videos. I specialize in short-form content for Instagram and YouTube."`}
            rows={6}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 resize-none text-sm"
          />
          <p className="text-xs text-slate-400 mt-2">
            💡 The more detail you add, the more personalized your AI messages will be!
          </p>
        </div>

        {/* Follow-up days */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⏰</span>
            <div>
              <div className="font-black text-slate-800">Follow-Up Reminder</div>
              <div className="text-xs text-slate-400">Days after DM to send follow-up</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {[1, 2, 3, 4, 5, 7].map(d => (
              <button
                key={d}
                onClick={() => setFollowUpDays(d)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  followUpDays === d
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Currently set to <strong>{followUpDays} days</strong> after sending DM
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
            saved
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200'
              : 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-slate-300'
          }`}
        >
          {saved ? '✅ Settings Saved!' : '💾 Save Settings'}
        </button>

        {/* Sync Status Card */}
        {isSupabaseConfigured ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-md">
                ☁️
              </div>
              <div>
                <div className="font-black text-green-800">Cloud Sync Active</div>
                <div className="text-xs text-green-600">Data syncs across all your devices</div>
              </div>
              <div className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${synced ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                {synced ? '✅ Synced' : '⏳ Syncing'}
              </div>
            </div>
            {userEmail && (
              <div className="bg-white rounded-xl p-3 border border-green-200 mb-3">
                <div className="text-xs font-bold text-slate-500 mb-0.5">Logged in as</div>
                <div className="font-bold text-slate-800 text-sm truncate">{userEmail}</div>
              </div>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-full border-2 border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
              >
                🚪 Sign Out
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl shadow-md">
                💾
              </div>
              <div>
                <div className="font-black text-amber-800">Local Storage Mode</div>
                <div className="text-xs text-amber-600">Data saved on this device only</div>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              To sync across devices, deploy to Vercel with your Supabase environment variables.
              Tap <strong>"Go Live"</strong> in the More menu for the setup guide.
            </p>
          </div>
        )}

        {/* App info */}
        <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-4 border border-violet-100 text-center">
          <div className="text-2xl font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-1">
            LeadPulse
          </div>
          <div className="text-xs text-slate-400">
            Your personal AI-powered lead & DM management tool
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isSupabaseConfigured ? '☁️ Cloud synced across all devices' : '🔒 Data stored locally on this device'}
          </div>
        </div>
      </div>
    </div>
  );
}
