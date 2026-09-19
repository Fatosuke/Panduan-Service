import React, { useState, useEffect } from 'react';
import { KomponenItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';
import {
  Zap,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

interface KomponenViewProps {
  initialSubCategory?: 'pasif' | 'aktif' | null;
  currentUser?: User | null;
  onBackToMain?: () => void;
}

const emptyForm = {
  name: '',
  category: 'pasif' as 'pasif' | 'aktif',
  subType: '',
  symbol: '',
  description: '',
  functionDesc: '',
  howToTest: '',
  goodCondition: '',
  badCondition: '',
  safetyNote: '',
  pinoutOrColorCode: '',
  image: ''
};

export const KomponenView: React.FC<KomponenViewProps> = ({
  initialSubCategory = null,
  currentUser,
  onBackToMain
}) => {
  const [komponenList, setKomponenList] = useState<KomponenItem[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<'pasif' | 'aktif' | null>(initialSubCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KomponenItem | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const canEdit = currentUser ? SpreadsheetService.hasFulltimeAccess(currentUser) : false;

  useEffect(() => {
    refreshData();
    const unsub = SpreadsheetService.subscribeToDataChanges(refreshData);
    return unsub;
  }, []);

  const refreshData = () => {
    setKomponenList(SpreadsheetService.getKomponenKatalog());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredKomponen = komponenList.filter(item => {
    const matchesCategory = selectedSubCategory ? item.category === selectedSubCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ ...emptyForm, category: selectedSubCategory || 'pasif' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: KomponenItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      subType: item.subType,
      symbol: item.symbol,
      description: item.description,
      functionDesc: item.functionDesc,
      howToTest: item.howToTest,
      goodCondition: item.goodCondition,
      badCondition: item.badCondition,
      safetyNote: item.safetyNote || '',
      pinoutOrColorCode: item.pinoutOrColorCode || '',
      image: item.image || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus komponen "${name}"? Data akan terhapus dari spreadsheet.`)) {
      return;
    }
    SpreadsheetService.deleteKomponenKatalogItem(id);
    refreshData();
    showToast(`Komponen "${name}" berhasil dihapus.`);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama komponen wajib diisi!');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      subType: formData.subType.trim(),
      symbol: formData.symbol.trim(),
      description: formData.description.trim(),
      functionDesc: formData.functionDesc.trim(),
      howToTest: formData.howToTest.trim(),
      goodCondition: formData.goodCondition.trim(),
      badCondition: formData.badCondition.trim(),
      safetyNote: formData.safetyNote.trim() || undefined,
      pinoutOrColorCode: formData.pinoutOrColorCode.trim() || undefined,
      image: formData.image.trim() || undefined
    };

    if (editingItem) {
      SpreadsheetService.updateKomponenKatalogItem({ ...editingItem, ...payload });
      showToast(`Komponen "${payload.name}" berhasil diperbarui.`);
    } else {
      const created = SpreadsheetService.addKomponenKatalogItem(payload);
      showToast(`Komponen "${created.name}" berhasil ditambahkan.`);
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
              <Cpu className="w-6 h-6 text-blue-400" />
              Katalog & Penjelasan Komponen Elektronika Audio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Pilih kategori komponen Pasif atau Aktif untuk mempelajari karakteristik, fungsi, dan cara uji kerusakan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && selectedSubCategory && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Komponen</span>
            </button>
          )}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              id="sub-pasif-btn"
              onClick={() => { setSelectedSubCategory('pasif'); }}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                selectedSubCategory === 'pasif'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              1. Komponen Pasif
            </button>
            <button
              id="sub-aktif-btn"
              onClick={() => { setSelectedSubCategory('aktif'); }}
              className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                selectedSubCategory === 'aktif'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              2. Komponen Aktif
            </button>
          </div>
        </div>
      </div>

      {!selectedSubCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div
            onClick={() => setSelectedSubCategory('pasif')}
            className="cursor-pointer bg-slate-800/90 border border-slate-700 hover:border-amber-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
              1. Komponen Pasif
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Komponen yang tidak memerlukan sumber tegangan/arus eksternal untuk berfungsi. Contoh utama dalam amplifier audio: Resistor daya emitor, Kapasitor filter elco, Mylar audio snubber, Induktor output, Trimpot bias, dan Sekring proteksi.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              Buka Panduan Pasif &rarr;
            </span>
          </div>

          <div
            onClick={() => setSelectedSubCategory('aktif')}
            className="cursor-pointer bg-slate-800/90 border border-slate-700 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              2. Komponen Aktif
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Komponen semikonduktor yang mampu mengendalikan aliran elektron, menghasilkan penguatan sinyal (gain), atau melakukan pensaklaran berkecepatan tinggi. Contoh: Transistor BJT Final Toshiba/Sanken, Mosfet Kelas D, IC Op-Amp NE5532, Dioda Bridge, dan Relay speaker.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              Buka Panduan Aktif &rarr;
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari nama komponen ${selectedSubCategory}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {filteredKomponen.length === 0 && (
            <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">Belum ada komponen di kategori ini</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian, atau tambahkan komponen baru.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredKomponen.map((komponen) => (
              <div
                key={komponen.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5 ${
                        komponen.category === 'pasif'
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                          : 'bg-blue-950/70 text-blue-400 border border-blue-800/60'
                      }`}>
                        {komponen.subType}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center flex-wrap gap-1">
                        <span>{komponen.name}</span>
                        <InlineMediaBadge image={komponen.image} title={komponen.name} />
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canEdit && (
                        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(komponen)}
                            className="p-1.5 rounded-md hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="Edit komponen ini"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(komponen.id, komponen.name)}
                            className="p-1.5 rounded-md hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Hapus komponen ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700/80 shrink-0">
                        {komponen.symbol}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {komponen.description}
                  </p>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <span className="font-semibold text-slate-300 block mb-0.5">Fungsi dalam Rangkaian:</span>
                      <span className="text-slate-400">{komponen.functionDesc}</span>
                    </div>

                    {komponen.pinoutOrColorCode && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                        <span className="font-semibold text-slate-300 block mb-0.5">Konfigurasi Kaki / Kode:</span>
                        <span className="text-slate-400 font-mono text-[11px]">{komponen.pinoutOrColorCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Kondisi Bagus (Normal)
                      </div>
                      <p className="text-[11px] text-emerald-200/90 leading-snug">{komponen.goodCondition}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300 mb-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Kondisi Rusak / Cacat
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-snug">{komponen.badCondition}</p>
                    </div>
                  </div>

                  {komponen.safetyNote && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{komponen.safetyNote}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    Metode Uji:
                  </span>
                  <span className="text-slate-300 font-medium text-right max-w-[75%] truncate">
                    {komponen.howToTest}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {editingItem ? 'Edit Komponen' : 'Tambah Komponen Baru'}
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
                    Nama Komponen: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Resistor Metal Film 1%"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="pasif">Pasif</option>
                    <option value="aktif">Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sub Tipe / Golongan:</label>
                  <input
                    type="text"
                    value={formData.subType}
                    onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                    placeholder="Contoh: Resistor Sinyal & Pembagi Tegangan"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Simbol / Rating Singkat:</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="Contoh: R (1kΩ, 10kΩ / 0.5W)"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <MediaFieldUploader
                mediaUrl={formData.image}
                mediaType="image"
                onChange={(url) => setFormData({ ...formData, image: url })}
                label="Foto Komponen (Tampil Kecil Setelah Nama):"
                accentColor="blue"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fungsi dalam Rangkaian:</label>
                <input
                  type="text"
                  value={formData.functionDesc}
                  onChange={(e) => setFormData({ ...formData, functionDesc: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Konfigurasi Kaki / Kode Warna (opsional):</label>
                <input
                  type="text"
                  value={formData.pinoutOrColorCode}
                  onChange={(e) => setFormData({ ...formData, pinoutOrColorCode: e.target.value })}
                  placeholder="Contoh: 5 Gelang Warna: Coklat(1), Hitam(0)..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Kondisi Bagus (Normal):</label>
                  <textarea
                    rows={2}
                    value={formData.goodCondition}
                    onChange={(e) => setFormData({ ...formData, goodCondition: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-emerald-900/60 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">Kondisi Rusak / Cacat:</label>
                  <textarea
                    rows={2}
                    value={formData.badCondition}
                    onChange={(e) => setFormData({ ...formData, badCondition: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-rose-900/60 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Metode Uji:</label>
                <input
                  type="text"
                  value={formData.howToTest}
                  onChange={(e) => setFormData({ ...formData, howToTest: e.target.value })}
                  placeholder="Contoh: Ukur dengan ohmmeter, bandingkan dengan kode gelang warna"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">Catatan Keamanan (opsional):</label>
                <input
                  type="text"
                  value={formData.safetyNote}
                  onChange={(e) => setFormData({ ...formData, safetyNote: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-amber-900/60 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Komponen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
