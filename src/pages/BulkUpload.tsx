import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import type { Platform, Category, Lead } from '../types';

interface Props {
  onImport: (leads: Omit<Lead, 'id' | 'addedAt' | 'status'>[]) => { imported: number; duplicates: number } | Promise<{ imported: number; duplicates: number }>;
  existingLeads: Lead[];
}

type RawRow = Record<string, string>;

interface MappedLead {
  name: string;
  profileUrl: string;
  platform: Platform;
  category: Category;
  notes: string;
  isDuplicate: boolean;
  isSelected: boolean;
  rowIndex: number;
}

const PLATFORMS: Platform[] = ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'Other'];
const CATEGORIES: Category[] = [
  'Business Coach', 'New Startup', 'Tech Company', 'Freelancer',
  'Agency', 'E-commerce', 'Creator', 'Other',
];

const PLATFORM_COLORS: Record<Platform, string> = {
  Twitter: 'bg-sky-100 text-sky-700 border-sky-300',
  Instagram: 'bg-pink-100 text-pink-700 border-pink-300',
  Facebook: 'bg-blue-100 text-blue-700 border-blue-300',
  LinkedIn: 'bg-blue-100 text-blue-800 border-blue-400',
  Other: 'bg-slate-100 text-slate-600 border-slate-300',
};

const PLATFORM_EMOJIS: Record<Platform, string> = {
  Twitter: '🐦', Instagram: '📸', Facebook: '👥', LinkedIn: '💼', Other: '🌐',
};

function guessPlatform(val: string): Platform {
  const v = val?.toLowerCase() || '';
  if (v.includes('twitter') || v.includes('x.com') || v === 'twitter') return 'Twitter';
  if (v.includes('instagram') || v.includes('ig') || v === 'instagram') return 'Instagram';
  if (v.includes('facebook') || v.includes('fb') || v === 'facebook') return 'Facebook';
  if (v.includes('linkedin') || v === 'linkedin') return 'LinkedIn';
  return 'Other';
}

function guessCategory(val: string): Category {
  const v = val?.toLowerCase() || '';
  if (v.includes('coach')) return 'Business Coach';
  if (v.includes('startup')) return 'New Startup';
  if (v.includes('tech')) return 'Tech Company';
  if (v.includes('freelanc')) return 'Freelancer';
  if (v.includes('agency')) return 'Agency';
  if (v.includes('ecommerce') || v.includes('e-commerce') || v.includes('shop')) return 'E-commerce';
  if (v.includes('creator') || v.includes('content')) return 'Creator';
  return 'Other';
}

function detectColumn(headers: string[], keywords: string[]): string {
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
}

const SAMPLE_CSV = `Name,Profile URL,Platform,Category,Notes
John Smith,https://instagram.com/johnsmith,Instagram,Business Coach,Posts daily about mindset
TechStartup Inc,https://linkedin.com/company/techstartup,LinkedIn,New Startup,SaaS product just launched
Sarah Creator,https://twitter.com/sarahcreates,Twitter,Creator,100k followers lifestyle creator
Agency Pro,https://facebook.com/agencypro,Facebook,Agency,Full service digital marketing agency
`;

type Step = 'upload' | 'map' | 'preview' | 'done';

