import React, { useState, useEffect } from 'react';
import { SpreadsheetService } from '../../services/spreadsheetService';
import { StaffContact } from '../../types';
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageCircle, 
  ShieldCheck, 
  UserCheck, 
  ArrowLeft,
  Award,
  Sparkles
} from 'lucide-react';

interface HelpViewProps {
  onBackToMain?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onBackToMain }) => {
  const [contacts, setContacts] = useState<StaffContact[]>(SpreadsheetService.getStaffContacts());

  useEffect(() => {
    setContacts(SpreadsheetService.getStaffContacts());
    const unsub = SpreadsheetService.subscribeToDataChanges(() => {
      setContacts(SpreadsheetService.getStaffContacts());
    });
    return unsub;
  }, []);

  const pembina = contacts.filter(s => s.role === 'Pembina');
  const admin = contacts.filter(s => s.role === 'Admin');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
              <HelpCircle className="w-6 h-6 text-emerald-400" />
              Pusat Bantuan, Kontak Pembina & Administrasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Hubungi pembina teknis untuk konsultasi kasus rumit atau hubungi admin untuk urusan akses spreadsheet
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: PEMBINA */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Daftar Nama Pembina Teknis (Master Engineers)
            </h3>
            <p className="text-xs text-slate-400">
              Tim pengawas dan pembina bersertifikasi untuk asistensi servis, skema, dan kendala unit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pembina.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-800/90 border border-slate-700/90 hover:border-amber-500/80 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                    {index + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {item.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">
                  {item.name}
                </h4>
                <p className="text-xs text-amber-400 font-medium mt-0.5 mb-2.5">
                  {item.title}
                </p>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs mb-4">
                  <span className="text-slate-400 block font-semibold mb-0.5">Bidang Spesialisasi:</span>
                  <span className="text-slate-200 leading-snug block">{item.specialty}</span>
                </div>
              </div>

              {/* Direct Contact Actions */}
              <div className="space-y-2 pt-3 border-t border-slate-700/60">
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                    `Halo Pembina ${item.name}, saya ingin konsultasi terkait servis unit amplifier.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat WhatsApp
                </a>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                  <span>{item.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ADMIN */}
      <div className="pt-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Daftar Nama Admin (Sistem & Spreadsheet)
            </h3>
            <p className="text-xs text-slate-400">
              Pengelola izin hak akses 6 bulan, penambahan nama di Spreadsheet, dan registrasi teknisi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {admin.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-800/90 border border-slate-700/90 hover:border-blue-500/80 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                    {index + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Administrasi
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">
                  {item.name}
                </h4>
                <p className="text-xs text-blue-400 font-medium mt-0.5 mb-2.5">
                  {item.title}
                </p>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs mb-4">
                  <span className="text-slate-400 block font-semibold mb-0.5">Tanggung Jawab:</span>
                  <span className="text-slate-200 leading-snug block">{item.specialty}</span>
                </div>
              </div>

              {/* Contact Admin */}
              <div className="space-y-2 pt-3 border-t border-slate-700/60">
                <a
                  href={`https://wa.me/6285711223344?text=${encodeURIComponent(
                    `Halo Admin ${item.name}, saya ingin mengajukan penambahan nama / perpanjangan akses ke spreadsheet aplikasi panduan service.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Hubungi Admin untuk Akses Spreadsheet
                </a>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                  <span>{item.phone}</span>
                  <span>{item.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
