import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Lead, Template, AppData, AppSettings } from './types';

const STORAGE_KEY = 'leadpulse_data_v2';

const defaultTemplates: Template[] = [
  {
    id: 'tpl_dm_1',
    name: 'Default First DM',
    type: 'dm',
    content: `Hey [Name]! 👋\n\nI came across your profile and I'm really impressed by what you're building. Your work in [niche] is exactly the kind of thing I love to support.\n\nI'd love to connect and share something that could genuinely help you grow — would you be open to a quick chat?\n\nLooking forward to hearing from you! 🚀`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_fu_1',
    name: 'Default Follow-Up',
    type: 'followup',
    content: `Hey [Name]! 👋\n\nJust circling back on my last message — I know things get busy!\n\nI truly believe what I have to share could add real value to what you're doing. Would love just 10 minutes of your time.\n\nLet me know if you're open to it! 😊`,
    createdAt: new Date().toISOString(),
  },
];

const defaultSettings: AppSettings = {
  geminiApiKey: 'AIzaSyD0WGE5x3zozZWLZQlOwThPkL54-66Ng74',
  serviceDescription: '',
  followUpDays: 3,
};

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
function loadLocalData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return { ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
    }
  } catch { /* ignore */ }
  return { leads: [], templates: defaultTemplates, settings: defaultSettings };
}

function saveLocalData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── SUPABASE ROW ↔ LEAD CONVERTERS ──────────────────────────────────────────
function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    profileUrl: (row.profile_url as string) || '',
    platform: row.platform as Lead['platform'],
    category: row.category as Lead['category'],
    status: (row.status as Lead['status']) || 'new',
    notes: (row.notes as string) || '',
    addedAt: (row.added_at as string) || (row.created_at as string),
    dmSentAt: (row.dm_sent_at as string) || undefined,
    followUpSentAt: (row.follow_up_sent_at as string) || undefined,
    repliedAt: (row.replied_at as string) || undefined,
    followUpDueDate: (row.follow_up_due_date as string) || undefined,
    lastDmText: (row.last_dm_text as string) || undefined,
  };
}

function leadToRow(lead: Omit<Lead, 'id' | 'addedAt' | 'status'>, userId: string) {
  return {
    user_id: userId,
    name: lead.name,
    profile_url: lead.profileUrl,
    platform: lead.platform,
    category: lead.category,
    status: 'new',
    notes: lead.notes || '',
    added_at: new Date().toISOString(),
  };
}

function rowToTemplate(row: Record<string, unknown>): Template {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as 'dm' | 'followup',
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    geminiApiKey: (row.gemini_api_key as string) || defaultSettings.geminiApiKey,
    serviceDescription: (row.service_description as string) || '',
    followUpDays: (row.follow_up_days as number) || 3,
  };
}

