import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  Layers, 
  Menu, 
  ClipboardList, 
  FileSpreadsheet, 
  HelpCircle, 
  Wrench, 
  Zap, 
  Cpu, 
  CheckSquare, 
  Square,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { User } from '../types';

interface IntroGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

const STORAGE_KEY_HIDE_INTRO = 'panduan_service_hide_welcome_popup';

export const IntroGuideModal: React.FC<IntroGuideModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Initialize checkbox value from storage
  useEffect(() => {
    const isHidden = localStorage.getItem(STORAGE_KEY_HIDE_INTRO) === 'true';
    setDontShowAgain(isHidden);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_HIDE_INTRO, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_HIDE_INTRO);
    }
    onClose();
  };

  const guideSections = [
    {
      id: 'welcome',
      title: 'Selamat Datang di Panduan Service',
      icon: <Wrench className="w-5 h-5 text-blue-400" />,
      badge: 'Pengenalan',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-800/50">
            <h4 className="text-base font-bold text-white mb-1">
              Halo {currentUser?.fullName || 'Sobat Teknisi'}! 👋
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aplikasi ini dirancang khusus untuk memandu Anda dalam perakitan, pemeriksaan, diagnosa kerusakan, hingga pencatatan servis perangkat audio & amplifier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Status Akun Anda
              </span>
              <p className="text-slate-400 text-[11px]">
                {currentUser?.accessType === 'fulltime'
                  ? 'Akun Fulltime Access (Akses penuh termasuk fitur sinkronisasi spreadsheet).'
                  : currentUser?.accessType === 'editor'
                  ? 'Akun Editor (PKL) - bisa membantu menambah & mengedit data panduan.'
                  : 'Akun 6 Bulan Akses Panduan Service Audio.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Responsif & Fleksibel
              </span>
              <p className="text-slate-400 text-[11px]">
                Dapat digunakan di laptop teknisi, tablet bengkel, maupun smartphone Android secara lancar.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tabs',
      title: '1. Lima Tab Servis di Halaman Utama',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      badge: 'Alur Kerja',
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Halaman utama terbagi menjadi 5 tab berurutan sesuai alur kerja servis:
          </p>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">
                Tab 1
              </span>
              <div>
                <strong className="text-white">Alat Service:</strong>
                <p className="text-slate-400 text-[11px]">Standar Perlengkapan kerja: multitester analog / digital, audio generator, Power supply, Dummy Load, Osiloskop.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold text-[11px] shrink-0 mt-0.5">
                Tab 2
              </span>
              <div>
                <strong className="text-white">Nama dan Tipe Amplifier:</strong>
                <p className="text-slate-400 text-[11px]">Jenis-jenis amplifier TOA dan tipenya.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[11px] shrink-0 mt-0.5">
                Tab 3
              </span>
              <div>
                <strong className="text-white">Cek Komponen Rusak vs Bagus:</strong>
                <p className="text-slate-400 text-[11px]">Membedakan komponen normal dan rusak via visual dan pengetesan multimeter.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold text-[11px] shrink-0 mt-0.5">
                Tab 4
              </span>
              <div>
                <strong className="text-white">Pengetesan Amplifier:</strong>
                <p className="text-slate-400 text-[11px]">Cara pengetesan amplifier pada ruang service dan pengetesan audio.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold text-[11px] shrink-0 mt-0.5">
                Tab 5
              </span>
              <div>
                <strong className="text-white">Tes Speaker:</strong>
                <p className="text-slate-400 text-[11px]">Pengetesan perangkat speaker TOA dengan audio dan cara membedakan tipe speaker.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'drawer',
      title: '2. Menu Khusus Kiri Atas (Sidebar Drawer)',
      icon: <Menu className="w-5 h-5 text-amber-400" />,
      badge: 'Navigasi',
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Klik tombol hamburger <strong>"Menu Khusus (Kiri Atas)"</strong> di pojok kiri atas untuk membuka 4 modul spesifik:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                1. Komponen Pasif & Aktif
              </span>
              <p className="text-[11px] text-slate-400">
                Pustaka komponen Resistor, Elco, Dioda, Transistor, MOSFET, dan IC driver audio.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-400" />
                2. Tools Servis
              </span>
              <p className="text-[11px] text-slate-400">
                Katalog alat lengkap dengan fungsi teknis dan cara penggunaan yang aman.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                3. Analisis Kerusakan
              </span>
              <p className="text-[11px] text-slate-400">
                Pengecekan kerusakan dengan menyesuaikan data kerusakan pada ampli dan database.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                4. Help & Kontak Pembina
              </span>
              <p className="text-[11px] text-slate-400">
                Daftar kontak pembina teknis dan admin jika menemui kerusakan unit yang rumit.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bubble',
      title: '4. Bubble Catat Nomor Service (Pojok Kiri Bawah)',
      icon: <ClipboardList className="w-5 h-5 text-cyan-400" />,
      badge: 'Catatan Nomor Service',
      content: (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-1.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              Tombol Melayang di Pojok Kiri Bawah
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Gunakan bubble melayang di pojok kiri bawah kapan saja untuk mencatat pekerjaan servis yang sedang Anda tangani tanpa harus meninggalkan halaman yang sedang dibaca.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-semibold text-white">4 Data Wajib yang Tercatat:</span>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              <li><strong className="text-white">Nama yang Mengerjakan:</strong> Otomatis terisi nama akun teknisi yang sedang login.</li>
              <li><strong className="text-cyan-400 font-mono">Nomor Service:</strong> Nomor nota servis (misal: GTC-2600001).</li>
              <li><strong className="text-white">Analisa Kerusakan:</strong> Kerusakan yang ditemukan pada sirkuit audio.</li>
              <li><strong className="text-emerald-400">Komponen yang Diganti:</strong> Daftar komponen pengganti (transistor, IC, zener, dll).</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'sheets',
      title: '4. Sinkronisasi Data Google Spreadsheet',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      badge: 'Data & Hak Akses',
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Aplikasi ini terhubung langsung dengan Google Sheets untuk menyimpan dan memperbarui data secara kolaboratif:
          </p>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Aturan Hak Akses Spreadsheet:
            </span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• Tombol <strong>Spreadsheet Sync</strong> hanya dapat diakses oleh akun <strong>Fulltime Access</strong>.</li>
              <li>• Hak edit dan sinkronisasi penuh dimiliki oleh akun berstatus <strong className="text-white">Fulltime</strong> (diatur lewat panel Kelola Akun).</li>
              <li>• Pengguna lain dapat melihat data dalam mode tinjau (*Read-Only*).</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
            <span className="font-semibold text-white block">Tersedia 5 Tab Sheet:</span>
            <span>1. Whitelist Siswa • 2. Media Komponen • 3. Database Analisis • 4. Kontak Staff • 5. Catatan Nomor Service.</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Panduan Penggunaan Web
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  Tour Aplikasi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pengenalan fitur lengkap servis audio & integrasi spreadsheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER / TAB NAVIGATION */}
        <div className="flex items-center overflow-x-auto bg-slate-950/60 p-2 border-b border-slate-800 gap-1.5 text-xs">
          {guideSections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`py-1.5 px-3 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeStep === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{sec.badge}</span>
            </button>
          ))}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              {guideSections[activeStep].icon}
              <span>{guideSections[activeStep].title}</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Halaman {activeStep + 1} dari {guideSections.length}
            </span>
          </div>

          {guideSections[activeStep].content}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Checkbox "Jangan tampilkan lagi" */}
          <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className="p-0.5 text-blue-400 focus:outline-none cursor-pointer"
            >
              {dontShowAgain ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <span className={dontShowAgain ? 'text-blue-300 font-medium' : 'text-slate-400'}>
              Jangan tampilkan lagi pop-up ini setelah login
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Sebelumnya
              </button>
            )}

            {activeStep < guideSections.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => Math.min(guideSections.length - 1, prev + 1))}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mulai Gunakan Web</span>
              </button>
            )}
          </div>
        </div>

        {/* Note about accessing it later in special menu */}
        <div className="py-2 px-4 bg-slate-900 text-center text-[11px] text-slate-500 border-t border-slate-800/60">
          💡 <em>Tips:</em> Anda dapat membuka kembali panduan ini kapan saja melalui menu <strong>"Panduan Penggunaan Web"</strong> di laci menu khusus (kiri atas).
        </div>
      </div>
    </div>
  );
};
