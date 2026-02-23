import { useState } from 'react';
import { generateMessageWithGemini } from '../utils/gemini';
import type { GeminiOptions } from '../utils/gemini';
import type { Template } from '../types';

type Tone = 'professional' | 'friendly' | 'casual' | 'bold' | 'witty';
type Length = 'short' | 'medium' | 'long';

interface Props {
  apiKey: string;
  serviceDescription: string;
  leadName: string;
  platform: string;
  category: string;
  notes: string;
  type: 'dm' | 'followup';
  previousDm?: string;
  templates?: Template[]; // available templates to use as AI base
  onGenerated: (message: string) => void;
}

const TONES: { value: Tone; label: string; emoji: string; color: string }[] = [
  { value: 'professional', label: 'Pro', emoji: '💼', color: 'from-blue-500 to-blue-700' },
  { value: 'friendly', label: 'Friendly', emoji: '😊', color: 'from-green-500 to-emerald-600' },
  { value: 'casual', label: 'Casual', emoji: '😎', color: 'from-yellow-400 to-orange-500' },
  { value: 'bold', label: 'Bold', emoji: '💪', color: 'from-red-500 to-rose-600' },
  { value: 'witty', label: 'Witty', emoji: '🎭', color: 'from-purple-500 to-violet-700' },
];

const LENGTHS: { value: Length; label: string; desc: string }[] = [
  { value: 'short', label: 'Short', desc: '< 60 words' },
  { value: 'medium', label: 'Medium', desc: '80-120' },
  { value: 'long', label: 'Long', desc: '150+ words' },
];

export function AIMessageGenerator({
  apiKey,
  serviceDescription,
  leadName,
  platform,
  category,
  notes,
  type,
  previousDm,
  templates = [],
  onGenerated,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState<Tone>('friendly');
  const [length, setLength] = useState<Length>('medium');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState('');

  // Filter templates by type
  const relevantTemplates = templates.filter(t => t.type === type);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please add your Gemini API key in ⚙️ Settings first.');
      return;
    }
    setLoading(true);
    setError('');
    setGenerated('');

    // Find selected template base
    const templateBase =
      selectedTemplateId && selectedTemplateId !== 'none'
        ? templates.find(t => t.id === selectedTemplateId)?.content
        : undefined;

    try {
      const opts: GeminiOptions = {
        apiKey,
        leadName,
        platform,
        category,
        notes,
        serviceDescription,
        tone,
        length,
        customInstructions,
        type,
        previousDm,
        templateBase,
      };
      const msg = await generateMessageWithGemini(opts);
      setGenerated(msg);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate. Check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    onGenerated(generated);
    setIsOpen(false);
    setGenerated('');
  };

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 active:scale-95 transition-all"
      >
        <span className="text-lg">🤖</span>
        <span>Generate with AI (Gemini)</span>
        <span className="ml-auto text-base">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-4 space-y-4 border border-purple-700 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="text-white font-black text-sm">AI Message Generator</div>
              <div className="text-purple-300 text-xs">Powered by Google Gemini</div>
            </div>
          </div>

          {/* Template as AI base — NEW FEATURE */}
          {relevantTemplates.length > 0 && (
            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1.5">
                📋 Start From Template <span className="font-normal opacity-60">(AI will personalize it)</span>
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setSelectedTemplateId('none')}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedTemplateId === 'none'
                      ? 'border-pink-400 bg-pink-500/20 text-pink-200'
                      : 'border-white/10 text-purple-300 bg-white/5'
                  }`}
                >
                  ✨ Write fresh (no template)
                </button>
                {relevantTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTemplateId === t.id
                        ? 'border-violet-400 bg-violet-500/20 text-violet-200'
                        : 'border-white/10 text-purple-300 bg-white/5'
                    }`}
                  >
                    <div className="font-bold">{t.name}</div>
                    <div className="opacity-60 mt-0.5 truncate font-mono">{t.content.slice(0, 55)}…</div>
                  </button>
                ))}
              </div>
              {selectedTemplateId !== 'none' && (
                <div className="mt-2 bg-violet-500/10 border border-violet-500/30 rounded-xl p-2.5 text-xs text-violet-300">
                  🪄 AI will personalize <strong>{templates.find(t => t.id === selectedTemplateId)?.name}</strong> for <strong>{leadName}</strong>
                </div>
              )}
            </div>
          )}

          {/* Tone selector */}
          <div>
            <label className="text-xs font-bold text-purple-300 block mb-2">🎨 Tone</label>
            <div className="flex gap-1.5 flex-wrap">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tone === t.value
                      ? `bg-gradient-to-r ${t.color} text-white shadow-md scale-105`
                      : 'bg-white/10 text-purple-200 border border-white/20'
                  }`}
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length selector */}
          <div>
            <label className="text-xs font-bold text-purple-300 block mb-2">📏 Message Length</label>
            <div className="flex gap-2">
              {LENGTHS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLength(l.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    length === l.value
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                      : 'bg-white/10 text-purple-200 border border-white/20'
                  }`}
                >
                  <div>{l.label}</div>
                  <div className="font-normal opacity-70">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="text-xs font-bold text-purple-300 block mb-1.5">
              ✍️ Your Instructions <span className="font-normal opacity-60">(guide the AI)</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder={`e.g. "mention their recent posts", "focus on video editing service", "ask about their biggest challenge", "reference their coaching business"...`}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder-purple-400 focus:outline-none focus:border-purple-400 resize-none"
            />
            <p className="text-purple-400 text-xs mt-1">💡 The more specific you are, the better the message!</p>
          </div>

          {/* Lead context display */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs font-bold text-purple-300 mb-1.5">📋 Lead Context (auto-used by AI)</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-purple-200">
              <div><span className="opacity-60">Name:</span> <span className="font-semibold">{leadName || '—'}</span></div>
              <div><span className="opacity-60">Platform:</span> <span className="font-semibold">{platform}</span></div>
              <div><span className="opacity-60">Category:</span> <span className="font-semibold">{category}</span></div>
              {notes && (
                <div className="col-span-2">
                  <span className="opacity-60">Notes:</span>{' '}
                  <span className="font-semibold">{notes.slice(0, 55)}{notes.length > 55 ? '…' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-red-300 text-xs space-y-1">
              <div className="font-bold">⚠️ Error</div>
              <div>{error}</div>
            </div>
          )}

          {/* Generated message */}
          {generated && (
            <div className="bg-white/10 border border-green-500/40 rounded-xl p-3">
              <div className="text-xs font-bold text-green-400 mb-2">✨ Generated Message:</div>
              <div className="text-white text-xs whitespace-pre-wrap font-mono leading-relaxed">{generated}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 bg-white/10 text-purple-200 py-2 rounded-xl text-xs font-bold border border-white/20 disabled:opacity-50"
                >
                  {loading ? '⏳ Generating...' : '🔄 Regenerate'}
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  ✅ Use This Message
                </button>
              </div>
            </div>
          )}

          {/* Generate button */}
          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg disabled:opacity-60 active:scale-95 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI is writing your message…
                </span>
              ) : (
                `✨ ${selectedTemplateId !== 'none' ? 'Personalize Template with AI' : `Generate ${type === 'dm' ? 'DM' : 'Follow-Up'} Message`}`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
