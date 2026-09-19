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
  KonsultasiTicket,
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
async function apiGet(action: string, params: Record<string, string> = {}): Promise<any> {
  if (!APPS_SCRIPT_URL) throw new Error('Apps Script URL belum dikonfigurasi (VITE_APPS_SCRIPT_URL).');
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Permintaan gagal.');
  return json;
}

async function apiPost(action: string, payload: Record<string, any> = {}): Promise<any> {
  if (!APPS_SCRIPT_URL) throw new Error('Apps Script URL belum dikonfigurasi (VITE_APPS_SCRIPT_URL).');
  // Content-Type text/plain keeps this a CORS "simple request" (no preflight
  // OPTIONS call), which Apps Script Web Apps don't handle. The Apps Script
  // side still parses the body as JSON regardless of the declared type.
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Permintaan gagal.');
  return json;
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
    try {
      const token = getStoredToken();
      const json = await apiPost('listUsers', { token });
      if (!cancelled) callback(json.data);
    } catch (e) {
      console.error('[backendService] Gagal memuat daftar akun:', e);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

export async function setUserAccessType(uid: string, accessType: AccessType): Promise<void> {
  const token = getStoredToken();
  await apiPost('setAccess', { token, targetUserId: uid, accessType });
}

// ---------------------------------------------------------------------------
// Generic polling-based collection store (mirrors a single Sheet tab)
// ---------------------------------------------------------------------------
type Listener = () => void;

function createCollectionStore<T extends { id: string }>(sheetName: string) {
  let cache: T[] = [];
  let ready = false;
  const listeners = new Set<Listener>();
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function notify() {
    listeners.forEach((l) => l());
  }

  async function fetchOnce() {
    try {
      const json = await apiGet('getAll', { sheet: sheetName });
      cache = json.data;
      ready = true;
      notify();
    } catch (e) {
      console.error(`[backendService] Gagal memuat "${sheetName}":`, e);
    }
  }

  function start() {
    if (pollTimer) return;
    fetchOnce();
    pollTimer = setInterval(fetchOnce, POLL_INTERVAL_MS);
  }

  function stop() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    ready = false;
    cache = [];
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

  /** Force an immediate refresh regardless of the polling timer. */
  async function refresh(): Promise<void> {
    await fetchOnce();
  }

  async function add(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const tempId = item.id || `temp-${Date.now()}`;
    const optimisticItem = { ...(item as any), id: tempId } as T;
    cache = [optimisticItem, ...cache];
    notify();

    try {
      const token = getStoredToken();
      const json = await apiPost('add', { token, sheet: sheetName, payload: item });
      cache = cache.map((i) => (i.id === tempId ? json.data : i));
      notify();
      return json.data;
    } catch (e) {
      cache = cache.filter((i) => i.id !== tempId);
      notify();
      throw e;
    }
  }

  async function update(item: T): Promise<void> {
    const previous = cache;
    cache = cache.map((i) => (i.id === item.id ? item : i));
    notify();
    try {
      const token = getStoredToken();
      await apiPost('update', { token, sheet: sheetName, payload: item });
    } catch (e) {
      cache = previous;
      notify();
      throw e;
    }
  }

  async function remove(id: string): Promise<void> {
    const previous = cache;
    cache = cache.filter((i) => i.id !== id);
    notify();
    try {
      const token = getStoredToken();
      await apiPost('delete', { token, sheet: sheetName, id });
    } catch (e) {
      cache = previous;
      notify();
      throw e;
    }
  }

  async function replaceAll(items: T[]): Promise<void> {
    const previous = cache;
    cache = items;
    notify();
    try {
      const token = getStoredToken();
      await apiPost('replaceAll', { token, sheet: sheetName, items });
    } catch (e) {
      cache = previous;
      notify();
      throw e;
    }
  }

  return { start, stop, subscribe, getAll, isReady, refresh, add, update, remove, replaceAll };
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
export const konsultasiStore = createCollectionStore<KonsultasiTicket>('Tiket_Konsultasi');

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
  konsultasiStore,
];

export function startAllStores(): void {
  allStores.forEach((s) => s.start());
}

export function stopAllStores(): void {
  allStores.forEach((s) => s.stop());
}

export function subscribeToAnyDataChange(listener: Listener): () => void {
  const unsubs = allStores.map((s) => s.subscribe(listener));
  return () => unsubs.forEach((u) => u());
}

export function allStoresReady(): boolean {
  return allStores.every((s) => s.isReady());
}

/** Force every collection to refetch right now (e.g. a "Sync Now" button). */
export async function refreshAllStoresNow(): Promise<void> {
  await Promise.all(allStores.map((s) => s.refresh()));
}

/** Simple connectivity check against the deployed Apps Script Web App. */
export async function pingBackend(): Promise<void> {
  await apiGet('ping');
}
