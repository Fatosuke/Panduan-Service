import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Wrench, 
  FileSearch, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Radio, 
  ShieldCheck, 
  FileSpreadsheet,
  Home,
  BookOpen
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onSelectView: (view: string, subParam?: 'pasif' | 'aktif') => void;
  onOpenSpreadsheetManager: () => void;
  onOpenIntroGuide?: () => void;
  isFulltime?: boolean;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  onOpenSpreadsheetManager,
  onOpenIntroGuide,
  isFulltime = false
}) => {
  const [komponenExpanded, setKomponenExpanded] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-80 sm:w-96 max-w-full bg-slate-900 border-r border-slate-700/80 h-full shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
        
        {/* Top Header */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Menu Utama Servis
                </h3>
                <p className="text-[11px] text-slate-400">
                  Panduan & Diagnosa Elektronika
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Home & Intro navigation */}
          <div className="px-4 pt-3 space-y-1.5">
            <button
              onClick={() => {
                onSelectView('main');
                onClose();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeView === 'main'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Halaman Utama (5 Tab Servis)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenIntroGuide) onOpenIntroGuide();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Pengenalan & Cara Pakai Web</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 font-bold">
                Buka Panduan
              </span>
            </button>
          </div>

          {/* List of 4 Specific Rows mandated by user */}
          <div className="p-4 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-2 pb-1">
              Navigasi Khusus (4 Poin Panduan):
            </div>

            {/* BARIS 1: KOMPONEN (Pasif dan Aktif) */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setKomponenExpanded(!komponenExpanded)}
                className={`w-full p-3 text-left flex items-center justify-between transition-colors ${
                  activeView.startsWith('komponen') ? 'bg-slate-800 text-blue-400' : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-sm">1. Komponen</span>
                </div>
                {komponenExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Sub-menu Pasif vs Aktif */}
              {komponenExpanded && (
                <div className="p-2 space-y-1 bg-slate-900/60 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onSelectView('komponen', 'pasif');
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs flex items-center justify-between transition-all ${
                      activeView === 'komponen-pasif'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Komponen Pasif
                    </span>
                    <span className="text-[10px] opacity-70">Resistor, Elco, Fuse...</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectView('komponen', 'aktif');
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs flex items-center justify-between transition-all ${
                      activeView === 'komponen-aktif'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-blue-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Komponen Aktif
                    </span>
                    <span className="text-[10px] opacity-70">Transistor, Mosfet, IC...</span>
                  </button>
                </div>
              )}
            </div>

            {/* BARIS 2: TOOLS */}
            <button
              type="button"
              onClick={() => {
                onSelectView('tools');
                onClose();
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                activeView === 'tools'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                  : 'bg-slate-800/40 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-sm">2. Tools</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            {/* BARIS 3: ANALISIS */}
            <button
              type="button"
              onClick={() => {
                onSelectView('analisis');
                onClose();
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                activeView === 'analisis'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-800/40 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <div>
                  <span className="font-bold text-sm block leading-tight">3. Analisis Kerusakan</span>
                  <span className="text-[10px] text-slate-400">Pengecekan unit 3 langkah</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            {/* BARIS 4: HELP */}
            <button
              type="button"
              onClick={() => {
                onSelectView('help');
                onClose();
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                activeView === 'help'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-800/40 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <div>
                  <span className="font-bold text-sm block leading-tight">4. Help (Bantuan)</span>
                  <span className="text-[10px] text-slate-400">Kontak Pembina & Admin</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </div>

        {/* Bottom footer inside drawer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          {isFulltime && (
            <button
              type="button"
              onClick={() => {
                onOpenSpreadsheetManager();
                onClose();
              }}
              className="w-full mb-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Pengaturan & Sinkronisasi Spreadsheet</span>
            </button>
          )}
          <p className="text-[10px] text-slate-500 text-center">
            Panduan Service Audio v2.5 • Terintegrasi Spreadsheet
          </p>
        </div>

      </div>
    </div>
  );
};
