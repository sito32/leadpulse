import { useMemo } from 'react';
import type { Lead } from '../types';
import { isSameDay, startOfWeek, startOfMonth } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { PlatformIcon } from '../components/PlatformIcon';

interface Props {
  leads: Lead[];
  followUpDue: Lead[];
  newLeadsReadyToDm: Lead[];
  onNavigate: (page: string) => void;
}

function StatCard({
  value,
  label,
  sublabel,
  gradient,
  icon,
  onClick,
}: {
  value: number;
  label: string;
  sublabel?: string;
  gradient: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 ${gradient} text-white shadow-lg ${onClick ? 'cursor-pointer active:scale-95 transition-all' : ''}`}
    >
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-4xl font-black leading-none">{value}</div>
      <div className="font-bold text-sm opacity-90 mt-1">{label}</div>
      {sublabel && <div className="text-xs opacity-70 mt-0.5">{sublabel}</div>}
      <div className="absolute -right-3 -bottom-4 text-7xl opacity-10 select-none">{icon}</div>
    </div>
  );
}

export function Dashboard({ leads, followUpDue, newLeadsReadyToDm, onNavigate }: Props) {
  const now = new Date();

  const stats = useMemo(() => {
    const today = leads.filter(l => isSameDay(new Date(l.addedAt), now));
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const thisWeek = leads.filter(l => new Date(l.addedAt) >= weekStart);
    const thisMonth = leads.filter(l => new Date(l.addedAt) >= monthStart);
    const dmSentToday = leads.filter(l => l.dmSentAt && isSameDay(new Date(l.dmSentAt), now));
    const dmSentWeek = leads.filter(l => l.dmSentAt && new Date(l.dmSentAt) >= weekStart);
    const dmSentMonth = leads.filter(l => l.dmSentAt && new Date(l.dmSentAt) >= monthStart);
    const converted = leads.filter(l => l.status === 'converted');
    const replied = leads.filter(l => l.status === 'replied' || l.status === 'converted');
    return { today, thisWeek, thisMonth, dmSentToday, dmSentWeek, dmSentMonth, converted, replied };
  }, [leads]);

  const platformBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.platform] = (map[l.platform] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const recentLeads = leads.slice(0, 5);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const count = leads.filter(l => isSameDay(new Date(l.addedAt), d)).length;
      const dmCount = leads.filter(l => l.dmSentAt && isSameDay(new Date(l.dmSentAt), d)).length;
      days.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), count, dmCount, isToday: i === 0 });
    }
    return days;
  }, [leads]);

  const maxBarVal = Math.max(...weeklyData.map(d => Math.max(d.count, d.dmCount)), 1);

  return (
    <div className="pb-4 space-y-5">
      {/* Colorful Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 px-4 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-8xl">📊</div>
          <div className="absolute -bottom-4 -left-4 text-8xl">🚀</div>
        </div>
        <h1 className="text-3xl font-black text-white relative z-10">LeadPulse</h1>
        <p className="text-violet-200 text-sm mt-0.5 relative z-10">Your lead progress dashboard</p>
        <div className="flex gap-4 mt-4 relative z-10">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{leads.length}</div>
            <div className="text-xs text-violet-200 font-semibold">Total Leads</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-black text-white">
              {leads.filter(l => l.dmSentAt).length}
            </div>
            <div className="text-xs text-violet-200 font-semibold">DMs Sent</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-black text-white">{stats.converted.length}</div>
            <div className="text-xs text-violet-200 font-semibold">Converted</div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 -mt-2">
        {/* Alert banners */}
        <div className="space-y-2">
          {followUpDue.length > 0 && (
            <button
              onClick={() => onNavigate('followup')}
              className="w-full flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3.5 rounded-2xl shadow-lg shadow-orange-200"
            >
              <span className="text-2xl animate-bounce">🔔</span>
              <div className="text-left">
                <div className="font-black">
                  {followUpDue.length} Follow-Up{followUpDue.length > 1 ? 's' : ''} Due!
                </div>
                <div className="text-xs opacity-90">Tap to send follow-ups now →</div>
              </div>
              <span className="ml-auto bg-white/20 rounded-xl px-2 py-1 text-sm font-black">
                {followUpDue.length}
              </span>
            </button>
          )}

          {newLeadsReadyToDm.length > 0 && (
            <button
              onClick={() => onNavigate('senddm')}
              className="w-full flex items-center gap-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white p-3.5 rounded-2xl shadow-lg shadow-violet-200"
            >
              <span className="text-2xl">✉️</span>
              <div className="text-left">
                <div className="font-black">
                  {newLeadsReadyToDm.length} Lead{newLeadsReadyToDm.length > 1 ? 's' : ''} Ready to DM!
                </div>
                <div className="text-xs opacity-90">Tap to compose & send messages →</div>
              </div>
              <span className="ml-auto bg-white/20 rounded-xl px-2 py-1 text-sm font-black">
                {newLeadsReadyToDm.length}
              </span>
            </button>
          )}
        </div>

        {/* TODAY stats */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <h2 className="font-black text-slate-700 text-base">Today's Progress</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              value={stats.today.length}
              label="Leads Collected"
              sublabel="today"
              gradient="bg-gradient-to-br from-violet-500 to-purple-700"
              icon="🎯"
              onClick={() => onNavigate('leads')}
            />
            <StatCard
              value={stats.dmSentToday.length}
              label="DMs Sent"
              sublabel="today"
              gradient="bg-gradient-to-br from-pink-500 to-rose-600"
              icon="✉️"
              onClick={() => onNavigate('senddm')}
            />
          </div>
        </div>

        {/* WEEK / MONTH stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">📆 This Week</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Leads</span>
                <span className="font-black text-violet-600 text-xl">{stats.thisWeek.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">DMs</span>
                <span className="font-black text-pink-600 text-xl">{stats.dmSentWeek.length}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">🗓️ This Month</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Leads</span>
                <span className="font-black text-violet-600 text-xl">{stats.thisMonth.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">DMs</span>
                <span className="font-black text-pink-600 text-xl">{stats.dmSentMonth.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-3 text-white text-center shadow-md">
            <div className="text-2xl font-black">{stats.replied.length}</div>
            <div className="text-xs font-bold opacity-90">Replied</div>
          </div>
          <div
            className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-3 text-white text-center shadow-md cursor-pointer active:scale-95"
            onClick={() => onNavigate('followup')}
          >
            <div className="text-2xl font-black">{followUpDue.length}</div>
            <div className="text-xs font-bold opacity-90">Follow-Ups</div>
          </div>
          <div className="bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl p-3 text-white text-center shadow-md">
            <div className="text-2xl font-black">{stats.converted.length}</div>
            <div className="text-xs font-bold opacity-90">Converted</div>
          </div>
        </div>

        {/* 7-day bar chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
            <span>📈</span> Last 7 Days Activity
          </h3>
          <div className="flex items-end gap-1.5" style={{ height: '90px' }}>
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '72px' }}>
                  <div
                    className={`flex-1 rounded-t-md transition-all ${d.isToday ? 'bg-violet-500' : 'bg-violet-200'}`}
                    style={{ height: `${(d.count / maxBarVal) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                  />
                  <div
                    className={`flex-1 rounded-t-md transition-all ${d.isToday ? 'bg-pink-500' : 'bg-pink-200'}`}
                    style={{ height: `${(d.dmCount / maxBarVal) * 100}%`, minHeight: d.dmCount > 0 ? '4px' : '0' }}
                  />
                </div>
                <div className={`text-[10px] font-black ${d.isToday ? 'text-violet-600' : 'text-slate-400'}`}>
                  {d.label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-violet-400 inline-block" /> Leads
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-pink-400 inline-block" /> DMs
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('newlead')}
              className="flex items-center gap-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg font-bold text-sm active:scale-95 transition-all"
            >
              <span className="text-2xl">🎯</span>
              <div className="text-left">
                <div>Add Lead</div>
                <div className="text-xs opacity-80 font-normal">Save new profile</div>
              </div>
            </button>
            <button
              onClick={() => onNavigate('senddm')}
              className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 rounded-2xl shadow-lg font-bold text-sm active:scale-95 transition-all"
            >
              <span className="text-2xl">✉️</span>
              <div className="text-left">
                <div>Send DM</div>
                <div className="text-xs opacity-80 font-normal">{newLeadsReadyToDm.length} waiting</div>
              </div>
            </button>
          </div>
        </div>

        {/* Platform breakdown */}
        {platformBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2">
              <span>🌐</span> Platform Breakdown
            </h3>
            <div className="space-y-3">
              {platformBreakdown.map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <PlatformIcon platform={platform as any} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700">{platform}</span>
                      <span className="font-black text-slate-600">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-400 to-pink-500 rounded-full transition-all"
                        style={{ width: `${(count / leads.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Leads */}
        {recentLeads.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-700 flex items-center gap-2">
                <span>🆕</span> Recent Leads
              </h3>
              <button onClick={() => onNavigate('leads')} className="text-xs text-violet-600 font-black bg-violet-50 px-3 py-1 rounded-lg">
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <PlatformIcon platform={lead.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">{lead.name}</div>
                    <div className="text-xs text-slate-400">{lead.category}</div>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {leads.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-black text-slate-700 mb-2">Let's Get Started!</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Add your first lead to start tracking your progress and sending AI-powered DMs!
            </p>
            <button
              onClick={() => onNavigate('newlead')}
              className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-8 py-3.5 rounded-2xl font-black text-base shadow-xl shadow-violet-200"
            >
              🎯 Add First Lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
