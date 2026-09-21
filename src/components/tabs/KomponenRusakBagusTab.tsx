import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Image as ImageIcon, 
  Video, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
  Tv,
  Layers,
  ChevronRight,
  Upload,
  HardDrive,
  Maximize2,
  X,
  FileUp,
  Info,
  Sparkles,
  HelpCircle,
  Search
} from 'lucide-react';
import { ComponentMediaGuide, KomponenItem, User } from '../../types';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { InlineMediaBadge } from '../common/InlineMediaBadge';
import { MediaFieldUploader } from '../common/MediaFieldUploader';

interface KomponenRusakBagusTabProps {
  onOpenSpreadsheetManager?: () => void;
  onNavigateToKatalog?: () => void;
  currentUser?: User | null;
}

export const KomponenRusakBagusTab: React.FC<KomponenRusakBagusTabProps> = ({
  onOpenSpreadsheetManager,
  onNavigateToKatalog,
  currentUser
}) => {
  const isFulltime = currentUser ? SpreadsheetService.hasFulltimeAccess(currentUser) : false;
  const canEdit = isFulltime;
  const [mediaGuides, setMediaGuides] = useState<ComponentMediaGuide[]>(
    SpreadsheetService.getMediaGuides()
  );
  const [komponenKatalog, setKomponenKatalog] = useState<KomponenItem[]>(
    SpreadsheetService.getKomponenKatalog()
  );
  const [katalogSearch, setKatalogSearch] = useState('');

  useEffect(() => {
    const unsub = SpreadsheetService.subscribeToDataChanges(() => {
      setMediaGuides(SpreadsheetService.getMediaGuides());
      setKomponenKatalog(SpreadsheetService.getKomponenKatalog());
    });
    return unsub;
  }, []);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [filterType, setFilterType] = useState<'semua' | 'video' | 'image'>('semua');
  
  // Quick Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCompName, setUploadCompName] = useState<string>('');
  const [uploadType, setUploadType] = useState<'video' | 'image'>('video');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState<string>('');

  // Fullscreen Image preview
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const filteredGuides = mediaGuides.filter(item => 
    filterType === 'semua' ? true : item.mediaType === filterType
  );

  const currentMedia = filteredGuides[activeIndex] || filteredGuides[0] || mediaGuides[0];
  const currentMediaInfo = currentMedia 
    ? SpreadsheetService.formatMediaInfo(currentMedia.mediaUrl, currentMedia.mediaType)
    : null;

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Akses Ditolak: Hanya akun Fulltime yang memiliki hak untuk mengupload atau mengedit media komponen.');
      return;
    }
    if (!uploadTitle.trim() || !uploadUrl.trim()) {
      alert('Mohon lengkapi Judul dan File/Link media.');
      return;
    }

    const newGuide: ComponentMediaGuide = {
      id: `med-custom-${Date.now()}`,
      title: uploadTitle.trim(),
      mediaType: uploadType,
      mediaUrl: uploadUrl.trim(),
      componentName: uploadCompName.trim() || 'Komponen Elektronika',
      caption: uploadCaption.trim() || 'Diunggah langsung oleh teknisi',
      goodSymptom: 'Parameter terukur normal dan stabil',
      badSymptom: 'Komponen bocor, short, atau putus',
      testMethod: 'Uji dengan Multimeter Digital / Tester',
      normalValue: 'Normal',
      damagedValue: 'Rusak / Short'
    };

    SpreadsheetService.addOrUpdateMediaGuide(newGuide);
    const updated = SpreadsheetService.getMediaGuides();
    setMediaGuides(updated);
    setActiveIndex(0);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadCompName('');
    setUploadUrl('');
    setUploadCaption('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar - matches the style used on Tab 1 (Alat) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-6 h-6 text-indigo-400" />
            Media Edukasi Visual: Cara Mengenali Komponen Rusak / Bagus
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gambar &amp; Video Tutorial Langsung ({mediaGuides.length} media tersimpan)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
              title="Upload video atau gambar baru (Khusus akun Fulltime)"
            >
              <Upload className="w-4 h-4" />
              <span>+ Upload Media</span>
            </button>
          )}
          {isFulltime && onOpenSpreadsheetManager && (
            <button
              type="button"
              onClick={onOpenSpreadsheetManager}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Kelola URL Video & Gambar di Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Spreadsheet Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Video / Gambar - separate row, below the header (matches Tab 1's filter row) */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/80 w-fit">
        <button
          onClick={() => { setFilterType('semua'); setActiveIndex(0); }}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'semua' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => { setFilterType('video'); setActiveIndex(0); }}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
            filterType === 'video' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Video className="w-3 h-3" />
          Video
        </button>
        <button
          onClick={() => { setFilterType('image'); setActiveIndex(0); }}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
            filterType === 'image' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          Gambar
        </button>
      </div>

      {/* SECTION ATAS: GAMBAR / VIDEO DARI SPREADSHEET */}
      <div className="bg-slate-800/95 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">

        {/* Informational Guidance Banner on Non-YouTube Uploads */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-700/60 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Dukungan Media Penuh:</strong> Anda dapat menggunakan file video <strong>.MP4 / .MOV</strong> langsung dari komputer/HP, atau tautan video/foto dari <strong>Google Drive</strong>.
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline shrink-0 cursor-pointer"
            >
              Upload File Sekarang &rarr;
            </button>
          )}
        </div>

        {/* Media Player Showcase Stage */}
        {currentMedia && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-700/80">
            {/* Main Stage (8 cols) */}
            <div className="lg:col-span-8 bg-black flex flex-col items-center justify-center min-h-[320px] sm:min-h-[440px] relative overflow-hidden group">
              {/* Native HTML5 Video Player */}
              {currentMediaInfo?.kind === 'html5_video' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
                  <video
                    key={currentMediaInfo.streamUrl}
                    controls
                    playsInline
                    preload="metadata"
                    src={currentMediaInfo.streamUrl}
                    className="w-full h-full max-h-[460px] object-contain rounded-lg shadow-2xl bg-black"
                  >
                    Format video tidak didukung peramban. Silakan klik tombol 'Buka File Asli'.
                  </video>
                </div>
              )}

              {/* Google Drive Video Player (Stream Iframe) */}
              {currentMediaInfo?.kind === 'drive_video' && (
                <div className="w-full h-full aspect-video min-h-[340px] sm:min-h-[440px]">
                  <iframe
                    src={currentMediaInfo.streamUrl}
                    title={currentMedia.title}
                    className="w-full h-full min-h-[340px] sm:min-h-[440px] border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Generic Embed / Iframe */}
              {currentMediaInfo?.kind === 'iframe' && (
                <div className="w-full h-full aspect-video min-h-[340px] sm:min-h-[440px]">
                  <iframe
                    src={currentMediaInfo.streamUrl}
                    title={currentMedia.title}
                    className="w-full h-full min-h-[340px] sm:min-h-[440px] border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Image Viewer with Zoom */}
              {currentMediaInfo?.kind === 'image' && (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center relative">
                  <img
                    src={currentMediaInfo.streamUrl}
                    alt={currentMedia.title}
                    referrerPolicy="no-referrer"
                    onClick={() => setExpandedImage(currentMediaInfo.streamUrl)}
                    className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800 cursor-zoom-in hover:brightness-105 transition-all"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedImage(currentMediaInfo.streamUrl)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Perbesar Gambar
                    </button>
                    {currentMediaInfo.isGoogleDrive && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Google Drive Image
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Media source and action overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
                {currentMediaInfo?.isGoogleDrive && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-950/90 text-blue-300 text-[11px] font-semibold border border-blue-800 shadow-md flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    Google Drive
                  </span>
                )}
                {currentMediaInfo?.isDirectFile && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 text-[11px] font-semibold border border-emerald-800 shadow-md flex items-center gap-1">
                    <FileUp className="w-3 h-3" />
                    File Langsung
                  </span>
                )}
                {currentMedia.mediaUrl.startsWith('http') && (
                  <a
                    href={currentMedia.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 shadow-md"
                    title="Buka File di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Side Information Panel (4 cols) */}
            <div className="lg:col-span-4 p-5 bg-slate-900/90 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-700/80">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800 mb-2">
                  {currentMedia.mediaType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {currentMedia.componentName}
                </span>
                <h4 className="text-base font-bold text-white mb-2 leading-snug flex items-center flex-wrap gap-1">
                  <span>{currentMedia.title}</span>
                  <InlineMediaBadge 
                    mediaUrl={currentMedia.mediaUrl}
                    mediaType={currentMedia.mediaType}
                    title={currentMedia.title}
                  />
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {currentMedia.caption}
                </p>

                {/* Normal vs Damaged Metric */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                    <span className="font-bold text-emerald-300 flex items-center gap-1 mb-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Nilai Normal (Bagus):
                    </span>
                    <p className="text-[11px] font-mono text-emerald-200/90">{currentMedia.normalValue}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
                    <span className="font-bold text-rose-300 flex items-center gap-1 mb-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Nilai Rusak (Short / Bocor):
                    </span>
                    <p className="text-[11px] font-mono text-rose-200/90">{currentMedia.damagedValue}</p>
                  </div>
                </div>
              </div>

              {/* Method Footer */}
              <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
                <span className="font-semibold text-slate-400 block mb-0.5">Metode Pengukuran:</span>
                <span className="text-slate-200 text-[11px]">{currentMedia.testMethod}</span>
              </div>
            </div>
          </div>
        )}

        {/* Carousel / Playlist Selector from Spreadsheet */}
        <div className="p-4 bg-slate-900/60 overflow-x-auto">
          <div className="flex gap-3">
            {filteredGuides.map((guide, idx) => (
              <button
                key={guide.id}
                onClick={() => setActiveIndex(idx)}
                className={`p-2.5 rounded-xl border text-left shrink-0 w-64 sm:w-72 transition-all flex items-start gap-2.5 ${
                  activeIndex === idx
                    ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600 text-slate-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  guide.mediaType === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {guide.mediaType === 'video' ? <Play className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {guide.componentName}
                  </span>
                  <p className="text-xs font-semibold text-white truncate">
                    {guide.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {guide.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK UPLOAD MEDIA MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Upload Video / Gambar Panduan</h4>
                  <p className="text-xs text-slate-400">Bisa pilih file langsung dari HP/komputer atau link Google Drive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Helper on Google Drive */}
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-blue-300">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                Cara Menggunakan Video / Foto dari Google Drive:
              </div>
              <ol className="list-decimal list-inside text-[11px] text-blue-200/90 space-y-0.5">
                <li>Upload video MP4 atau foto Anda ke Google Drive.</li>
                <li>Klik kanan file di Drive &rarr; <strong>Bagikan</strong> &rarr; jadikan <strong>Siapa saja yang memiliki link</strong>.</li>
                <li>Salin linknya lalu tempelkan di kotak link di bawah ini!</li>
              </ol>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-3.5">
              {/* Media Uploader (Upload langsung dari perangkat atau Link URL) */}
              <MediaFieldUploader
                mediaUrl={uploadUrl}
                mediaType={uploadType}
                onChange={(url, type) => {
                  setUploadUrl(url);
                  setUploadType(type);
                }}
                label="File Media Foto atau Video:"
                accentColor="blue"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Komponen:</label>
                <input
                  type="text"
                  value={uploadCompName}
                  onChange={(e) => setUploadCompName(e.target.value)}
                  placeholder="Contoh: Transistor Final 2SC5200"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Panduan:</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Cara Mengukur Transistor Final Bagus vs Short"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan / Keterangan Singkat:</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Contoh: Uji probe multimeter di kaki Basis-Kolektor"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadUrl.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Simpan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {expandedImage && (
        <div 
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white text-sm flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Tutup
            </button>
            <img
              src={expandedImage}
              alt="Expanded preview"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* SECTION BAWAH: TABEL PANDUAN LENGKAP PENGECEKAN KOMPONEN RUSAK VS BAGUS */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="border-b border-slate-700/70 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              SOP Praktis & Standar Nilai Uji Komponen Elektronika
            </h3>
            <p className="text-xs text-slate-400">
              Gunakan multimeter mode Dioda atau Resistansi sesuai panduan berikut sebelum menyalakan amplifier. Daftar ini sama dengan Katalog Komponen Pasif &amp; Aktif di Menu Khusus.
            </p>
          </div>
          {onNavigateToKatalog && (
            <button
              type="button"
              onClick={onNavigateToKatalog}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline shrink-0 cursor-pointer"
            >
              {canEdit ? 'Kelola Katalog Komponen →' : 'Lihat Katalog Lengkap →'}
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={katalogSearch}
            onChange={(e) => setKatalogSearch(e.target.value)}
            placeholder="Cari komponen (resistor, transistor, elco...)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {komponenKatalog.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-sm bg-slate-900/50 rounded-xl border border-slate-700/60">
            Katalog komponen masih kosong.
          </div>
        )}

        <div className="space-y-4">
          {komponenKatalog
            .filter(k =>
              k.name.toLowerCase().includes(katalogSearch.toLowerCase()) ||
              k.subType.toLowerCase().includes(katalogSearch.toLowerCase())
            )
            .map((k, idx) => (
              <div key={k.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{k.name}</span>
                    <InlineMediaBadge image={k.image} title={k.name} />
                  </h4>
                  <span className="text-xs font-mono text-slate-400">{k.symbol}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700/60">
                    <span className="text-slate-400 font-semibold block mb-1">Cara Pengukuran:</span>
                    <p className="text-slate-300">{k.howToTest}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                    <span className="text-emerald-300 font-bold block mb-1">Ciri {k.name} BAGUS:</span>
                    <p className="text-[11px] leading-relaxed">{k.goodCondition}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-200">
                    <span className="text-rose-300 font-bold block mb-1">Ciri {k.name} RUSAK:</span>
                    <p className="text-[11px] leading-relaxed">{k.badCondition}</p>
                  </div>
                </div>
                {k.safetyNote && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{k.safetyNote}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
