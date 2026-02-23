import { useState } from 'react';
import type { Template } from '../types';

interface Props {
  templates: Template[];
  onAdd: (tpl: Omit<Template, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Template>) => void;
  onDelete: (id: string) => void;
}

export function Templates({ templates, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'dm' | 'followup'>('dm');
  const [content, setContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const dmTemplates = templates.filter(t => t.type === 'dm');
  const fuTemplates = templates.filter(t => t.type === 'followup');

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    if (editId) {
      onUpdate(editId, { name, type, content });
      setEditId(null);
    } else {
      onAdd({ name, type, content });
    }
    setName('');
    setContent('');
    setType('dm');
    setShowForm(false);
  };

  const handleEdit = (tpl: Template) => {
    setEditId(tpl.id);
    setName(tpl.name);
    setType(tpl.type);
    setContent(tpl.content);
    setShowForm(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
    setContent('');
    setType('dm');
  };

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Header */}
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            📝 <span className="bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent">Templates</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your DM & follow-up messages</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md"
          >
            + New
          </button>
        )}
      </div>

      {/* Template form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-green-300 p-4 space-y-3 shadow-lg">
          <h3 className="font-black text-slate-800">{editId ? '✏️ Edit Template' : '✨ New Template'}</h3>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Business Coach DM"
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-400 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('dm')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${type === 'dm' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}
              >
                ✉️ First DM
              </button>
              <button
                onClick={() => setType('followup')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${type === 'followup' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}
              >
                🔄 Follow-Up
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Message Content</label>
            <p className="text-xs text-slate-400 mb-1.5">Use <span className="font-mono bg-slate-100 px-1 rounded">[Name]</span> to auto-insert the lead's name</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Hey [Name]! 👋&#10;&#10;I saw your profile and..."
              rows={8}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-400 resize-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 border-2 border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !content.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
            >
              {editId ? 'Update' : 'Save Template'}
            </button>
          </div>
        </div>
      )}

      {/* DM Templates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">✉️</span>
          <h2 className="font-black text-slate-700">First DM Templates</h2>
          <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-bold">{dmTemplates.length}</span>
        </div>
        {dmTemplates.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-300">
            <div className="text-3xl mb-2">✉️</div>
            <div className="text-sm text-slate-500">No DM templates yet. Create your first one!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {dmTemplates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{tpl.name}</span>
                    <span className="ml-2 bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold">DM</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(tpl.id, tpl.content)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${copied === tpl.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {copied === tpl.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button onClick={() => handleEdit(tpl)} className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-semibold">
                      ✏️
                    </button>
                    {deleteConfirm === tpl.id ? (
                      <button onClick={() => { onDelete(tpl.id); setDeleteConfirm(null); }} className="text-xs bg-red-500 text-white px-2 py-1.5 rounded-lg font-semibold">
                        Sure?
                      </button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(tpl.id)} className="text-xs bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg font-semibold">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {tpl.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up Templates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔄</span>
          <h2 className="font-black text-slate-700">Follow-Up Templates</h2>
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">{fuTemplates.length}</span>
        </div>
        {fuTemplates.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-300">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-sm text-slate-500">No follow-up templates yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {fuTemplates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{tpl.name}</span>
                    <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">Follow-Up</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(tpl.id, tpl.content)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${copied === tpl.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {copied === tpl.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button onClick={() => handleEdit(tpl)} className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-semibold">
                      ✏️
                    </button>
                    {deleteConfirm === tpl.id ? (
                      <button onClick={() => { onDelete(tpl.id); setDeleteConfirm(null); }} className="text-xs bg-red-500 text-white px-2 py-1.5 rounded-lg font-semibold">
                        Sure?
                      </button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(tpl.id)} className="text-xs bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg font-semibold">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {tpl.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-200">
        <h3 className="font-bold text-green-800 mb-2 text-sm">💡 Tips</h3>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Use <span className="font-mono bg-green-100 px-1 rounded">[Name]</span> — it'll be replaced with the lead's name automatically</li>
          <li>• Keep your first DM short, personal and value-focused</li>
          <li>• Follow-up message should be friendly, not pushy</li>
        </ul>
      </div>
    </div>
  );
}