export function BulkUpload({ onImport, existingLeads }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [rawData, setRawData] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  // Column mapping
  const [colName, setColName] = useState('');
  const [colUrl, setColUrl] = useState('');
  const [colPlatform, setColPlatform] = useState('');
  const [colCategory, setColCategory] = useState('');
  const [colNotes, setColNotes] = useState('');

  // Default values for missing fields
  const [defaultPlatform, setDefaultPlatform] = useState<Platform>('Instagram');
  const [defaultCategory, setDefaultCategory] = useState<Category>('Other');

  // Preview
  const [previewLeads, setPreviewLeads] = useState<MappedLead[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSV = useCallback((csvText: string, name: string) => {
    setError('');
    const result = Papa.parse<RawRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      setError('Could not parse file. Make sure it is a valid CSV or spreadsheet.');
      return;
    }

    const rows = result.data;
    if (rows.length === 0) {
      setError('No data found in the file.');
      return;
    }

    const hdrs = Object.keys(rows[0]);
    setHeaders(hdrs);
    setRawData(rows);
    setFileName(name);

    // Auto-detect columns
    const nameCol = detectColumn(hdrs, ['name', 'person', 'contact', 'lead', 'full name', 'username']);
    const urlCol = detectColumn(hdrs, ['url', 'link', 'profile', 'handle', 'instagram', 'twitter', 'linkedin', 'facebook']);
    const platformCol = detectColumn(hdrs, ['platform', 'network', 'social', 'source']);
    const categoryCol = detectColumn(hdrs, ['category', 'niche', 'type', 'industry', 'segment']);
    const notesCol = detectColumn(hdrs, ['notes', 'note', 'comment', 'description', 'remarks', 'info']);

    setColName(nameCol);
    setColUrl(urlCol);
    setColPlatform(platformCol);
    setColCategory(categoryCol);
    setColNotes(notesCol);

    setStep('map');
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text, file.name);
    };
    reader.readAsText(file);
  }, [processCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    processCSV(pasteText.trim(), 'pasted-data.csv');
    setShowPaste(false);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadpulse-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBuildPreview = () => {
    if (!colName) {
      setError('Please select at least the Name column.');
      return;
    }
    setError('');

    const existingUrls = new Set(existingLeads.map(l => l.profileUrl?.toLowerCase().trim()));

    const mapped: MappedLead[] = rawData.map((row, i) => {
      const name = (row[colName] || '').trim();
      const profileUrl = colUrl ? (row[colUrl] || '').trim() : '';
      const platformRaw = colPlatform ? (row[colPlatform] || '') : '';
      const categoryRaw = colCategory ? (row[colCategory] || '') : '';
      const notes = colNotes ? (row[colNotes] || '').trim() : '';

      const platform = PLATFORMS.includes(platformRaw as Platform)
        ? (platformRaw as Platform)
        : guessPlatform(platformRaw) !== 'Other'
        ? guessPlatform(platformRaw)
        : defaultPlatform;

      const category = CATEGORIES.includes(categoryRaw as Category)
        ? (categoryRaw as Category)
        : guessCategory(categoryRaw) !== 'Other'
        ? guessCategory(categoryRaw)
        : defaultCategory;

      const isDuplicate = !!profileUrl && existingUrls.has(profileUrl.toLowerCase().trim());

      return {
        name,
        profileUrl,
        platform,
        category,
        notes,
        isDuplicate,
        isSelected: !isDuplicate && name.length > 0,
        rowIndex: i,
      };
    }).filter(l => l.name.length > 0);

    setPreviewLeads(mapped);
    setStep('preview');
  };

  const toggleSelect = (index: number) => {
    setPreviewLeads(prev =>
      prev.map((l, i) => i === index ? { ...l, isSelected: !l.isSelected } : l)
    );
  };

  const toggleAll = (selected: boolean) => {
    setPreviewLeads(prev => prev.map(l => ({ ...l, isSelected: l.isDuplicate ? false : selected })));
  };

  const handleImport = async () => {
    const toImport = previewLeads.filter(l => l.isSelected && !l.isDuplicate);
    const result = await onImport(toImport.map(l => ({
      name: l.name,
      profileUrl: l.profileUrl,
      platform: l.platform,
      category: l.category,
      notes: l.notes,
    })));
    setImportResult(result);
    setStep('done');
  };

  const handleReset = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setFileName('');
    setPasteText('');
    setPreviewLeads([]);
    setImportResult(null);
    setError('');
    setShowPaste(false);
  };

  const selectedCount = previewLeads.filter(l => l.isSelected).length;
  const duplicateCount = previewLeads.filter(l => l.isDuplicate).length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-7xl flex items-center justify-end pr-4 select-none">📊</div>
        <h1 className="text-2xl font-black text-white relative z-10">📊 Bulk Upload</h1>
        <p className="text-emerald-100 text-sm mt-0.5 relative z-10">Import leads from spreadsheet or CSV</p>

        {/* Step Progress */}
        <div className="flex items-center gap-1.5 mt-3 relative z-10">
          {(['upload', 'map', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black transition-all ${
                step === s ? 'bg-white text-emerald-600 scale-110 shadow-lg'
                : ['upload', 'map', 'preview', 'done'].indexOf(step) > i ? 'bg-white/40 text-white' : 'bg-white/20 text-white/60'
              }`}>
                {['upload', 'map', 'preview', 'done'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-bold capitalize ${step === s ? 'text-white' : 'text-white/50'}`}>
                {s === 'upload' ? 'File' : s === 'map' ? 'Map' : s === 'preview' ? 'Review' : 'Done'}
              </span>
              {i < 3 && <div className={`w-4 h-0.5 rounded ${['upload', 'map', 'preview', 'done'].indexOf(step) > i ? 'bg-white/60' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ─── STEP 1: UPLOAD ─── */}
        {step === 'upload' && (
          <>
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
                  : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="text-5xl mb-3">{isDragging ? '📂' : '📁'}</div>
              <div className="font-black text-slate-700 text-lg mb-1">
                {isDragging ? 'Drop it here!' : 'Upload CSV File'}
              </div>
              <div className="text-sm text-slate-500 mb-3">
                Drag & drop or tap to browse
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md">
                📎 Choose File
              </div>
              <div className="text-xs text-slate-400 mt-3">Supports .csv files from Excel or Google Sheets</div>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Paste from Google Sheets */}
            <button
              onClick={() => setShowPaste(!showPaste)}
              className="w-full flex items-center gap-3 bg-white border-2 border-blue-200 rounded-2xl p-4 text-left hover:border-blue-400 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                📋
              </div>
              <div>
                <div className="font-black text-slate-800">Paste from Google Sheets</div>
                <div className="text-xs text-slate-500">Copy cells from Sheets → paste here</div>
              </div>
              <span className="ml-auto text-slate-400">{showPaste ? '▲' : '▼'}</span>
            </button>

            {showPaste && (
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 space-y-3">
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
                  💡 In Google Sheets: Select your cells (with headers!) → Ctrl+C → Click below & Ctrl+V
                </div>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste spreadsheet data here (tab-separated or comma-separated)..."
                  rows={6}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 resize-none font-mono"
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!pasteText.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
                >
                  📊 Parse Pasted Data
                </button>
              </div>
            )}

            {/* Download Sample */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <div className="font-black text-slate-800 text-sm mb-1">First time? Download the sample!</div>
                  <div className="text-xs text-slate-500 mb-3">
                    Use our sample CSV to see the exact format. Fill it in your spreadsheet app and upload.
                  </div>
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md"
                  >
                    ⬇️ Download Sample CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Supported Columns */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-700 mb-3 text-sm flex items-center gap-2">
                <span>📝</span> Supported Columns
              </h3>
              <div className="space-y-2">
                {[
                  { col: 'Name', required: true, desc: 'Person or business name', color: 'bg-red-100 text-red-700' },
                  { col: 'Profile URL', required: false, desc: 'Link to their profile page', color: 'bg-blue-100 text-blue-700' },
                  { col: 'Platform', required: false, desc: 'Twitter, Instagram, Facebook, LinkedIn', color: 'bg-purple-100 text-purple-700' },
                  { col: 'Category', required: false, desc: 'Business Coach, Startup, Creator…', color: 'bg-green-100 text-green-700' },
                  { col: 'Notes', required: false, desc: 'Any notes about this lead', color: 'bg-orange-100 text-orange-700' },
                ].map(item => (
                  <div key={item.col} className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${item.color}`}>
                      {item.col} {item.required && <span className="text-red-500">*</span>}
                    </span>
                    <span className="text-xs text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}
          </>
        )}

        {/* ─── STEP 2: COLUMN MAPPING ─── */}
        {step === 'map' && (
          <>
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📄</span>
                <div className="font-black text-slate-800 text-sm truncate">{fileName}</div>
              </div>
              <div className="text-xs text-slate-500">
                {rawData.length} rows found · {headers.length} columns detected
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <h3 className="font-black text-slate-700 flex items-center gap-2">
                <span>🗂️</span> Map Your Columns
              </h3>
              <p className="text-xs text-slate-400 -mt-2">Match your spreadsheet columns to LeadPulse fields</p>

              {[
                { label: '👤 Name', required: true, value: colName, onChange: setColName, desc: 'Person or business name' },
                { label: '🔗 Profile URL', required: false, value: colUrl, onChange: setColUrl, desc: 'Profile link' },
                { label: '🌐 Platform', required: false, value: colPlatform, onChange: setColPlatform, desc: 'Social network' },
                { label: '🏷️ Category', required: false, value: colCategory, onChange: setColCategory, desc: 'Lead type/niche' },
                { label: '📝 Notes', required: false, value: colNotes, onChange: setColNotes, desc: 'Extra info' },
              ].map(field => (
                <div key={field.label}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-bold text-slate-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <span className="text-xs text-slate-400">— {field.desc}</span>
                  </div>
                  <select
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none bg-white transition-colors ${
                      field.value ? 'border-emerald-400 bg-emerald-50' : field.required ? 'border-red-300' : 'border-slate-200'
                    }`}
                  >
                    <option value="">— Not in my file —</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Defaults */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <span>⚙️</span> Default Values
                <span className="text-xs text-slate-400 font-normal">(used when column is missing/unrecognized)</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Default Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setDefaultPlatform(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        defaultPlatform === p
                          ? `${PLATFORM_COLORS[p]} scale-105`
                          : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                    >
                      {PLATFORM_EMOJIS[p]} {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Default Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setDefaultCategory(c)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        defaultCategory === c
                          ? 'border-teal-400 bg-teal-50 text-teal-700 scale-105'
                          : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview of first 2 rows */}
            {rawData.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-bold text-slate-500 mb-2">👀 Preview (first 2 rows)</div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr>
                        {headers.map(h => (
                          <th key={h} className="text-left px-2 py-1 text-slate-400 font-bold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 2).map((row, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          {headers.map(h => (
                            <td key={h} className="px-2 py-1.5 text-slate-600 whitespace-nowrap max-w-[120px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReset}
                className="border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleBuildPreview}
                disabled={!colName}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg disabled:opacity-50"
              >
                Preview Leads →
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 3: PREVIEW ─── */}
        {step === 'preview' && (
          <>
            {/* Summary Bar */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="font-black text-base">📋 Review Leads</div>
                <div className="text-emerald-200 text-xs">{rawData.length} rows parsed</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/20 rounded-xl p-2.5 text-center">
                  <div className="text-2xl font-black">{previewLeads.length}</div>
                  <div className="text-xs opacity-80">Total</div>
                </div>
                <div className="bg-white/20 rounded-xl p-2.5 text-center">
                  <div className="text-2xl font-black text-green-300">{selectedCount}</div>
                  <div className="text-xs opacity-80">Selected</div>
                </div>
                <div className="bg-white/20 rounded-xl p-2.5 text-center">
                  <div className="text-2xl font-black text-yellow-300">{duplicateCount}</div>
                  <div className="text-xs opacity-80">Duplicates</div>
                </div>
              </div>
            </div>

            {/* Select All / None */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="flex-1 bg-emerald-100 text-emerald-700 font-bold text-sm py-2.5 rounded-xl border border-emerald-300"
              >
                ✅ Select All
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold text-sm py-2.5 rounded-xl border border-slate-200"
              >
                ☐ Deselect All
              </button>
            </div>

            {duplicateCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700 font-medium">
                ⚠️ {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} detected (same profile URL already in your leads) — they are auto-deselected.
              </div>
            )}

            {/* Lead cards */}
            <div className="space-y-2">
              {previewLeads.map((lead, i) => (
                <div
                  key={i}
                  onClick={() => !lead.isDuplicate && toggleSelect(i)}
                  className={`rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                    lead.isDuplicate
                      ? 'border-yellow-200 bg-yellow-50 opacity-60'
                      : lead.isSelected
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      lead.isDuplicate
                        ? 'border-yellow-400 bg-yellow-100'
                        : lead.isSelected
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {lead.isDuplicate ? (
                        <span className="text-yellow-600 text-xs font-black">≠</span>
                      ) : lead.isSelected ? (
                        <span className="text-white text-xs font-black">✓</span>
                      ) : null}
                    </div>

                    {/* Platform badge */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${PLATFORM_COLORS[lead.platform]} flex-shrink-0`}>
                      {PLATFORM_EMOJIS[lead.platform]} {lead.platform}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{lead.name}</div>
                      <div className="text-xs text-slate-400 truncate">{lead.category}</div>
                      {lead.profileUrl && (
                        <div className="text-xs text-blue-500 truncate font-mono">{lead.profileUrl}</div>
                      )}
                      {lead.notes && (
                        <div className="text-xs text-slate-400 italic truncate">"{lead.notes}"</div>
                      )}
                    </div>

                    {lead.isDuplicate && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                        Dup
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sticky bottom-20 bg-white/90 backdrop-blur py-3 -mx-4 px-4 border-t border-slate-100">
              <button
                onClick={() => setStep('map')}
                className="border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                🚀 Import {selectedCount} Leads
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 4: DONE ─── */}
        {step === 'done' && importResult && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
            <div className="text-8xl animate-bounce">🎉</div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">Import Complete!</h2>
              <p className="text-slate-500 text-sm">Your leads have been added to LeadPulse</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-5 text-white text-center shadow-lg">
                <div className="text-4xl font-black">{importResult.imported}</div>
                <div className="text-sm font-bold opacity-90 mt-1">Imported ✅</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-white text-center shadow-lg">
                <div className="text-4xl font-black">{importResult.duplicates}</div>
                <div className="text-sm font-bold opacity-90 mt-1">Skipped ⚠️</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border border-violet-100 w-full">
              <div className="font-bold text-violet-700 mb-1">🚀 What's next?</div>
              <div className="text-sm text-slate-600 space-y-1">
                <div>• Go to <strong>Send DM</strong> page to message them</div>
                <div>• Use <strong>AI</strong> to write personalized messages</div>
                <div>• Track progress on <strong>Dashboard</strong></div>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleReset}
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-sm"
              >
                Import More
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg"
              >
                ✅ Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
