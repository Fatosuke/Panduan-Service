import React, { useState } from 'react';
import { INITIAL_KOMPONEN } from '../../data/initialData';
import { KomponenItem } from '../../types';
import { 
  Zap, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Search,
  BookOpen
} from 'lucide-react';

interface KomponenViewProps {
  initialSubCategory?: 'pasif' | 'aktif' | null;
  onBackToMain?: () => void;
}

export const KomponenView: React.FC<KomponenViewProps> = ({ 
  initialSubCategory = null,
  onBackToMain
}) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState<'pasif' | 'aktif' | null>(initialSubCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<KomponenItem | null>(null);

  const filteredKomponen = INITIAL_KOMPONEN.filter(item => {
    const matchesCategory = selectedSubCategory ? item.category === selectedSubCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
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

        {/* Pasif / Aktif Toggle Buttons */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 shrink-0">
          <button
            id="sub-pasif-btn"
            onClick={() => { setSelectedSubCategory('pasif'); setSelectedDetail(null); }}
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
            onClick={() => { setSelectedSubCategory('aktif'); setSelectedDetail(null); }}
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

      {/* If neither chosen, prompt selection */}
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
        /* Detailed list of components */
        <div className="space-y-6">
          {/* Search bar inside category */}
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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredKomponen.map((komponen) => (
              <div
                key={komponen.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5 ${
                        komponen.category === 'pasif' 
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                          : 'bg-blue-950/70 text-blue-400 border border-blue-800/60'
                      }`}>
                        {komponen.subType}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {komponen.name}
                      </h4>
                    </div>
                    <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700/80 shrink-0">
                      {komponen.symbol}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {komponen.description}
                  </p>

                  {/* Function and Pinout */}
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

                  {/* Test condition split */}
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

                  {/* Safety note if any */}
                  {komponen.safetyNote && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{komponen.safetyNote}</span>
                    </div>
                  )}
                </div>

                {/* How to test action button */}
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
    </div>
  );
};
