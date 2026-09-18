import React, { useState } from 'react';
import { Play, Image as ImageIcon, X, ExternalLink, Film, Maximize2 } from 'lucide-react';

interface InlineMediaBadgeProps {
  mediaUrl?: string;
  image?: string;
  mediaType?: 'image' | 'video';
  title?: string;
  className?: string;
}

export const InlineMediaBadge: React.FC<InlineMediaBadgeProps> = ({
  mediaUrl,
  image,
  mediaType,
  title,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Resolve url
  const rawUrl = (mediaUrl || image || '').trim();
  if (!rawUrl) return null;

  // Auto detect type if not specified
  const isVideo = mediaType === 'video' || 
    rawUrl.includes('youtube.com') || 
    rawUrl.includes('youtu.be') || 
    rawUrl.endsWith('.mp4') || 
    rawUrl.endsWith('.webm') ||
    rawUrl.startsWith('data:video/');

  // Format YouTube embed
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const id = urlParams.get('v');
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
    } catch {
      // fallback
    }
    return url;
  };

  const embedUrl = isVideo ? getEmbedUrl(rawUrl) : rawUrl;
  const isDirectVideo = rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.startsWith('data:video/') || rawUrl.startsWith('blob:');

  return (
    <>
      {/* Small inline badge / thumbnail */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={`Lihat media ${isVideo ? 'Video' : 'Foto'}: ${title || ''}`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all shadow-sm cursor-pointer align-middle ml-2 group ${
          isVideo 
            ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-700/80 text-rose-200' 
            : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/80 text-emerald-200'
        } ${className}`}
      >
        {isVideo ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Play className="w-3 h-3 fill-rose-300 text-rose-300 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-tight">Video</span>
          </>
        ) : (
          <>
            {rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? (
              <img 
                src={rawUrl} 
                alt="" 
                className="w-4 h-4 rounded object-cover border border-emerald-500/40 shrink-0" 
                onError={(e) => {
                  // Fallback to icon
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-3 h-3 text-emerald-400" />
            )}
            <span className="font-bold tracking-tight">Foto</span>
          </>
        )}
      </button>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Bar */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {isVideo ? (
                  <Film className="w-4 h-4 text-rose-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                )}
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {title || (isVideo ? 'Pemutaran Video Panduan' : 'Pratinjau Foto')}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {!rawUrl.startsWith('data:') && (
                  <a 
                    href={rawUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Buka URL asli di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="p-2 sm:p-4 bg-slate-950/60 flex items-center justify-center min-h-[260px] sm:min-h-[380px] max-h-[75vh] overflow-auto">
              {isVideo ? (
                isDirectVideo ? (
                  <video 
                    src={rawUrl} 
                    controls 
                    autoPlay 
                    className="max-h-[65vh] w-full rounded-xl object-contain bg-black shadow-lg"
                  />
                ) : (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                    <iframe
                      src={embedUrl}
                      title={title || 'Video Player'}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )
              ) : (
                <img 
                  src={rawUrl} 
                  alt={title || 'Foto panduan'} 
                  className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[80%] font-mono text-[11px] text-slate-400">
                {rawUrl.startsWith('data:') ? '📁 Foto / Video Disimpan Langsung dari File Perangkat' : rawUrl}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
