import React, { useState, useEffect } from 'react';
import { AmpliItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';
import { 
  Radio, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  Info,
  Layers,
  Zap,
  Cpu,
  FileSpreadsheet
} from 'lucide-react';

interface AmpliTabProps {
  currentUser?: User | null;
  onOpenSpreadsheetManager?: () => void;
}

export const AmpliTab: React.FC<AmpliTabProps> = ({ currentUser, onOpenSpreadsheetManager }) => {
  const [ampliList, setAmpliList] = useState<AmpliItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AmpliItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    classType: 'Kelas AB' as AmpliItem['classType'],
    powerRange: '',
    voltageSupply: '',
    description: '',
    typicalTransistors: '',
    characteristicsText: '',
    commonFailuresText: '',
    schematicTips: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video'
  });

  const canEdit = currentUser ? SpreadsheetService.hasFulltimeAccess(currentUser) : false;

  // Load from service on mount
  useEffect(() => {
    refreshData();
    const unsub = SpreadsheetService.subscribeToDataChanges(refreshData);
    return unsub;
  }, []);

  const refreshData = () => {
    setAmpliList(SpreadsheetService.getAmpliList());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const classes = ['Semua', 'Kelas AB', 'Kelas D', 'Kelas H', 'Built-up / Komersial', 'Kelas OCL / BTL'];

  const filteredAmpli = ampliList.filter(amp => {
    const matchClass = selectedClass === 'Semua' || amp.classType === selectedClass;
    const matchSearch = amp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        amp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        amp.powerRange.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (amp.typicalTransistors && amp.typicalTransistors.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchClass && matchSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      classType: 'Kelas AB',
      powerRange: '150W - 800W RMS per kanal',
      voltageSupply: '+/- 32V s.d +/- 65V DC Simetris (CT)',
      description: '',
      typicalTransistors: 'Final: 2SC5200/2SA1943 atau Sanken 2SC3858/2SA1494',
      characteristicsText: 'Topologi stabil dan mudah dirakit\nRespon suara vokal jernih dan bass padat',
      commonFailuresText: 'Transistor final jebol akibat beban panas berlebih\nResistor kapur hangus jika impedansi di bawah batas aman',
      schematicTips: 'Gunakan bohlam seri sebagai pengaman saat uji pertama kali.',
      mediaUrl: '',
      mediaType: 'image'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AmpliItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      classType: item.classType,
      powerRange: item.powerRange,
      voltageSupply: item.voltageSupply,
      description: item.description,
      typicalTransistors: item.typicalTransistors || '',
      characteristicsText: item.characteristics.join('\n'),
      commonFailuresText: item.commonFailures.join('\n'),
      schematicTips: item.schematicTips,
      mediaUrl: item.mediaUrl || item.image || '',
      mediaType: item.mediaType || (item.mediaUrl?.includes('youtu') ? 'video' : 'image')
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!canEdit) {
      alert('Hanya pembina/master engineer yang memiliki izin menghapus data.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus data tipe ampli "${name}"?`)) {
      SpreadsheetService.deleteAmpliItem(id);
      refreshData();
      showToast(`Data "${name}" berhasil dihapus.`);
    }
  };

  const handleResetToDefault = () => {
    if (!canEdit) {
      alert('Hanya pembina/master engineer yang memiliki izin mereset data.');
      return;
    }
    if (window.confirm('Apakah Anda ingin mengembalikan daftar tipe ampli ke data standar bawaan? Perubahan manual akan di-reset.')) {
      SpreadsheetService.resetAmpliList();
      refreshData();
      showToast('Daftar tipe ampli berhasil di-reset ke data bawaan.');
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama tipe ampli wajib diisi!');
      return;
    }

    const characteristics = formData.characteristicsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const commonFailures = formData.commonFailuresText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingItem) {
      // Update
      const updated: AmpliItem = {
        ...editingItem,
        name: formData.name.trim(),
        classType: formData.classType,
        powerRange: formData.powerRange.trim() || '150W - 600W RMS',
        voltageSupply: formData.voltageSupply.trim() || '+/- 45V DC',
        description: formData.description.trim(),
        typicalTransistors: formData.typicalTransistors.trim(),
        characteristics: characteristics.length > 0 ? characteristics : ['Topologi terstandar audio'],
        commonFailures: commonFailures.length > 0 ? commonFailures : ['Transistor aus karena panas berlebih'],
        schematicTips: formData.schematicTips.trim() || 'Pastikan pendingin heatsink memadai.',
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      };
      SpreadsheetService.updateAmpliItem(updated);
      showToast(`Data tipe ampli "${updated.name}" berhasil diperbarui!`);
    } else {
      // Add
      const created = SpreadsheetService.addAmpliItem({
        name: formData.name.trim(),
        classType: formData.classType,
        powerRange: formData.powerRange.trim() || '150W - 600W RMS',
        voltageSupply: formData.voltageSupply.trim() || '+/- 45V DC',
        description: formData.description.trim() || 'Power amplifier audio untuk kebutuhan lapangan & studio.',
        typicalTransistors: formData.typicalTransistors.trim(),
        characteristics: characteristics.length > 0 ? characteristics : ['Topologi terstandar audio'],
        commonFailures: commonFailures.length > 0 ? commonFailures : ['Transistor aus karena panas berlebih'],
        schematicTips: formData.schematicTips.trim() || 'Pastikan pendingin heatsink memadai.',
        mediaUrl: formData.mediaUrl.trim() || undefined,
        mediaType: formData.mediaType
      });
      showToast(`Tipe ampli baru "${created.name}" berhasil ditambahkan!`);
    }

    refreshData();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guide Banner for Data Location (Fulltime only) */}
      {canEdit && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <strong className="text-white font-bold block mb-0.5">
                Akses Master Engineer (Fulltime):
              </strong>
              <p className="text-slate-300 text-xs leading-relaxed">
                Anda dapat menambah, mengedit, atau menghapus data ampli langsung dari web ini atau melalui Google Spreadsheet yang telah tersinkron.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tipe Ampli</span>
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
              title="Reset data ke standar awal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-400" />
            Nama-Nama dan Tipe Power Amplifier Audio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Mempelajari topologi penguat Kelas AB, D, H, serta unit built-up komersial lapangan dan titik rawan kerusakannya ({ampliList.length} tipe terdaftar)
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/80">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Class Comparison Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Kelas AB (Linear)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Kualitas suara sangat jernih, distorsi harmonik rendah, namun efisiensi sekitar 50-65% sehingga membutuhkan pendingin heatsink besar.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Kelas D (Switching PWM)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Efisiensi tinggi di atas 90%, minim panas, bobot ringan, sangat cocok untuk subwoofer bertenaga ribuan watt RMS.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Kelas H (Multi-Rail Stepper)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Arsitektur Kelas AB dengan voltase bertingkat (Low &amp; High Rail) via saklar mosfet. Menjadi standar power balap konser lapangan.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tipe ampli: SOCL, Kelas D, Kelas H, Yamaha P7000S, Behringer, transistor..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Empty state */}
      {filteredAmpli.length === 0 && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Tidak ada tipe ampli yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau klik tombol Tambah Tipe Ampli di atas.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tipe Ampli Baru</span>
          </button>
        </div>
      )}

      {/* Ampli Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAmpli.map((amp) => (
          <div
            key={amp.id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                      amp.classType === 'Kelas AB' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      amp.classType === 'Kelas D' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      amp.classType === 'Kelas H' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {amp.classType}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center flex-wrap gap-1">
                    <span>{amp.name}</span>
                    <InlineMediaBadge 
                      mediaUrl={amp.mediaUrl}
                      image={amp.image}
                      mediaType={amp.mediaType}
                      title={amp.name}
                    />
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <span className="text-[11px] text-slate-400 block">Daya RMS:</span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {amp.powerRange}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete (Fulltime only) */}
                  {canEdit && (
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(amp)}
                        className="p-1.5 rounded-md hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        title="Edit spesifikasi tipe ampli ini"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(amp.id, amp.name)}
                        className="p-1.5 rounded-md hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Hapus tipe ampli ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Voltage and Transistors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                  <span className="text-slate-400 block font-medium mb-0.5">Tegangan Catu Daya (PSU):</span>
                  <span className="text-slate-200 font-mono text-[11px]">{amp.voltageSupply}</span>
                </div>
                {amp.typicalTransistors && (
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-slate-400 block font-medium mb-0.5">Semikonduktor Utama:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{amp.typicalTransistors}</span>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {amp.description}
              </p>

              {/* Characteristics */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  Karakteristik &amp; Fitur Sirkuit:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {amp.characteristics.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common failures */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs mb-4">
                <h4 className="font-bold text-rose-300 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Titik Rawan Kerusakan Paling Sering:
                </h4>
                <ul className="space-y-1 text-rose-200/90 text-[11px]">
                  {amp.commonFailures.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Schematic Tip Footer */}
            <div className="pt-3 border-t border-slate-700/60 text-xs flex items-center justify-between">
              <span className="text-slate-400">Tips Teknisi:</span>
              <span className="text-amber-300 font-medium text-right max-w-[80%] truncate">
                {amp.schematicTips}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* MODAL: TAMBAH / EDIT DATA TIPE AMPLI */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Data Tipe Ampli' : 'Tambah Tipe Power Ampli Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingItem ? `Mengubah data untuk: ${editingItem.name}` : 'Masukkan spesifikasi topologi amplifier audio baru'}
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

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama &amp; Tipe Ampli *:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Driver Safari 400 Watt / Apex B500"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Topologi / Kelas Ampli *:
                  </label>
                  <select
                    value={formData.classType}
                    onChange={(e) => setFormData({ ...formData, classType: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Kelas AB">Kelas AB</option>
                    <option value="Kelas D">Kelas D</option>
                    <option value="Kelas H">Kelas H</option>
                    <option value="Built-up / Komersial">Built-up / Komersial</option>
                    <option value="Kelas OCL / BTL">Kelas OCL / BTL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rentang Daya (RMS):
                  </label>
                  <input
                    type="text"
                    value={formData.powerRange}
                    onChange={(e) => setFormData({ ...formData, powerRange: e.target.value })}
                    placeholder="Contoh: 300W - 1200W RMS @ 4 Ohm"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tegangan Catu Daya (PSU):
                  </label>
                  <input
                    type="text"
                    value={formData.voltageSupply}
                    onChange={(e) => setFormData({ ...formData, voltageSupply: e.target.value })}
                    placeholder="Contoh: +/- 45V s.d +/- 75V DC CT"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Semikonduktor / Komponen Utama:
                </label>
                <input
                  type="text"
                  value={formData.typicalTransistors}
                  onChange={(e) => setFormData({ ...formData, typicalTransistors: e.target.value })}
                  placeholder="Contoh: Final: 2SC5200/2SA1943. Driver: TIP41/42C atau Mosfet IRFB4227"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Media Uploader (Upload langsung dari perangkat atau Link URL) */}
              <MediaFieldUploader
                mediaUrl={formData.mediaUrl}
                mediaType={formData.mediaType}
                onChange={(url, type) => setFormData({ ...formData, mediaUrl: url, mediaType: type })}
                label="Media Foto / Video (Tampil kecil setelah nama tipe):"
                accentColor="indigo"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deskripsi Topologi &amp; Karakter:
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat fungsi, kualitas suara, penggunaan lapangan..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Karakteristik &amp; Fitur Sirkuit (1 baris = 1 poin):
                </label>
                <textarea
                  rows={3}
                  value={formData.characteristicsText}
                  onChange={(e) => setFormData({ ...formData, characteristicsText: e.target.value })}
                  placeholder="Satu poin per baris..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-300 mb-1.5">
                  Titik Rawan Kerusakan Paling Sering (1 baris = 1 poin):
                </label>
                <textarea
                  rows={3}
                  value={formData.commonFailuresText}
                  onChange={(e) => setFormData({ ...formData, commonFailuresText: e.target.value })}
                  placeholder="Satu poin per baris..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                  Tips Teknisi &amp; Skematik:
                </label>
                <input
                  type="text"
                  value={formData.schematicTips}
                  onChange={(e) => setFormData({ ...formData, schematicTips: e.target.value })}
                  placeholder="Contoh: Pastikan trimpot bias disetel pada batas 0.35V - 0.45V BE sebelum dipasang beban"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Tipe Ampli'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

