import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Clock, Ban, Users, Loader2 } from 'lucide-react';
import { User, AccessType } from '../types';
import { subscribeToUsers, setUserAccessType } from '../services/backendService';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const ACCESS_LABEL: Record<AccessType, string> = {
  fulltime: 'Fulltime',
  '6months': '6 Bulan',
  none: 'Menunggu Persetujuan',
};

const ACCESS_STYLE: Record<AccessType, string> = {
  fulltime: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300',
  '6months': 'bg-amber-950/60 border-amber-700/60 text-amber-300',
  none: 'bg-rose-950/60 border-rose-700/60 text-rose-300',
};

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const unsub = subscribeToUsers((list) => {
      // Newest registrations first.
      const sorted = [...list].sort((a, b) =>
        (b.registeredAt || '').localeCompare(a.registeredAt || '')
      );
      setUsers(sorted);
      setLoading(false);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeAccess = async (uid: string, accessType: AccessType) => {
    setSavingId(uid);
    try {
      await setUserAccessType(uid, accessType);
    } catch (e) {
      console.error('Gagal mengubah akses akun:', e);
      alert('Gagal mengubah akses akun. Coba lagi.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">Kelola Akun</h3>
              <p className="text-[11px] text-slate-400">
                Setujui akun baru & atur level akses tiap pengguna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat daftar akun...
            </div>
          )}

          {!loading && users.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-10">Belum ada akun terdaftar.</p>
          )}

          {!loading &&
            users.map((u) => {
              const isSelf = u.id === currentUser.id;
              const isSaving = savingId === u.id;
              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {u.fullName} {isSelf && <span className="text-slate-500 text-xs">(Anda)</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${ACCESS_STYLE[u.accessType]}`}
                  >
                    {ACCESS_LABEL[u.accessType]}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isSaving || u.accessType === 'fulltime'}
                      onClick={() => handleChangeAccess(u.id, 'fulltime')}
                      title="Jadikan Fulltime"
                      className="p-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || u.accessType === '6months'}
                      onClick={() => handleChangeAccess(u.id, '6months')}
                      title="Jadikan 6 Bulan"
                      className="p-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || u.accessType === 'none' || isSelf}
                      onClick={() => handleChangeAccess(u.id, 'none')}
                      title="Cabut Akses"
                      className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Hanya akun Fulltime yang bisa membuka & mengubah panel ini. Perubahan berlaku instan di semua perangkat.
        </div>
      </div>
    </div>
  );
};
