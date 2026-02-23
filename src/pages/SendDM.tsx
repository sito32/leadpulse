import { useState } from 'react';
import type { Lead, Template, AppSettings } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';
import { StatusBadge } from '../components/StatusBadge';
import { AIMessageGenerator } from '../components/AIMessageGenerator';
import { ProfileVisitButton } from '../components/ProfileVisitButton';

interface Props {
  leads: Lead[];
  templates: Template[];
  settings: AppSettings;
  onMarkDmSent: (id: string, dmText?: string, followUpDays?: number) => void;
}

function getDaysAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function SendDM({ leads, templates, settings, onMarkDmSent }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dmText, setDmText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const dmTemplates = templates.filter(t => t.type === 'dm');

  // Show leads that are new (no DM yet) — the main purpose of this page
  const readyLeads = leads.filter(l => l.status === 'new');
  const allOtherLeads = leads.filter(l => l.status !== 'new');

  const filteredReady = readyLeads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.platform.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOther = allOtherLeads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.platform.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setCopied(false);
    setSentSuccess(null);
    // Auto-fill first DM template
    const tpl = dmTemplates[0];
    if (tpl) {
      setDmText(tpl.content.replace(/\[Name\]/g, lead.name));
      setSelectedTemplate(tpl.id);
    } else {
      setDmText('');
      setSelectedTemplate('');
    }
  };

  const handleTemplateSelect = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl && selectedLead) {
      setDmText(tpl.content.replace(/\[Name\]/g, selectedLead.name));
      setSelectedTemplate(tplId);
    }
  };

  const handleCopy = () => {
    if (!dmText) return;
    navigator.clipboard?.writeText(dmText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMarkSent = () => {
    if (!selectedLeadId) return;
    onMarkDmSent(selectedLeadId, dmText, settings.followUpDays);
    setSentSuccess(selectedLead?.name || '');
    setSelectedLeadId(null);
    setDmText('');
  };

  if (sentSuccess) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center pb-24">
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">DM Sent!</h2>
        <p className="text-slate-500 mb-1">
          DM marked as sent to <span className="font-bold text-violet-600">{sentSuccess}</span>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Follow-up reminder set for {settings.followUpDays} days from now 🔔
        </p>
        <button
          onClick={() => setSentSuccess(null)}
          className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg"
        >
          Send More DMs
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-violet-600 to-pink-600">
        <h1 className="text-2xl font-black text-white">
          ✉️ Send DM
        </h1>
        <p className="text-violet-100 text-sm mt-0.5">
          {readyLeads.length} leads ready to contact
        </p>
      </div>

      {selectedLead ? (
        /* DM Compose View */
        <div className="p-4 space-y-4">
          {/* Back + Lead info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedLeadId(null); setDmText(''); }}
              className="flex items-center gap-1 text-slate-500 text-sm font-semibold bg-slate-100 px-3 py-1.5 rounded-xl"
            >
              ← Back
            </button>
          </div>

          {/* Lead Card */}
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border-2 border-violet-200">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={selectedLead.platform} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-800 text-base">{selectedLead.name}</div>
                <div className="text-sm text-slate-500">{selectedLead.platform} · {selectedLead.category}</div>
                {selectedLead.notes && (
                  <div className="text-xs text-slate-400 mt-0.5 italic">"{selectedLead.notes}"</div>
                )}
              </div>
              <StatusBadge status={selectedLead.status} />
            </div>
            <a
              href={selectedLead.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-xs text-violet-600 font-bold shadow-sm border border-violet-100"
            >
              <span>🔗</span>
              <span className="truncate">{selectedLead.profileUrl}</span>
              <span className="ml-auto text-slate-400">↗</span>
            </a>
          </div>

          {/* AI Generator */}
          <AIMessageGenerator
            apiKey={settings.geminiApiKey}
            serviceDescription={settings.serviceDescription}
            leadName={selectedLead.name}
            platform={selectedLead.platform}
            category={selectedLead.category}
            notes={selectedLead.notes}
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
              <label className="block text-sm font-bold text-slate-700 mb-2">📋 Or Use a Template</label>
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

          {/* Message Editor */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">✉️ Your Message</label>
            <textarea
              value={dmText}
              onChange={e => setDmText(e.target.value)}
              placeholder="Type or generate your DM message here..."
              rows={9}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 transition-colors bg-white resize-none text-sm font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{dmText.length} characters</span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  copied
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                }`}
              >
                {copied ? '✅ Copied!' : '📋 Copy Message'}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
            💡 <strong>Steps:</strong> 1. Copy message above → 2. Visit profile → 3. Paste & send DM → 4. Come back and tap "Mark as Sent"
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ProfileVisitButton
              url={selectedLead.profileUrl}
              platform={selectedLead.platform}
            />
            <button
              onClick={handleMarkSent}
              disabled={!dmText.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-50"
            >
              ✅ Mark as Sent
            </button>
          </div>

          <p className="text-xs text-center text-slate-400">
            Tap "✅ Mark as Sent" after you actually send the DM on {selectedLead.platform}
          </p>
        </div>
      ) : (
        /* Lead Selection View */
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 bg-white"
            />
          </div>

          {/* Ready to DM */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-black">
                {filteredReady.length}
              </div>
              <h2 className="font-black text-slate-700 text-base">🎯 Ready to DM</h2>
              <span className="text-xs text-slate-400">New leads — no DM sent yet</span>
            </div>

            {filteredReady.length === 0 ? (
              <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-8 text-center border border-violet-100">
                <div className="text-5xl mb-3">🎯</div>
                <div className="font-bold text-slate-700 mb-1">No new leads to DM</div>
                <div className="text-sm text-slate-400 mb-4">
                  {leads.length === 0 ? 'Add your first lead to get started!' : 'All leads have been contacted!'}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredReady.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="w-full text-left bg-white rounded-2xl border-2 border-violet-200 p-4 shadow-sm hover:border-violet-400 hover:shadow-md transition-all active:scale-98 group"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={lead.platform} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm">{lead.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{lead.category}</div>
                        {lead.notes && (
                          <div className="text-xs text-slate-400 mt-0.5 italic truncate">"{lead.notes}"</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-slate-400">
                          {getDaysAgo(lead.addedAt) === 0 ? 'Today' : `${getDaysAgo(lead.addedAt)}d ago`}
                        </div>
                        <div className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs px-3 py-1 rounded-xl font-bold group-hover:shadow-md transition-all">
                          Send DM →
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other leads (already DM'd) */}
          {filteredOther.length > 0 && (
            <div>
              <h2 className="font-black text-slate-600 text-sm mb-2 flex items-center gap-2">
                📌 Already Contacted
                <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">{filteredOther.length}</span>
              </h2>
              <div className="space-y-2">
                {filteredOther.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="w-full text-left bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={lead.platform} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-700 text-sm truncate">{lead.name}</div>
                        <div className="text-xs text-slate-400">{lead.category}</div>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
