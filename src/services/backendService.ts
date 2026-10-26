/**
 * backendService.ts
 * ---------------------------------------------------------------------------
 * Replaces firebaseService.ts. Talks to a Google Apps Script Web App
 * (see /google-apps-script/Code.gs) that uses the master Google Sheet
 * itself as the database - not a mirror, the actual source of truth.
 *
 * - Auth: real email + password, hashed & verified server-side inside the
 *   Apps Script (never in the browser).
 * - Data: every collection is a tab in the Sheet. Reads are polled on an
 *   interval (POLL_INTERVAL_MS) instead of pushed instantly like Firestore
 *   would - this is the trade-off of a free, spreadsheet-only backend, but
 *   it means editing a row directly in the Sheet also shows up in the app,
 *   which a Firestore-mirror setup could never do.
 * - The exported store objects (toolsStore, ampliStore, ...) and the
 *   subscribeToAnyDataChange/startAllStores/stopAllStores/allStoresReady
 *   functions keep the exact same shape as the old firebaseService.ts, so
 *   spreadsheetService.ts barely had to change.
 * ---------------------------------------------------------------------------
 */
import { APP_VERSION, APP_BUILD } from '../version';
import {
  User,
  AccessType,
  ToolItem,
  AmpliItem,
  ComponentMediaGuide,
  TesAmpliItem,
  TesSpeakerItem,
  AnalisisUnitRecord,
  StaffContact,
  ServiceLogRecord,
  WhitelistEntry,
  KomponenItem,
  ChatThread,
  ChatMessage,
} from '../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Set in .env.local as VITE_APPS_SCRIPT_URL after deploying Code.gs as a Web
// App (see SETUP_GUIDE.md). Looks like:
// https://script.google.com/macros/s/AKfycb.../exec
export const APPS_SCRIPT_URL: string = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || '';

export function isBackendConfigured(): boolean {
  return !!APPS_SCRIPT_URL;
}

/** How often each data collection re-checks the Sheet for changes. */
export const POLL_INTERVAL_MS = 15000;

const SESSION_TOKEN_KEY = 'panduan_service_session_token';

// ---------------------------------------------------------------------------
// Low-level Apps Script API calls
// ---------------------------------------------------------------------------
const REQUEST_TIMEOUT_MS = 60000;

async function apiGet(action: string, params: Record<string, string> = {}): Promise<any> {
  if (!APPS_SCRIPT_URL) throw new Error('Apps Script URL belum dikonfigurasi (VITE_APPS_SCRIPT_URL).');
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
  const res = await fetch(url.toString());
  const json = await readJson(res);
  if (!json.ok) throw new ApiError(json.error || 'Permintaan gagal.', json.code);
  return json;
}

async function apiPost(action: string, payload: Record<string, any> = {}): Promise<any> {
  if (!APPS_SCRIPT_URL) throw new Error('Apps Script URL belum dikonfigurasi (VITE_APPS_SCRIPT_URL).');
  // Content-Type text/plain keeps this a CORS "simple request" (no preflight
  // OPTIONS call), which Apps Script Web Apps don't handle. The Apps Script
  // side still parses the body as JSON regardless of the declared type.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ApiError('Server terlalu lama merespons. Coba lagi.');
    throw new ApiError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda.');
  } finally {
    clearTimeout(timer);
  }
  const json = await readJson(res);
  if (!json.ok) {
    if (json.code === 'invalid_session') {
      clearToken();
      sessionInvalidListeners.forEach((l) => l());
    }
    if (typeof json.error === 'string' && json.error.startsWith('Aksi POST tidak dikenal')) {
      throw new ApiError(
        'Code.gs di Apps Script masih versi lama. Tempel Code.gs terbaru, lalu Deploy > Manage deployments > New version.',
        'server_outdated'
      );
    }
    throw new ApiError(json.error || 'Permintaan gagal.', json.code);
  }
  return json;
}

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    // Apps Script mengembalikan halaman HTML (bukan JSON) kalau URL salah,
    // belum di-deploy ulang, atau aksesnya bukan "Anyone".
    throw new ApiError(
      'Server tidak membalas dengan benar. Pastikan Code.gs sudah di-deploy ulang (New version) dan akses "Anyone".'
    );
  }
}

