import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useSupabaseStore } from './store.supabase';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { NewLead } from './pages/NewLead';
import { SendDM } from './pages/SendDM';
import { FollowUp } from './pages/FollowUp';
import { Leads } from './pages/Leads';
import { Templates } from './pages/Templates';
import { Settings } from './pages/Settings';
import { BulkUpload } from './pages/BulkUpload';
import { DeployGuide } from './pages/DeployGuide';

export type Page = 'dashboard' | 'newlead' | 'senddm' | 'followup' | 'leads' | 'templates' | 'settings' | 'bulkupload' | 'deployguide';

const NAV_ITEMS: {
  id: Page;
  label: string;
  icon: string;
  activeGradient: string;
  accentColor: string;
}[] = [
  { id: 'dashboard', label: 'Home', icon: '📊', activeGradient: 'bg-gradient-to-r from-violet-500 to-purple-600', accentColor: 'bg-violet-500' },
  { id: 'newlead', label: 'New Lead', icon: '🎯', activeGradient: 'bg-gradient-to-r from-pink-500 to-rose-600', accentColor: 'bg-pink-500' },
  { id: 'senddm', label: 'Send DM', icon: '✉️', activeGradient: 'bg-gradient-to-r from-violet-500 to-pink-500', accentColor: 'bg-indigo-500' },
  { id: 'followup', label: 'Follow-Up', icon: '🔄', activeGradient: 'bg-gradient-to-r from-orange-500 to-red-600', accentColor: 'bg-orange-500' },
  { id: 'leads', label: 'Leads', icon: '📋', activeGradient: 'bg-gradient-to-r from-cyan-500 to-blue-600', accentColor: 'bg-cyan-500' },
];

