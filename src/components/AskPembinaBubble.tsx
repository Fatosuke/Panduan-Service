import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Plus,
  ArrowLeft,
  Coins,
  Dumbbell,
  BookOpen,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { User, ChatThread, ChatMessage } from '../types';
import { SpreadsheetService } from '../services/spreadsheetService';

interface AskPembinaBubbleProps {
  currentUser?: User | null;
  onNavigateToHelp?: () => void;
  onRefreshUser?: () => void | Promise<void>;
}

export const AskPembinaBubble: React.FC<AskPembinaBubbleProps> = ({
  currentUser,
  onNavigateToHelp,
  onRefreshUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'newThread'>('list');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New thread form
  const [selectedPembinaName, setSelectedPembinaName] = useState('');
  const [newMessageDraft, setNewMessageDraft] = useState('');
  const [isStartingThread, setIsStartingThread] = useState(false);
  const [showTokenExhausted, setShowTokenExhausted] = useState(false);
  const [showExerciseConfirm, setShowExerciseConfirm] = useState(false);

  const isFulltime = currentUser?.accessType === 'fulltime';
  const pembinaList = SpreadsheetService.getStaffContacts().filter(s => s.role === 'Pembina');
  const tokens = currentUser?.askTokens ?? 0;
  const exerciseText = currentUser?.gender === 'Perempuan' ? '10 kali Squat Jump' : '10 kali Push Up';

  const refresh = () => {
    setThreads(SpreadsheetService.getChatThreads());
    setMessages(SpreadsheetService.getChatMessages());
  };

  useEffect(() => {
    refresh();
    const unsub = SpreadsheetService.subscribeToDataChanges(refresh);
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) onRefreshUser?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  if (!currentUser) return null;

  // Penanya hanya melihat percakapan miliknya sendiri; akun fulltime
  // (Pembina/Admin) melihat semua percakapan masuk.
  const myThreads = isFulltime
    ? threads
    : threads.filter(t => t.askerId === currentUser.id);

  const activeMyThreads = myThreads.filter(t => t.status === 'active').sort((a, b) => b.id.localeCompare(a.id));
  const closedMyThreads = myThreads.filter(t => t.status === 'closed').sort((a, b) => b.id.localeCompare(a.id));

  const activeThread = myThreads.find(t => t.id === activeThreadId) || null;
  const threadMessages = activeThread
    ? messages.filter(m => m.threadId === activeThread.id).sort((a, b) => a.id.localeCompare(b.id))
    : [];

  const lastMessagePreview = (threadId: string) => {
    const msgs = messages.filter(m => m.threadId === threadId).sort((a, b) => a.id.localeCompare(b.id));
    return msgs.length > 0 ? msgs[msgs.length - 1].text : '';
  };

  const openThread = (id: string) => {
    setActiveThreadId(id);
    setView('chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !messageDraft.trim()) return;
    setIsSending(true);
    try {
      await SpreadsheetService.sendChatMessage(activeThreadId, messageDraft.trim());
      setMessageDraft('');
      refresh();
    } catch (err: any) {
      alert('Gagal mengirim pesan: ' + (err?.message || ''));
    } finally {
      setIsSending(false);
    }
  };

  const attemptStartThread = async (usedExemption: boolean) => {
    if (!selectedPembinaName || !newMessageDraft.trim()) {
      alert('Pilih Pembina dan tulis pertanyaan Anda terlebih dahulu.');
      return;
    }
    setIsStartingThread(true);
    try {
      const { thread } = await SpreadsheetService.startChatThread({
        pembinaName: selectedPembinaName,
        firstMessage: newMessageDraft.trim(),
        usedExemption
      });
      setShowTokenExhausted(false);
      setShowExerciseConfirm(false);
      setNewMessageDraft('');
      refresh();
      onRefreshUser?.();
      openThread(thread.id);
    } catch (err: any) {
      if (err?.message === 'no_tokens') {
        setShowTokenExhausted(true);
      } else {
        alert('Gagal memulai percakapan: ' + (err?.message || ''));
      }
    } finally {
      setIsStartingThread(false);
    }
  };

  const handleStartThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptStartThread(false);
  };

  const handleCloseThread = async (threadId: string) => {
    if (!window.confirm('Tutup percakapan ini?')) return;
    try {
      await SpreadsheetService.closeChatThread(threadId);
      refresh();
      setView('list');
    } catch (err: any) {
      alert('Gagal menutup percakapan: ' + (err?.message || ''));
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setView('list');
    setActiveThreadId(null);
    setShowTokenExhausted(false);
    setShowExerciseConfirm(false);
  };

  return (
    <>
      {/* FLOATING BUBBLE BUTTON - Pojok Kanan Bawah */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-600 text-white rounded-full shadow-xl shadow-purple-900/40 border border-purple-400/40 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Tanya Pembina"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            {activeMyThreads.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight tracking-wide">Tanya Pembina</span>
            <span className="text-[10px] text-purple-200 font-medium leading-none">
              {isFulltime ? `${activeMyThreads.length} percakapan aktif` : `${tokens} token tersisa`}
            </span>
          </div>
        </button>
      </div>

      {/* POPUP / MODAL DIALOG */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 p-2 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={resetAndClose}
        >
          <div
            className="w-full sm:w-[420px] sm:max-h-[85vh] max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp sm:mr-4 sm:mb-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {view !== 'list' && (
                  <button
                    type="button"
                    onClick={() => { setView('list'); setActiveThreadId(null); }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {view === 'chat' && activeThread ? activeThread.subject : view === 'newThread' ? 'Pertanyaan Baru' : 'Tanya Pembina'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {view === 'chat' && activeThread
                      ? `${activeThread.askerName} ↔ ${activeThread.pembinaName}`
                      : isFulltime ? 'Percakapan masuk dari teknisi' : 'Chat langsung dengan Pembina'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* VIEW: LIST */}
              {view === 'list' && (
                <div className="p-4 space-y-3">
                  {!isFulltime && (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-200 text-xs">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>Token bertanya tersisa:</span>
                      </div>
                      <span className="text-lg font-bold text-white">{tokens}</span>
                    </div>
                  )}

                  {!isFulltime && (
                    <button
                      type="button"
                      onClick={() => { setView('newThread'); setSelectedPembinaName(pembinaList[0]?.name || ''); }}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Tanya Pembina Baru
                    </button>
                  )}

                  {activeMyThreads.length === 0 && closedMyThreads.length === 0 && (
                    <p className="text-center text-slate-500 text-xs py-8">
                      {isFulltime ? 'Belum ada percakapan masuk.' : 'Belum ada percakapan. Mulai pertanyaan baru di atas.'}
                    </p>
                  )}

                  {activeMyThreads.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Aktif</p>
                      {activeMyThreads.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => openThread(t.id)}
                          className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-xs text-white truncate">{t.subject}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {isFulltime ? t.askerName : t.pembinaName} · {lastMessagePreview(t.id)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {closedMyThreads.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Selesai</p>
                      {closedMyThreads.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => openThread(t.id)}
                          className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-left transition-colors cursor-pointer opacity-70"
                        >
                          <span className="font-semibold text-xs text-slate-300 truncate block">{t.subject}</span>
                          <p className="text-[11px] text-slate-500 truncate">
                            {isFulltime ? t.askerName : t.pembinaName}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: NEW THREAD FORM */}
              {view === 'newThread' && (
                <form onSubmit={handleStartThreadSubmit} className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Pembina:</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {pembinaList.length === 0 && (
                        <p className="text-xs text-slate-500">Belum ada kontak Pembina terdaftar.</p>
                      )}
                      {pembinaList.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPembinaName(p.name)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            selectedPembinaName === p.name
                              ? 'bg-purple-500/20 border-purple-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="font-bold">{p.name}</span>
                          <span className="block text-[10px] text-slate-500 truncate">{p.specialty}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pertanyaan Anda:</label>
                    <textarea
                      rows={4}
                      required
                      value={newMessageDraft}
                      onChange={(e) => setNewMessageDraft(e.target.value)}
                      placeholder="Tulis pertanyaan atau kendala servis Anda..."
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isStartingThread || pembinaList.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    {isStartingThread ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Kirim Pertanyaan
                  </button>

                  {!isFulltime && (
                    <p className="text-[10px] text-slate-500 text-center">
                      Ini akan memakai 1 token bertanya. Sisa token: {tokens}.
                    </p>
                  )}
                </form>
              )}

              {/* VIEW: CHAT */}
              {view === 'chat' && activeThread && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4 space-y-3">
                    {threadMessages.map(m => {
                      const isMine = m.senderId === currentUser.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
                            isMine
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                          }`}>
                            {!isMine && (
                              <p className="text-[10px] font-bold text-purple-300 mb-0.5">{m.senderName}</p>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            <p className={`text-[9px] mt-1 ${isMine ? 'text-purple-200' : 'text-slate-500'}`}>{m.createdAt}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

            </div>

            {/* Footer: message input (only in chat view, only if thread still active) */}
            {view === 'chat' && activeThread && (
              <div className="border-t border-slate-800 bg-slate-950 p-3">
                {activeThread.status === 'closed' ? (
                  <p className="text-center text-[11px] text-slate-500 py-1">Percakapan ini sudah ditutup.</p>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder="Tulis balasan..."
                      className="flex-1 py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !messageDraft.trim()}
                      className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors cursor-pointer shrink-0"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                )}
                {(currentUser.id === activeThread.askerId || isFulltime) && activeThread.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleCloseThread(activeThread.id)}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 mt-2 cursor-pointer"
                  >
                    Tutup percakapan ini
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOKEN EXHAUSTED DIALOG */}
      {showTokenExhausted && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-700/60 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Token Bertanya Habis</h4>
                <p className="text-[11px] text-slate-400">Jatah bertanya bulan ini sudah terpakai semua.</p>
              </div>
            </div>

            {!showExerciseConfirm ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTokenExhausted(false);
                    resetAndClose();
                    onNavigateToHelp?.();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Baca Manual Dulu
                </button>
                <button
                  type="button"
                  onClick={() => setShowExerciseConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Dumbbell className="w-4 h-4" />
                  Tetap Bertanya ({exerciseText})
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Yuk lakukan <strong className="text-amber-400">{exerciseText}</strong> dulu, baru klik tombol di bawah untuk kirim pertanyaan Anda kali ini.
                </p>
                <button
                  type="button"
                  disabled={isStartingThread}
                  onClick={() => attemptStartThread(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isStartingThread ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Saya Sudah Selesai, Kirim Pertanyaan
                </button>
                <button
                  type="button"
                  onClick={() => setShowExerciseConfirm(false)}
                  className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Kembali
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setShowTokenExhausted(false); setShowExerciseConfirm(false); }}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  );
};
