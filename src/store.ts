import { useState, useEffect, useCallback } from 'react';
import type { Lead, Template, AppData, AppSettings } from './types';

const STORAGE_KEY = 'leadpulse_data_v2';

const defaultTemplates: Template[] = [
  {
    id: 'tpl_dm_1',
    name: 'Default First DM',
    type: 'dm',
    content: `Hey [Name]! 👋

I came across your profile and I'm really impressed by what you're building. Your work in [niche] is exactly the kind of thing I love to support.

I'd love to connect and share something that could genuinely help you grow — would you be open to a quick chat?

Looking forward to hearing from you! 🚀`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_fu_1',
    name: 'Default Follow-Up',
    type: 'followup',
    content: `Hey [Name]! 👋

Just circling back on my last message — I know things get busy!

I truly believe what I have to share could add real value to what you're doing. Would love just 10 minutes of your time.

Let me know if you're open to it! 😊`,
    createdAt: new Date().toISOString(),
  },
];

const defaultSettings: AppSettings = {
  geminiApiKey: 'AIzaSyD0WGE5x3zozZWLZQlOwThPkL54-66Ng74',
  serviceDescription: '',
  followUpDays: 3,
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return {
        ...parsed,
        settings: { ...defaultSettings, ...parsed.settings },
      };
    }
  } catch {
    // ignore
  }
  return { leads: [], templates: defaultTemplates, settings: defaultSettings };
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStore() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'addedAt' | 'status'>) => {
    const newLead: Lead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      addedAt: new Date().toISOString(),
      status: 'new',
    };
    setData(d => ({ ...d, leads: [newLead, ...d.leads] }));
    return newLead;
  }, []);

  const bulkAddLeads = useCallback(
    (incomingLeads: Omit<Lead, 'id' | 'addedAt' | 'status'>[]): { imported: number; duplicates: number } => {
      let imported = 0;
      let duplicates = 0;
      setData(d => {
        const existingUrls = new Set(d.leads.map(l => l.profileUrl?.toLowerCase().trim()));
        const newLeads: Lead[] = [];
        incomingLeads.forEach((lead, idx) => {
          const urlKey = lead.profileUrl?.toLowerCase().trim();
          if (urlKey && existingUrls.has(urlKey)) {
            duplicates++;
          } else {
            if (urlKey) existingUrls.add(urlKey);
            imported++;
            newLeads.push({
              ...lead,
              id: `lead_bulk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`,
              addedAt: new Date().toISOString(),
              status: 'new',
            });
          }
        });
        return { ...d, leads: [...newLeads, ...d.leads] };
      });
      return { imported, duplicates };
    },
    []
  );

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setData(d => ({ ...d, leads: d.leads.filter(l => l.id !== id) }));
  }, []);

  const markDmSent = useCallback((id: string, dmText?: string, followUpDays = 3) => {
    const now = new Date();
    const followUpDate = new Date(now);
    followUpDate.setDate(followUpDate.getDate() + followUpDays);
    setData(d => ({
      ...d,
      leads: d.leads.map(l =>
        l.id === id
          ? {
              ...l,
              status: 'dm_sent',
              dmSentAt: now.toISOString(),
              followUpDueDate: followUpDate.toISOString(),
              lastDmText: dmText ?? l.lastDmText,
            }
          : l
      ),
    }));
  }, []);

  const markFollowUpSent = useCallback((id: string) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l =>
        l.id === id
          ? {
              ...l,
              status: 'follow_up_sent',
              followUpSentAt: new Date().toISOString(),
            }
          : l
      ),
    }));
  }, []);

  const markStatus = useCallback((id: string, status: Lead['status']) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => (l.id === id ? { ...l, status } : l)),
    }));
  }, []);

  const addTemplate = useCallback((tpl: Omit<Template, 'id' | 'createdAt'>) => {
    const newTpl: Template = {
      ...tpl,
      id: `tpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData(d => ({ ...d, templates: [...d.templates, newTpl] }));
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<Template>) => {
    setData(d => ({
      ...d,
      templates: d.templates.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setData(d => ({ ...d, templates: d.templates.filter(t => t.id !== id) }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...updates } }));
  }, []);

  const followUpDue = data.leads.filter(l => {
    if (l.status !== 'dm_sent') return false;
    if (!l.followUpDueDate) return false;
    return new Date(l.followUpDueDate) <= new Date();
  });

  // Leads that have no DM sent yet (status = 'new') - ready to DM
  const newLeadsReadyToDm = data.leads.filter(l => l.status === 'new');

  return {
    leads: data.leads,
    templates: data.templates,
    settings: data.settings,
    followUpDue,
    newLeadsReadyToDm,
    addLead,
    bulkAddLeads,
    updateLead,
    deleteLead,
    markDmSent,
    markFollowUpSent,
    markStatus,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
  };
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(d: Date) {
  const result = new Date(d);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