// Dipanggil saat server menolak token (kedaluwarsa / dihapus) - App.tsx
// memakai ini untuk otomatis kembali ke layar login.
const sessionInvalidListeners = new Set<() => void>();
export function subscribeToSessionInvalid(listener: () => void): () => void {
  sessionInvalidListeners.add(listener);
  return () => sessionInvalidListeners.delete(listener);
}

// Dipanggil saat menyimpan (tambah/ubah/hapus) ke spreadsheet GAGAL, supaya
// UI bisa memberi tahu pengguna - bukan hanya item yang hilang diam-diam.
export interface WriteErrorInfo {
  sheet: string;
  action: string;
  message: string;
}
const writeErrorListeners = new Set<(info: WriteErrorInfo) => void>();
export function subscribeToWriteErrors(listener: (info: WriteErrorInfo) => void): () => void {
  writeErrorListeners.add(listener);
  return () => writeErrorListeners.delete(listener);
}
function reportWriteError(sheet: string, action: string, e: unknown): void {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[backendService] Gagal ${action} di "${sheet}":`, e);
  writeErrorListeners.forEach((l) => l({ sheet, action, message }));
}

// ---------------------------------------------------------------------------
// Session (token stored in localStorage - this device only)
// ---------------------------------------------------------------------------
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string): void {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string;
}

export async function registerWithEmail(
  input: RegisterInput
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const json = await apiPost('register', input);
    saveToken(json.token);
    return { success: true, user: json.user };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Pendaftaran gagal.' };
  }
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const json = await apiPost('login', { email, password });
    saveToken(json.token);
    return { success: true, user: json.user };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Login gagal.' };
  }
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  clearToken();
  if (token) {
    try {
      await apiPost('logout', { token });
    } catch {
      /* best-effort */
    }
  }
}

/**
 * Checks the token saved on this device against the backend. Call once on
 * app start. Returns the account if the session is still valid, otherwise
 * null (and clears the stale token).
 */
export async function validateSession(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const json = await apiPost('validateToken', { token });
    if (!json.valid) {
      clearToken();
      return null;
    }
    return json.user;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Account management (for fulltime admins)
// ---------------------------------------------------------------------------
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  let cancelled = false;

  async function poll() {
    if (cancelled || (typeof document !== 'undefined' && document.hidden)) return;
    try {
      const token = getStoredToken();
      const json = await apiPost('listUsers', { token });
      if (!cancelled) callback(json.data);
    } catch (e) {
      console.error('[backendService] Gagal memuat daftar akun:', e);
    }
  }

  poll();
  const timer = setInterval(poll, 10000);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

export async function setUserAccessType(uid: string, accessType: AccessType): Promise<void> {
  const token = getStoredToken();
  await apiPost('setAccess', { token, targetUserId: uid, accessType });
}

export async function setUserAskTokens(uid: string, askTokens: number): Promise<void> {
  const token = getStoredToken();
  await apiPost('setAskTokens', { token, targetUserId: uid, askTokens });
}

// ---------------------------------------------------------------------------
// Chat "Tanyakan Pada Pembina"
// ---------------------------------------------------------------------------
export async function startChatThread(input: {
  pembinaName: string;
  subject?: string;
  firstMessage: string;
  usedExemption?: boolean;
}): Promise<{ thread: ChatThread; message: ChatMessage }> {
  const token = getStoredToken();
  const json = await apiPost('startChatThread', { token, ...input });
  return { thread: json.thread, message: json.message };
}

export async function sendChatMessage(threadId: string, text: string): Promise<ChatMessage> {
  const token = getStoredToken();
  const json = await apiPost('sendChatMessage', { token, threadId, text });
  return json.message;
}

export async function closeChatThread(threadId: string): Promise<void> {
  const token = getStoredToken();
  await apiPost('closeChatThread', { token, threadId });
}

// ---------------------------------------------------------------------------
// Unggah foto / video ke Google Drive (lewat Apps Script)
// Sel Google Sheets dibatasi 50.000 karakter, jadi yang disimpan di sel
// hanya link-nya.
// ---------------------------------------------------------------------------
export async function uploadMediaToDrive(
  file: Blob,
  fileName: string
): Promise<{ url: string; type: 'image' | 'video' }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1] || '';
  const token = getStoredToken();
  const json = await apiPost('uploadMedia', {
    token,
    fileName,
    mimeType: file.type,
    dataBase64: base64,
  });
  return { url: json.url, type: json.type };
}

// ---------------------------------------------------------------------------
// Generic polling-based collection store (mirrors a single Sheet tab)
// ---------------------------------------------------------------------------
type Listener = () => void;

function createCollectionStore<T extends { id: string }>(sheetName: string) {
  let cache: T[] = [];
  let ready = false;
  let lastError: string | null = null;
  // Selama ada penyimpanan yang belum selesai, hasil polling tidak boleh
  // menimpa cache (kalau tidak, item yang baru ditambah bisa sempat hilang).
  let pendingWrites = 0;
  let lastWriteError: string | null = null;
  const idleWaiters: Array<() => void> = [];
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((l) => l());
  }

  /** Dipanggil poller pusat dengan isi terbaru tab ini. */
  function applyData(rows: T[]) {
    lastError = null;
    ready = true;
    if (pendingWrites === 0) cache = rows;
    notify();
  }

  /** Dipanggil poller pusat bila tab ini gagal dimuat. */
  function applyError(message: string) {
    lastError = message;
    // Tetap ditandai siap supaya satu tab yang bermasalah tidak membuat
    // seluruh aplikasi macet di layar loading (tab itu kosong dan dicoba lagi
    // di polling berikutnya).
    ready = true;
    notify();
  }

  function reset() {
    ready = false;
    cache = [];
    lastError = null;
    pendingWrites = 0;
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getAll(): T[] {
    return cache;
  }

  function isReady(): boolean {
    return ready;
  }

  function getLastError(): string | null {
    return lastError;
  }

  /** Pesan error penyimpanan terakhir (null bila penyimpanan terakhir berhasil). */
  function getLastWriteError(): string | null {
    return lastWriteError;
  }

  /** Selesai (resolve) begitu semua penyimpanan yang sedang berjalan tuntas. */
  function whenIdle(): Promise<void> {
    if (pendingWrites === 0) return Promise.resolve();
    return new Promise<void>((resolve) => idleWaiters.push(resolve));
  }

  /** Force an immediate refresh of this collection regardless of the timer. */
  async function refresh(): Promise<void> {
    await pollSheets([sheetName]);
  }

  async function runWrite<R>(action: string, work: () => Promise<R>, rollback: () => void): Promise<R> {
    pendingWrites++;
    lastWriteError = null;
    try {
      return await work();
    } catch (e) {
      rollback();
      notify();
      lastWriteError = e instanceof Error ? e.message : String(e);
      reportWriteError(sheetName, action, e);
      throw e;
    } finally {
      pendingWrites--;
      if (pendingWrites === 0) idleWaiters.splice(0).forEach((resolve) => resolve());
    }
  }

  async function add(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const tempId = item.id || `temp-${Date.now()}`;
    const optimisticItem = { ...(item as any), id: tempId } as T;
    cache = [...cache, optimisticItem];
    notify();

    return runWrite(
      'menambah data',
      async () => {
        const token = getStoredToken();
        const json = await apiPost('add', { token, sheet: sheetName, payload: { ...(item as any), id: tempId } });
        cache = cache.map((i) => (i.id === tempId ? json.data : i));
        notify();
        return json.data as T;
      },
      () => {
        cache = cache.filter((i) => i.id !== tempId);
      }
    );
  }

  /** Tambah banyak item sekaligus dalam SATU permintaan ke server. */
  async function addMany(items: T[]): Promise<void> {
    if (items.length === 0) return;
    const ids = new Set(items.map((i) => i.id));
    cache = [...cache, ...items];
    notify();

    await runWrite(
      'menambah banyak data',
      async () => {
        const token = getStoredToken();
        const json = await apiPost('addMany', { token, sheet: sheetName, items });
        const saved: T[] = json.data || items;
        const byId = new Map(saved.map((i) => [i.id, i]));
        cache = cache.map((i) => (ids.has(i.id) ? byId.get(i.id) || i : i));
        notify();
      },
      () => {
        cache = cache.filter((i) => !ids.has(i.id));
      }
    );
  }

  async function update(item: T): Promise<void> {
    const previous = cache;
    cache = cache.map((i) => (i.id === item.id ? item : i));
    notify();
    await runWrite(
      'mengubah data',
      async () => {
        const token = getStoredToken();
        await apiPost('update', { token, sheet: sheetName, payload: item });
      },
      () => {
        cache = previous;
      }
    );
  }

  async function remove(id: string): Promise<void> {
    const previous = cache;
    cache = cache.filter((i) => i.id !== id);
    notify();
    await runWrite(
      'menghapus data',
      async () => {
        const token = getStoredToken();
        await apiPost('delete', { token, sheet: sheetName, id });
      },
      () => {
        cache = previous;
      }
    );
  }

  async function replaceAll(items: T[]): Promise<void> {
    const previous = cache;
    cache = items;
    notify();
    await runWrite(
      'mengganti seluruh data',
      async () => {
        const token = getStoredToken();
        await apiPost('replaceAll', { token, sheet: sheetName, items });
      },
      () => {
        cache = previous;
      }
    );
  }

  return {
    subscribe,
    getAll,
    isReady,
    getLastError,
    getLastWriteError,
    whenIdle,
    refresh,
    add,
    addMany,
    update,
    remove,
    replaceAll,
    sheetName,
    applyData,
    applyError,
    reset,
  };
}

export const toolsStore = createCollectionStore<ToolItem>('Alat_Kerja');
export const ampliStore = createCollectionStore<AmpliItem>('Tipe_Ampli');
export const mediaGuideStore = createCollectionStore<ComponentMediaGuide>('Komponen_Rusak_Bagus');
export const tesAmpliStore = createCollectionStore<TesAmpliItem>('Pengetesan_Amplifier');
export const tesSpeakerStore = createCollectionStore<TesSpeakerItem>('Pengetesan_Speaker');
export const analisisStore = createCollectionStore<AnalisisUnitRecord>('Analisis_Kerusakan');
export const staffStore = createCollectionStore<StaffContact>('Kontak_Staff');
export const serviceLogStore = createCollectionStore<ServiceLogRecord>('Nomor_Service');
export const whitelistStore = createCollectionStore<WhitelistEntry>('Whitelist_Siswa');
export const komponenKatalogStore = createCollectionStore<KomponenItem>('Katalog_Komponen');
export const chatThreadsStore = createCollectionStore<ChatThread>('Chat_Threads');
export const chatMessagesStore = createCollectionStore<ChatMessage>('Chat_Pesan');

const allStores = [
  toolsStore,
  ampliStore,
  mediaGuideStore,
  tesAmpliStore,
  tesSpeakerStore,
  analisisStore,
  staffStore,
  serviceLogStore,
  whitelistStore,
  komponenKatalogStore,
  chatThreadsStore,
  chatMessagesStore,
];

function allStoresList() {
  return allStores;
}

// ---------------------------------------------------------------------------
// Poller pusat: SATU permintaan (getBatch) untuk semua tab, bukan 12
// permintaan terpisah - jauh lebih ringan bagi Apps Script, dan berhenti
// sendiri saat tab browser sedang tidak dilihat.
// ---------------------------------------------------------------------------
let pollTimer: ReturnType<typeof setInterval> | null = null;
let visibilityHandlerAttached = false;
// true bila Code.gs di Apps Script masih versi lama (belum bisa getBatch).
// Aplikasi tetap memuat data lewat cara lama supaya layar tidak kosong, dan
// menampilkan peringatan agar Code.gs segera diperbarui.
let serverOutdated = false;

export function isServerOutdated(): boolean {
  return serverOutdated;
}

async function pollSheetsLegacy(targets: ReturnType<typeof allStoresList>): Promise<void> {
  await Promise.all(
    targets.map(async (store) => {
      try {
        const json = await apiGet('getAll', { sheet: store.sheetName });
        store.applyData(json.data || []);
      } catch (e) {
        store.applyError(e instanceof Error ? e.message : String(e));
      }
    })
  );
}

async function pollSheets(names: string[]): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  const targets = allStores.filter((s) => names.includes(s.sheetName));
  try {
    const json = await apiPost('getBatch', { token, sheets: names });
    serverOutdated = false;
    targets.forEach((store) => {
      const entry = json.data?.[store.sheetName];
      if (!entry) {
        store.applyError('Server tidak mengirim data untuk tab ini.');
      } else if (entry.error) {
        console.error(`[backendService] Gagal memuat "${store.sheetName}":`, entry.error);
        store.applyError(entry.error);
      } else {
        store.applyData(entry.data || []);
      }
    });
  } catch (e) {
    if (e instanceof ApiError && e.code === 'server_outdated') {
      serverOutdated = true;
      await pollSheetsLegacy(targets);
      return;
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error('[backendService] Gagal memuat data:', e);
    targets.forEach((store) => store.applyError(message));
  }
}

function pollAllIfVisible() {
  if (typeof document !== 'undefined' && document.hidden) return;
  void pollSheets(allStores.map((s) => s.sheetName));
}

export function startAllStores(): void {
  if (pollTimer) return;
  void pollSheets(allStores.map((s) => s.sheetName));
  pollTimer = setInterval(pollAllIfVisible, POLL_INTERVAL_MS);
  if (typeof document !== 'undefined' && !visibilityHandlerAttached) {
    visibilityHandlerAttached = true;
    // Begitu pengguna kembali melihat aplikasi, langsung segarkan data.
    document.addEventListener('visibilitychange', () => {
      if (pollTimer && !document.hidden) pollAllIfVisible();
    });
  }
}

export function stopAllStores(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  allStores.forEach((s) => s.reset());
}

export function subscribeToAnyDataChange(listener: Listener): () => void {
  const unsubs = allStores.map((s) => s.subscribe(listener));
  return () => unsubs.forEach((u) => u());
}

export function allStoresReady(): boolean {
  return allStores.every((s) => s.isReady());
}

/** Any collection whose most recent fetch failed - {sheet, error} pairs. */
export function getStoreErrors(): { sheet: string; error: string }[] {
  return allStores
    .filter((s) => s.getLastError())
    .map((s) => ({ sheet: s.sheetName, error: s.getLastError() as string }));
}

/** Force every collection to refetch right now (e.g. a "Sync Now" button). */
export async function refreshAllStoresNow(): Promise<void> {
  await pollSheets(allStores.map((s) => s.sheetName));
}

/** Simple connectivity check against the deployed Apps Script Web App. */
export async function pingBackend(): Promise<void> {
  await apiGet('ping');
  // Ping saja lolos di Code.gs versi lama juga, jadi cek juga apakah server
  // sudah mengenal aksi baru (getBatch).
  const token = getStoredToken();
  if (!token) return;
  try {
    await apiPost('getBatch', { token, sheets: [] });
  } catch (e) {
    if (e instanceof ApiError && e.code === 'server_outdated') throw e;
    // error lain (sesi habis, akun belum disetujui) bukan urusan ping
  }
}

// ---------------------------------------------------------------------------
// Diagnosa koneksi: memeriksa satu per satu dari web sampai Google Sheet dan
// melaporkan di langkah mana yang bermasalah (dipakai panel "Diagnosa Web"
// di Pusat Integrasi). Tidak mengubah data apa pun.
// ---------------------------------------------------------------------------
export interface DiagnosticStep {
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

export async function runDiagnostics(): Promise<{ steps: DiagnosticStep[]; summary: string }> {
  const steps: DiagnosticStep[] = [];
  const add = (label: string, status: DiagnosticStep['status'], detail: string) =>
    steps.push({ label, status, detail });
  const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

  add('Versi web yang tayang', 'ok', APP_BUILD);

  // 1. URL
  if (!APPS_SCRIPT_URL) {
    add('URL Apps Script (VITE_APPS_SCRIPT_URL)', 'fail', 'Kosong. Isi di Vercel > Settings > Environment Variables, lalu Redeploy.');
    return { steps, summary: 'Web belum tahu alamat Apps Script. Isi VITE_APPS_SCRIPT_URL di Vercel lalu Redeploy.' };
  }
  const idMatch = /\/macros\/s\/([^/]+)/.exec(APPS_SCRIPT_URL);
  const idShort = idMatch ? idMatch[1].slice(0, 12) + '…' + idMatch[1].slice(-4) : '(format URL tidak biasa)';
  add('URL Apps Script', idMatch ? 'ok' : 'warn', `ID deployment: ${idShort}${APPS_SCRIPT_URL.endsWith('/exec') ? '' : ' (tidak berakhiran /exec)'}`);

  // 2. ping + versi Code.gs
  let serverVersion: string | null = null;
  let pingOk = false;
  try {
    const json = await apiGet('ping');
    pingOk = true;
    serverVersion = json.version || null;
    if (serverVersion) {
      add('Code.gs di Apps Script', serverVersion === APP_VERSION ? 'ok' : 'warn', `Versi ${serverVersion}${serverVersion === APP_VERSION ? '' : ` (web ${APP_VERSION})`}`);
    } else {
      add('Code.gs di Apps Script', 'fail', 'Merespons, tapi TANPA penanda versi = masih Code.gs LAMA (belum di-deploy New version, atau yang dipakai deployment lain).');
    }
  } catch (e) {
    add('Menghubungi Apps Script', 'fail', errText(e));
  }
  if (!pingOk) {
    return {
      steps,
      summary: 'Apps Script tidak bisa dihubungi / tidak membalas dengan benar. Periksa URL di Vercel dan pengaturan akses deployment ("Siapa saja").',
    };
  }

  // 3. login
  const token = getStoredToken();
  if (!token) {
    add('Login', 'fail', 'Belum login.');
    return { steps, summary: 'Belum login. Masuk dulu, lalu jalankan diagnosa lagi.' };
  }
  try {
    const json = await apiPost('validateToken', { token });
    if (json.valid) {
      add('Sesi login', 'ok', `Akses: ${json.user.accessType}${json.user.accessExpired ? ' (masa berlaku 6 bulan SUDAH habis)' : ''}`);
    } else {
      add('Sesi login', 'fail', 'Token tidak dikenal server. Keluar lalu login lagi.');
    }
  } catch (e) {
    add('Sesi login', 'fail', errText(e));
  }

  // 4. baca semua tab
  const names = allStores.map((s) => s.sheetName);
  let batchOk = false;
  try {
    const json = await apiPost('getBatch', { token, sheets: names });
    batchOk = true;
    const bad: string[] = [];
    names.forEach((n) => {
      const entry = json.data?.[n];
      if (!entry || entry.error) {
        bad.push(`${n}: ${entry?.error || 'tidak ada respons'}`);
      } else {
        add(`Tab ${n}`, 'ok', `${(entry.data || []).length} baris di spreadsheet`);
      }
    });
    bad.forEach((b) => add('Gagal membaca tab', 'fail', b));
  } catch (e) {
    if (e instanceof ApiError && e.code === 'server_outdated') {
      add('Membaca data (cara baru)', 'fail', 'Server tidak mengenal perintah getBatch = Code.gs LAMA.');
      try {
        const json = await apiGet('getAll', { sheet: 'Alat_Kerja' });
        add('Membaca data (cara lama)', 'ok', `Alat_Kerja: ${(json.data || []).length} baris`);
      } catch (e2) {
        add('Membaca data (cara lama)', 'fail', errText(e2));
      }
    } else if (e instanceof ApiError && e.code === 'pending') {
      add('Membaca data', 'warn', 'Akun masih menunggu persetujuan admin / akses 6 bulan habis.');
    } else {
      add('Membaca data (getBatch)', 'fail', errText(e));
    }
  }

  // 5. isi di layar
  const onScreen = allStores.map((s) => `${s.sheetName}=${s.getAll().length}${s.getLastError() ? ' (error)' : ''}`).join(', ');
  add('Data yang sedang tampil di layar', 'ok', onScreen);

  // ringkasan
  let summary: string;
  if (!serverVersion) {
    summary = 'PENYEBAB: Code.gs di Apps Script masih versi lama. Tempel Code.gs terbaru, Save, lalu Deploy > Manage deployments > pilih deployment dengan ID di atas > pensil > Version: New version > Terapkan.';
  } else if (serverVersion !== APP_VERSION) {
    summary = `Versi web (${APP_VERSION}) dan Code.gs (${serverVersion}) berbeda. Samakan keduanya: deploy Code.gs terbaru dan unggah web terbaru.`;
  } else if (!batchOk) {
    summary = 'Code.gs sudah baru tapi pembacaan data gagal. Salin hasil diagnosa ini dan kirim ke Claude.';
  } else if (steps.some((s) => s.status === 'fail')) {
    summary = 'Ada tab yang gagal dibaca (lihat baris merah). Salin hasil diagnosa ini dan kirim ke Claude.';
  } else {
    summary = 'Server dan data normal. Kalau layar masih kosong, muat ulang dengan Ctrl+Shift+R.';
  }
  return { steps, summary };
}
