import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Wrench, 
  Radio, 
  Layers, 
  Activity, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  LogOut, 
  FileSpreadsheet, 
  User as UserIcon,
  Calendar,
  AlertCircle,
  HelpCircle,
  Cpu,
  FileSearch,
  Sparkles,
  BookOpen,
  X
} from 'lucide-react';
import { SpreadsheetService } from './services/spreadsheetService';
import { User } from './types';
import { AuthScreen } from './components/AuthScreen';
import { SidebarDrawer } from './components/SidebarDrawer';
import { SpreadsheetManagerModal } from './components/SpreadsheetManagerModal';
import { UserManagementPanel } from './components/UserManagementPanel';
import { ServiceBubbleModal } from './components/ServiceBubbleModal';
import { IntroGuideModal } from './components/IntroGuideModal';
import {
  validateSession,
  startAllStores,
  stopAllStores,
  logout,
  allStoresReady,
  subscribeToAnyDataChange,
  isBackendConfigured,
} from './services/backendService';
import { Users as UsersIcon } from 'lucide-react';

// Views
import { KomponenView } from './components/views/KomponenView';
import { ToolsView } from './components/views/ToolsView';
import { AnalisisView } from './components/views/AnalisisView';
import { HelpView } from './components/views/HelpView';

// Tabs for Main Page
import { AlatTab } from './components/tabs/AlatTab';
import { AmpliTab } from './components/tabs/AmpliTab';
import { KomponenRusakBagusTab } from './components/tabs/KomponenRusakBagusTab';
import { TesAmpliTab } from './components/tabs/TesAmpliTab';
import { TesSpeakerTab } from './components/tabs/TesSpeakerTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState<boolean>(false);
  const [isDataReady, setIsDataReady] = useState<boolean>(false);
  const [storeErrors, setStoreErrors] = useState<{ sheet: string; error: string }[]>([]);
  const [dismissedErrorBanner, setDismissedErrorBanner] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState<boolean>(false);
  
  // Navigation: 'main' | 'komponen-pasif' | 'komponen-aktif' | 'tools' | 'analisis' | 'help'
  const [activeView, setActiveView] = useState<string>('main');
  
  // Active tab on the main page (5 tabs requested)
  // 1. nama nama alat yang akan digunakan
  // 2. nama nama dan tipe ampli
  // 3. cara mengenali komponen rusak/bagus
  // 4. cara pengetesan amplifier
  // 5. cara pengetesan speaker
  const [activeMainTab, setActiveMainTab] = useState<
    'alat' | 'ampli' | 'komponen-rusak-bagus' | 'tes-ampli' | 'tes-speaker'
  >('komponen-rusak-bagus');

  // Single source of truth for "who is logged in". Unlike Firebase, this
  // backend has no push-based session listener, so we validate the token
  // saved on this device once on mount, and AuthScreen calls
  // handleAuthSuccess directly right after a successful register/login.
  useEffect(() => {
    validateSession().then((user) => {
      setCurrentUser(user);
      setAuthResolved(true);
      if (user) {
        startAllStores();
        const isHidden = localStorage.getItem('panduan_service_hide_welcome_popup') === 'true';
        if (!isHidden) {
          setIsIntroModalOpen(true);
        }
      }
    });
  }, []);

  // Track when every collection has loaded at least once from the
  // spreadsheet, so we can show a brief loading state instead of a flash
  // of empty tabs. A collection that keeps failing (e.g. Apps Script not
  // redeployed with a newer Code.gs yet) still counts as "ready" - it just
  // stays empty - so one bad sheet never blocks the whole app forever.
  useEffect(() => {
    if (!currentUser) return;
    const checkStatus = () => {
      if (allStoresReady()) setIsDataReady(true);
      setStoreErrors(SpreadsheetService.getStoreErrors());
    };
    checkStatus();
    const unsub = subscribeToAnyDataChange(checkStatus);
    return unsub;
  }, [currentUser]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthResolved(true);
    startAllStores();
    const isHidden = localStorage.getItem('panduan_service_hide_welcome_popup') === 'true';
    if (!isHidden) {
      setIsIntroModalOpen(true);
    }
  };

  const handleLogout = async () => {
    stopAllStores();
    setIsDataReady(false);
    await logout();
    setCurrentUser(null);
    setActiveView('main');
    setIsIntroModalOpen(false);
  };

  const handleSelectView = (view: string, subParam?: 'pasif' | 'aktif') => {
    if (view === 'komponen') {
      if (subParam === 'pasif') {
        setActiveView('komponen-pasif');
      } else if (subParam === 'aktif') {
        setActiveView('komponen-aktif');
      } else {
        setActiveView('komponen-pasif');
      }
    } else {
      setActiveView(view);
    }
  };

  // Backend not configured yet (VITE_APPS_SCRIPT_URL missing) - show a
  // clear setup message instead of a confusing broken login screen.
  if (!isBackendConfigured()) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-amber-600/20 border border-amber-600/40 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Backend Belum Dikonfigurasi</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Tambahkan <code className="text-amber-300">VITE_APPS_SCRIPT_URL</code> ke file <code className="text-amber-300">.env.local</code> dengan URL Web App dari Google Apps Script Anda. Lihat SETUP_GUIDE.md untuk langkah lengkapnya.
        </p>
      </div>
    );
  }

  // Wait for the saved session to be checked before deciding what to show,
  // to avoid a flash of the login screen on refresh.
  if (!authResolved) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not authenticated, show Login & Registration screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Registered but not yet approved by an admin: no access to data yet.
  if (currentUser.accessType === 'none') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-amber-600/20 border border-amber-600/40 text-amber-400 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Menunggu Persetujuan Admin</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Akun <strong>{currentUser.fullName}</strong> sudah terdaftar. Hubungi admin (akun Fulltime) agar akses Anda diaktifkan lewat panel &quot;Kelola Akun&quot;.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300"
        >
          Keluar
        </button>
      </div>
    );
  }

  // Data hasn't loaded from Firestore yet - avoid flashing empty tabs.
  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Memuat data terbaru...</p>
      </div>
    );
  }

  const isFulltime = SpreadsheetService.hasFulltimeAccess(currentUser);
  const isAdmin = SpreadsheetService.isFulltimeAdmin(currentUser);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* TOP BAR / HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Left: Hamburger button for drawer (Tab di sebelah kiri atas) */}
          <div className="flex items-center gap-3">
            <button
              id="btn-open-left-drawer"
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
              title="Buka Menu Panduan (Komponen, Tools, Analisis, Help)"
            >
              <Menu className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold text-white">
                Menu Khusus (Kiri Atas)
              </span>
            </button>

            {/* App branding */}
            <div 
              onClick={() => setActiveView('main')}
              className="cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  Panduan Service
                  <span className="hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    Audio & Amp
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Sistem Informasi Servis Elektronika Terintegrasi Spreadsheet
                </p>
              </div>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guide popup trigger */}
            <button
              id="btn-open-intro-guide"
              type="button"
              onClick={() => setIsIntroModalOpen(true)}
              className="p-2 sm:py-1.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Panduan & Cara Pakai Web"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline font-semibold">Panduan Web</span>
            </button>

            {/* Spreadsheet sync trigger */}
            {isFulltime && (
              <button
                type="button"
                onClick={() => setIsSpreadsheetModalOpen(true)}
                className="p-2 sm:py-1.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Pengaturan Data Spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Spreadsheet Sync</span>
              </button>
            )}

            {/* User management (approve accounts / set access level) - admin (Fulltime) only */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsUserManagementOpen(true)}
                className="p-2 sm:py-1.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Kelola Akun Pengguna"
              >
                <UsersIcon className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">Kelola Akun</span>
              </button>
            )}

            {/* User Name */}
            <div className="flex items-center px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs shadow-sm">
              <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
                {currentUser.fullName}
              </span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 sm:py-1.5 sm:px-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* SUB-HEADER / ACTIVE VIEW BANNER IF VIEW IS NOT MAIN */}
      {activeView !== 'main' && (
        <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Navigasi Aktif:</span>
              <span className="font-bold text-blue-400">
                {activeView === 'komponen-pasif' && '1. Komponen > Komponen Pasif'}
                {activeView === 'komponen-aktif' && '1. Komponen > Komponen Aktif'}
                {activeView === 'tools' && '2. Tools (Peralatan Servis)'}
                {activeView === 'analisis' && '3. Analisis Kerusakan Unit'}
                {activeView === 'help' && '4. Help (Daftar Pembina & Admin)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('main')}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              &larr; Kembali ke 5 Tab Halaman Utama
            </button>
          </div>
        </div>
      )}

      {/* DATA LOAD ERROR BANNER (admin only - helps diagnose Apps Script deploy issues) */}
      {isAdmin && storeErrors.length > 0 && !dismissedErrorBanner && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-200 mb-1">
                {storeErrors.length} tab data gagal dimuat dari spreadsheet
              </p>
              <ul className="space-y-0.5 text-[11px] sm:text-xs text-rose-300/90 mb-2">
                {storeErrors.map((e) => (
                  <li key={e.sheet}>
                    <strong>{e.sheet}</strong>: {e.error}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-300/80">
                Biasanya karena Apps Script belum di-deploy ulang dengan Code.gs terbaru. Buka Apps Script Editor Anda &gt; Deploy &gt; Manage deployments &gt; buat versi baru.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedErrorBanner(true)}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-900/60 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* VIEW: MAIN PAGE (5 TABS REQUESTED BY USER) */}
        {activeView === 'main' && (
          <div className="space-y-6">
            
            {/* Top Navigation Tabs on Main Page */}
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-lg">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Pilih Topik Pembelajaran & Servis:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                
                {/* Tab 1: Nama nama alat yang akan digunakan */}
                <button
                  type="button"
                  id="tab-alat-btn"
                  onClick={() => setActiveMainTab('alat')}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    activeMainTab === 'alat'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Wrench className="w-5 h-5 mb-2 text-amber-300" />
                  <div>
                    <span className="text-[10px] font-bold opacity-80 uppercase block">Tab 1</span>
                    <span className="text-xs sm:text-sm font-bold leading-tight block">
                      Nama-Nama Alat
                    </span>
                  </div>
                </button>

                {/* Tab 2: Nama nama dan tipe ampli */}
                <button
                  type="button"
                  id="tab-ampli-btn"
                  onClick={() => setActiveMainTab('ampli')}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    activeMainTab === 'ampli'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Radio className="w-5 h-5 mb-2 text-indigo-300" />
                  <div>
                    <span className="text-[10px] font-bold opacity-80 uppercase block">Tab 2</span>
                    <span className="text-xs sm:text-sm font-bold leading-tight block">
                      Nama & Tipe Ampli
                    </span>
                  </div>
                </button>

                {/* Tab 3: Cara mengenali komponen rusak/bagus (Mandatory: Gambar/Video di bagian atas) */}
                <button
                  type="button"
                  id="tab-komponen-rusak-btn"
                  onClick={() => setActiveMainTab('komponen-rusak-bagus')}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                    activeMainTab === 'komponen-rusak-bagus'
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-5 h-5 mb-2 text-blue-300" />
                  <div>
                    <span className="text-[10px] font-bold opacity-80 uppercase block">Tab 3 • Media Video</span>
                    <span className="text-xs sm:text-sm font-bold leading-tight block">
                      Komponen Rusak/Bagus
                    </span>
                  </div>
                </button>

                {/* Tab 4: Cara pengetesan amplifier */}
                <button
                  type="button"
                  id="tab-tes-ampli-btn"
                  onClick={() => setActiveMainTab('tes-ampli')}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    activeMainTab === 'tes-ampli'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Activity className="w-5 h-5 mb-2 text-emerald-300" />
                  <div>
                    <span className="text-[10px] font-bold opacity-80 uppercase block">Tab 4</span>
                    <span className="text-xs sm:text-sm font-bold leading-tight block">
                      Pengetesan Amplifier
                    </span>
                  </div>
                </button>

                {/* Tab 5: Cara pengetesan speaker */}
                <button
                  type="button"
                  id="tab-tes-speaker-btn"
                  onClick={() => setActiveMainTab('tes-speaker')}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer col-span-2 sm:col-span-1 ${
                    activeMainTab === 'tes-speaker'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-5 h-5 mb-2 text-purple-300" />
                  <div>
                    <span className="text-[10px] font-bold opacity-80 uppercase block">Tab 5</span>
                    <span className="text-xs sm:text-sm font-bold leading-tight block">
                      Pengetesan Speaker
                    </span>
                  </div>
                </button>

              </div>
            </div>

            {/* TAB CONTENT RENDERING (5 Core Tabs) */}
            <div>
              {activeMainTab === 'alat' && (
                <AlatTab 
                  currentUser={currentUser}
                  onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
                />
              )}
              {activeMainTab === 'ampli' && (
                <AmpliTab 
                  currentUser={currentUser}
                  onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
                />
              )}
              {activeMainTab === 'komponen-rusak-bagus' && (
                <KomponenRusakBagusTab 
                  currentUser={currentUser}
                  onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
                />
              )}
              {activeMainTab === 'tes-ampli' && (
                <TesAmpliTab 
                  currentUser={currentUser}
                  onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
                />
              )}
              {activeMainTab === 'tes-speaker' && (
                <TesSpeakerTab 
                  currentUser={currentUser}
                  onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
                />
              )}
            </div>

          </div>
        )}

        {/* VIEW: KOMPONEN PASIF */}
        {activeView === 'komponen-pasif' && (
          <KomponenView 
            initialSubCategory="pasif" 
            currentUser={currentUser}
            onBackToMain={() => setActiveView('main')} 
          />
        )}

        {/* VIEW: KOMPONEN AKTIF */}
        {activeView === 'komponen-aktif' && (
          <KomponenView 
            initialSubCategory="aktif" 
            currentUser={currentUser}
            onBackToMain={() => setActiveView('main')} 
          />
        )}

        {/* VIEW: TOOLS */}
        {activeView === 'tools' && (
          <ToolsView currentUser={currentUser} onBackToMain={() => setActiveView('main')} />
        )}

        {/* VIEW: ANALISIS (3 Steps + Spreadsheet matching + "tanyakan pada pembina") */}
        {activeView === 'analisis' && (
          <AnalisisView 
            currentUser={currentUser}
            onBackToMain={() => setActiveView('main')} 
            onNavigateToHelp={() => setActiveView('help')}
          />
        )}

        {/* VIEW: HELP (Pembina & Admin) */}
        {activeView === 'help' && (
          <HelpView currentUser={currentUser} onBackToMain={() => setActiveView('main')} />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Panduan Service Audio & Amplifier • Terintegrasi Spreadsheet</span>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setActiveView('help')}
              className="hover:text-slate-300"
            >
              Hubungi Pembina & Admin
            </button>
            {isFulltime && (
              <>
                <span>•</span>
                <button 
                  type="button"
                  onClick={() => setIsSpreadsheetModalOpen(true)}
                  className="hover:text-slate-300 text-emerald-400 cursor-pointer"
                >
                  Pengaturan Spreadsheet
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* FLOATING BUBBLE UNTUK PENCATATAN NOMOR SERVICE (Pojok Kiri Bawah) */}
      <ServiceBubbleModal 
        currentUser={currentUser}
        onOpenSpreadsheetManager={isFulltime ? () => setIsSpreadsheetModalOpen(true) : undefined}
      />

      {/* LEFT TOP DRAWER COMPONENT ("Tab disebelah kiri atas") */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenSpreadsheetManager={() => setIsSpreadsheetModalOpen(true)}
        onOpenIntroGuide={() => setIsIntroModalOpen(true)}
        isFulltime={isFulltime}
      />

      {/* SPREADSHEET MANAGER MODAL */}
      {isSpreadsheetModalOpen && (
        <SpreadsheetManagerModal
          isOpen={isSpreadsheetModalOpen}
          onClose={() => setIsSpreadsheetModalOpen(false)}
          currentUser={currentUser}
          onDataUpdated={() => {
            // Re-trigger component state updates if needed
          }}
        />
      )}

      {/* POP UP PENGENALAN DAN CARA MENGGUNAKAN WEB (DAPAT DIAKSES DI MENU KHUSUS) */}
      <IntroGuideModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        currentUser={currentUser}
      />

      {/* KELOLA AKUN (approve akun baru / atur level akses) */}
      {isUserManagementOpen && (
        <UserManagementPanel
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
