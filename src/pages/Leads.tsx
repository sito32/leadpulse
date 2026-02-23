import { useState } from 'react';
import type { Lead, LeadStatus, Platform } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PlatformIcon } from '../components/PlatformIcon';

interface Props {
  leads: Lead[];
  onDelete: (id: string) => void;
  onMarkStatus: (id: string, status: LeadStatus) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const PLATFORMS: Platform[] = ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'Other'];
const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: '🔵 New Lead' },
  { value: 'dm_sent', label: '🟣 DM Sent' },
  { value: 'follow_up_due', label: '🟠 Follow-Up Due' },
  { value: 'follow_up_sent', label: '🟡 Follow-Up Sent' },
  { value: 'replied', label: '🟢 Replied' },
  { value: 'converted', label: '✅ Converted' },
  { value: 'not_interested', label: '🔴 Not Interested' },
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Leads({ leads, onDelete, onMarkStatus, onUpdateLead }: Props) {
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = leads.filter(l => {
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase()) ||
      l.profileUrl.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === 'all' || l.platform === filterPlatform;
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchPlatform && matchStatus;
  });

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-slate-800">
          📋 <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">All Leads</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">{leads.length} leads total · {filtered.length} shown</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, category..."
          className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterPlatform('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterPlatform === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 text-slate-600 bg-white'}`}
        >
          All Platforms
        </button>
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterPlatform === p ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 text-slate-600 bg-white'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === 'all' ? 'bg-violet-500 text-white border-violet-500' : 'border-slate-200 text-slate-600 bg-white'}`}
        >
          All Status
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === s.value ? 'bg-violet-500 text-white border-violet-500' : 'border-slate-200 text-slate-600 bg-white'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🔍</div>
          <div className="font-bold text-slate-600">No leads found</div>
          <div className="text-sm text-slate-400">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <div
              key={lead.id}
              className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${expandedId === lead.id ? 'border-blue-300' : 'border-slate-100'}`}
            >
              <button
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={lead.platform} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">{lead.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{lead.category} · {formatDate(lead.addedAt)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={lead.status} />
                    <span className="text-slate-300 text-sm">{expandedId === lead.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {expandedId === lead.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                  {/* Profile URL */}
                  <a
                    href={lead.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 font-semibold truncate"
                  >
                    🔗 {lead.profileUrl}
                  </a>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400 font-semibold">Added</div>
                      <div className="text-slate-700 font-bold">{formatDate(lead.addedAt)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400 font-semibold">DM Sent</div>
                      <div className="text-slate-700 font-bold">{formatDate(lead.dmSentAt)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400 font-semibold">Follow-Up Due</div>
                      <div className="text-slate-700 font-bold">{formatDate(lead.followUpDueDate)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400 font-semibold">Follow-Up Sent</div>
                      <div className="text-slate-700 font-bold">{formatDate(lead.followUpSentAt)}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {editId === lead.id ? (
                    <div>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 resize-none"
                        placeholder="Add notes..."
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => { onUpdateLead(lead.id, { notes: editNotes }); setEditId(null); }}
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setEditId(lead.id); setEditNotes(lead.notes || ''); }}
                      className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="text-xs font-bold text-slate-400 mb-1">Notes (tap to edit)</div>
                      <div className="text-xs text-slate-600">{lead.notes || 'No notes yet...'}</div>
                    </div>
                  )}

                  {/* Status change */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1.5">Update Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => onMarkStatus(lead.id, s.value)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            lead.status === s.value
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  {deleteConfirm === lead.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onDelete(lead.id); setDeleteConfirm(null); setExpandedId(null); }}
                        className="flex-1 bg-red-500 text-white text-xs py-2 rounded-xl font-bold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 border border-slate-200 text-slate-600 text-xs py-2 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(lead.id)}
                      className="w-full border border-red-200 text-red-500 text-xs py-2 rounded-xl font-semibold"
                    >
                      🗑️ Delete Lead
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