// ─── MAIN STORE HOOK ──────────────────────────────────────────────────────────
export function useSupabaseStore(userId: string | null) {
  const [data, setData] = useState<AppData>(loadLocalData);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const initialized = useRef(false);

  // Load all data from Supabase when userId is available
  useEffect(() => {
    if (!userId || !supabase || !isSupabaseConfigured || initialized.current) return;
    initialized.current = true;
    loadFromSupabase(userId);
  }, [userId]);

  // Save to localStorage as fallback always
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  const loadFromSupabase = async (uid: string) => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Load leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', uid)
        .order('added_at', { ascending: false });

      // Load templates
      const { data: templatesData } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      // Load settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      const leads = (leadsData || []).map(r => rowToLead(r as Record<string, unknown>));
      const templates = (templatesData || []).length > 0
        ? (templatesData || []).map(r => rowToTemplate(r as Record<string, unknown>))
        : defaultTemplates;
      const settings = settingsData
        ? rowToSettings(settingsData as Record<string, unknown>)
        : defaultSettings;

      setData({ leads, templates, settings });
      setSynced(true);

      // If no templates exist in DB yet, seed them
      if ((templatesData || []).length === 0) {
        for (const tpl of defaultTemplates) {
          await supabase.from('templates').insert({
            user_id: uid,
            name: tpl.name,
            type: tpl.type,
            content: tpl.content,
          });
        }
      }

      // If no settings exist, create them
      if (!settingsData) {
        await supabase.from('settings').insert({
          user_id: uid,
          gemini_api_key: defaultSettings.geminiApiKey,
          service_description: '',
          follow_up_days: 3,
        });
      }
    } catch (err) {
      console.error('Failed to load from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── LEADS ────────────────────────────────────────────────────────────────
  const addLead = useCallback(async (
    lead: Omit<Lead, 'id' | 'addedAt' | 'status'>
  ): Promise<Lead> => {
    const tempId = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newLead: Lead = {
      ...lead,
      id: tempId,
      addedAt: new Date().toISOString(),
      status: 'new',
    };

    // Optimistic update
    setData(d => ({ ...d, leads: [newLead, ...d.leads] }));

    if (supabase && userId && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase
          .from('leads')
          .insert(leadToRow(lead, userId))
          .select()
          .single();

        if (inserted) {
          const realLead = rowToLead(inserted as Record<string, unknown>);
          setData(d => ({
            ...d,
            leads: d.leads.map(l => l.id === tempId ? realLead : l),
          }));
          return realLead;
        }
      } catch (err) {
        console.error('Failed to insert lead:', err);
      }
    }
    return newLead;
  }, [userId]);

  const bulkAddLeads = useCallback(
    async (incomingLeads: Omit<Lead, 'id' | 'addedAt' | 'status'>[]): Promise<{ imported: number; duplicates: number }> => {
      let imported = 0;
      let duplicates = 0;
      const existingUrls = new Set(data.leads.map(l => l.profileUrl?.toLowerCase().trim()));

      const toAdd = incomingLeads.filter(lead => {
        const urlKey = lead.profileUrl?.toLowerCase().trim();
        if (urlKey && existingUrls.has(urlKey)) {
          duplicates++;
          return false;
        }
        if (urlKey) existingUrls.add(urlKey);
        imported++;
        return true;
      });

      const newLeads: Lead[] = toAdd.map((lead, idx) => ({
        ...lead,
        id: `lead_bulk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`,
        addedAt: new Date().toISOString(),
        status: 'new' as const,
      }));

      setData(d => ({ ...d, leads: [...newLeads, ...d.leads] }));

      if (supabase && userId && isSupabaseConfigured && toAdd.length > 0) {
        try {
          const rows = toAdd.map(lead => leadToRow(lead, userId));
          const { data: inserted } = await supabase.from('leads').insert(rows).select();
          if (inserted && inserted.length > 0) {
            const realLeads = (inserted as Record<string, unknown>[]).map(rowToLead);
            setData(d => {
              const withoutTemp = d.leads.filter(l => !l.id.startsWith('lead_bulk_'));
              return { ...d, leads: [...realLeads, ...withoutTemp] };
            });
          }
        } catch (err) {
          console.error('Failed to bulk insert leads:', err);
        }
      }

      return { imported, duplicates };
    },
    [userId, data.leads]
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    }));

    if (supabase && userId && isSupabaseConfigured) {
      // Convert camelCase to snake_case for Supabase
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.dmSentAt !== undefined) dbUpdates.dm_sent_at = updates.dmSentAt;
      if (updates.followUpSentAt !== undefined) dbUpdates.follow_up_sent_at = updates.followUpSentAt;
      if (updates.followUpDueDate !== undefined) dbUpdates.follow_up_due_date = updates.followUpDueDate;
      if (updates.lastDmText !== undefined) dbUpdates.last_dm_text = updates.lastDmText;
      if (updates.repliedAt !== undefined) dbUpdates.replied_at = updates.repliedAt;

      try {
        await supabase.from('leads').update(dbUpdates).eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Failed to update lead:', err);
      }
    }
  }, [userId]);

  const deleteLead = useCallback(async (id: string) => {
    setData(d => ({ ...d, leads: d.leads.filter(l => l.id !== id) }));
    if (supabase && userId && isSupabaseConfigured) {
      try {
        await supabase.from('leads').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    }
  }, [userId]);

  const markDmSent = useCallback(async (id: string, dmText?: string, followUpDays = 3) => {
    const now = new Date();
    const followUpDate = new Date(now);
    followUpDate.setDate(followUpDate.getDate() + followUpDays);

    const updates: Partial<Lead> = {
      status: 'dm_sent',
      dmSentAt: now.toISOString(),
      followUpDueDate: followUpDate.toISOString(),
      lastDmText: dmText,
    };
    await updateLead(id, updates);
  }, [updateLead]);

  const markFollowUpSent = useCallback(async (id: string) => {
    await updateLead(id, {
      status: 'follow_up_sent',
      followUpSentAt: new Date().toISOString(),
    });
  }, [updateLead]);

  const markStatus = useCallback(async (id: string, status: Lead['status']) => {
    await updateLead(id, { status });
  }, [updateLead]);

  // ─── TEMPLATES ────────────────────────────────────────────────────────────
  const addTemplate = useCallback(async (tpl: Omit<Template, 'id' | 'createdAt'>) => {
    const tempId = `tpl_${Date.now()}`;
    const newTpl: Template = {
      ...tpl,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setData(d => ({ ...d, templates: [...d.templates, newTpl] }));

    if (supabase && userId && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase
          .from('templates')
          .insert({ user_id: userId, name: tpl.name, type: tpl.type, content: tpl.content })
          .select()
          .single();
        if (inserted) {
          const realTpl = rowToTemplate(inserted as Record<string, unknown>);
          setData(d => ({
            ...d,
            templates: d.templates.map(t => t.id === tempId ? realTpl : t),
          }));
        }
      } catch (err) {
        console.error('Failed to insert template:', err);
      }
    }
  }, [userId]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    setData(d => ({
      ...d,
      templates: d.templates.map(t => t.id === id ? { ...t, ...updates } : t),
    }));

    if (supabase && userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      try {
        await supabase.from('templates').update(dbUpdates).eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Failed to update template:', err);
      }
    }
  }, [userId]);

  const deleteTemplate = useCallback(async (id: string) => {
    setData(d => ({ ...d, templates: d.templates.filter(t => t.id !== id) }));
    if (supabase && userId && isSupabaseConfigured) {
      try {
        await supabase.from('templates').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
  }, [userId]);

  // ─── SETTINGS ────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...updates } }));

    if (supabase && userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.geminiApiKey !== undefined) dbUpdates.gemini_api_key = updates.geminiApiKey;
      if (updates.serviceDescription !== undefined) dbUpdates.service_description = updates.serviceDescription;
      if (updates.followUpDays !== undefined) dbUpdates.follow_up_days = updates.followUpDays;

      try {
        await supabase.from('settings').upsert({
          user_id: userId,
          ...dbUpdates,
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('Failed to update settings:', err);
      }
    }
  }, [userId]);

  // ─── DERIVED ─────────────────────────────────────────────────────────────
  const followUpDue = data.leads.filter(l => {
    if (l.status !== 'dm_sent') return false;
    if (!l.followUpDueDate) return false;
    return new Date(l.followUpDueDate) <= new Date();
  });

  const newLeadsReadyToDm = data.leads.filter(l => l.status === 'new');

  return {
    leads: data.leads,
    templates: data.templates,
    settings: data.settings,
    followUpDue,
    newLeadsReadyToDm,
    loading,
    synced,
    isSupabaseConfigured,
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

// ─── HELPERS (re-exported for Dashboard) ─────────────────────────────────────
export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(d: Date) {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
