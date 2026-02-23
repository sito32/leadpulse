import { useState } from 'react';
import type { Platform, Category, Template, AppSettings } from '../types';
import { AIMessageGenerator } from '../components/AIMessageGenerator';

const PLATFORMS: Platform[] = ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'Other'];
const CATEGORIES: Category[] = [
  'Business Coach', 'New Startup', 'Tech Company', 'Freelancer',
  'Agency', 'E-commerce', 'Creator', 'Other',
];

const PLATFORM_EMOJIS: Record<Platform, string> = {
  Twitter: '🐦',
  Instagram: '📸',
  Facebook: '👥',
  LinkedIn: '💼',
  Other: '🌐',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  Twitter: 'border-sky-400 bg-sky-50 text-sky-700',
  Instagram: 'border-pink-400 bg-pink-50 text-pink-700',
  Facebook: 'border-blue-400 bg-blue-50 text-blue-700',
  LinkedIn: 'border-blue-600 bg-blue-50 text-blue-800',
  Other: 'border-slate-400 bg-slate-50 text-slate-700',
};

interface Props {
  templates: Template[];
  settings: AppSettings;
  onAddLead: (lead: { name: string; profileUrl: string; platform: Platform; category: Category; notes: string }) => any;
  onMarkDmSent: (id: string, dmText?: string, followUpDays?: number) => void;
}

export function NewLead({ templates, settings, onAddLead, onMarkDmSent }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [category, setCategory] = useState<Category>('Business Coach');
  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dmText, setDmText] = useState('');
  const [dmSentNow, setDmSentNow] = useState(false);
  const [copied, setCopied] = useState(false);

  const dmTemplates = templates.filter(t => t.type === 'dm');

  const handleStep1 = () => {
    if (!name.trim() || !profileUrl.trim()) return;
    const lead = onAddLead({ name, profileUrl, platform, category, notes });
    setSavedLeadId(lead.id);
    const tpl = dmTemplates[0];
    if (tpl) {
      setDmText(tpl.content.replace(/\[Name\]/g, name));
      setSelectedTemplate(tpl.id);
    }
    setStep(2);
  };

  const handleTemplateSelect = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      setDmText(tpl.content.replace(/\[Name\]/g, name));
      setSelectedTemplate(tplId);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(dmText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDmSent = () => {
    if (savedLeadId) {
      onMarkDmSent(savedLeadId, dmText, settings.followUpDays);
    }
    setDmSentNow(true);
    setSuccess(true);
  };

  const handleSkipDm = () => {
    setSuccess(true);
  };

  const handleReset = () => {
    setName(''); setProfileUrl(''); setPlatform('Instagram');
    setCategory('Business Coach'); setNotes(''); setSelectedTemplate('');
    setDmText(''); setDmSentNow(false); setSavedLeadId(null);
    setSuccess(false); setStep(1); setCopied(false);
  };

  if (success) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center pb-24">
        <div className="text-8xl mb-4 animate-bounce">{dmSentNow ? '🎉' : '✅'}</div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">
          {dmSentNow ? 'Lead Added & DM Sent!' : 'Lead Saved!'}
        </h2>
        <p className="text-slate-500 mb-2">
          <span className="font-semibold text-violet-600">{name}</span> has been added.
        </p>
        {dmSentNow && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm text-orange-700 font-semibold mb-4">
            🔔 Follow-up reminder set for {settings.followUpDays} days!
          </div>
        )}
        {!dmSentNow && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-semibold mb-4">
            💡 Go to "Send DM" page to send your message!
          </div>
        )}
        <button
          onClick={handleReset}
          className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-8 py-3.5 rounded-2xl font-black text-base shadow-lg shadow-violet-200"
        >
          + Add Another Lead
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Colorful Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-violet-600 to-pink-600">
        <h1 className="text-2xl font-black text-white">🎯 Add New Lead</h1>
        <p className="text-violet-100 text-sm mt-0.5">
          {step === 1 ? 'Save a lead profile from any platform' : 'Compose & send your first DM'}
        </p>
        {/* Step bar */}
        <div className="flex gap-2 mt-3">
          <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
        <div className="text-xs text-violet-200 mt-1">Step {step} of 2</div>
      </div>

      <div className="p-4 space-y-4">
        {step === 1 && (
          <>
            {/* Platform selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${
                      platform === p
                        ? `${PLATFORM_COLORS[p]} shadow-md scale-105`
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <span>{PLATFORM_EMOJIS[p]}</span> {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Person / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Smith or TechStartup Inc."
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 transition-colors bg-white font-medium"
              />
            </div>

            {/* Profile URL */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Profile URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={profileUrl}
                onChange={e => setProfileUrl(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 transition-colors bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      category === c
                        ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm scale-105'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Why is this a good lead? What did you notice about them? This helps AI write better messages!"
                rows={3}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 transition-colors bg-white resize-none text-sm"
              />
            </div>

            <button
              onClick={handleStep1}
              disabled={!name.trim() || !profileUrl.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-violet-200 disabled:opacity-40 disabled:shadow-none transition-all active:scale-95"
            >
              Save Lead & Write DM →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Lead summary */}
            <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border-2 border-violet-100">
              <div className="font-black text-slate-800 text-base">{name}</div>
              <div className="text-sm text-slate-500">{platform} · {category}</div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 font-bold break-all mt-1 block"
              >
                🔗 {profileUrl}
              </a>
            </div>

            {/* AI Generator */}
            <AIMessageGenerator
              apiKey={settings.geminiApiKey}
              serviceDescription={settings.serviceDescription}
              leadName={name}
              platform={platform}
              category={category}
              notes={notes}
              type="dm"
              templates={templates}
              onGenerated={msg => {
                setDmText(msg);
                setSelectedTemplate('');
              }}
            />

            {/* Template picker */}
            {dmTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  📋 Or Use a Template
                </label>
                <div className="flex flex-col gap-2">
                  {dmTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateSelect(t.id)}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        selectedTemplate === t.id
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DM Editor */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">✉️ Your Message</label>
              <textarea
                value={dmText}
                onChange={e => setDmText(e.target.value)}
                placeholder="Type, generate with AI, or select a template above..."
                rows={9}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 transition-colors bg-white resize-none font-mono text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{dmText.length} chars</span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Message'}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              💡 <strong>Steps:</strong> Copy message → Visit profile → Send DM → Tap "✅ DM Sent!" below
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSkipDm}
                className="border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-sm"
              >
                Save Only
              </button>
              <button
                onClick={handleDmSent}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-green-200 active:scale-95 transition-all"
              >
                ✅ DM Sent!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
