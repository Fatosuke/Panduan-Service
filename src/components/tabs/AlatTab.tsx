import React, { useState, useEffect } from 'react';
import { ToolItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';
import { 
  Wrench, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Gauge, 
  ShieldAlert, 
  Check, 
  FileSpreadsheet,
  Info,
  Layers
} from 'lucide-react';

interface AlatTabProps {
  currentUser?: User | null;
  onOpenSpreadsheetManager?: () => void;
}

export const AlatTab: React.FC<AlatTabProps> = ({ currentUser, onOpenSpreadsheetManager }) => {
  const [toolsList, setToolsList] = useState<ToolItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ToolItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pengukuran' as ToolItem['category'],
    specs: '',
    description: '',
    functionDesc: '',
    howToUseText: '',
    safetyTipsText: '',
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
    setToolsList(SpreadsheetService.getToolsList());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };



  const filteredTools = toolsList.filter(tool => {
    const matchesCategory = selectedCategory === 'Semua' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tool.functionDesc && tool.functionDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Pengukuran',
      specs: '',
      description: '',
      functionDesc: '',
      howToUseText: '',
      safetyTipsText: '',
      mediaUrl: '',
      mediaType: 'image'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ToolItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      specs: item.specs,
      description: item.description,
      functionDesc: item.functionDesc || '',
      howToUseText: (item.howToUse || []).join('\n'),
      safetyTipsText: (item.safetyTips || []).join('\n'),
      mediaUrl: item.mediaUrl || item.image || '',
      mediaType: item.mediaType || (item.mediaUrl?.includes('youtu') ? 'video' : 'image')
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus alat "${name}"? Data akan terhapus dari memori lokal dan spreadsheet.`)) {
      return;
    }
    SpreadsheetService.deleteToolItem(id);
    refreshData();
    showToast(`Alat "${name}" berhasil dihapus.`);
  };

  const handleResetToDefault = () => {
    if (!window.confirm('Kembalikan daftar alat ke pengaturan standar awal?')) return;
    SpreadsheetService.resetToolsList();
    refreshData();
    showToast('Data alat berhasil dikembalikan ke standar awal.');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama alat wajib diisi!');
      return;
    }

    const howToUse = formData.howToUseText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const safetyTips = formData.safetyTipsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingItem) {
      // Update
      const updated: ToolItem = {
        ...editingItem,
        name: formData.name.trim(),
        category: formData.category,
        specs: formData.specs.trim(),
        description: formData.description.trim(),
        functionDesc: formData.functionDesc.trim(),
        howToUse,
        safetyTips,
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      };
      SpreadsheetService.updateToolItem(updated);
      showToast(`Alat "${updated.name}" berhasil diperbarui.`);
    } else {
      // Create
      const created = SpreadsheetService.addToolItem({
        name: formData.name.trim(),
        category: formData.category,
        specs: formData.specs.trim(),
        description: formData.description.trim(),
        functionDesc: formData.functionDesc.trim(),
        howToUse,
        safetyTips,
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      });
      showToast(`Alat "${created.name}" berhasil ditambahkan.`);
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
            <Wrench className="w-6 h-6 text-amber-400" />
            Nama-Nama Alat yang Akan Digunakan (Tools)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Daftar instrumen ukur, keselamatan K3, dan peralatan utama meja servis ({toolsList.length} alat terdaftar)
          </p>
        </div>

        {/* Action Buttons for Fulltime Users */}
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Alat</span>
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
              title="Reset data alat ke awal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari alat, multimeter, solder, osiloskop, spesifikasi..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Tidak ada alat yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau kategori filter di atas.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Alat Baru</span>
            </button>
          )}
        </div>
      )}

      {/* Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1">
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900 text-amber-400 border border-slate-700/80 mb-1.5">
                    {tool.category}
                  </span>
                  
                  {/* Nama Alat + Media Badge Kecil Langsung Setelah Nama */}
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center flex-wrap gap-1">
                    <span>{tool.name}</span>
                    <InlineMediaBadge 
                      mediaUrl={tool.mediaUrl}
                      image={tool.image}
                      mediaType={tool.mediaType}
                      title={tool.name}
                    />
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tool)}
                        className="p-1.5 rounded-md hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                        title="Edit alat ini"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(tool.id, tool.name)}
                        className="p-1.5 rounded-md hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Hapus alat ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Specs Badge */}
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-3 text-xs">
                <span className="text-slate-400 font-medium">Spesifikasi Acuan: </span>
                <span className="text-slate-200 font-mono text-[11px]">{tool.specs}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {tool.description}
              </p>

              {/* Function on workbench */}
              {tool.functionDesc && (
                <div className="mb-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Fungsi di Meja Servis:
                  </span>
                  <p className="text-xs text-slate-300">{tool.functionDesc}</p>
                </div>
              )}

              {/* How to use */}
              {tool.howToUse && tool.howToUse.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    SOP / Cara Pemakaian:
                  </span>
                  <div className="space-y-1 text-xs text-slate-300">
                    {tool.howToUse.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Safety Tips */}
            {tool.safetyTips && tool.safetyTips.length > 0 && (
              <div className="mt-2 pt-3 border-t border-slate-700/60 flex items-start gap-2 text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded-xl border border-amber-900/30">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 block mb-0.5">Tips Keselamatan (K3):</span>
                  {tool.safetyTips.join(' • ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL (FULLTIME ONLY) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {editingItem ? 'Edit Peralatan Kerja' : 'Tambah Peralatan Kerja Baru'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tersinkron otomatis ke Master Spreadsheet &amp; web
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Alat: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Osiloskop Digital 100MHz"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pengukuran">Pengukuran</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Solder & Pasang">Solder &amp; Pasang</option>
                    <option value="Utama">Utama</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Spesifikasi Acuan / Rating:
                </label>
                <input
                  type="text"
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  placeholder="Contoh: Bandwidth 100MHz, 2 Channel, 1GSa/s"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Media Uploader (Upload langsung dari perangkat atau Link URL) */}
              <MediaFieldUploader
                mediaUrl={formData.mediaUrl}
                mediaType={formData.mediaType}
                onChange={(url, type) => setFormData({ ...formData, mediaUrl: url, mediaType: type })}
                label="Media Foto atau Video (Tampil Kecil Setelah Nama Alat):"
                accentColor="amber"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi Alat:
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan peran alat ini dalam perbaikan audio..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fungsi Penting di Meja Servis:
                </label>
                <input
                  type="text"
                  value={formData.functionDesc}
                  onChange={(e) => setFormData({ ...formData, functionDesc: e.target.value })}
                  placeholder="Contoh: Mengukur tegangan simetris rel dan DCO di output speaker"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SOP / Prosedur Pemakaian (Pisahkan baris dengan Enter):
                </label>
                <textarea
                  rows={2}
                  value={formData.howToUseText}
                  onChange={(e) => setFormData({ ...formData, howToUseText: e.target.value })}
                  placeholder="Set multimeter ke mode DC auto-range&#10;Hubungkan probe hitam ke Ground CT&#10;Sentuhkan probe merah ke titik uji"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tips Keselamatan Kerja (K3) (Pisahkan baris dengan Enter):
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyTipsText}
                  onChange={(e) => setFormData({ ...formData, safetyTipsText: e.target.value })}
                  placeholder="Selalu buang muatan elco sebelum menyolder&#10;Gunakan alas karet anti-statis"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Alat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
