import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Image as ImageIcon,
  Video,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Tv,
  Search,
  X,
  Pencil,
  Trash2,
  HardDrive,
  FileUp,
  Info,
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

type Condition = 'bagus' | 'rusak' | 'umum';

const norm = (s?: string): string => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Kondisi sebuah media dibaca dari kolom yang sudah ada di Sheet (tanpa kolom baru):
 * hanya "gejala bagus" terisi -> BAGUS, hanya "gejala rusak" terisi -> RUSAK,
 * selain itu (kosong, atau dua-duanya terisi seperti data lama) -> UMUM.
 */
const conditionOf = (g: ComponentMediaGuide): Condition => {
  const good = (g.goodSymptom || '').trim();
  const bad = (g.badSymptom || '').trim();
  if (good && !bad) return 'bagus';
  if (bad && !good) return 'rusak';
  return 'umum';
};

const COND_UI: Record<Condition, { label: string; badge: string; ring: string; text: string }> = {
  bagus: {
    label: 'Bagus',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70',
    ring: 'border-emerald-700/70 hover:border-emerald-500',
    text: 'text-emerald-300',
  },
  rusak: {
    label: 'Rusak',
    badge: 'bg-rose-950/60 text-rose-300 border-rose-800/70',
    ring: 'border-rose-700/70 hover:border-rose-500',
    text: 'text-rose-300',
  },
  umum: {
    label: 'Umum',
    badge: 'bg-slate-900 text-slate-300 border-slate-700',
    ring: 'border-slate-600 hover:border-slate-400',
    text: 'text-slate-300',
  },
};

interface FormState {
  component: string; // nama komponen dari katalog, atau '__lain'
  customComponent: string;
  condition: Condition;
  title: string;
  caption: string;
  hasil: string;
  url: string;
  type: 'image' | 'video';
}

const EMPTY_FORM: FormState = {
  component: '',
  customComponent: '',
  condition: 'bagus',
  title: '',
  caption: '',
  hasil: '',
  url: '',
  type: 'video',
};

