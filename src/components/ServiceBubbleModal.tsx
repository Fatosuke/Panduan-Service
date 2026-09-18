import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  X, 
  Plus, 
  CheckCircle2, 
  Copy, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  Wrench,
  AlertCircle
} from 'lucide-react';
import { User, ServiceLogRecord } from '../types';
import { SpreadsheetService } from '../services/spreadsheetService';

interface ServiceBubbleModalProps {
  currentUser?: User | null;
  onOpenSpreadsheetManager?: () => void;
}

export const ServiceBubbleModal: React.FC<ServiceBubbleModalProps> = ({
  currentUser,
  onOpenSpreadsheetManager
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'list'>('form');

  // Form states
  const [namaYangMengerjakan, setNamaYangMengerjakan] = useState<string>(currentUser?.fullName || '');
  const [nomorService, setNomorService] = useState<string>('');
  const [analisaKerusakan, setAnalisaKerusakan] = useState<string>('');
  const [komponenDiganti, setKomponenDiganti] = useState<string>('');

  // Data & search states
  const [serviceLogs, setServiceLogs] = useState<ServiceLogRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Sync nama when currentUser changes
  useEffect(() => {
    if (currentUser?.fullName) {
      setNamaYangMengerjakan(currentUser.fullName);
    }
  }, [currentUser]);

  // Load records
  const refreshLogs = () => {
    setServiceLogs(SpreadsheetService.getServiceLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaYangMengerjakan.trim() || !nomorService.trim() || !analisaKerusakan.trim() || !komponenDiganti.trim()) {
      alert('Harap isi semua kolom data nomor service.');
      return;
    }

    SpreadsheetService.addServiceLog({
      namaYangMengerjakan,
      nomorService,
      analisaKerusakan,
      komponenDiganti
    });

    // Reset inputs
    setNomorService('');
    setAnalisaKerusakan('');
    setKomponenDiganti('');
    refreshLogs();

    setSuccessToast('✅ Catatan tersimpan & otomatis disinkronkan ke Google Spreadsheet!');
    setTimeout(() => {
      setSuccessToast(null);
      setActiveSubTab('list');
    }, 1500);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus catatan nomor service ini?')) {
      SpreadsheetService.deleteServiceLog(id);
      refreshLogs();
    }
  };

  const handleCopyForSpreadsheet = () => {
    const csvContent = SpreadsheetService.exportServiceLogsCSV();
    navigator.clipboard.writeText(csvContent);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const filteredLogs = serviceLogs.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.nomorService.toLowerCase().includes(q) ||
      item.namaYangMengerjakan.toLowerCase().includes(q) ||
      item.analisaKerusakan.toLowerCase().includes(q) ||
      item.komponenDiganti.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* FLOATING BUBBLE BUTTON - Pojok Kiri Bawah */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          id="service-log-bubble-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-full shadow-xl shadow-blue-900/40 border border-blue-400/40 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Pencatatan Nomor Service yang Dikerjakan"
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight tracking-wide">
              Catat No. Service
            </span>
            <span className="text-[10px] text-blue-200 font-medium leading-none">
              {serviceLogs.length} Data Tercatat
            </span>
          </div>
        </button>
      </div>

      {/* POPUP / MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-start sm:p-6 p-2 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div 
            className="w-full sm:w-[480px] sm:max-h-[85vh] max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp sm:ml-4 sm:mb-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Catatan Nomor Service</h3>
                  <p className="text-[11px] text-slate-400">Pencatatan pekerjaan servis untuk spreadsheet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs inside Bubble Modal */}
            <div className="flex bg-slate-950/60 p-1 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('form')}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSubTab === 'form'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input No. Service Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSubTab === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Riwayat ({serviceLogs.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Toast message */}
              {successToast && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* SUB TAB 1: FORM INPUT */}
              {activeSubTab === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 space-y-1">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-400" />
                      Format Kolom Spreadsheet:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Nama yang mengerjakan, Nomor service, Analisa kerusakan, Komponen yang diganti.
                    </p>
                  </div>

                  {/* 1. Nama yang mengerjakan */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nama yang Mengerjakan *
                    </label>
                    <input
                      type="text"
                      required
                      value={namaYangMengerjakan}
                      onChange={(e) => setNamaYangMengerjakan(e.target.value)}
                      placeholder="Contoh: Vicky / Agas Maulana / Tommy Wijaya"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 2. Nomor Service */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nomor Service *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomorService}
                      onChange={(e) => setNomorService(e.target.value)}
                      placeholder="Contoh: SRV-2025-0091 atau No. Nota / Tanda Terima"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 3. Analisa Kerusakan */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Analisa Kerusakan *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={analisaKerusakan}
                      onChange={(e) => setAnalisaKerusakan(e.target.value)}
                      placeholder="Contoh: Power CA20 mati total, TR final jebol 4 set dan tegangan bias tidak seimbang"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 4. Komponen yang Diganti */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Komponen yang Diganti *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={komponenDiganti}
                      onChange={(e) => setKomponenDiganti(e.target.value)}
                      placeholder="Contoh: 2SC5200 (4 pcs), 2SA1943 (4 pcs), Zener 15V (2 pcs), Resistor kapur 0.22Ω 5W"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan ke Database & Spreadsheet</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SUB TAB 2: LIST DAFTAR NOMOR SERVICE */}
              {activeSubTab === 'list' && (
                <div className="space-y-3">
                  {/* Search & Action bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nomor service / nama / analisa..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyForSpreadsheet}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/40 rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer font-medium"
                      title="Salin CSV untuk Spreadsheet"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedToast ? 'Tersalin!' : 'Salin CSV'}</span>
                    </button>
                  </div>

                  {/* Records List */}
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                      <p>Belum ada catatan nomor service yang sesuai.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                      {filteredLogs.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 relative group hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold text-[11px] border border-blue-800/80">
                                {item.nomorService}
                              </span>
                              <span className="font-semibold text-white truncate text-[11px]">
                                {item.namaYangMengerjakan}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.createdAt}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 leading-snug">
                            <span className="text-slate-500 font-medium">Analisa: </span>
                            {item.analisaKerusakan}
                          </div>

                          <div className="text-[11px] text-emerald-300 leading-snug">
                            <span className="text-slate-500 font-medium">Komponen: </span>
                            {item.komponenDiganti}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {onOpenSpreadsheetManager && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onOpenSpreadsheetManager();
                        }}
                        className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka Tab Nomor Service di Pengaturan Spreadsheet</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
