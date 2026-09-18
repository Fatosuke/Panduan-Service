import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  Sliders, 
  Volume2, 
  Zap,
  Info,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { TesAmpliItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';

interface TesAmpliTabProps {
  currentUser?: User | null;
  onOpenSpreadsheetManager?: () => void;
}

export const TesAmpliTab: React.FC<TesAmpliTabProps> = ({ currentUser, onOpenSpreadsheetManager }) => {
  const [steps, setSteps] = useState<TesAmpliItem[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TesAmpliItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    tag: 'Pengujian Standar',
    action: '',
    target: '',
    failure: '',
    tips: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video'
  });

  const canEdit = currentUser ? SpreadsheetService.hasFulltimeAccess(currentUser) : false;

  useEffect(() => {
    refreshData();
    const unsub = SpreadsheetService.subscribeToDataChanges(refreshData);
    return unsub;
  }, []);

  const refreshData = () => {
    setSteps(SpreadsheetService.getTestAmpliList());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      tag: 'Pengujian Standar',
      action: '',
      target: '',
      failure: '',
      tips: '',
      mediaUrl: '',
      mediaType: 'image'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TesAmpliItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      tag: item.tag,
      action: item.action,
      target: item.target,
      failure: item.failure,
      tips: item.tips,
      mediaUrl: item.mediaUrl || '',
      mediaType: item.mediaType || (item.mediaUrl?.includes('youtu') ? 'video' : 'image')
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus langkah uji "${title}"?`)) return;
    SpreadsheetService.deleteTestAmpliItem(id);
    refreshData();
    showToast(`Langkah uji "${title}" berhasil dihapus.`);
  };

  const handleResetToDefault = () => {
    if (!window.confirm('Kembalikan seluruh langkah uji amplifier ke standar awal?')) return;
    SpreadsheetService.resetTestAmpliList();
    refreshData();
    showToast('Langkah pengetesan berhasil di-reset ke standar.');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul langkah pengujian wajib diisi!');
      return;
    }

    if (editingItem) {
      const updated: TesAmpliItem = {
        ...editingItem,
        title: formData.title.trim(),
        tag: formData.tag.trim(),
        action: formData.action.trim(),
        target: formData.target.trim(),
        failure: formData.failure.trim(),
        tips: formData.tips.trim(),
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      };
      SpreadsheetService.updateTestAmpliItem(updated);
      showToast(`Langkah "${updated.title}" berhasil diperbarui.`);
    } else {
      const created = SpreadsheetService.addTestAmpliItem({
        num: steps.length + 1,
        title: formData.title.trim(),
        tag: formData.tag.trim(),
        action: formData.action.trim(),
        target: formData.target.trim(),
        failure: formData.failure.trim(),
        tips: formData.tips.trim(),
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      });
      showToast(`Langkah baru "${created.title}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Cara Pengetesan Power Amplifier (SOP Pengujian)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Panduan verifikasi bohlam pengaman, kalibrasi DCO, bias transistor final, dan sinyal audio ({steps.length} langkah SOP)
          </p>
        </div>

        {/* Action Buttons for Fulltime Users */}
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Langkah Uji</span>
            </button>
            {onOpenSpreadsheetManager && (
              <button
                type="button"
                onClick={onOpenSpreadsheetManager}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
                title="Buka Sinkronisasi Master Spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Spreadsheet Sync</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset data pengetesan ampli ke standar awal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Check Indicator */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Status Checklist Pengujian Lapangan
            </h4>
            <p className="text-xs text-slate-400">
              {completedSteps.length} dari {steps.length} langkah pengujian telah diverifikasi selesai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60">
            {steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0}% Selesai
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              className={`border rounded-2xl p-5 transition-all shadow-lg ${
                isDone 
                  ? 'bg-slate-900/90 border-emerald-600/50 ring-1 ring-emerald-500/20' 
                  : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors cursor-pointer mt-0.5 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400'
                    }`}
                    title={isDone ? 'Tandai belum selesai' : 'Tandai langkah ini selesai'}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : (step.num || idx + 1)}
                  </button>

                  <div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-900 text-cyan-400 border border-slate-700/80 mb-1">
                      {step.tag}
                    </span>

                    {/* Judul Langkah + Media Badge Kecil Langsung Setelah Judul */}
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center flex-wrap gap-1">
                      <span>{step.title}</span>
                      <InlineMediaBadge 
                        mediaUrl={step.mediaUrl}
                        mediaType={step.mediaType}
                        title={step.title}
                      />
                    </h3>
                  </div>
                </div>

                {/* Edit & Delete for Fulltime */}
                {canEdit && (
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(step)}
                      className="p-1.5 rounded-md hover:bg-cyan-600/30 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Edit langkah pengujian ini"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(step.id, step.title)}
                      className="p-1.5 rounded-md hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Hapus langkah ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-3 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-cyan-400 block mb-1">Tindakan Pengukuran:</span>
                {step.action}
              </div>

              {/* Target vs Failure Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                  <span className="font-bold text-emerald-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Target Parameter Normal:
                  </span>
                  <p className="text-[11px] leading-relaxed text-emerald-100/90">
                    {step.target}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
                  <span className="font-bold text-rose-300 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Indikasi Rusak / Bahaya:
                  </span>
                  <p className="text-[11px] leading-relaxed text-rose-100/90">
                    {step.failure}
                  </p>
                </div>
              </div>

              {/* Tips Teknisi */}
              {step.tips && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-2 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cyan-300">Tips Master Teknisi: </span>
                    {step.tips}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL (FULLTIME ONLY) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {editingItem ? 'Edit Langkah Pengetesan Ampli' : 'Tambah Langkah Pengetesan Baru'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tersinkron otomatis ke Google Sheets tab Pengetesan_Amplifier
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Judul Langkah Pengujian: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Kalibrasi Tegangan Bias Transistor Final"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tag Kategori:</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Contoh: Bias & DCO"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Media Uploader (Upload langsung dari perangkat atau Link URL) */}
              <MediaFieldUploader
                mediaUrl={formData.mediaUrl}
                mediaType={formData.mediaType}
                onChange={(url, type) => setFormData({ ...formData, mediaUrl: url, mediaType: type })}
                label="Media Foto / Video (Tampil kecil setelah nama langkah):"
                accentColor="cyan"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tindakan Pengukuran (SOP):
                </label>
                <textarea
                  rows={2}
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  placeholder="Gunakan multimeter skala DCV 200V probe hitam di Ground..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Parameter Normal:
                </label>
                <textarea
                  rows={2}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="DCO di bawah 20mV, tegangan simetris VCC seimbang..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Indikasi Rusak / Kerusakan Fatal:
                </label>
                <textarea
                  rows={2}
                  value={formData.failure}
                  onChange={(e) => setFormData({ ...formData, failure: e.target.value })}
                  placeholder="Bohlam pengaman terus menyala, atau DCO keluar belasan volt..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tips Teknisi Audio:
                </label>
                <input
                  type="text"
                  value={formData.tips}
                  onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                  placeholder="Pastikan transistor sensor bias BD139 terpasang di heatsink utama"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Langkah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
