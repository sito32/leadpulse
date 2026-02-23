export type Platform = 'Twitter' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'Other';
export type Category = 'Business Coach' | 'New Startup' | 'Tech Company' | 'Freelancer' | 'Agency' | 'E-commerce' | 'Creator' | 'Other';
export type LeadStatus = 'new' | 'dm_sent' | 'follow_up_due' | 'follow_up_sent' | 'replied' | 'converted' | 'not_interested';

export interface Lead {
  id: string;
  name: string;
  profileUrl: string;
  platform: Platform;
  category: Category;
  status: LeadStatus;
  notes: string;
  addedAt: string;
  dmSentAt?: string;
  followUpSentAt?: string;
  repliedAt?: string;
  followUpDueDate?: string;
  lastDmText?: string;
}

export interface Template {
  id: string;
  name: string;
  type: 'dm' | 'followup';
  content: string;
  createdAt: string;
}

export interface AppSettings {
  geminiApiKey: string;
  serviceDescription: string;
  followUpDays: number;
}

export interface AppData {
  leads: Lead[];
  templates: Template[];
  settings: AppSettings;
}
