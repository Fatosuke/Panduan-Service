import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Send, 
  ArrowLeft, 
  Clock, 
  Wrench, 
  Check, 
  MessageSquare,
  Sparkles,
  PhoneCall,
  RefreshCw,
  Loader2,
  ExternalLink,
  Database,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { AnalisisUnitRecord, StaffContact, SpreadsheetConfig } from '../../types';
import { STAFF_CONTACTS } from '../../data/initialData';

interface AnalisisViewProps {
  onBackToMain?: () => void;
  onNavigateToHelp?: () => void;
}

export const AnalisisView: React.FC<AnalisisViewProps> = ({ 
  onBackToMain,
  onNavigateToHelp 
}) => {
  // Form state: only nama/tipe unit and komponen rusak/hasil pengecekan
  const [unitName, setUnitName] = useState('');
  const [damagedComponent, setDamagedComponent] = useState('');

  // Real-time synchronization state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SpreadsheetConfig>(SpreadsheetService.getSheetConfig());
  const [showConfigBox, setShowConfigBox] = useState(false);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Result state
  const [hasQueried, setHasQueried] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    found: boolean;
    record?: AnalisisUnitRecord;
    message?: string;
  } | null>(null);

  // Consultation state for when "tanyakan pada pembina" triggers
  const [selectedPembina, setSelectedPembina] = useState<StaffContact>(
    STAFF_CONTACTS.filter(s => s.role === 'Pembina')[0]
  );
  const [consultationSent, setConsultationSent] = useState(false);

  // Direct quick-add to spreadsheet state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickSolution, setQuickSolution] = useState('');
  const [quickAddSyncing, setQuickAddSyncing] = useState(false);
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  const handleQuickAddSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSolution.trim() || !unitName.trim() || !damagedComponent.trim()) return;

    setQuickAddSyncing(true);
    setQuickAddNotice(null);

    const newRecord: AnalisisUnitRecord = {
      id: `ana-${Date.now()}`,
      unitName: unitName.trim(),
      serialNumber: 'SN-GENERIC',
      damagedComponent: damagedComponent.trim(),
      diagnosisResult: quickSolution.trim(),
      rootCause: 'Beban berlebih atau aus',
      repairSteps: [
        'Periksa jalur komponen dengan teliti',
        'Ganti dengan part original baru',
        'Uji menggunakan bohlam seri sebelum tersambung ke beban penuh'
      ],
      recommendedParts: [damagedComponent.trim()],
      difficulty: 'Sedang',
      estimatedTime: '45 Menit'
    };

    // 1. Save locally
    const existing = SpreadsheetService.getAnalysisRecords();
    const updated = [newRecord, ...existing];
    SpreadsheetService.saveAnalysisRecords(updated);

    // 2. Sync to spreadsheet
    try {
      const res = await SpreadsheetService.syncAnalysisRecordToSpreadsheet(newRecord);
      setQuickAddNotice(res.message);
    } catch (err: any) {
      setQuickAddNotice('Tersimpan di web: ' + (err?.message || ''));
    }

    setQuickAddSyncing(false);
    setShowQuickAdd(false);
    setQuickSolution('');

    // Update query result to show found immediately
    setQueryResult({
      found: true,
      record: newRecord
    });
  };

  useEffect(() => {
    const cfg = SpreadsheetService.getSheetConfig();
    setSheetConfig(cfg);
    if (cfg.googleSpreadsheetId) {
      setSpreadsheetInput(cfg.googleSpreadsheetId);
    } else if (cfg.sheetUrl) {
      setSpreadsheetInput(cfg.sheetUrl);
    }
  }, []);

  const handleSaveSpreadsheetId = () => {
    const val = spreadsheetInput.trim();
    if (!val) return;

    let id = val;
    const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      id = match[1];
    }

    const currentCfg = SpreadsheetService.getSheetConfig();
    const updated: SpreadsheetConfig = {
      ...currentCfg,
      googleSpreadsheetId: id,
      isConnected: true,
      lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    SpreadsheetService.saveSheetConfig(updated);
    setSheetConfig(updated);
    setShowConfigBox(false);
    setSyncStatusMsg(`ID Spreadsheet disimpan: ${id}. Setiap cek analisa akan membaca sheet ini real-time.`);
  };

  // Triggered every time the user checks analysis: FETCHES DATA IN REALTIME FROM SPREADSHEET
  const handleAnalisisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultationSent(false);

    if (!unitName.trim()) {
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Sedang mengambil data terbaru dari Google Spreadsheet secara real-time...');

    try {
      // 1. Live Fetch from Google Spreadsheet (API / CSV)
      const syncResult = await SpreadsheetService.fetchRealtimeAnalysis();
      const checkTimestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCheckTime(checkTimestamp);

      if (syncResult.success) {
        setSyncStatusMsg(syncResult.message || `Data berhasil ditarik realtime (${syncResult.count} data)`);
      } else {
        setSyncStatusMsg(syncResult.message || 'Pemeriksaan real-time selesai');
      }

      // 2. Query analysis using the freshly fetched records
      const result = SpreadsheetService.queryAnalysis(unitName, '', damagedComponent, syncResult.records);
      setQueryResult(result);
      setHasQueried(true);
    } catch (err: any) {
      console.error('Gagal mengambil data real-time:', err);
      // Fallback query to local records
      const fallbackResult = SpreadsheetService.queryAnalysis(unitName, '', damagedComponent);
      setQueryResult(fallbackResult);
      setHasQueried(true);
      setSyncStatusMsg('Gagal koneksi live Google Sheets, menggunakan data lokal tersimpan.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Sedang menyinkronkan data Google Spreadsheet...');
    try {
      const res = await SpreadsheetService.fetchRealtimeAnalysis();
      const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCheckTime(time);
      setSyncStatusMsg(res.message || `Sinkronisasi sukses: ${res.count} data diperbarui.`);
      setSheetConfig(SpreadsheetService.getSheetConfig());
    } catch (err: any) {
      setSyncStatusMsg('Gagal menyinkronkan data: ' + (err?.message || 'Koneksi terputus'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickSample = (sampleUnit: string, sampleDamage: string) => {
    setUnitName(sampleUnit);
    setDamagedComponent(sampleDamage);
    setHasQueried(false);
    setQueryResult(null);
  };

  const pembinaList = STAFF_CONTACTS.filter(s => s.role === 'Pembina');

  const handleSendToPembina = () => {
    setConsultationSent(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-indigo-400" />
              Sistem Analisis Kerusakan Unit Servis
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Identifikasi kerusakan unit dan pencarian solusi langsung dari Google Spreadsheet secara Real-Time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualSyncNow}
            disabled={isSyncing}
            className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Tarik data terbaru dari Google Sheets sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinkron Realtime...' : 'Cek Live Sheet'}</span>
          </button>
        </div>
      </div>

      {/* REALTIME SPREADSHEET STATUS & CONFIG CARD */}
      <div className="bg-slate-900/90 border border-indigo-900/60 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              Koneksi Real-Time Spreadsheet:
            </span>
            <span className="text-xs text-slate-300 font-mono">
              {sheetConfig.googleSpreadsheetId 
                ? `${sheetConfig.googleSpreadsheetId.substring(0, 16)}...` 
                : (sheetConfig.sheetUrl ? 'Web CSV Terhubung' : 'ID Default Master Aktif')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sheetConfig.googleSpreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetConfig.googleSpreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowConfigBox(!showConfigBox)}
              className="text-[11px] py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {showConfigBox ? 'Tutup Pengaturan' : '⚙️ Hubungkan / Ganti ID Sheet'}
            </button>
          </div>
        </div>

        {/* Real-time sync feedback message banner */}
        {syncStatusMsg && (
          <div className="py-2 px-3 rounded-xl bg-blue-950/50 border border-blue-800/60 text-xs text-blue-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
              {syncStatusMsg}
            </span>
            {lastCheckTime && (
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                Pukul {lastCheckTime}
              </span>
            )}
          </div>
        )}

        {/* Expandable Config Box */}
        {showConfigBox && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-xs text-slate-400">
              Tempelkan link atau ID Google Spreadsheet Anda (misal: <code>https://docs.google.com/spreadsheets/d/...</code>). Setiap kali formulir dicek, web akan otomatis menarik baris terbaru.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau link Google Sheets"
                className="flex-1 py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSaveSpreadsheetId}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan ID Spreadsheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/70 pb-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Formulir Diagnosa & Pengecekan Unit
            </h3>
            <p className="text-xs text-slate-400">
              Lengkapi 2 informasi di bawah ini untuk mencocokkan dengan riwayat solusi di Spreadsheet
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Sync Real-Time
          </span>
        </div>

        <form onSubmit={handleAnalisisSubmit} className="space-y-6">
          {/* STEP 1: Nama / Tipe Unit */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <label className="text-sm font-bold text-white">
                Nama / Tipe Unit *
              </label>
            </div>
            <p className="text-xs text-slate-400 mb-2 pl-8.5">
              Masukkan merk, tipe, atau model penguat suara yang sedang dikerjakan
            </p>
            <div className="pl-8.5">
              <input
                id="input-unit-name"
                type="text"
                required
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Contoh: ZA-2240, Yamaha P7000S, Ampli OCL 150W, Power SOCL 504..."
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* STEP 2: Komponen Yang Rusak / Hasil Pengecekan */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <label className="text-sm font-bold text-white">
                Komponen yang Rusak / Hasil Pengecekan *
              </label>
            </div>
            <p className="text-xs text-slate-400 mb-2 pl-8.5">
              Tuliskan temuan fisik atau hasil pengukuran multitester (contoh: Dioda bridge, Transistor final 2SC5200 short, Dioda Zener 12V bocor)
            </p>
            <div className="pl-8.5">
              <textarea
                id="input-damaged-component"
                required
                rows={3}
                value={damagedComponent}
                onChange={(e) => setDamagedComponent(e.target.value)}
                placeholder="Contoh: Dioda bridge, Transistor final 2SC5200 short, fuse putus..."
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            id="btn-analisis-submit"
            type="submit"
            disabled={isSyncing}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sedang Mengambil Data Real-Time dari Spreadsheet...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                <span>Analisis &amp; Cari Solusi Real-Time dari Spreadsheet</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Picker */}
        <div className="mt-6 pt-4 border-t border-slate-700/60">
          <span className="text-xs text-slate-400 block mb-2 font-medium">
            Klik sampel data unit dari Spreadsheet untuk menguji sistem secara instan:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickSample('ZA-2240', 'Dioda bridge')}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-300 hover:border-emerald-500 cursor-pointer font-medium"
            >
              ⭐ ZA-2240 (Dioda bridge)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSample('Ampli OCL 150W', 'Transistor Final 2SC5200 short')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-blue-500 cursor-pointer"
            >
              📋 Ampli OCL 150W (TR 2SC5200 short)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSample('Power SOCL 504', 'Dioda Zener 12V bocor')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-blue-500 cursor-pointer"
            >
              📋 Power SOCL 504 (Dioda Zener bocor)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSample('Amplifier Custom Rakitan X', 'Suara mendadak keluar letupan frekuensi ultra')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-rose-800 text-rose-300 hover:border-rose-600 cursor-pointer"
            >
              ❓ Sampel Tidak Ada di Sheet (Uji Pesan Pembina)
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY SECTION */}
      {hasQueried && queryResult && (
        <div className="animate-fadeIn space-y-4">
          {/* Live verification indicator */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Pencarian dilakukan pada basis data Spreadsheet terbaru
            </span>
            {lastCheckTime && (
              <span className="text-[11px] text-slate-400 font-mono">
                Sinkron Real-Time: {lastCheckTime}
              </span>
            )}
          </div>

          {queryResult.found && queryResult.record ? (
            /* DATA SESUAI DITEMUKAN DI SPREADSHEET */
            <div className="bg-slate-800/90 border border-emerald-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Data Ditemukan di Spreadsheet
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      Hasil Analisis: {queryResult.record.unitName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Serial: {queryResult.record.serialNumber} | Komponen: {queryResult.record.damagedComponent}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tingkat Kesulitan:</span>
                  <span className="text-xs font-bold text-amber-400 px-2 py-0.5 bg-amber-950/60 rounded-md border border-amber-800 inline-block mt-0.5">
                    {queryResult.record.difficulty} ({queryResult.record.estimatedTime})
                  </span>
                </div>
              </div>

              {/* Diagnosis and Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-700/60">
                  <span className="text-emerald-400 font-bold block mb-1">Hasil Diagnosa &amp; Solusi (Dari Spreadsheet):</span>
                  <p className="text-slate-100 font-bold text-base leading-relaxed">{queryResult.record.diagnosisResult}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
                  <span className="text-slate-400 font-semibold block mb-1">Keterangan Tambahan:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{queryResult.record.rootCause}</p>
                </div>
              </div>

              {/* Step-by-step SOP repair */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  Langkah-Langkah Solusi Servis:
                </h4>
                <div className="space-y-2">
                  {queryResult.record.repairSteps.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-start gap-3 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended replacement parts */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                  Komponen Terkait / Pengganti:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {queryResult.record.recommendedParts.map((part, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-blue-900/40 border border-blue-700/60 text-xs text-blue-200 font-semibold">
                      🔧 {part}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* DATA TIDAK DITEMUKAN DI SPREADSHEET -> MUNCUL "TANYAKAN PADA PEMBINA" */
            <div className="bg-slate-800/95 border-2 border-amber-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-amber-950 text-amber-300 text-xs font-bold border border-amber-800 mb-1">
                    Status Pencarian Database Spreadsheet
                  </div>
                  {/* Exact phrase requested: "tanyakan pada pembina" */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-400 capitalize tracking-tight">
                    Tanyakan Pada Pembina
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Data kerusakan unit <strong>"{unitName}"</strong> dengan temuan kerusakan <strong>"{damagedComponent}"</strong> tidak ditemukan dalam catatan database Spreadsheet. Anda disarankan berkonsultasi langsung dengan Pembina Audio.
                  </p>
                </div>
              </div>

              {/* Direct consultation section */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  Kirim Pertanyaan Kasus Servis Ini ke Pembina:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pembinaList.map((pem) => (
                    <button
                      key={pem.id}
                      type="button"
                      onClick={() => setSelectedPembina(pem)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPembina.id === pem.id
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-white">{pem.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </div>
                      <p className="text-[11px] text-amber-300/80 mt-1 truncate">{pem.specialty}</p>
                    </button>
                  ))}
                </div>

                {/* Message preview to pembina */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5 font-mono text-slate-300">
                  <p><strong className="text-amber-400">Kepada:</strong> {selectedPembina.name} ({selectedPembina.title})</p>
                  <p><strong className="text-blue-400">Unit:</strong> {unitName}</p>
                  <p><strong className="text-blue-400">Temuan Kerusakan:</strong> {damagedComponent}</p>
                  <p><strong className="text-emerald-400">Catatan:</strong> "Mohon arahan dan panduan teknis langkah servis untuk unit ini karena belum ada di spreadsheet."</p>
                </div>

                {!consultationSent ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                        `Halo Pembina ${selectedPembina.name}, saya teknisi ingin menanyakan kasus unit yang tidak ada di spreadsheet:\nUnit: ${unitName}\nTemuan Kerusakan: ${damagedComponent}\nMohon panduannya.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Hubungi Pembina via WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={handleSendToPembina}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Kirim Tiket Konsultasi Internal
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/70 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      Pertanyaan telah terkirim kepada Pembina <strong>{selectedPembina.name}</strong>. Pembina akan segera merespons via sistem atau chat.
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Add Solution & Sync Directly to Google Spreadsheet */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Sudah Menemukan Solusi untuk Unit "{unitName}"?
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tambahkan langsung ke database agar otomatis tersinkron ke Google Spreadsheet.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showQuickAdd ? 'Tutup Form' : '+ Tambah Solusi & Sync ke Spreadsheet'}</span>
                  </button>
                </div>

                {showQuickAdd && (
                  <form onSubmit={handleQuickAddSolution} className="pt-2 border-t border-slate-800 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Nama Unit:</span>
                        <strong className="text-white font-mono">{unitName}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Komponen Rusak:</span>
                        <strong className="text-amber-400 font-mono">{damagedComponent}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Hasil Diagnosa &amp; Solusi Perbaikan *:
                      </label>
                      <input
                        type="text"
                        required
                        value={quickSolution}
                        onChange={(e) => setQuickSolution(e.target.value)}
                        placeholder="Contoh: Ganti Fuse 2A 250V / Ganti Dioda Bridge & Cek Elco"
                        className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Data akan langsung dikirim ke baris Google Spreadsheet
                      </span>
                      <button
                        type="submit"
                        disabled={quickAddSyncing || !quickSolution.trim()}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {quickAddSyncing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyinkronkan...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Simpan &amp; Sync ke Spreadsheet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {quickAddNotice && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{quickAddNotice}</span>
                  </div>
                )}
              </div>

              {/* Link to help page */}
              {onNavigateToHelp && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToHelp}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Lihat Daftar Lengkap Kontak Pembina & Admin di Halaman Bantuan (Help) &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