const MORE_ITEMS: { id: Page; label: string; icon: string; gradient: string }[] = [
  { id: 'bulkupload', label: 'Bulk Upload', icon: '📊', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'templates', label: 'Templates', icon: '📝', gradient: 'from-green-500 to-teal-600' },
  { id: 'deployguide', label: 'Go Live', icon: '🚀', gradient: 'from-violet-600 to-pink-600' },
  { id: 'settings', label: 'Settings', icon: '⚙️', gradient: 'from-slate-600 to-slate-800' },
];

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [showMore, setShowMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize Supabase auth
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      // No Supabase → run in localStorage-only mode (no auth needed)
      setAuthChecked(true);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email ?? null);
      }
      setAuthChecked(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const store = useSupabaseStore(userId);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserId(null);
    setUserEmail(null);
  };

  const handleNavigate = (p: string) => {
    setPage(p as Page);
    setShowMore(false);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🚀</div>
          <div className="text-white font-black text-xl mb-2">LeadPulse</div>
          <div className="flex items-center justify-center gap-2 text-violet-300 text-sm">
            <span className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // If Supabase is configured but user is not logged in → show auth screen
  if (isSupabaseConfigured && !userId) {
    return <Auth onAuth={() => { /* auth state change will update userId */ }} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            leads={store.leads}
            followUpDue={store.followUpDue}
            newLeadsReadyToDm={store.newLeadsReadyToDm}
            onNavigate={handleNavigate}
          />
        );
      case 'newlead':
        return (
          <NewLead
            templates={store.templates}
            settings={store.settings}
            onAddLead={store.addLead}
            onMarkDmSent={store.markDmSent}
          />
        );
      case 'senddm':
        return (
          <SendDM
            leads={store.leads}
            templates={store.templates}
            settings={store.settings}
            onMarkDmSent={store.markDmSent}
          />
        );
      case 'followup':
        return (
          <FollowUp
            leads={store.leads}
            templates={store.templates}
            settings={store.settings}
            onMarkFollowUpSent={store.markFollowUpSent}
            onMarkStatus={store.markStatus}
          />
        );
      case 'leads':
        return (
          <Leads
            leads={store.leads}
            onDelete={store.deleteLead}
            onMarkStatus={store.markStatus}
            onUpdateLead={store.updateLead}
          />
        );
      case 'templates':
        return (
          <Templates
            templates={store.templates}
            onAdd={store.addTemplate}
            onUpdate={store.updateTemplate}
            onDelete={store.deleteTemplate}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={store.settings}
            onUpdate={store.updateSettings}
            userEmail={userEmail}
            synced={store.synced}
            isSupabaseConfigured={isSupabaseConfigured}
            onSignOut={handleSignOut}
          />
        );
      case 'bulkupload':
        return <BulkUpload existingLeads={store.leads} onImport={store.bulkAddLeads} />;
      case 'deployguide':
        return <DeployGuide />;
      default:
        return null;
    }
  };

  const followUpCount = store.followUpDue.length;
  const newLeadsCount = store.newLeadsReadyToDm.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Sync indicator */}
      {isSupabaseConfigured && (
        <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 transition-all ${store.synced ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs text-center py-1.5 font-bold flex items-center justify-center gap-1.5">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing your data...
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '72px', paddingTop: isSupabaseConfigured && !store.synced ? '28px' : '0' }}>
        {renderPage()}
      </div>

      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 z-40 max-w-md mx-auto left-1/2 -translate-x-1/2 w-full"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 right-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-48"
            onClick={e => e.stopPropagation()}
          >
            {MORE_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setShowMore(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100 ${page === item.id ? 'bg-slate-50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-lg shadow-sm`}>
                  {item.icon}
                </div>
                <span className={`font-bold text-sm ${page === item.id ? 'text-violet-600' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                {page === item.id && <span className="ml-auto text-violet-500 text-xs">✓</span>}
              </button>
            ))}

            {/* Sign out button (only if Supabase is configured) */}
            {isSupabaseConfigured && userId && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors border-t border-red-100"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-lg">
                  🚪
                </div>
                <span className="font-bold text-sm text-red-600">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 shadow-2xl z-50">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(item => {
            const isActive = page === item.id;
            let badge: number | null = null;
            if (item.id === 'followup' && followUpCount > 0) badge = followUpCount;
            if (item.id === 'senddm' && newLeadsCount > 0) badge = newLeadsCount;

            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setShowMore(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 relative transition-all ${isActive ? 'scale-105' : 'opacity-55'}`}
              >
                {isActive && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full ${item.accentColor}`} />
                )}
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${isActive ? `${item.activeGradient} shadow-lg` : ''}`}>
                  <span className={`text-xl ${isActive ? '' : 'grayscale opacity-70'}`}>{item.icon}</span>
                  {badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-black px-1 shadow-md">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 relative transition-all ${showMore || ['templates', 'settings', 'bulkupload', 'deployguide'].includes(page) ? 'scale-105' : 'opacity-55'}`}
          >
            {(showMore || ['templates', 'settings', 'bulkupload', 'deployguide'].includes(page)) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full bg-slate-600" />
            )}
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${showMore || ['templates', 'settings', 'bulkupload', 'deployguide'].includes(page) ? 'bg-gradient-to-r from-slate-600 to-slate-800 shadow-lg' : ''}`}>
              <span className={`text-xl ${showMore || ['templates', 'settings', 'bulkupload', 'deployguide'].includes(page) ? '' : 'grayscale opacity-70'}`}>
                {page === 'templates' ? '📝' : page === 'settings' ? '⚙️' : page === 'bulkupload' ? '📊' : page === 'deployguide' ? '🚀' : '⋯'}
              </span>
            </div>
            <span className={`text-[10px] font-black mt-0.5 ${showMore || ['templates', 'settings', 'bulkupload', 'deployguide'].includes(page) ? 'text-slate-800' : 'text-slate-400'}`}>
              {page === 'templates' ? 'Templates' : page === 'settings' ? 'Settings' : page === 'bulkupload' ? 'Bulk' : page === 'deployguide' ? 'Go Live' : 'More'}
            </span>
          </button>
        </div>
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  );
}
