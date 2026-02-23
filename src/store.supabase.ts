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

// ─── ROW CONVERTERS ──────────────────────────────────────────────────────────
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
export function useSupabaseStore(_userId: string | null) {
  const [data, setData] = useState<AppData>(loadLocalData);
  const [synced, setSynced] = useState(!isSupabaseConfigured);
  const initialized = useRef(false);

  // On mount, if Supabase is configured, load from DB
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || initialized.current) return;
    initialized.current = true;
    loadFromSupabase();
  }, []);

  // Always mirror to localStorage as offline backup
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  // ─── LOAD ALL DATA FROM SUPABASE ─────────────────────────────────────────
  const loadFromSupabase = async () => {
    if (!supabase) return;
    setSynced(false);
    try {
      const [leadsRes, templatesRes, settingsRes] = await Promise.all([
        supabase.from('leads').select('*').order('added_at', { ascending: false }),
        supabase.from('templates').select('*').order('created_at', { ascending: true }),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
      ]);

      const leads = (leadsRes.data || []).map(r => rowToLead(r as Record<string, unknown>));

      let templates: Template[];
      if ((templatesRes.data || []).length > 0) {
        templates = (templatesRes.data || []).map(r => rowToTemplate(r as Record<string, unknown>));
      } else {
        templates = defaultTemplates;
        // Seed default templates into DB
        for (const tpl of defaultTemplates) {
          await supabase.from('templates').insert({
            name: tpl.name,
            type: tpl.type,
            content: tpl.content,
          }).select();
        }
      }

      const settings = settingsRes.data
        ? rowToSettings(settingsRes.data as Record<string, unknown>)
        : defaultSettings;

      if (!settingsRes.data) {
        await supabase.from('settings').insert({
          gemini_api_key: defaultSettings.geminiApiKey,
          service_description: '',
          follow_up_days: 3,
        });
      }

      setData({ leads, templates, settings });
      setSynced(true);
    } catch (err) {
      console.error('Failed to load from Supabase:', err);
      setSynced(true); // Fall back to local data silently
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

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase
          .from('leads')
          .insert({
            name: lead.name,
            profile_url: lead.profileUrl,
            platform: lead.platform,
            category: lead.category,
            status: 'new',
            notes: lead.notes || '',
            added_at: new Date().toISOString(),
          })
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
  }, []);

  const bulkAddLeads = useCallback(
    async (incomingLeads: Omit<Lead, 'id' | 'addedAt' | 'status'>[]): Promise<{ imported: number; duplicates: number }> => {
      let imported = 0;
      let duplicates = 0;

      setData(d => {
        const existingUrls = new Set(d.leads.map(l => l.profileUrl?.toLowerCase().trim()));
        const toAdd = incomingLeads.filter(lead => {
          const urlKey = lead.profileUrl?.toLowerCase().trim();
          if (urlKey && existingUrls.has(urlKey)) { duplicates++; return false; }
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

        // Fire-and-forget Supabase insert
        if (supabase && isSupabaseConfigured && toAdd.length > 0) {
          const rows = toAdd.map(lead => ({
            name: lead.name,
            profile_url: lead.profileUrl,
            platform: lead.platform,
            category: lead.category,
            status: 'new',
            notes: lead.notes || '',
            added_at: new Date().toISOString(),
          }));
          void supabase.from('leads').insert(rows).select().then(({ data: inserted }) => {
            if (inserted && inserted.length > 0) {
              const realLeads = (inserted as Record<string, unknown>[]).map(rowToLead);
              setData(d2 => {
                const withoutTemp = d2.leads.filter(l => !l.id.startsWith('lead_bulk_'));
                return { ...d2, leads: [...realLeads, ...withoutTemp] };
              });
            }
          });
        }

        return { ...d, leads: [...newLeads, ...d.leads] };
      });

      // Return approximate counts (actual dedup happens in setData)
      await new Promise(r => setTimeout(r, 50));
      return { imported, duplicates };
    },
    []
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    }));

    if (supabase && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.dmSentAt !== undefined) dbUpdates.dm_sent_at = updates.dmSentAt;
      if (updates.followUpSentAt !== undefined) dbUpdates.follow_up_sent_at = updates.followUpSentAt;
      if (updates.followUpDueDate !== undefined) dbUpdates.follow_up_due_date = updates.followUpDueDate;
      if (updates.lastDmText !== undefined) dbUpdates.last_dm_text = updates.lastDmText;
      if (updates.repliedAt !== undefined) dbUpdates.replied_at = updates.repliedAt;

      try {
        await supabase.from('leads').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.error('Failed to update lead:', err);
      }
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setData(d => ({ ...d, leads: d.leads.filter(l => l.id !== id) }));
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('leads').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    }
  }, []);

  const markDmSent = useCallback(async (id: string, dmText?: string, followUpDays = 3) => {
    const now = new Date();
    const followUpDate = new Date(now);
    followUpDate.setDate(followUpDate.getDate() + followUpDays);
    await updateLead(id, {
      status: 'dm_sent',
      dmSentAt: now.toISOString(),
      followUpDueDate: followUpDate.toISOString(),
      lastDmText: dmText,
    });
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
    const newTpl: Template = { ...tpl, id: tempId, createdAt: new Date().toISOString() };
    setData(d => ({ ...d, templates: [...d.templates, newTpl] }));

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase
          .from('templates')
          .insert({ name: tpl.name, type: tpl.type, content: tpl.content })
          .select().single();
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
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    setData(d => ({
      ...d,
      templates: d.templates.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
    if (supabase && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      try {
        await supabase.from('templates').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.error('Failed to update template:', err);
      }
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setData(d => ({ ...d, templates: d.templates.filter(t => t.id !== id) }));
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('templates').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
  }, []);

  // ─── SETTINGS ────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...updates } }));

    if (supabase && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.geminiApiKey !== undefined) dbUpdates.gemini_api_key = updates.geminiApiKey;
      if (updates.serviceDescription !== undefined) dbUpdates.service_description = updates.serviceDescription;
      if (updates.followUpDays !== undefined) dbUpdates.follow_up_days = updates.followUpDays;

      try {
        // Try update first, then insert if no rows exist
        const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();
        if (existing) {
          await supabase.from('settings').update(dbUpdates).eq('id', (existing as Record<string, unknown>).id as string);
        } else {
          await supabase.from('settings').insert({
            gemini_api_key: updates.geminiApiKey || defaultSettings.geminiApiKey,
            service_description: updates.serviceDescription || '',
            follow_up_days: updates.followUpDays || 3,
          });
        }
      } catch (err) {
        console.error('Failed to update settings:', err);
      }
    }
  }, []);

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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
