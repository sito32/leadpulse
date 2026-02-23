import { useState } from 'react';

type Phase = 'intro' | 'supabase' | 'github' | 'vercel' | 'final';

interface CheckState {
  [key: string]: boolean;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
        copied ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {copied ? '✅ Copied!' : `📋 ${label}`}
    </button>
  );
}

function CodeBox({
  code,
  lang = 'bash',
  dark = true,
}: {
  code: string;
  lang?: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try { navigator.clipboard.writeText(code); } catch {
      const el = document.createElement('textarea');
      el.value = code; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };
  return (
    <div className={`rounded-2xl overflow-hidden border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className={`ml-2 text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{lang}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
            copied ? 'bg-green-500 text-white' : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {copied ? '✅ Copied!' : '📋 Copy All'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className={`text-xs font-mono whitespace-pre leading-relaxed ${dark ? 'text-green-300' : 'text-slate-700'}`}>{code}</pre>
      </div>
    </div>
  );
}

function CheckItem({
  id,
  label,
  desc,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  desc?: string;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
        checked ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
        checked ? 'border-green-500 bg-green-500' : 'border-slate-300'
      }`}>
        {checked && <span className="text-white text-xs font-black">✓</span>}
      </div>
      <div>
        <div className={`text-sm font-bold ${checked ? 'text-green-700' : 'text-slate-700'}`}>{label}</div>
        {desc && <div className="text-xs text-slate-400 mt-0.5">{desc}</div>}
      </div>
    </button>
  );
}

function StepNumber({ n, done }: { n: number; done?: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 shadow-md ${
      done ? 'bg-green-500 text-white' : 'bg-gradient-to-br from-violet-500 to-pink-500 text-white'
    }`}>
      {done ? '✓' : n}
    </div>
  );
}

function InfoBox({ type, children }: { type: 'tip' | 'warning' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip: 'bg-amber-50 border-amber-200 text-amber-800',
    warning: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const icons = { tip: '💡', warning: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`flex gap-2.5 p-3.5 rounded-2xl border ${styles[type]}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icons[type]}</span>
      <div className="text-xs font-medium leading-relaxed">{children}</div>
    </div>
  );
}

const SQL_CODE = `-- ✅ Copy ALL of this and paste into Supabase SQL Editor

create table leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  platform text not null,
  profile_url text,
  category text,
  notes text,
  status text default 'new',
  dm_sent_at timestamptz,
  follow_up_date timestamptz,
  follow_up_sent_at timestamptz,
  follow_up_due_date timestamptz,
  last_dm_text text,
  replied_at text,
  added_at timestamptz default now(),
  created_at timestamptz default now()
);

create table templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  content text not null,
  created_at timestamptz default now()
);

create table settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  gemini_api_key text,
  service_description text,
  follow_up_days integer default 3,
  updated_at timestamptz default now()
);

alter table leads enable row level security;
alter table templates enable row level security;
alter table settings enable row level security;

create policy "Users manage own leads"
  on leads for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own templates"
  on templates for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own settings"
  on settings for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`;

const GIT_CODE = `git init
git add .
git commit -m "Initial LeadPulse commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/leadpulse.git
git push -u origin main`;

const GIT_UPDATE_CODE = `git add .
git commit -m "Update: describe what you changed"
git push`;

export function DeployGuide() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [checks, setChecks] = useState<CheckState>({});

  const toggle = (id: string) => setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const done = (id: string) => checks[id] || false;

  const totalChecks = 15;
  const completedChecks = Object.values(checks).filter(Boolean).length;
  const progressPercent = Math.round((completedChecks / totalChecks) * 100);

  const PHASES = [
    { id: 'intro' as Phase, label: 'Start', emoji: '🗺️', color: 'from-violet-500 to-purple-600' },
    { id: 'supabase' as Phase, label: 'Database', emoji: '🛢️', color: 'from-green-500 to-teal-600' },
    { id: 'github' as Phase, label: 'Code', emoji: '🐙', color: 'from-slate-600 to-slate-800' },
    { id: 'vercel' as Phase, label: 'Deploy', emoji: '▲', color: 'from-blue-500 to-indigo-600' },
    { id: 'final' as Phase, label: 'Done!', emoji: '🎉', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-pink-600 px-4 pt-5 pb-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 text-8xl opacity-10 select-none">🚀</div>
        <h1 className="text-2xl font-black text-white relative z-10">🚀 Go Live Guide</h1>
        <p className="text-violet-200 text-sm mt-0.5 relative z-10">Step-by-step for beginners — 100% Free</p>

        {/* Overall Progress */}
        <div className="mt-4 bg-white/10 rounded-2xl p-3 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-violet-200">Your Progress</span>
            <span className="text-xs font-black text-white">{completedChecks}/{totalChecks} steps done</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs font-bold text-violet-200">{progressPercent}% complete</span>
          </div>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="bg-white border-b border-slate-100 shadow-sm px-3 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              phase === p.id
                ? `bg-gradient-to-r ${p.color} text-white shadow-md scale-105`
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span>{p.emoji}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">

        {/* ═══════════════════════════════════════════════════════
            PHASE 1 — INTRO / OVERVIEW
        ═══════════════════════════════════════════════════════ */}
        {phase === 'intro' && (
          <>
            {/* Welcome card */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-3xl p-5 text-white shadow-xl">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-xl font-black mb-2">Welcome! Let's Make Your App Live</h2>
              <p className="text-violet-200 text-sm leading-relaxed">
                Right now LeadPulse only works on <strong className="text-white">this one device</strong>.
                After following this guide, it will work on <strong className="text-white">ALL your devices</strong> with data synced!
              </p>
            </div>

            {/* What you need */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-800 text-base mb-3 flex items-center gap-2">
                <span>✅</span> What You Need (All Free!)
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: '💻', title: 'A Computer', desc: 'Windows, Mac, or Linux — any laptop or desktop works', color: 'bg-slate-50 border-slate-200' },
                  { icon: '🌐', title: 'Internet Connection', desc: 'To sign up for the free services', color: 'bg-blue-50 border-blue-200' },
                  { icon: '📧', title: 'An Email Address', desc: 'To create your free accounts', color: 'bg-violet-50 border-violet-200' },
                  { icon: '⏱️', title: '20–30 Minutes', desc: 'That\'s all it takes from start to finish!', color: 'bg-amber-50 border-amber-200' },
                ].map(item => (
                  <div key={item.title} className={`flex items-start gap-3 p-3 rounded-xl border ${item.color}`}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 tools */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-800 text-base mb-1 flex items-center gap-2">
                <span>🛠️</span> 3 Free Tools You'll Use
              </h3>
              <p className="text-xs text-slate-400 mb-3">Think of them like this:</p>
              <div className="space-y-3">
                {[
                  {
                    num: '1',
                    emoji: '🛢️',
                    name: 'Supabase',
                    analogy: 'Like a Google Sheet in the cloud',
                    role: 'Database',
                    desc: 'Stores ALL your leads, templates, settings. Every device reads from this one place.',
                    time: '~10 min',
                    url: 'supabase.com',
                    gradient: 'from-green-500 to-teal-600',
                  },
                  {
                    num: '2',
                    emoji: '🐙',
                    name: 'GitHub',
                    analogy: 'Like Google Drive for your code',
                    role: 'Code Storage',
                    desc: 'Keeps your app code safe online. Vercel reads from here to build your website.',
                    time: '~5 min',
                    url: 'github.com',
                    gradient: 'from-slate-600 to-slate-800',
                  },
                  {
                    num: '3',
                    emoji: '▲',
                    name: 'Vercel',
                    analogy: 'Like a free web hosting service',
                    role: 'Hosting',
                    desc: 'Takes your code from GitHub and puts it on the internet as a real website.',
                    time: '~5 min',
                    url: 'vercel.com',
                    gradient: 'from-blue-500 to-indigo-600',
                  },
                ].map(tool => (
                  <div key={tool.name} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${tool.gradient} px-4 py-3 flex items-center gap-3`}>
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                        {tool.emoji}
                      </div>
                      <div>
                        <div className="text-white font-black">{tool.name}</div>
                        <div className="text-white/70 text-xs">{tool.analogy}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{tool.role}</div>
                        <div className="text-white/60 text-xs mt-1">{tool.time}</div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-white">
                      <p className="text-xs text-slate-600">{tool.desc}</p>
                      <p className="text-xs font-mono text-blue-500 mt-1">🔗 {tool.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it all connects */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                <span>🔄</span> How They Connect
              </h3>
              <div className="flex flex-col items-center gap-2 text-sm">
                <div className="bg-white rounded-xl border-2 border-violet-300 px-4 py-2.5 text-center w-full shadow-sm">
                  <div className="font-black text-violet-700">Your Code (on your PC)</div>
                  <div className="text-xs text-slate-400">The app files you have now</div>
                </div>
                <div className="text-slate-400 font-bold text-lg">↓ git push</div>
                <div className="bg-white rounded-xl border-2 border-slate-400 px-4 py-2.5 text-center w-full shadow-sm">
                  <div className="font-black text-slate-700">🐙 GitHub</div>
                  <div className="text-xs text-slate-400">Code stored online</div>
                </div>
                <div className="text-slate-400 font-bold text-lg">↓ auto builds</div>
                <div className="bg-white rounded-xl border-2 border-blue-400 px-4 py-2.5 text-center w-full shadow-sm">
                  <div className="font-black text-blue-700">▲ Vercel</div>
                  <div className="text-xs text-slate-400">Hosts your website live</div>
                </div>
                <div className="text-slate-400 font-bold text-lg">↔️ reads/writes</div>
                <div className="bg-white rounded-xl border-2 border-green-400 px-4 py-2.5 text-center w-full shadow-sm">
                  <div className="font-black text-green-700">🛢️ Supabase</div>
                  <div className="text-xs text-slate-400">Your leads & data in the cloud</div>
                </div>
              </div>
            </div>

            <InfoBox type="success">
              <strong>All 3 services are completely FREE</strong> for personal use! Supabase gives you 50,000 free rows,
              Vercel gives unlimited hobby deployments, GitHub is free forever.
            </InfoBox>

            <button
              onClick={() => setPhase('supabase')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-green-200 active:scale-95 transition-all"
            >
              Let's Start! → Step 1: Supabase 🛢️
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 2 — SUPABASE
        ═══════════════════════════════════════════════════════ */}
        {phase === 'supabase' && (
          <>
            <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-3xl p-5 text-white shadow-xl">
              <div className="text-3xl mb-2">🛢️</div>
              <h2 className="text-xl font-black mb-1">Step 1: Set Up Supabase</h2>
              <p className="text-green-200 text-sm">
                This is your database — where all leads will be stored in the cloud.
                Estimated time: <strong className="text-white">10 minutes</strong>
              </p>
            </div>

            {/* STEP 1 */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center gap-3">
                <StepNumber n={1} done={done('sb1')} />
                <div>
                  <div className="text-white font-black">Create a Supabase Account</div>
                  <div className="text-green-100 text-xs">Go to supabase.com and sign up — it's free</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    {
                      n: 1,
                      text: 'Open your web browser (Chrome, Firefox, Safari — any)',
                      detail: null,
                    },
                    {
                      n: 2,
                      text: 'Type this in the address bar and press Enter:',
                      detail: (
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2.5 mt-1">
                          <span className="font-mono text-sm text-green-400 flex-1">supabase.com</span>
                          <CopyButton text="supabase.com" />
                        </div>
                      ),
                    },
                    {
                      n: 3,
                      text: 'You will see a green website. Click the big button that says "Start your project"',
                      detail: (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 mt-1 text-xs text-green-700">
                          📸 It looks like a large green button in the middle of the page
                        </div>
                      ),
                    },
                    {
                      n: 4,
                      text: 'Sign up using one of these methods:',
                      detail: (
                        <div className="mt-1 space-y-1.5">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-700 border border-slate-200">
                            <strong className="text-green-700">✅ Easiest:</strong> Click "Continue with GitHub" (if you already have GitHub, or will make one soon)
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-700 border border-slate-200">
                            <strong className="text-blue-700">Or:</strong> Enter your email and create a password → click "Sign Up"
                          </div>
                        </div>
                      ),
                    },
                    {
                      n: 5,
                      text: 'If you signed up with email, check your inbox for a confirmation email and click the link inside',
                      detail: (
                        <InfoBox type="tip">
                          Check your <strong>Spam folder</strong> too if you don't see it in your inbox within 1–2 minutes!
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.n}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="sb1" label="✅ I created a Supabase account and I'm logged in" checked={done('sb1')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 2 */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center gap-3">
                <StepNumber n={2} done={done('sb2')} />
                <div>
                  <div className="text-white font-black">Create a New Project</div>
                  <div className="text-green-100 text-xs">This is your personal database container</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'After logging in, you\'ll see the Supabase dashboard. Click the green "New Project" button' },
                    {
                      n: 2,
                      text: 'Fill in the form like this:',
                      detail: (
                        <div className="mt-1 space-y-2">
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-200">Form fields to fill:</div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24 flex-shrink-0">Organization:</span>
                                <span className="text-xs text-slate-700">Keep the default one (your account name)</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24 flex-shrink-0">Project name:</span>
                                <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2.5 py-1.5 flex-1">
                                  <span className="font-mono text-xs text-green-400 flex-1">leadpulse</span>
                                  <CopyButton text="leadpulse" />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24 flex-shrink-0">Password:</span>
                                <span className="text-xs text-slate-700">Create a strong password. <strong>SAVE IT SOMEWHERE!</strong></span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24 flex-shrink-0">Region:</span>
                                <span className="text-xs text-slate-700">Choose the country closest to you</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    { n: 3, text: 'Click "Create new project" button at the bottom' },
                    {
                      n: 4,
                      text: 'Wait 1–2 minutes for the project to be created. You\'ll see a loading spinner — just wait!',
                      detail: (
                        <InfoBox type="info">
                          This is completely normal. Supabase is setting up your database server. Don't close the page!
                        </InfoBox>
                      ),
                    },
                    { n: 5, text: 'When done, you\'ll see your project dashboard with colorful charts and icons' },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="sb2" label="✅ My Supabase project is created and ready" desc="You can see the project dashboard" checked={done('sb2')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 3 — SQL */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center gap-3">
                <StepNumber n={3} done={done('sb3')} />
                <div>
                  <div className="text-white font-black">Create Database Tables</div>
                  <div className="text-green-100 text-xs">Run the SQL script to set up your storage</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <InfoBox type="info">
                  <strong>What is SQL?</strong> It's just instructions that tell the database what to store.
                  You don't need to understand it — just copy and paste it!
                </InfoBox>

                <div className="space-y-3">
                  {[
                    {
                      n: 1,
                      text: 'In the LEFT sidebar of your Supabase dashboard, look for "SQL Editor" (it has a terminal icon). Click it.',
                      detail: (
                        <InfoBox type="tip">
                          If you don't see the sidebar, look for a small arrow or hamburger icon (☰) at the top left to open it.
                        </InfoBox>
                      ),
                    },
                    { n: 2, text: 'At the top of the SQL Editor page, click the button "+ New Query" or "New query"' },
                    {
                      n: 3,
                      text: 'A blank white text area will appear. Click "Copy All" below, then click inside that text area and press Ctrl+V (Windows) or Cmd+V (Mac) to paste:',
                      detail: (
                        <div className="mt-2">
                          <CodeBox code={SQL_CODE} lang="SQL" />
                        </div>
                      ),
                    },
                    {
                      n: 4,
                      text: 'After pasting, click the green "Run" button (or press Ctrl+Enter / Cmd+Enter)',
                      detail: (
                        <InfoBox type="success">
                          You should see a message like <strong>"Success. No rows returned"</strong> — this means it worked perfectly!
                        </InfoBox>
                      ),
                    },
                    {
                      n: 5,
                      text: 'To verify: click "Table Editor" in the left sidebar — you should see 3 tables: leads, templates, settings',
                      detail: (
                        <InfoBox type="warning">
                          If you see an error message, make sure you copied the ENTIRE SQL code from beginning to end. Try copying again and running.
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="sb3" label="✅ SQL ran successfully — tables created" desc="I see 'leads', 'templates', 'settings' in Table Editor" checked={done('sb3')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 4 — Get API Keys */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center gap-3">
                <StepNumber n={4} done={done('sb4')} />
                <div>
                  <div className="text-white font-black">Copy Your Supabase Keys</div>
                  <div className="text-green-100 text-xs">⚠️ Very important — you'll need these for Vercel!</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <InfoBox type="warning">
                  <strong>These are like passwords for your database.</strong> You'll paste them into Vercel later.
                  Save them in your Notes app or a text file on your computer!
                </InfoBox>

                <div className="space-y-3">
                  {[
                    { n: 1, text: 'In the Supabase left sidebar, click the "⚙️ Settings" (gear icon) near the bottom' },
                    { n: 2, text: 'In the Settings menu that opens, click "API"' },
                    {
                      n: 3,
                      text: 'You will see a page with keys. Find and copy these 2 things:',
                      detail: (
                        <div className="mt-2 space-y-2">
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3.5">
                            <div className="font-black text-blue-800 text-sm mb-1.5">📋 Thing 1: Project URL</div>
                            <div className="text-xs text-blue-600 mb-2">Look for the section called "Project URL" — it looks like this:</div>
                            <div className="font-mono text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded-xl break-all">
                              https://abcdefghijklmnop.supabase.co
                            </div>
                            <div className="text-xs text-blue-500 mt-2">Click the copy button next to it. Save it somewhere!</div>
                          </div>
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3.5">
                            <div className="font-black text-purple-800 text-sm mb-1.5">📋 Thing 2: Anon Public Key</div>
                            <div className="text-xs text-purple-600 mb-2">Scroll down to "Project API Keys" — find the row that says <strong>"anon public"</strong>:</div>
                            <div className="font-mono text-xs bg-purple-100 text-purple-800 px-3 py-2 rounded-xl break-all">
                              eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
                            </div>
                            <div className="text-xs text-purple-500 mt-2">Click the copy icon next to it. Save this too!</div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      n: 4,
                      text: 'Open your Notes app (or Notepad on Windows, or TextEdit on Mac) and paste both keys there. Label them clearly:',
                      detail: (
                        <CodeBox
                          code={`Supabase Project URL:\nhttps://your-url-here.supabase.co\n\nSupabase Anon Key:\neyJhbGciOiJIUzI1Ni...`}
                          lang="notes"
                          dark={false}
                        />
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="sb4" label="✅ I copied and saved both Supabase keys" desc="Project URL + Anon Public Key are saved in my notes" checked={done('sb4')} onToggle={toggle} />
              </div>
            </div>

            <InfoBox type="success">
              <strong>🎉 Supabase is done!</strong> Your database is ready. Now let's put your code on GitHub!
            </InfoBox>

            <button
              onClick={() => setPhase('github')}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white py-4 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
            >
              Next → Step 2: GitHub 🐙
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 3 — GITHUB
        ═══════════════════════════════════════════════════════ */}
        {phase === 'github' && (
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
              <div className="text-3xl mb-2">🐙</div>
              <h2 className="text-xl font-black mb-1">Step 2: Upload to GitHub</h2>
              <p className="text-slate-300 text-sm">
                Think of GitHub like "Google Drive for code". We'll upload your app there
                so Vercel can find it. Takes about <strong className="text-white">5 minutes</strong>.
              </p>
            </div>

            {/* STEP 1 — Create GitHub account */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 flex items-center gap-3">
                <StepNumber n={1} done={done('gh1')} />
                <div>
                  <div className="text-white font-black">Create a GitHub Account</div>
                  <div className="text-slate-300 text-xs">Free account at github.com</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Go to github.com in your browser' },
                    { n: 2, text: 'Click "Sign up" in the top right corner' },
                    {
                      n: 3,
                      text: 'Fill in: your email, a password, and choose a username (e.g. johnsmith2024)',
                      detail: (
                        <InfoBox type="tip">
                          Your username will appear in your website URL! Keep it simple like your name.
                        </InfoBox>
                      ),
                    },
                    { n: 4, text: 'Complete the puzzle/verification they show you (to prove you\'re human)' },
                    { n: 5, text: 'Check your email and click the confirmation link GitHub sends' },
                    { n: 6, text: 'You\'ll now see your GitHub dashboard (looks like a black page with octocat logo)' },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="gh1" label="✅ I have a GitHub account and I'm logged in" checked={done('gh1')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 2 — Create repo */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 flex items-center gap-3">
                <StepNumber n={2} done={done('gh2')} />
                <div>
                  <div className="text-white font-black">Create a Repository</div>
                  <div className="text-slate-300 text-xs">A "repository" = a folder for your project on GitHub</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    {
                      n: 1,
                      text: 'On GitHub, look at the top right — click the "+" icon (plus sign)',
                      detail: (
                        <div className="bg-slate-50 rounded-xl p-2.5 mt-1 text-xs text-slate-600 border border-slate-200">
                          📸 It's a small "+" next to your profile picture in the top-right corner
                        </div>
                      ),
                    },
                    { n: 2, text: 'From the dropdown menu, click "New repository"' },
                    {
                      n: 3,
                      text: 'Fill in the form:',
                      detail: (
                        <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-200">Repository Settings:</div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0">Repository name:</span>
                              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2.5 py-1.5 flex-1">
                                <span className="font-mono text-xs text-green-400 flex-1">leadpulse</span>
                                <CopyButton text="leadpulse" />
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0">Description:</span>
                              <span className="text-xs text-slate-600">Leave empty (optional)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0">Visibility:</span>
                              <span className="text-xs text-slate-600">Select "Public" (free) — Vercel works with both</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0">Initialize:</span>
                              <span className="text-xs text-slate-600"><strong>Leave unchecked</strong> — don't add README, .gitignore, or license</span>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    { n: 4, text: 'Click the green "Create repository" button at the bottom' },
                    {
                      n: 5,
                      text: 'You\'ll see a page with some code/instructions — leave this open, we\'ll come back to it!',
                      detail: (
                        <InfoBox type="info">
                          The URL of this page will be something like: <span className="font-mono">github.com/yourusername/leadpulse</span>
                          <br />Copy this URL — you'll need it in the next step!
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="gh2" label="✅ My leadpulse repository is created on GitHub" checked={done('gh2')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 3 — Install Git */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 flex items-center gap-3">
                <StepNumber n={3} done={done('gh3')} />
                <div>
                  <div className="text-white font-black">Install Git on Your Computer</div>
                  <div className="text-slate-300 text-xs">Git is the tool that sends your code to GitHub</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <InfoBox type="info">
                  <strong>What is Git?</strong> It's a small program you install on your computer that helps you upload code to GitHub. You only install it once!
                </InfoBox>

                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-blue-50 px-3 py-2 border-b border-slate-200">
                      <span className="text-xs font-black text-blue-700">🪟 If you use Windows:</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex gap-2">
                        <span className="text-blue-500 font-black text-xs flex-shrink-0">1.</span>
                        <span className="text-xs text-slate-700">Go to <span className="font-mono bg-slate-100 px-1 rounded">git-scm.com</span> in your browser</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-500 font-black text-xs flex-shrink-0">2.</span>
                        <span className="text-xs text-slate-700">Click the big orange "Download for Windows" button</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-500 font-black text-xs flex-shrink-0">3.</span>
                        <span className="text-xs text-slate-700">Open the downloaded file and install it (keep clicking "Next" with default settings — don't change anything)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-500 font-black text-xs flex-shrink-0">4.</span>
                        <span className="text-xs text-slate-700">After installing, search for "Git Bash" in your Start menu — open it</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700">🍎 If you use Mac:</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex gap-2">
                        <span className="text-slate-600 font-black text-xs flex-shrink-0">1.</span>
                        <span className="text-xs text-slate-700">Press <strong>Cmd + Space</strong> to open Spotlight Search</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-600 font-black text-xs flex-shrink-0">2.</span>
                        <span className="text-xs text-slate-700">Type "Terminal" and press Enter to open it</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-600 font-black text-xs flex-shrink-0">3.</span>
                        <span className="text-xs text-slate-700">Type this and press Enter: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">git --version</span></span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-600 font-black text-xs flex-shrink-0">4.</span>
                        <span className="text-xs text-slate-700">If Git isn't installed, Mac will ask to install it automatically — click "Install"</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 mb-1">🔍 How to verify Git is installed:</div>
                    <div className="text-xs text-slate-600 mb-1.5">Open Terminal/Git Bash and type:</div>
                    <CodeBox code="git --version" lang="check" />
                    <div className="text-xs text-green-600 mt-1.5">✅ If you see something like "git version 2.42.0" — Git is installed!</div>
                  </div>
                </div>

                <CheckItem id="gh3" label="✅ Git is installed — I can see the version number" checked={done('gh3')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 4 — Configure Git */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 flex items-center gap-3">
                <StepNumber n={4} done={done('gh4')} />
                <div>
                  <div className="text-white font-black">Set Up Git With Your Name</div>
                  <div className="text-slate-300 text-xs">Tell Git who you are (only do this once ever)</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-700">In your Terminal (Mac) or Git Bash (Windows), run these 2 commands. Replace the example info with yours:</p>
                <CodeBox
                  code={`git config --global user.email "youremail@gmail.com"\ngit config --global user.name "Your Full Name"`}
                  lang="Terminal"
                />
                <InfoBox type="tip">
                  Use the same email you used for GitHub! Your name can be anything — it's just for labels on your commits.
                </InfoBox>
                <CheckItem id="gh4" label="✅ I set up Git with my name and email" checked={done('gh4')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 5 — Push code */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 flex items-center gap-3">
                <StepNumber n={5} done={done('gh5')} />
                <div>
                  <div className="text-white font-black">Upload Your Code to GitHub</div>
                  <div className="text-slate-300 text-xs">This sends your files to your GitHub repository</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    {
                      n: 1,
                      text: 'Open Terminal/Git Bash and navigate to your LeadPulse project folder',
                      detail: (
                        <div className="mt-1 space-y-1.5">
                          <InfoBox type="tip">
                            <strong>How to open Terminal in your project folder:</strong>
                            <br />• <strong>Windows:</strong> Open the project folder in File Explorer → Right-click on empty space inside the folder → Click "Open Git Bash here" or "Open in Terminal"
                            <br />• <strong>Mac:</strong> Open Terminal → type <span className="font-mono bg-amber-100 px-1 rounded">cd </span> (with a space after) → then drag your project folder onto the Terminal window and press Enter
                          </InfoBox>
                        </div>
                      ),
                    },
                    {
                      n: 2,
                      text: 'Copy and run these commands ONE BY ONE (press Enter after each):',
                      detail: (
                        <div className="mt-2 space-y-2">
                          <InfoBox type="warning">
                            ⚠️ In the 5th command below, replace <strong>YOURUSERNAME</strong> with your actual GitHub username!
                          </InfoBox>
                          <CodeBox code={GIT_CODE} lang="Terminal" />
                        </div>
                      ),
                    },
                    {
                      n: 3,
                      text: 'When you run the last command (git push), it might ask you to log in to GitHub',
                      detail: (
                        <div className="mt-1 space-y-2">
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700">
                            <strong>A browser window might open</strong> asking you to authorize Git. Click "Authorize" and log in with your GitHub credentials.
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700">
                            Or it may ask for your GitHub username and password in the terminal. Enter them. (When typing password, it won't show characters — that's normal!)
                          </div>
                        </div>
                      ),
                    },
                    {
                      n: 4,
                      text: 'When done, go back to GitHub in your browser and refresh your repository page — you should see all your files there!',
                      detail: (
                        <InfoBox type="success">
                          If you see files like "src", "package.json", "index.html" etc. in your GitHub repo — 
                          <strong> your code is on GitHub!</strong> 🎉
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="gh5" label="✅ My code is on GitHub — I can see the files in my repo" checked={done('gh5')} onToggle={toggle} />
              </div>
            </div>

            <InfoBox type="success">
              <strong>🎉 GitHub is done!</strong> Your code is safely stored online. Now let's deploy it as a live website!
            </InfoBox>

            <button
              onClick={() => setPhase('vercel')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
            >
              Next → Step 3: Vercel 🚀
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 4 — VERCEL
        ═══════════════════════════════════════════════════════ */}
        {phase === 'vercel' && (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl">
              <div className="text-3xl mb-2">▲</div>
              <h2 className="text-xl font-black mb-1">Step 3: Deploy on Vercel</h2>
              <p className="text-blue-200 text-sm">
                The final step! Vercel takes your GitHub code and puts it on the internet as a real website.
                Takes about <strong className="text-white">5 minutes</strong>.
              </p>
            </div>

            {/* STEP 1 */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <StepNumber n={1} done={done('v1')} />
                <div>
                  <div className="text-white font-black">Create a Vercel Account</div>
                  <div className="text-blue-200 text-xs">Sign up with GitHub for the easiest experience</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Go to vercel.com in your browser' },
                    { n: 2, text: 'Click "Sign Up" at the top right' },
                    {
                      n: 3,
                      text: 'Choose "Continue with GitHub" — this is the easiest option!',
                      detail: (
                        <InfoBox type="tip">
                          By signing in with GitHub, Vercel automatically connects to your repositories. This saves you a lot of steps!
                        </InfoBox>
                      ),
                    },
                    { n: 4, text: 'GitHub will ask if you want to authorize Vercel — click "Authorize Vercel"' },
                    { n: 5, text: 'You\'ll be taken to the Vercel dashboard — a black and white page with "New Project" button' },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="v1" label="✅ I'm logged into Vercel" checked={done('v1')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 2 */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <StepNumber n={2} done={done('v2')} />
                <div>
                  <div className="text-white font-black">Import Your GitHub Project</div>
                  <div className="text-blue-200 text-xs">Connect Vercel to your leadpulse repository</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'On the Vercel dashboard, click the "Add New..." button (or "New Project" button)' },
                    { n: 2, text: 'Click "Project" from the dropdown' },
                    {
                      n: 3,
                      text: 'You\'ll see a list of your GitHub repositories. Find "leadpulse" in the list',
                      detail: (
                        <InfoBox type="info">
                          If you don't see it, click "Adjust GitHub App Permissions" and give Vercel access to your leadpulse repository.
                        </InfoBox>
                      ),
                    },
                    { n: 4, text: 'Click "Import" next to the leadpulse repository' },
                    {
                      n: 5,
                      text: 'Vercel will show you a configuration page. You\'ll see it auto-detected "Vite" as the framework — that\'s correct!',
                      detail: (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 mt-1">
                          ✅ Framework: Vite should be auto-selected. If not, choose it from the dropdown.
                        </div>
                      ),
                    },
                    {
                      n: 6,
                      text: '⛔ DO NOT click "Deploy" yet! You need to add environment variables first (next step)',
                      detail: (
                        <InfoBox type="warning">
                          If you deploy without environment variables, the app won't connect to your database and will show errors!
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="v2" label="✅ I can see the Vercel configuration page for leadpulse" checked={done('v2')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 3 — Environment Variables */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <StepNumber n={3} done={done('v3')} />
                <div>
                  <div className="text-white font-black">Add Your Supabase Keys to Vercel</div>
                  <div className="text-blue-200 text-xs">This connects your app to your database</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <InfoBox type="warning">
                  <strong>This is the most important step!</strong> Get out the Supabase keys you saved in Step 1. You'll need both of them now.
                </InfoBox>

                <div className="space-y-3">
                  {[
                    { n: 1, text: 'On the Vercel configuration page, scroll down until you see "Environment Variables"' },
                    { n: 2, text: 'Click on "Environment Variables" to expand that section' },
                    {
                      n: 3,
                      text: 'Add the FIRST variable:',
                      detail: (
                        <div className="mt-1 border-2 border-blue-200 rounded-2xl overflow-hidden">
                          <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
                            <span className="text-xs font-black text-blue-700">Variable #1 — Your Database URL</span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div>
                              <div className="text-xs font-bold text-slate-500 mb-1">In the "Name" field, type:</div>
                              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2.5 py-2">
                                <span className="font-mono text-xs text-green-400 flex-1">VITE_SUPABASE_URL</span>
                                <CopyButton text="VITE_SUPABASE_URL" />
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500 mb-1">In the "Value" field, paste your Supabase Project URL:</div>
                              <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono text-xs text-slate-600 break-all">
                                https://abcdefghijklmnop.supabase.co
                              </div>
                              <div className="text-xs text-blue-500 mt-1">← This is YOUR Supabase Project URL from Step 1.4</div>
                            </div>
                            <div className="text-xs text-slate-500">Then press Enter or click "Add"</div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      n: 4,
                      text: 'Add the SECOND variable:',
                      detail: (
                        <div className="mt-1 border-2 border-purple-200 rounded-2xl overflow-hidden">
                          <div className="bg-purple-50 px-3 py-2 border-b border-purple-200">
                            <span className="text-xs font-black text-purple-700">Variable #2 — Your Database Key</span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div>
                              <div className="text-xs font-bold text-slate-500 mb-1">In the "Name" field, type:</div>
                              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2.5 py-2">
                                <span className="font-mono text-xs text-green-400 flex-1">VITE_SUPABASE_ANON_KEY</span>
                                <CopyButton text="VITE_SUPABASE_ANON_KEY" />
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500 mb-1">In the "Value" field, paste your Supabase Anon Key:</div>
                              <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono text-xs text-slate-600 break-all">
                                eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
                              </div>
                              <div className="text-xs text-purple-500 mt-1">← This is YOUR long Supabase anon key from Step 1.4</div>
                            </div>
                            <div className="text-xs text-slate-500">Then press Enter or click "Add"</div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      n: 5,
                      text: 'You should now see BOTH variables listed. Double-check the names are spelled exactly right:',
                      detail: (
                        <CodeBox
                          code={`VITE_SUPABASE_URL\nVITE_SUPABASE_ANON_KEY`}
                          lang="Expected variable names"
                          dark={false}
                        />
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="v3" label="✅ Both environment variables are added in Vercel" desc="VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY" checked={done('v3')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 4 — Deploy! */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <StepNumber n={4} done={done('v4')} />
                <div>
                  <div className="text-white font-black">Deploy! 🚀</div>
                  <div className="text-blue-200 text-xs">The moment your app goes live!</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Now click the big "Deploy" button at the bottom of the page' },
                    {
                      n: 2,
                      text: 'You\'ll see a progress screen with animations and logs — this usually takes 1–3 minutes',
                      detail: (
                        <InfoBox type="info">
                          You can watch the build logs scrolling — this is Vercel building your app. Don't close the page!
                        </InfoBox>
                      ),
                    },
                    {
                      n: 3,
                      text: 'When it\'s done, you\'ll see a big "🎉 Congratulations!" screen with confetti animation!',
                      detail: (
                        <InfoBox type="success">
                          This means your app is LIVE on the internet! Anyone can access it with the URL Vercel gives you.
                        </InfoBox>
                      ),
                    },
                    {
                      n: 4,
                      text: 'Click "Continue to Dashboard" — you\'ll see your project with a live URL like:',
                      detail: (
                        <div className="mt-1 bg-slate-900 rounded-xl px-4 py-3">
                          <span className="font-mono text-sm text-green-400">leadpulse-yourname.vercel.app</span>
                        </div>
                      ),
                    },
                    { n: 5, text: 'Click "Visit" or click the URL to open your live app in a new tab — bookmark it on your phone!' },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="v4" label="✅ My app is deployed and I can see my live URL!" checked={done('v4')} onToggle={toggle} />
              </div>
            </div>

            {/* STEP 5 — Create account in the live app */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <StepNumber n={5} done={done('v5')} />
                <div>
                  <div className="text-white font-black">Create Your Login Account</div>
                  <div className="text-blue-200 text-xs">Sign up in YOUR live app to start using it</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Open your live Vercel URL (e.g. leadpulse.vercel.app) in your browser' },
                    { n: 2, text: 'You\'ll see a Sign Up / Login screen. Click "Sign Up"' },
                    { n: 3, text: 'Enter your email address and create a password for LeadPulse' },
                    { n: 4, text: 'Click "Sign Up" — Supabase will send you a confirmation email' },
                    {
                      n: 5,
                      text: 'Check your email for a message from Supabase — click the confirmation link inside',
                      detail: (
                        <InfoBox type="tip">
                          Check spam folder! The email comes from <span className="font-mono">noreply@mail.app.supabase.io</span>
                        </InfoBox>
                      ),
                    },
                    { n: 6, text: 'After confirming, go back to your app and log in with your email and password' },
                    {
                      n: 7,
                      text: 'Now open your app on your PHONE using the same URL — log in with the same email/password',
                      detail: (
                        <InfoBox type="success">
                          Add it to your home screen! On iPhone: Share button → "Add to Home Screen". On Android: Menu → "Add to Home Screen". Now it works like an app icon! 📱
                        </InfoBox>
                      ),
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{step.text}</p>
                        {'detail' in step && step.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <CheckItem id="v5" label="✅ I can log in to my live app on both phone and computer!" checked={done('v5')} onToggle={toggle} />
              </div>
            </div>

            <InfoBox type="success">
              <strong>🎉 YOU DID IT!</strong> LeadPulse is now live, synced across all devices, and you have your own personal lead management website!
            </InfoBox>

            <button
              onClick={() => setPhase('final')}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-4 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
            >
              🎉 View Completion Page!
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 5 — FINAL / DONE
        ═══════════════════════════════════════════════════════ */}
        {phase === 'final' && (
          <>
            {/* Celebration */}
            <div className="text-center py-4">
              <div className="text-8xl mb-3 animate-bounce">🎉</div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">You're Live!</h2>
              <p className="text-slate-500 text-sm">LeadPulse is now your personal website, accessible anywhere</p>
            </div>

            {/* Progress summary */}
            <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-4 text-white shadow-xl">
              <h3 className="font-black text-base mb-3 flex items-center gap-2">
                <span>📊</span> Your Progress
              </h3>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-violet-200">{completedChecks}/{totalChecks} steps completed</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {/* Full checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-800 mb-3">✅ Complete Checklist</h3>
              <div className="space-y-2">
                {[
                  { id: 'sb1', label: '🛢️ Supabase account created' },
                  { id: 'sb2', label: '🛢️ Supabase project created' },
                  { id: 'sb3', label: '🛢️ Database tables created (SQL ran)' },
                  { id: 'sb4', label: '🛢️ API keys saved' },
                  { id: 'gh1', label: '🐙 GitHub account created' },
                  { id: 'gh2', label: '🐙 leadpulse repository created' },
                  { id: 'gh3', label: '🐙 Git installed on computer' },
                  { id: 'gh4', label: '🐙 Git configured with name/email' },
                  { id: 'gh5', label: '🐙 Code pushed to GitHub' },
                  { id: 'v1', label: '▲ Vercel account created' },
                  { id: 'v2', label: '▲ GitHub project imported in Vercel' },
                  { id: 'v3', label: '▲ Environment variables added' },
                  { id: 'v4', label: '▲ App deployed and live!' },
                  { id: 'v5', label: '▲ Login account created in live app' },
                ].map(item => (
                  <CheckItem key={item.id} id={item.id} label={item.label} checked={done(item.id)} onToggle={toggle} />
                ))}
              </div>
            </div>

            {/* How to update */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                <span>🔄</span> How to Update the App in the Future
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Every time you want to change something in the app, just run these 3 commands in Terminal from your project folder:
              </p>
              <CodeBox code={GIT_UPDATE_CODE} lang="Terminal" />
              <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                Vercel automatically detects the push and re-deploys your app in about 1 minute! ⚡
              </div>
            </div>

            {/* Common issues */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                <span>🔧</span> Troubleshooting Common Problems
              </h3>
              <div className="space-y-3">
                {[
                  {
                    problem: 'Vercel build failed',
                    solution: 'Go to Vercel dashboard → your project → Settings → Environment Variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are there with correct values. Then go to Deployments → click "Redeploy".',
                    color: 'border-red-200 bg-red-50',
                    icon: '❌',
                  },
                  {
                    problem: 'App loads but leads don\'t save',
                    solution: 'Make sure you\'re logged in to the app. Also verify the SQL script ran successfully in Supabase (check Table Editor → you should see leads, templates, settings tables).',
                    color: 'border-yellow-200 bg-yellow-50',
                    icon: '⚠️',
                  },
                  {
                    problem: 'Can\'t log in to the live app',
                    solution: 'Check your email for a confirmation message from Supabase and click the link. Also check your spam folder. The link expires after 24 hours.',
                    color: 'border-blue-200 bg-blue-50',
                    icon: '🔑',
                  },
                  {
                    problem: 'git push denied / authentication failed',
                    solution: 'Run: git config --global user.email "youremail@gmail.com" then try again. On Windows, Git Bash might open a browser login window — complete the login there.',
                    color: 'border-purple-200 bg-purple-50',
                    icon: '🐙',
                  },
                  {
                    problem: 'Can\'t find the project folder in Terminal',
                    solution: 'On Windows: open the folder in File Explorer, then in the address bar type "cmd" and press Enter. On Mac: drag the folder onto the Terminal icon in your dock.',
                    color: 'border-slate-200 bg-slate-50',
                    icon: '📁',
                  },
                ].map(item => (
                  <div key={item.problem} className={`rounded-2xl border p-3.5 ${item.color}`}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm mb-1">{item.problem}</div>
                        <div className="text-xs text-slate-600 leading-relaxed">{item.solution}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add to home screen tip */}
            <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl border border-violet-200 p-4">
              <h3 className="font-black text-violet-800 mb-2 flex items-center gap-2">
                <span>📱</span> Pro Tip: Add to Your Phone Home Screen
              </h3>
              <div className="space-y-2">
                <div className="bg-white rounded-xl p-3 border border-violet-100">
                  <div className="text-xs font-bold text-slate-700 mb-1">📱 iPhone / Safari:</div>
                  <div className="text-xs text-slate-600">Open your Vercel URL in Safari → Tap the Share button (box with arrow) at bottom → Scroll down and tap "Add to Home Screen" → Tap "Add"</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-violet-100">
                  <div className="text-xs font-bold text-slate-700 mb-1">🤖 Android / Chrome:</div>
                  <div className="text-xs text-slate-600">Open your Vercel URL in Chrome → Tap the 3 dots menu (⋮) at top right → Tap "Add to Home screen" → Tap "Add"</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-violet-700 font-medium">
                Now LeadPulse appears as an app icon on your phone! 🎉
              </div>
            </div>

            {/* Final card */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-pink-600 rounded-3xl p-6 text-white text-center shadow-2xl">
              <div className="text-5xl mb-3">🚀</div>
              <h2 className="text-2xl font-black mb-2">LeadPulse is LIVE!</h2>
              <p className="text-violet-200 text-sm mb-4">
                You now have a professional AI-powered lead management tool that syncs across all your devices — completely free!
              </p>
              <div className="bg-white/10 rounded-2xl p-4 text-left space-y-2 text-sm">
                <div className="font-black text-center mb-2">📅 Your Daily Workflow:</div>
                <div className="text-violet-200 text-xs space-y-1.5">
                  <div>1️⃣ Open your Vercel URL on your phone</div>
                  <div>2️⃣ Log in with your email + password</div>
                  <div>3️⃣ Add new leads, send DMs, track follow-ups</div>
                  <div>4️⃣ Check Dashboard to see your progress</div>
                  <div>5️⃣ All data syncs automatically across devices ✅</div>
                </div>
              </div>
            </div>

            {/* Restart button */}
            <button
              onClick={() => setPhase('intro')}
              className="w-full border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-sm"
            >
              ← Back to Overview
            </button>
          </>
        )}
      </div>
    </div>
  );
}