// ---------------------------------------------------------------------------
// Kotak kecil (thumbnail) satu foto / video
// ---------------------------------------------------------------------------
const MediaThumb: React.FC<{ guide: ComponentMediaGuide; onOpen: () => void }> = ({ guide, onOpen }) => {
  const [broken, setBroken] = useState(false);
  const info = SpreadsheetService.formatMediaInfo(guide.mediaUrl, guide.mediaType);
  const cond = conditionOf(guide);
  const showImage = guide.mediaType === 'image' && !broken;

  return (
    <button
      type="button"
      onClick={onOpen}
      title={guide.title}
      className={`group w-28 shrink-0 text-left rounded-xl border bg-slate-900/80 overflow-hidden transition-colors cursor-pointer ${COND_UI[cond].ring}`}
    >
      <div className="relative h-20 bg-black/60 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={info.streamUrl}
            alt={guide.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : guide.mediaType === 'video' ? (
          <span className="w-9 h-9 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 ml-0.5" />
          </span>
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-500" />
        )}
        <span className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-slate-200">
          {guide.mediaType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
        </span>
      </div>
      <p className="px-2 py-1.5 text-[10px] font-semibold text-slate-200 truncate">{guide.title}</p>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Galeri foto / video di dalam kartu komponen, dikelompokkan Bagus / Rusak / Umum
// ---------------------------------------------------------------------------
const MediaGallery: React.FC<{
  items: ComponentMediaGuide[];
  onOpen: (g: ComponentMediaGuide) => void;
  canEdit: boolean;
}> = ({ items, onOpen, canEdit }) => {
  const groups: Condition[] = ['bagus', 'rusak', 'umum'];
  return (
    <div className="mt-4 pt-4 border-t border-slate-700/70">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
        <Video className="w-3.5 h-3.5" />
        Foto &amp; Video Uji ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">
          Belum ada foto/video untuk komponen ini.
          {canEdit && ' Klik "+ Tambah Media" di atas untuk menambahkan.'}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((cond) => {
            const list = items.filter((g) => conditionOf(g) === cond);
            if (list.length === 0) return null;
            return (
              <div key={cond}>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border mb-1.5 ${COND_UI[cond].badge}`}>
                  {cond === 'bagus' && <CheckCircle className="w-3 h-3" />}
                  {cond === 'rusak' && <XCircle className="w-3 h-3" />}
                  {COND_UI[cond].label} ({list.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {list.map((g) => (
                    <MediaThumb key={g.id} guide={g} onOpen={() => onOpen(g)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pemutar / penampil satu media (jendela besar)
// ---------------------------------------------------------------------------
const MediaViewer: React.FC<{
  guide: ComponentMediaGuide;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ guide, canEdit, onClose, onEdit, onDelete }) => {
  const info = SpreadsheetService.formatMediaInfo(guide.mediaUrl, guide.mediaType);
  const cond = conditionOf(guide);
  const hasil = cond === 'bagus' ? guide.normalValue : cond === 'rusak' ? guide.damagedValue : '';
  const gejala = cond === 'bagus' ? guide.goodSymptom : cond === 'rusak' ? guide.badSymptom : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-950 text-blue-400 border border-slate-700/80">
                {guide.componentName}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${COND_UI[cond].badge}`}>
                {cond === 'bagus' && <CheckCircle className="w-3 h-3" />}
                {cond === 'rusak' && <XCircle className="w-3 h-3" />}
                {COND_UI[cond].label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{guide.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700/80">
                <button
                  type="button"
                  onClick={onEdit}
                  title="Edit media"
                  aria-label="Edit media"
                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  title="Hapus media"
                  aria-label="Hapus media"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-black flex items-center justify-center">
          {info.kind === 'html5_video' && (
            <video
              key={info.streamUrl}
              controls
              playsInline
              preload="metadata"
              src={info.streamUrl}
              className="w-full max-h-[70vh] object-contain bg-black"
            >
              Format video tidak didukung peramban. Silakan klik "Buka file asli".
            </video>
          )}
          {(info.kind === 'drive_video' || info.kind === 'iframe') && (
            <div className="w-full aspect-video">
              <iframe
                src={info.streamUrl}
                title={guide.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          )}
          {info.kind === 'image' && (
            <img
              src={info.streamUrl}
              alt={guide.title}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <div className="p-4 space-y-3">
          {guide.caption && <p className="text-sm text-slate-300 leading-relaxed">{guide.caption}</p>}
          {(gejala || hasil) && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                cond === 'bagus'
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
              }`}
            >
              <span className={`font-bold block mb-0.5 ${COND_UI[cond].text}`}>
                {cond === 'bagus' ? 'Yang terlihat / hasil ukur (BAGUS):' : 'Yang terlihat / hasil ukur (RUSAK):'}
              </span>
              <p className="font-mono text-[11px]">{hasil || gejala}</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            {info.isGoogleDrive && (
              <span className="px-2 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Google Drive
              </span>
            )}
            {info.isDirectFile && (
              <span className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <FileUp className="w-3 h-3" /> File langsung
              </span>
            )}
            {guide.mediaUrl.startsWith('http') && (
              <a
                href={guide.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Buka file asli
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Halaman Tab 3
// ---------------------------------------------------------------------------
export const KomponenRusakBagusTab: React.FC<KomponenRusakBagusTabProps> = ({
  onOpenSpreadsheetManager,
  onNavigateToKatalog,
  currentUser,
}) => {
  const canEdit = currentUser ? SpreadsheetService.hasFulltimeAccess(currentUser) : false;

  const [mediaGuides, setMediaGuides] = useState<ComponentMediaGuide[]>(SpreadsheetService.getMediaGuides());
  const [komponenKatalog, setKomponenKatalog] = useState<KomponenItem[]>(SpreadsheetService.getKomponenKatalog());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'semua' | 'pasif' | 'aktif'>('semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [viewer, setViewer] = useState<ComponentMediaGuide | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SpreadsheetService.subscribeToDataChanges(() => {
      setMediaGuides(SpreadsheetService.getMediaGuides());
      setKomponenKatalog(SpreadsheetService.getKomponenKatalog());
    });
    return unsub;
  }, []);

  // Kalau media yang sedang dibuka terhapus / berubah dari sumber lain, ikuti.
  useEffect(() => {
    if (!viewer) return;
    const fresh = mediaGuides.find((g) => g.id === viewer.id);
    if (!fresh) setViewer(null);
    else if (fresh !== viewer) setViewer(fresh);
  }, [mediaGuides]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Media dikelompokkan per komponen (cocok berdasarkan nama komponen).
  const { mediaByComponent, unmatched } = useMemo(() => {
    const byName = new Map<string, ComponentMediaGuide[]>();
    komponenKatalog.forEach((k) => byName.set(norm(k.name), []));
    const rest: ComponentMediaGuide[] = [];
    mediaGuides.forEach((g) => {
      const bucket = byName.get(norm(g.componentName));
      if (bucket) bucket.push(g);
      else rest.push(g);
    });
    return { mediaByComponent: byName, unmatched: rest };
  }, [mediaGuides, komponenKatalog]);

  const q = searchQuery.trim().toLowerCase();
  const filteredKatalog = komponenKatalog.filter((k) => {
    if (categoryFilter !== 'semua' && k.category !== categoryFilter) return false;
    if (!q) return true;
    return k.name.toLowerCase().includes(q) || (k.subType || '').toLowerCase().includes(q);
  });
  const showUnmatched = unmatched.length > 0 && categoryFilter === 'semua' && !q;

  // ---- form ---------------------------------------------------------------
  const openAdd = () => {
    if (!canEdit) {
      alert('Akses Ditolak: Hanya akun Fulltime atau Editor yang boleh menambah media komponen.');
      return;
    }
    setEditingId(null);
    setForm({ ...EMPTY_FORM, component: komponenKatalog[0]?.name || '__lain' });
    setIsModalOpen(true);
  };

  const openEdit = (g: ComponentMediaGuide) => {
    const match = komponenKatalog.find((k) => norm(k.name) === norm(g.componentName));
    const cond = conditionOf(g);
    setEditingId(g.id);
    setForm({
      component: match ? match.name : '__lain',
      customComponent: match ? '' : g.componentName,
      condition: cond,
      title: g.title,
      caption: g.caption,
      hasil: cond === 'bagus' ? g.normalValue : cond === 'rusak' ? g.damagedValue : '',
      url: g.mediaUrl,
      type: g.mediaType,
    });
    setViewer(null);
    setIsModalOpen(true);
  };

  const handleDelete = (g: ComponentMediaGuide) => {
    if (!canEdit) return;
    if (!window.confirm(`Yakin ingin menghapus media "${g.title}"? Data akan terhapus dari spreadsheet.`)) return;
    SpreadsheetService.deleteMediaGuideItem(g.id);
    setViewer(null);
    showToast('Media dihapus.');
  };

  const saveForm = (addMore: boolean) => {
    if (!canEdit) return;
    const componentName = form.component === '__lain' ? form.customComponent.trim() : form.component;
    if (!componentName) {
      alert('Pilih komponen, atau ketik nama komponennya.');
      return;
    }
    if (!form.url.trim()) {
      alert('Pilih file foto/video, atau tempel link-nya.');
      return;
    }
    if (!form.title.trim()) {
      alert('Judul wajib diisi.');
      return;
    }

    const cap = form.caption.trim();
    const hasil = form.hasil.trim();
    const prev = editingId ? mediaGuides.find((g) => g.id === editingId) : undefined;
    const guide: ComponentMediaGuide = {
      id: editingId || `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: form.title.trim(),
      mediaType: form.type,
      mediaUrl: form.url.trim(),
      caption: cap,
      componentName,
      // Kondisi disimpan lewat kolom yang sudah ada: bagus -> gejala/nilai bagus,
      // rusak -> gejala/nilai rusak, umum -> semuanya kosong.
      goodSymptom: form.condition === 'bagus' ? hasil || cap || 'Kondisi bagus' : '',
      badSymptom: form.condition === 'rusak' ? hasil || cap || 'Kondisi rusak' : '',
      testMethod: prev?.testMethod ?? '',
      normalValue: form.condition === 'bagus' ? hasil : '',
      damagedValue: form.condition === 'rusak' ? hasil : '',
    };

    SpreadsheetService.addOrUpdateMediaGuide(guide);

    if (addMore && !editingId) {
      // Tetap di form, simpan pilihan komponen & kondisi, kosongkan sisanya.
      setForm({ ...form, title: '', caption: '', hasil: '', url: '', type: 'video' });
      showToast('Tersimpan. Silakan tambah media berikutnya.');
    } else {
      setIsModalOpen(false);
      setEditingId(null);
      showToast(editingId ? 'Media diperbarui.' : 'Media ditambahkan.');
    }
  };

  const inputCls =
    'w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-6 h-6 text-indigo-400" />
            Media Edukasi Visual: Cara Mengenali Komponen Rusak / Bagus
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Foto &amp; video uji komponen bagus vs rusak ({mediaGuides.length} media tersimpan, {komponenKatalog.length} komponen)
            {onNavigateToKatalog && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={onNavigateToKatalog}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  {canEdit ? 'Kelola Katalog Komponen' : 'Lihat Katalog Lengkap'}
                </button>
              </>
            )}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openAdd}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Media</span>
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
          </div>
        )}
      </div>

      {/* Search + filter kategori */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komponen (resistor, transistor, elco...)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/80 w-fit">
          {(['semua', 'pasif', 'aktif'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === c
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {c === 'semua' ? 'Semua' : c === 'pasif' ? 'Komponen Pasif' : 'Komponen Aktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredKatalog.length === 0 && !showUnmatched && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            {komponenKatalog.length === 0 ? 'Katalog komponen masih kosong' : 'Tidak ada komponen yang cocok'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {komponenKatalog.length === 0
              ? 'Tambahkan komponen di Katalog Komponen, lalu foto/video ujinya bisa dilampirkan di sini.'
              : 'Coba ubah kata kunci pencarian atau filter kategori di atas.'}
          </p>
        </div>
      )}

      {/* Kartu komponen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredKatalog.map((k) => {
          const items = mediaByComponent.get(norm(k.name)) || [];
          return (
            <div
              key={k.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900 text-blue-400 border border-slate-700/80 mb-1.5">
                    {k.subType || (k.category === 'pasif' ? 'Pasif' : 'Aktif')}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center flex-wrap gap-1">
                    <span>{k.name}</span>
                    <InlineMediaBadge image={k.image} title={k.name} />
                  </h3>
                </div>
                {k.symbol && <span className="text-xs font-mono text-slate-400 shrink-0">{k.symbol}</span>}
              </div>

              {k.howToTest && (
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Cara Pengukuran:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{k.howToTest}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                  <span className="text-emerald-300 font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ciri BAGUS
                  </span>
                  <p className="text-[11px] leading-relaxed">{k.goodCondition}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
                  <span className="text-rose-300 font-bold flex items-center gap-1 mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Ciri RUSAK
                  </span>
                  <p className="text-[11px] leading-relaxed">{k.badCondition}</p>
                </div>
              </div>

              {k.safetyNote && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{k.safetyNote}</span>
                </div>
              )}

              <MediaGallery items={items} onOpen={setViewer} canEdit={canEdit} />
            </div>
          );
        })}
      </div>

      {/* Media yang belum dikaitkan ke komponen di katalog */}
      {showUnmatched && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Media lainnya</h3>
          <p className="text-xs text-slate-400 mb-2">
            Nama komponennya tidak ada di Katalog Komponen, jadi tidak muncul di kartu mana pun.
          </p>
          <MediaGallery items={unmatched} onOpen={setViewer} canEdit={canEdit} />
        </div>
      )}

      {/* Penampil media */}
      {viewer && (
        <MediaViewer
          guide={viewer}
          canEdit={canEdit}
          onClose={() => setViewer(null)}
          onEdit={() => openEdit(viewer)}
          onDelete={() => handleDelete(viewer)}
        />
      )}

      {/* Form tambah / edit media */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {editingId ? 'Edit Media Komponen' : 'Tambah Foto / Video Komponen'}
                  </h4>
                  <p className="text-xs text-slate-400">Tersinkron otomatis ke Master Spreadsheet &amp; web</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveForm(false);
              }}
              className="space-y-3.5"
            >
              <MediaFieldUploader
                mediaUrl={form.url}
                mediaType={form.type}
                onChange={(url, type) => setForm((f) => ({ ...f, url, type }))}
                label="File Foto atau Video:"
                accentColor="blue"
              />

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/50 text-[11px] text-blue-200/90">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Video lebih dari 15 MB: unggah dulu ke Google Drive, klik <strong>Bagikan &rarr; Siapa saja yang memiliki link</strong>,
                  lalu tempel linknya di mode <strong>Tempel Link</strong>.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Komponen: <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.component}
                    onChange={(e) => setForm({ ...form, component: e.target.value })}
                    className={inputCls}
                  >
                    {komponenKatalog.map((k) => (
                      <option key={k.id} value={k.name}>
                        {k.name}
                      </option>
                    ))}
                    <option value="__lain">Lainnya (ketik sendiri)…</option>
                  </select>
                  {form.component === '__lain' && (
                    <input
                      type="text"
                      value={form.customComponent}
                      onChange={(e) => setForm({ ...form, customComponent: e.target.value })}
                      placeholder="Contoh: Transistor Final 2SC5200"
                      className={`${inputCls} mt-2`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kondisi komponen di media ini:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['bagus', 'rusak', 'umum'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, condition: c })}
                        className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          form.condition === c
                            ? c === 'bagus'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : c === 'rusak'
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-slate-600 border-slate-500 text-white'
                            : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {COND_UI[c].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Dioda B-E transistor 2SC5200 normal"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan singkat:</label>
                <input
                  type="text"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="Contoh: Probe merah di Base, probe hitam di Emitter"
                  className={inputCls}
                />
              </div>

              {form.condition !== 'umum' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hasil ukur / yang terlihat (opsional):
                  </label>
                  <input
                    type="text"
                    value={form.hasil}
                    onChange={(e) => setForm({ ...form, hasil: e.target.value })}
                    placeholder={
                      form.condition === 'bagus'
                        ? 'Contoh: 0,55 - 0,65 V pada skala dioda'
                        : 'Contoh: 0 V (short) atau OL (putus)'
                    }
                    className={inputCls}
                  />
                </div>
              )}

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                {!editingId && (
                  <button
                    type="button"
                    onClick={() => saveForm(true)}
                    disabled={!form.url.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Simpan &amp; Tambah Lagi
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!form.url.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
