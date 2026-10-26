import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, XCircle, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import { runDiagnostics, DiagnosticStep } from '../services/backendService';
import { APP_BUILD } from '../version';

/**
 * Panel "Diagnosa Web": memeriksa dari web sampai Google Sheet dan
 * menunjukkan di langkah mana data tidak sinkron. Hasilnya bisa disalin.
 */
export const DiagnosticsPanel: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[] | null>(null);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setRunning(true);
    setCopied(false);
    try {
      const res = await runDiagnostics();
      setSteps(res.steps);
      setSummary(res.summary);
    } catch (e) {
      setSteps([{ label: 'Diagnosa', status: 'fail', detail: e instanceof Error ? e.message : String(e) }]);
      setSummary('Diagnosa sendiri gagal dijalankan.');
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    if (!steps) return;
    const icon = { ok: '[OK]  ', warn: '[CEK]  ', fail: '[GAGAL] ' } as const;
    const text =
      `Diagnosa Web Panduan Service (${APP_BUILD}) - ${new Date().toISOString()}\n` +
      steps.map((s) => `${icon[s.status]}${s.label}: ${s.detail}`).join('\n') +
      `\n\nKESIMPULAN: ${summary}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard tidak tersedia: pengguna bisa memotret layar */
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/70 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Stethoscope className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white text-base">Diagnosa Web</h4>
            <p className="text-slate-400">
              Cek apakah web, Apps Script, dan Google Sheet sudah sinkron. Tidak mengubah data apa pun.
              <span className="ml-1 text-slate-500">Web {APP_BUILD}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {steps && (
            <button
              type="button"
              onClick={copy}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin hasil'}
            </button>
          )}
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
            {running ? 'Memeriksa…' : 'Jalankan Diagnosa'}
          </button>
        </div>
      </div>

      {steps && (
        <div className="mt-4 space-y-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              {s.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {s.status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {s.status === 'fail' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <p className="text-slate-300 break-words min-w-0">
                <span className="font-semibold text-white">{s.label}:</span> {s.detail}
              </p>
            </div>
          ))}
          <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-700 text-slate-200">
            <span className="font-bold text-cyan-300">Kesimpulan: </span>
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};
