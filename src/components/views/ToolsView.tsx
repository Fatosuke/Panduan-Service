import React, { useState } from 'react';
import { INITIAL_TOOLS } from '../../data/initialData';
import { ToolItem } from '../../types';
import { 
  Wrench, 
  ShieldAlert, 
  Check, 
  Search, 
  Info,
  ArrowLeft,
  Gauge
} from 'lucide-react';

interface ToolsViewProps {
  onBackToMain?: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ onBackToMain }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Semua', 'Pengukuran', 'Keamanan', 'Solder & Pasang', 'Utama'];

  const filteredTools = INITIAL_TOOLS.filter(tool => {
    const matchesCategory = selectedCategory === 'Semua' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
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
              <Wrench className="w-6 h-6 text-amber-400" />
              Peralatan Kerja & Instrumen Servis Audio (Tools)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Spesifikasi alat, fungsi penting di meja servis, SOP pemakaian, dan keselamatan kerja (K3)
            </p>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
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

      {/* Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900 text-amber-400 border border-slate-700/80 mb-1.5">
                    {tool.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {tool.name}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Gauge className="w-5 h-5" />
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

              {/* Function */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 mb-4">
                <div className="flex items-center gap-1.5 font-bold text-blue-300 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  Peran & Fungsi Utama Meja Kerja:
                </div>
                <p className="text-[11px] sm:text-xs text-blue-200/90 leading-relaxed">
                  {tool.functionDesc}
                </p>
              </div>

              {/* How to use */}
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

              {/* Safety tips */}
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
    </div>
  );
};
