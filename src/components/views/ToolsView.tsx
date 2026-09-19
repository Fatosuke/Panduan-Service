import React, { useState, useEffect } from 'react';
import { ToolItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';
import {
  Wrench,
  ShieldAlert,
  Check,
  Search,
  Info,
  ArrowLeft,
  Gauge,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

interface ToolsViewProps {
  currentUser?: User | null;
  onBackToMain?: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ currentUser, onBackToMain }) => {
  const [toolsList, setToolsList] = useState<ToolItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ToolItem | null>(null);
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

  const categories = ['Semua', 'Pengukuran', 'Keamanan', 'Solder & Pasang', 'Utama'];

  const filteredTools = toolsList.filter(tool => {
    const matchesCategory = selectedCategory === 'Semua' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (!window.confirm(`Yakin ingin menghapus alat "${name}"? Data akan terhapus dari spreadsheet.`)) {
      return;
    }
    SpreadsheetService.deleteToolItem(id);
    refreshData();
    showToast(`Alat "${name}" berhasil dihapus.`);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama alat wajib diisi!');
      return;
    }

    const howToUse = formData.howToUseText.split('\n').map(s => s.trim()).filter(Boolean);
    const safetyTips = formData.safetyTipsText.split('\n').map(s => s.trim()).filter(Boolean);

    if (editingItem) {
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              <Wrench className="w-6 h-6 text-amber-400" />
              Peralatan Kerja & Instrumen Servis Audio (Tools)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Spesifikasi alat, fungsi penting di meja servis, SOP pemakaian, dan keselamatan kerja (K3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Alat</span>
            </button>
          )}
          <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/80">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari alat, multitester, osiloskop, solder, dummy load..."
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
        </div>
      )}

      {/* Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1">
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900 text-amber-400 border border-slate-700/80 mb-1.5">
                    {tool.category}
                  </span>
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

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-3 text-xs">
                <span className="text-slate-400 font-medium">Spesifikasi Acuan: </span>
                <span className="text-slate-200 font-mono text-[11px]">{tool.specs}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {tool.description}
              </p>

              {tool.functionDesc && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 mb-4">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    Peran & Fungsi Utama Meja Kerja:
                  </div>
                  <p className="text-[11px] sm:text-xs text-blue-200/90 leading-relaxed">
                    {tool.functionDesc}
                  </p>
                </div>
              )}

              {tool.howToUse && tool.howToUse.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Petunjuk Penggunaan SOP:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {tool.howToUse.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 leading-tight">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tool.safetyTips && tool.safetyTips.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Peringatan Keamanan Kerja (Wajib Diingat):
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-rose-300/90">
                    {tool.safetyTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
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
                  <p className="text-xs text-slate-400">Tersinkron otomatis ke Master Spreadsheet & web</p>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Spesifikasi Acuan / Rating:</label>
                <input
                  type="text"
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  placeholder="Contoh: Bandwidth 100MHz, 2 Channel, 1GSa/s"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <MediaFieldUploader
                mediaUrl={formData.mediaUrl}
                mediaType={formData.mediaType}
                onChange={(url, type) => setFormData({ ...formData, mediaUrl: url, mediaType: type })}
                label="Media Foto atau Video (Tampil Kecil Setelah Nama Alat):"
                accentColor="amber"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Alat:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan peran alat ini dalam perbaikan audio..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fungsi Penting di Meja Servis:</label>
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
