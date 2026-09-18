import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Camera, 
  FolderOpen, 
  Link as LinkIcon, 
  X, 
  CheckCircle2, 
  Image as ImageIcon, 
  Video, 
  AlertCircle,
  Film,
  Sparkles
} from 'lucide-react';

interface MediaFieldUploaderProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onChange: (url: string, type: 'image' | 'video') => void;
  label?: string;
  accentColor?: 'amber' | 'indigo' | 'cyan' | 'emerald' | 'blue';
}

/**
 * Kompres gambar menggunakan HTML5 Canvas
 * Mengubah resolusi maksimal ke 800px dan kualitas 0.72 JPEG
 * Menghasilkan file sangat jernih tapi ringan (~20KB - 40KB Base64),
 * aman untuk memori browser, localStorage, dan cell Google Spreadsheet (maks 50rb karakter).
 */
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Gambar ke canvas dengan smoothing berkualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export ke JPEG terkompresi
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

export const MediaFieldUploader: React.FC<MediaFieldUploaderProps> = ({
  mediaUrl,
  mediaType,
  onChange,
  label = 'Media Foto / Video (Tampil Kecil Setelah Nama)',
  accentColor = 'indigo'
}) => {
  // Mode input: 'local' (upload langsung dari perangkat) atau 'url' (tempel link)
  const isExistingDataUrl = mediaUrl.startsWith('data:');
  const [activeMode, setActiveMode] = useState<'local' | 'url'>(
    !mediaUrl || isExistingDataUrl ? 'local' : 'url'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filePickerRef = useRef<HTMLInputElement>(null);
  const cameraPickerRef = useRef<HTMLInputElement>(null);

  const colorStyles = {
    amber: {
      borderFocus: 'focus:border-amber-500',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeTab: 'bg-amber-600 text-white',
      btnPrimary: 'bg-amber-600 hover:bg-amber-500 text-white',
      ringColor: 'ring-amber-500/20'
    },
    indigo: {
      borderFocus: 'focus:border-indigo-500',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeTab: 'bg-indigo-600 text-white',
      btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      ringColor: 'ring-indigo-500/20'
    },
    cyan: {
      borderFocus: 'focus:border-cyan-500',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      activeTab: 'bg-cyan-600 text-white',
      btnPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      ringColor: 'ring-cyan-500/20'
    },
    emerald: {
      borderFocus: 'focus:border-emerald-500',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeTab: 'bg-emerald-600 text-white',
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      ringColor: 'ring-emerald-500/20'
    },
    blue: {
      borderFocus: 'focus:border-blue-500',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      activeTab: 'bg-blue-600 text-white',
      btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white',
      ringColor: 'ring-blue-500/20'
    }
  }[accentColor];

  // Handle file reading from upload
  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      if (file.type.startsWith('image/')) {
        // Otomatis kompresi gambar
        const compressed = await compressImage(file);
        onChange(compressed, 'image');
      } else if (file.type.startsWith('video/')) {
        // Pengecekan ukuran video
        if (file.size > 15 * 1024 * 1024) {
          setErrorMessage('Ukuran video melebihi 15MB. Disarankan merekam video singkat (10-30 detik) agar hemat memori.');
          setIsProcessing(false);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const videoDataUrl = e.target?.result as string;
          onChange(videoDataUrl, 'video');
          setIsProcessing(false);
        };
        reader.onerror = () => {
          setErrorMessage('Gagal memproses file video.');
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        setErrorMessage('Format file tidak didukung. Harap pilih gambar (JPG/PNG/WebP) atau video (MP4/WebM).');
      }
    } catch (err) {
      console.error('File process error:', err);
      setErrorMessage('Terjadi kendala saat membaca file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveMedia = () => {
    onChange('', 'image');
    setErrorMessage(null);
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
      {/* Header Label & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-bold text-slate-200">
            {label}
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Opsional</span>
        </div>

        {/* Tab Switching: File Langsung vs Link URL */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('local')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeMode === 'local' ? colorStyles.activeTab : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3 h-3" />
            <span>Upload File Langsung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeMode === 'url' ? colorStyles.activeTab : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Link URL</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MODE 1: UPLOAD LANGSUNG DARI PERANGKAT (TANPA URL) */}
      {activeMode === 'local' && (
        <div className="space-y-2.5">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={filePickerRef}
            onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
            accept="image/*,video/mp4,video/webm"
            className="hidden"
          />
          {/* Native Mobile Camera Picker */}
          <input
            type="file"
            ref={cameraPickerRef}
            onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {!mediaUrl ? (
            /* Drag & Drop / File Select Box */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`p-4 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                dragOver 
                  ? 'border-indigo-400 bg-indigo-950/30' 
                  : 'border-slate-700/90 hover:border-slate-500 bg-slate-900/60'
              }`}
              onClick={() => filePickerRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 shadow-sm">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  {isProcessing ? 'Sedang Memproses Media...' : 'Klik atau Seret Foto / Video dari Perangkat Anda'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Foto langsung dikompresi otomatis, jernih &amp; hemat memori. <strong className="text-emerald-400 font-semibold">Tidak butuh URL web!</strong>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => filePickerRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-600 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pilih dari Galeri / File</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraPickerRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-600 transition-colors cursor-pointer sm:hidden"
                  title="Buka kamera ponsel untuk foto langsung"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jepret Kamera</span>
                </button>
              </div>
            </div>
          ) : (
            /* Media Preview Box */
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {mediaType === 'video' ? (
                  <div className="w-14 h-14 rounded-lg bg-rose-950/80 border border-rose-700/80 flex items-center justify-center shrink-0 text-rose-300">
                    <Film className="w-6 h-6" />
                  </div>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-600 shrink-0 bg-slate-950"
                  />
                )}

                <div className="text-xs overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {mediaType === 'video' ? 'Video Terunggah' : 'Foto Terunggah'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Tersimpan Langsung)
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] truncate">
                    {mediaUrl.startsWith('data:') 
                      ? 'Media lokal berhasil tersimpan ke sistem web' 
                      : mediaUrl}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Ganti & Hapus */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => filePickerRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Ganti dengan foto atau video lain"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors cursor-pointer"
                  title="Hapus media ini"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: INPUT DENGAN LINK URL WEB / YOUTUBE / DRIVE */}
      {activeMode === 'url' && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(val, val.includes('youtu') ? 'video' : mediaType);
                }}
                placeholder="https://images.unsplash.com/... atau link YouTube"
                className={`w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none ${colorStyles.borderFocus}`}
              />
            </div>
            <div>
              <select
                value={mediaType}
                onChange={(e) => onChange(mediaUrl, e.target.value as 'image' | 'video')}
                className={`w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none ${colorStyles.borderFocus}`}
              >
                <option value="image">Foto / Gambar</option>
                <option value="video">Video / YouTube</option>
              </select>
            </div>
          </div>
          {mediaUrl && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[80%] font-mono">{mediaUrl}</span>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explanation Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-800/80">
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Ikon badge foto/video akan otomatis muncul di sebelah nama item.
        </span>
      </div>
    </div>
  );
};
