import { useState } from 'react';
import type { Lead, Template, AppSettings } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';
import { AIMessageGenerator } from '../components/AIMessageGenerator';
import { ProfileVisitButton } from '../components/ProfileVisitButton';

interface Props {
  leads: Lead[];
  templates: Template[];
  settings: AppSettings;
  onMarkFollowUpSent: (id: string) => void;
  onMarkStatus: (id: string, status: Lead['status']) => void;
}

function getDaysAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function FollowUp({ leads, templates, settings, onMarkFollowUpSent, onMarkStatus }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Record<string, string>>({});
  const [dmTexts, setDmTexts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const fuTemplates = templates.filter(t => t.type === 'followup');

  const dueLeads = leads.filter(l => {
    if (l.status !== 'dm_sent') return false;
    if (!l.followUpDueDate) return false;
    return new Date(l.followUpDueDate) <= new Date();
  });

  const sentLeads = leads.filter(l => l.status === 'follow_up_sent');

  const pendingLeads = leads.filter(l => {
    if (l.status !== 'dm_sent') return false;
    if (!l.followUpDueDate) return false;
    return new Date(l.followUpDueDate) > new Date();
  });

  const handleExpand = (lead: Lead) => {
    if (expandedId === lead.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(lead.id);
    if (!dmTexts[lead.id]) {
      const tpl = fuTemplates[0];
      if (tpl) {
        setDmTexts(prev => ({ ...prev, [lead.id]: tpl.content.replace(/\[Name\]/g, lead.name) }));
        setSelectedTemplate(prev => ({ ...prev, [lead.id]: tpl.id }));
      }
    }
  };

  const handleTemplateSelect = (leadId: string, leadName: string, tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      setDmTexts(prev => ({ ...prev, [leadId]: tpl.content.replace(/\[Name\]/g, leadName) }));
      setSelectedTemplate(prev => ({ ...prev, [leadId]: tplId }));
    }
  };

  const handleCopy = (leadId: string) => {
    navigator.clipboard?.writeText(dmTexts[leadId] || '');
    setCopied(prev => ({ ...prev, [leadId]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [leadId]: false })), 2500);
  };

  const handleSent = (id: string) => {
    onMarkFollowUpSent(id);
    setSent(prev => ({ ...prev, [id]: true }));
    setExpandedId(null);
  };

  return (
    <div className="pb-24">
      {/* Colorful Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-orange-500 to-red-500">
        <h1 className="text-2xl font-black text-white">🔄 Follow-Ups</h1>
        <p className="text-orange-100 text-sm mt-0.5">
          {dueLeads.length} due now · {pendingLeads.length} upcoming
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Due Now */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-black shadow-md">
              {dueLeads.length}
            </span>
            <h2 className="font-black text-slate-700 text-base">🔔 Follow-Up Due Now</h2>
          </div>

          {dueLeads.length === 0 ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-green-700">All caught up!</div>
              <div className="text-sm text-green-600">No follow-ups due right now.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {dueLeads.map(lead => (
                <div
                  key={lead.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                    sent[lead.id] ? 'border-green-300' : 'border-orange-300'
                  }`}
                >
                  <button onClick={() => handleExpand(lead)} className="w-full text-left p-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={lead.platform} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate">{lead.name}</div>
                        <div className="text-xs text-slate-500">
                          {lead.category} · DM sent {getDaysAgo(lead.dmSentAt)}d ago
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {getDaysAgo(lead.followUpDueDate) !== null && getDaysAgo(lead.followUpDueDate)! >= 0
                            ? `${getDaysAgo(lead.followUpDueDate)}d overdue`
                            : 'Due today'}
                        </span>
                        <span className="text-slate-400 text-base">{expandedId === lead.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>

                  {expandedId === lead.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                      {/* Visit Profile */}
                      <ProfileVisitButton
                        url={lead.profileUrl}
                        platform={lead.platform}
                        compact={false}
                        className="w-full"
                      />

                      {/* Previous DM context */}
                      {lead.lastDmText && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="text-xs font-bold text-slate-400 mb-1">📨 Original DM Sent:</div>
                          <div className="text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">
                            {lead.lastDmText}
                          </div>
                        </div>
                      )}

                      {/* AI Generator */}
                      <AIMessageGenerator
                        apiKey={settings.geminiApiKey}
                        serviceDescription={settings.serviceDescription}
                        leadName={lead.name}
                        platform={lead.platform}
                        category={lead.category}
                        notes={lead.notes}
                        type="followup"
                        previousDm={lead.lastDmText}
                        templates={templates}
                        onGenerated={msg => {
                          setDmTexts(prev => ({ ...prev, [lead.id]: msg }));
                          setSelectedTemplate(prev => ({ ...prev, [lead.id]: '' }));
                        }}
                      />

                      {/* Template picker */}
                      {fuTemplates.length > 0 && (
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1.5">
                            📋 Or Use Template
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {fuTemplates.map(t => (
                              <button
                                key={t.id}
                                onClick={() => handleTemplateSelect(lead.id, lead.name, t.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                                  selectedTemplate[lead.id] === t.id
                                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                                    : 'border-slate-200 text-slate-600 bg-white'
                                }`}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message editor */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1.5">
                          ✉️ Your Follow-Up Message
                        </label>
                        <textarea
                          value={dmTexts[lead.id] || ''}
                          onChange={e =>
                            setDmTexts(prev => ({ ...prev, [lead.id]: e.target.value }))
                          }
                          rows={5}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-orange-400 resize-none font-mono bg-slate-50"
                        />
                        <button
                          onClick={() => handleCopy(lead.id)}
                          className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            copied[lead.id]
                              ? 'bg-green-500 text-white'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {copied[lead.id] ? '✅ Copied!' : '📋 Copy Message'}
                        </button>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-700 font-medium">
                        💡 Copy → Visit Profile → Send → Tap "✅ Sent!"
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onMarkStatus(lead.id, 'not_interested')}
                          className="border border-red-200 text-red-500 text-xs py-2.5 rounded-xl font-semibold"
                        >
                          ✕ Not Int.
                        </button>
                        <ProfileVisitButton
                          url={lead.profileUrl}
                          platform={lead.platform}
                          compact
                          className="flex items-center justify-center border border-blue-300 text-blue-600 text-xs py-2.5 rounded-xl font-semibold"
                        />
                        <button
                          onClick={() => handleSent(lead.id)}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs py-2.5 rounded-xl font-bold shadow-sm"
                        >
                          ✅ Sent!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        {pendingLeads.length > 0 && (
          <div>
            <h2 className="font-black text-slate-700 text-base mb-3 flex items-center gap-2">
              ⏳ Upcoming Follow-Ups
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {pendingLeads.length}
              </span>
            </h2>
            <div className="space-y-2">
              {pendingLeads.map(lead => {
                const daysUntil = lead.followUpDueDate
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(lead.followUpDueDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : null;
                return (
                  <div
                    key={lead.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3 shadow-sm"
                  >
                    <PlatformIcon platform={lead.platform} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">{lead.name}</div>
                      <div className="text-xs text-slate-400">{lead.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {daysUntil !== null ? `${daysUntil}d left` : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up sent history */}
        {sentLeads.length > 0 && (
          <div>
            <h2 className="font-black text-slate-700 text-base mb-3 flex items-center gap-2">
              ✉️ Follow-Up Sent
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {sentLeads.length}
              </span>
            </h2>
            <div className="space-y-2">
              {sentLeads.map(lead => (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3 shadow-sm"
                >
                  <PlatformIcon platform={lead.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{lead.name}</div>
                    <div className="text-xs text-slate-400">
                      Follow-up{' '}
                      {lead.followUpSentAt ? getDaysAgo(lead.followUpSentAt) + 'd ago' : ''}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onMarkStatus(lead.id, 'replied')}
                      className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      Replied
                    </button>
                    <button
                      onClick={() => onMarkStatus(lead.id, 'converted')}
                      className="text-xs bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      Won 🎉
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dueLeads.length === 0 && pendingLeads.length === 0 && sentLeads.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔄</div>
            <div className="font-bold text-slate-700 text-lg mb-2">No Follow-Ups Yet</div>
            <div className="text-slate-400 text-sm">
              Send your first DM and follow-ups will appear here after {settings.followUpDays} days.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
