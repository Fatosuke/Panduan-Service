import { 
  WhitelistEntry, 
  AnalisisUnitRecord, 
  ComponentMediaGuide, 
  StaffContact,
  User, 
  AccessType,
  SpreadsheetConfig,
  ServiceLogRecord,
  AmpliItem,
  ToolItem,
  TesAmpliItem,
  TesSpeakerItem,
  KomponenItem,
  ChatThread,
  ChatMessage
} from '../types';
import { 
  INITIAL_WHITELIST, 
  INITIAL_ANALISIS_DATABASE, 
  COMPONENT_MEDIA_GUIDES,
  STAFF_CONTACTS,
  INITIAL_SERVICE_LOGS,
  INITIAL_AMPLIS,
  INITIAL_TOOLS,
  INITIAL_TEST_AMPLI_STEPS,
  INITIAL_TEST_SPEAKER_STEPS,
  INITIAL_KOMPONEN
} from '../data/initialData';
import {
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
  subscribeToAnyDataChange,
  refreshAllStoresNow,
  pingBackend,
  isBackendConfigured,
  getStoreErrors,
  startChatThread,
  sendChatMessage,
  closeChatThread,
} from './backendService';

const STORAGE_KEYS = {
  WHITELIST: 'panduan_service_whitelist',
  ANALYSIS_DB: 'panduan_service_analysis_db',
  MEDIA_GUIDES: 'panduan_service_media_guides',
  STAFF_CONTACTS: 'panduan_service_staff_contacts',
  REGISTERED_USERS: 'panduan_service_registered_users',
  CURRENT_USER: 'panduan_service_current_user',
  SHEET_CONFIG: 'panduan_service_sheet_config',
  SERVICE_LOGS: 'panduan_service_job_records',
  AMPLI_LIST: 'panduan_service_ampli_list',
  TOOLS_LIST: 'panduan_service_tools_list',
  TEST_AMPLI_LIST: 'panduan_service_test_ampli_list',
  TEST_SPEAKER_LIST: 'panduan_service_test_speaker_list'
};

export class SpreadsheetService {

  // Nama kolom yang dikenali saat impor (sudah dinormalkan: huruf kecil tanpa simbol).
  private static readonly ALIAS = {
    tools: {
      id: ['id'], name: ['namaalat', 'name', 'nama'], category: ['kategori', 'category'],
      specs: ['spesifikasi', 'specs'], description: ['deskripsi', 'description'],
      functionDesc: ['fungsimejakerja', 'functiondesc', 'fungsi'], howToUse: ['soppemakaian', 'howtouse', 'sop'],
      safetyTips: ['tipsk3', 'safetytips'], mediaUrl: ['mediaurl', 'urlmedia'], mediaType: ['tipemedia', 'mediatype'],
    },
    ampli: {
      id: ['id'], name: ['namaampli', 'namaproduk', 'name', 'nama'],
      classType: ['kategoriproduk', 'kelastopologi', 'classtype', 'kelas'],
      powerRange: ['dayarms', 'powerrange', 'daya'], voltageSupply: ['teganganpsu', 'voltagesupply', 'tegangan'],
      description: ['deskripsi', 'description'], characteristics: ['karakteristik', 'characteristics'],
      commonFailures: ['titikrawan', 'commonfailures'], schematicTips: ['tipsteknisi', 'schematictips'],
      typicalTransistors: ['semikonduktorutama', 'typicaltransistors', 'semikonduktor'],
      mediaUrl: ['mediaurl', 'urlmedia'], mediaType: ['tipemedia', 'mediatype'],
    },
    media: {
      id: ['id'], title: ['judulkomponen', 'judul', 'title'], mediaType: ['tipemedia', 'mediatype'],
      mediaUrl: ['urlmedia', 'mediaurl'], caption: ['keterangan', 'caption'],
      componentName: ['namakomponen', 'componentname'], goodSymptom: ['gejalanormal', 'goodsymptom'],
      badSymptom: ['gejalarusak', 'badsymptom'], testMethod: ['metodepengujian', 'testmethod'],
      normalValue: ['nilainormal', 'normalvalue'], damagedValue: ['nilairusak', 'damagedvalue'],
    },
    tesAmpli: {
      id: ['id'], num: ['nomorurut', 'num', 'no'], title: ['judullangkah', 'title'], tag: ['kategoritag', 'tag'],
      action: ['tindakansop', 'action'], target: ['targetnormal', 'target'], failure: ['tandakerusakan', 'failure'],
      tips: ['tipsproteksi', 'tips'], mediaUrl: ['mediaurl', 'urlmedia'], mediaType: ['tipemedia', 'mediatype'],
    },
    tesSpeaker: {
      id: ['id'], num: ['nomorurut', 'num', 'no'], title: ['judullangkah', 'title'], method: ['metodeuji', 'method'],
      sop: ['prosedursop', 'sop'], normal: ['responnormal', 'normal'], defect: ['gejalarusak', 'defect'],
      tip: ['tipsteknisi', 'tip'], mediaUrl: ['mediaurl', 'urlmedia'], mediaType: ['tipemedia', 'mediatype'],
    },
    analisis: {
      id: ['id'], unitName: ['namaunit', 'unitname', 'unit'], serialNumber: ['serialnumber', 'sn', 'serial'],
      damagedComponent: ['komponenrusak', 'damagedcomponent'],
      diagnosisResult: ['hasildiagnosadansolusi', 'hasildiagnosa', 'diagnosisresult'],
      rootCause: ['penyebabutama', 'rootcause'], repairSteps: ['langkahperbaikan', 'repairsteps'],
      recommendedParts: ['partpengganti', 'recommendedparts'], difficulty: ['tingkatkesulitan', 'difficulty'],
      estimatedTime: ['estimasiwaktu', 'estimatedtime'],
    },
    staff: {
      id: ['id'], name: ['nama', 'name'], role: ['peran', 'role'], title: ['jabatan', 'title'],
      phone: ['nowhatsapp', 'phone', 'telepon', 'nohp'], email: ['email'], status: ['status'],
      specialty: ['spesialisasi', 'specialty'],
    },
    whitelist: {
      id: ['id'], name: ['namalengkap', 'nama', 'name'], department: ['departemen', 'department'],
      notes: ['catatan', 'notes'], accessType: ['accesstype', 'tipeakses', 'akses'],
    },
    serviceLog: {
      namaYangMengerjakan: ['namayangmengerjakan', 'namapengerja', 'nama'],
      nomorService: ['nomorservice', 'noservice', 'nomor'],
      analisaKerusakan: ['analisakerusakan', 'analisa'],
      komponenDiganti: ['komponenyangdiganti', 'komponendiganti', 'komponen'],
      createdAt: ['tanggal', 'createdat', 'waktu'],
    },
  };

  private static getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private static setStored<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // ==========================================
  // NOTE ON AUTHENTICATION
  // ==========================================
  // Login / daftar / keluar ada di backendService.ts (Google Apps Script,
  // kata sandi di-hash di server). Boleh tidaknya seseorang mengedit
  // ditentukan oleh kolom `accessType` di tab Akun_Pengguna, yang hanya bisa
  // diubah akun Fulltime lewat panel "Kelola Akun" - dan dicek ulang di server.

  // Whitelist / roster - kept as an informational list (e.g. "daftar siswa
  // yang pernah magang"). It is no longer used to decide who gets fulltime
  // access; that is entirely controlled by each account's `accessType`
  // field via the "Kelola Akun" panel.
  public static getWhitelist(): WhitelistEntry[] {
    return whitelistStore.isReady() ? whitelistStore.getAll() : INITIAL_WHITELIST;
  }

  public static saveWhitelist(entries: WhitelistEntry[]): void {
    this.fire(whitelistStore.replaceAll(entries));
  }

  public static addWhitelistEntry(name: string, department = 'Teknisi Audio'): WhitelistEntry {
    const cleanName = name.trim();
    const entryData: Omit<WhitelistEntry, 'id'> = {
      name: cleanName,
      accessType: '6months',
      department,
      notes: 'Ditambahkan via Spreadsheet Manager'
    };
    const tempId = `wl-${Date.now()}`;
    // Fire-and-forget: the store updates its in-memory cache synchronously
    // (before the network write resolves), so getWhitelist() called right
    // after this already reflects the new entry.
    this.fire(whitelistStore.add({ ...entryData, id: tempId }));
    return { id: tempId, ...entryData };
  }

  /**
   * Aturan Otorisasi (server-enforced via google-apps-script/Code.gs):
   * Akun dengan accessType 'fulltime' ATAU 'editor' bisa menambah / mengedit
   * / menghapus / mengimpor data. Akun 'editor' biasanya diberikan ke anak
   * PKL - bisa bantu edit data, tapi tidak bisa membuka panel Kelola Akun
   * (lihat isFulltimeAdmin di bawah).
   */
  public static canEditSpreadsheet(user?: User | null): boolean {
    return this.hasFulltimeAccess(user ?? null);
  }

  public static hasFulltimeAccess(user?: User | null): boolean {
    const targetUser = user ?? null;
    if (!targetUser) return false;
    return targetUser.accessType === 'fulltime' || targetUser.accessType === 'editor';
  }

  /**
   * Stricter than hasFulltimeAccess: true only for real Fulltime admins.
   * Use this (not hasFulltimeAccess) to gate anything that manages OTHER
   * accounts' access level, like the "Kelola Akun" panel - an Editor (PKL)
   * account should never be able to grant itself or others more access.
   */
  public static isFulltimeAdmin(user?: User | null): boolean {
    const targetUser = user ?? null;
    if (!targetUser) return false;
    return targetUser.accessType === 'fulltime';
  }

  /**
   * Subscribe to ANY change in the shared spreadsheet data (local edit or a
   * change made from another device). Call the returned unsubscribe
   * function on unmount. Used by tabs/views to stay in sync in real time.
   */
  public static subscribeToDataChanges(callback: () => void): () => void {
    return subscribeToAnyDataChange(callback);
  }

  /** Force every data tab to refetch immediately (e.g. "Sinkronkan Sekarang" button). */
  public static async refreshAllNow(): Promise<void> {
    await refreshAllStoresNow();
  }

  /** True once VITE_APPS_SCRIPT_URL has been set in .env.local. */
  public static isBackendConfigured(): boolean {
    return isBackendConfigured();
  }

  /** Simple connectivity check against the deployed Apps Script Web App. */
  public static async pingBackend(): Promise<void> {
    await pingBackend();
  }

  /**
   * Any data tab that failed to load on its last try - e.g. because Apps
   * Script hasn't been redeployed with a newer Code.gs yet and doesn't
   * recognize a sheet name. Empty array means everything loaded fine.
   */
  public static getStoreErrors(): { sheet: string; error: string }[] {
    return getStoreErrors();
  }

  // Component Media Guides (Image / Video) for Cara Mengenali Komponen Rusak/Bagus
  public static getMediaGuides(): ComponentMediaGuide[] {
    return mediaGuideStore.isReady() ? mediaGuideStore.getAll() : COMPONENT_MEDIA_GUIDES;
  }

  public static saveMediaGuides(guides: ComponentMediaGuide[]): void {
    this.fire(mediaGuideStore.replaceAll(guides));
  }

  public static addOrUpdateMediaGuide(guide: ComponentMediaGuide): void {
    const exists = this.getMediaGuides().some(g => g.id === guide.id);
    if (exists) {
      this.fire(mediaGuideStore.update(guide));
    } else {
      const id = guide.id || `media-${Date.now()}`;
      this.fire(mediaGuideStore.add({ ...guide, id }));
    }
  }

  /**
   * Format & extract media stream/preview URL from Google Drive, direct MP4/video files, images, data URLs, or blobs.
   */
  public static formatMediaInfo(rawUrl: string, mediaType: 'video' | 'image'): {
    kind: 'html5_video' | 'drive_video' | 'iframe' | 'image';
    streamUrl: string;
    originalUrl: string;
    isGoogleDrive: boolean;
    isDirectFile: boolean;
  } {
    if (!rawUrl) {
      return {
        kind: mediaType === 'video' ? 'html5_video' : 'image',
        streamUrl: '',
        originalUrl: '',
        isGoogleDrive: false,
        isDirectFile: false
      };
    }

    const trimmed = rawUrl.trim();

    // 1. Google Drive Link: drive.google.com/file/d/... or id=...
    const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      if (mediaType === 'video') {
        return {
          kind: 'drive_video',
          streamUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          originalUrl: trimmed,
          isGoogleDrive: true,
          isDirectFile: false
        };
      } else {
        return {
          kind: 'image',
          streamUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
          originalUrl: trimmed,
          isGoogleDrive: true,
          isDirectFile: false
        };
      }
    }

    // 2. YouTube compatibility (if someone still uses it, it won't break)
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      return {
        kind: 'iframe',
        streamUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
        originalUrl: trimmed,
        isGoogleDrive: false,
        isDirectFile: false
      };
    }

    // 3. Direct HTML5 video file formats (.mp4, .webm, .ogg, .mov, data:video, blob:)
    const isVideoFile = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:video/') || trimmed.startsWith('blob:');
    if (isVideoFile || mediaType === 'video') {
      return {
        kind: 'html5_video',
        streamUrl: trimmed,
        originalUrl: trimmed,
        isGoogleDrive: false,
        isDirectFile: true
      };
    }

    // 4. Default to Image
    return {
      kind: 'image',
      streamUrl: trimmed,
      originalUrl: trimmed,
      isGoogleDrive: false,
      isDirectFile: true
    };
  }

  // Analysis Database
  public static getAnalysisRecords(): AnalisisUnitRecord[] {
    return analisisStore.isReady() ? analisisStore.getAll() : INITIAL_ANALISIS_DATABASE;
  }

  public static saveAnalysisRecords(records: AnalisisUnitRecord[]): void {
    this.fire(analisisStore.replaceAll(records));
  }

  // Staff Contacts (Pembina & Admin)
  public static getStaffContacts(): StaffContact[] {
    return staffStore.isReady() ? staffStore.getAll() : STAFF_CONTACTS;
  }

  public static saveStaffContacts(contacts: StaffContact[]): void {
    this.fire(staffStore.replaceAll(contacts));
  }

  // ==========================================
  // KATALOG KOMPONEN ELEKTRONIKA (Pasif / Aktif)
  // ==========================================
  public static getKomponenKatalog(): KomponenItem[] {
    return komponenKatalogStore.isReady() ? komponenKatalogStore.getAll() : INITIAL_KOMPONEN;
  }

  public static saveKomponenKatalog(items: KomponenItem[]): void {
    this.fire(komponenKatalogStore.replaceAll(items));
  }

  public static addKomponenKatalogItem(data: Omit<KomponenItem, 'id'>): KomponenItem {
    const newItem: KomponenItem = { ...data, id: `komp-${Date.now()}` };
    this.fire(komponenKatalogStore.add(newItem));
    return newItem;
  }

  public static updateKomponenKatalogItem(item: KomponenItem): void {
    this.fire(komponenKatalogStore.update(item));
  }

  public static deleteKomponenKatalogItem(id: string): void {
    this.fire(komponenKatalogStore.remove(id));
  }

  public static resetKomponenKatalog(): KomponenItem[] {
    this.saveKomponenKatalog(INITIAL_KOMPONEN);
    return INITIAL_KOMPONEN;
  }

  // ==========================================
  // CHAT "TANYAKAN PADA PEMBINA" (live chat + token, menggantikan sistem
  // tiket lama). Token (askTokens) hanya berlaku untuk akun non-fulltime,
  // dikurangi 1 tiap memulai percakapan baru - dikelola manual oleh admin
  // Fulltime lewat panel Kelola Akun.
  // ==========================================
  public static getChatThreads(): ChatThread[] {
    return chatThreadsStore.isReady() ? chatThreadsStore.getAll() : [];
  }

  public static getChatMessages(): ChatMessage[] {
    return chatMessagesStore.isReady() ? chatMessagesStore.getAll() : [];
  }

  /**
   * Mulai percakapan baru dengan seorang Pembina. Melempar Error dengan
   * message 'no_tokens' kalau akun non-fulltime kehabisan token dan
   * usedExemption tidak diset - komponen UI menangkap ini untuk
   * menampilkan pilihan "baca manual" / "tantangan fisik".
   */
  public static async startChatThread(input: {
    pembinaName: string;
    subject?: string;
    firstMessage: string;
    usedExemption?: boolean;
  }): Promise<{ thread: ChatThread; message: ChatMessage }> {
    const result = await startChatThread(input);
    await Promise.all([chatThreadsStore.refresh(), chatMessagesStore.refresh()]);
    return result;
  }

  public static async sendChatMessage(threadId: string, text: string): Promise<ChatMessage> {
    const message = await sendChatMessage(threadId, text);
    await chatMessagesStore.refresh();
    return message;
  }

  public static async closeChatThread(threadId: string): Promise<void> {
    await closeChatThread(threadId);
    await chatThreadsStore.refresh();
  }

  // ==========================================
  // HELPER UMUM (impor / ekspor)
  // ==========================================

  /** Jalankan penyimpanan di latar belakang; error sudah dilaporkan oleh store. */
  private static fire(p: Promise<unknown>): void {
    p.catch((e) => console.error('[SpreadsheetService] Gagal menyimpan ke spreadsheet:', e));
  }

  private static normHeader(h: unknown): string {
    return String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private static csvCell(val: unknown): string {
    return `"${String(val ?? '').replace(/"/g, '""')}"`;
  }

  /**
   * Baca tabel hasil parseDelimitedText. Kolom dikenali dari NAMA header
   * (urutan kolom bebas, nama versi template maupun nama kolom asli di Sheet
   * sama-sama diterima). Kalau tidak ada header yang dikenali, dipakai urutan
   * kolom bawaan (defaultOrder).
   */
  private static readTable(
    rows: string[][],
    aliases: Record<string, string[]>,
    defaultOrder: string[]
  ): { hasHeader: boolean; records: Record<string, string>[] } {
    const header = rows[0] || [];
    const normed = header.map((h) => this.normHeader(h));
    const colOf: Record<string, number> = {};
    let matched = 0;
    for (const field of Object.keys(aliases)) {
      const idx = normed.findIndex((h) => h && aliases[field].includes(h));
      if (idx !== -1) {
        colOf[field] = idx;
        matched++;
      }
    }
    const hasHeader = matched >= 3;
    const looksLikeHeader =
      !hasHeader &&
      header.filter((c) => /^[A-Za-z]+(_[A-Za-z0-9]+)+$/.test(c.trim()) || /^id$/i.test(c.trim())).length >= 2;
    let order = colOf;
    if (!hasHeader) {
      order = {};
      defaultOrder.forEach((f, i) => {
        order[f] = i;
      });
    }
    const body = hasHeader || looksLikeHeader ? rows.slice(1) : rows;
    const records = body.map((r) => {
      // Semua field dikenal selalu ada (kosong bila kolomnya tidak ada di data).
      const o: Record<string, string> = {};
      Object.keys(aliases).forEach((f) => {
        o[f] = '';
      });
      Object.keys(order).forEach((f) => {
        o[f] = String(r[order[f]] ?? '').trim();
      });
      return o;
    });
    return { hasHeader: hasHeader || looksLikeHeader, records };
  }

  /** ID dari data impor; kalau kosong / kembar dibuatkan ID baru. */
  private static importId(prefix: string, given: string | undefined, i: number, used: Set<string>): string {
    let id = (given || '').trim();
    if (!id || used.has(id)) id = `${prefix}-${Date.now()}-${i}`;
    used.add(id);
    return id;
  }

  private static splitList(raw: string, alsoSemicolon = false): string[] {
    const re = alsoSemicolon ? /\n|\||;/ : /\n|\|/;
    return String(raw || '')
      .split(re)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private static detectMediaType(url: string, explicit?: string): 'image' | 'video' {
    const e = (explicit || '').toLowerCase().trim();
    if (e.includes('video')) return 'video';
    if (e.includes('image') || e.includes('gambar') || e.includes('foto')) return 'image';
    const u = (url || '').toLowerCase();
    if (
      u.startsWith('data:video/') ||
      u.includes('youtu') ||
      /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(u) ||
      /drive\.google\.com\/file\/d\/[^/]+\/preview/.test(u)
    ) {
      return 'video';
    }
    return 'image';
  }

  private static normalizeClassType(raw: string): AmpliItem['classType'] {
    const allowed: AmpliItem['classType'][] = [
      'Amplifier Low Impedance',
      'Amplifier High Impedance',
      'Speaker Low Impedance',
      'Speaker High Impedance',
      'Microphone Kabel',
      'Microphone Wireless',
      'Lain-lain',
    ];
    const v = (raw || '').trim().toLowerCase();
    const exact = allowed.find((a) => a.toLowerCase() === v);
    if (exact) return exact;
    const high = /high|hi-z|hi z|100\s?v|70\s?v/.test(v);
    if (v.includes('mic')) return /wireless|nirkabel/.test(v) ? 'Microphone Wireless' : 'Microphone Kabel';
    if (/speaker|spiker|horn|box|kolom/.test(v)) return high ? 'Speaker High Impedance' : 'Speaker Low Impedance';
    if (/amp|power|mixer/.test(v)) return high ? 'Amplifier High Impedance' : 'Amplifier Low Impedance';
    return 'Lain-lain';
  }

  private static normalizeDifficulty(raw: string): 'Mudah' | 'Sedang' | 'Sulit' | 'Kritis' {
    const v = (raw || '').trim().toLowerCase();
    if (v === 'mudah' || v === 'rendah') return 'Mudah';
    if (v === 'sulit' || v === 'tinggi') return 'Sulit';
    if (v === 'kritis') return 'Kritis';
    return 'Sedang';
  }

  // Robust CSV / TSV parser: kutip ganda, tanda kutip di dalam kutip (""),
  // dan sel yang berisi baris baru (hasil copy dari Google Sheets).
  public static parseDelimitedText(text: string): string[][] {
    const src = String(text || '').replace(/^\uFEFF/, '');
    const firstLine = src.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
    // Prioritas: tab (copy dari Sheets) > koma (CSV) > titik koma.
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(',') ? ',' : firstLine.includes(';') ? ';' : ',';

    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    const pushRow = () => {
      row.push(cell.trim());
      cell = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    };

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
      } else if (ch === '"' && cell.length === 0) {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && src[i + 1] === '\n') i++;
        pushRow();
      } else {
        cell += ch;
      }
    }
    pushRow();
    return rows;
  }

  // Import Whitelist from TSV/CSV string
  public static importWhitelistText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.whitelist, ['name', 'department', 'notes']);
      const used = new Set<string>();
      const entries: WhitelistEntry[] = [];

      records.forEach((r, i) => {
        if (!r.name) return;
        // Level akses: kolom accessType kalau ada; kalau tidak, dibaca dari
        // catatan / departemen ("... - Fulltime" -> fulltime).
        const marker = `${r.accessType} ${r.notes} ${r.department}`.toLowerCase();
        const accessType: WhitelistEntry['accessType'] = marker.includes('full') ? 'fulltime' : '6months';
        entries.push({
          id: this.importId('wl-import', r.id, i, used),
          name: r.name,
          accessType,
          department: r.department || 'Teknisi Audio',
          notes: r.notes || 'Diimpor dari Google Sheets',
        });
      });

      if (entries.length === 0) {
        return { success: false, count: 0, error: 'Tidak ditemukan baris nama yang valid dalam data tersebut.' };
      }

      this.saveWhitelist(entries);
      return { success: true, count: entries.length };
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : 'Gagal memproses data Whitelist' };
    }
  }

  // Import Media (Video & Gambar) from TSV/CSV string
  public static importMediaText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.media, [
        'id', 'title', 'mediaType', 'mediaUrl', 'caption', 'componentName',
        'goodSymptom', 'badSymptom', 'testMethod', 'normalValue', 'damagedValue',
      ]);
      const used = new Set<string>();
      const mediaList: ComponentMediaGuide[] = [];

      records.forEach((r, i) => {
        if (!r.title || !r.mediaUrl) return;
        mediaList.push({
          id: this.importId('guide-import', r.id, i, used),
          title: r.title,
          mediaType: this.detectMediaType(r.mediaUrl, r.mediaType),
          mediaUrl: r.mediaUrl,
          componentName: r.componentName || 'Komponen Elektronika',
          caption: r.caption || 'Panduan media komponen audio',
          goodSymptom: r.goodSymptom || 'Kondisi normal / parameter baik',
          badSymptom: r.badSymptom || 'Kondisi rusak / korslet / short',
          testMethod: r.testMethod || 'Uji menggunakan Multimeter Digital',
          normalValue: r.normalValue || 'Normal',
          damagedValue: r.damagedValue || 'Rusak',
        });
      });

      if (mediaList.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris media yang valid (wajib ada Judul dan URL).' };
      }

      this.saveMediaGuides(mediaList);
      return { success: true, count: mediaList.length };
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : 'Gagal memproses data Media' };
    }
  }

  // Import Analysis Database from TSV/CSV string
  public static importAnalysisText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records: raw } = this.readTable(rows, this.ALIAS.analisis, [
        'unitName', 'serialNumber', 'damagedComponent', 'diagnosisResult', 'rootCause',
        'repairSteps', 'recommendedParts', 'difficulty', 'estimatedTime',
      ]);
      const used = new Set<string>();
      const records: AnalisisUnitRecord[] = [];

      // Pemisah daftar: baris baru / | / ; . Koma hanya dipakai bila tidak ada
      // pemisah lain (koma bisa bagian dari kalimat langkah).
      const toList = (v: string, fallback: string[]): string[] => {
        const parts = this.splitList(v, true);
        if (parts.length > 1) return parts;
        const commaParts = v.includes(',') ? v.split(',').map((x) => x.trim()).filter(Boolean) : parts;
        return commaParts.length > 0 ? commaParts : fallback;
      };

      raw.forEach((r, i) => {
        if (!r.unitName || !r.damagedComponent) return;
        records.push({
          id: this.importId('ana-import', r.id, i, used),
          unitName: r.unitName,
          serialNumber: r.serialNumber || 'SN-GENERIC',
          damagedComponent: r.damagedComponent,
          diagnosisResult: r.diagnosisResult || 'Kerusakan sirkuit teridentifikasi',
          rootCause: r.rootCause || 'Beban berlebih / usia komponen',
          repairSteps: toList(r.repairSteps, ['Periksa fisik', 'Ganti komponen', 'Uji daya']),
          recommendedParts: toList(r.recommendedParts, [r.damagedComponent]),
          difficulty: this.normalizeDifficulty(r.difficulty),
          estimatedTime: r.estimatedTime || '45 Menit',
        });
      });

      if (records.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris analisis valid (wajib ada Nama Unit dan Komponen Rusak).' };
      }

      this.saveAnalysisRecords(records);
      return { success: true, count: records.length };
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : 'Gagal memproses data Analisis' };
    }
  }

  // Import Staff Contacts from TSV/CSV string
  public static importStaffText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.staff, ['name', 'role', 'title', 'phone', 'email', 'specialty']);
      const used = new Set<string>();
      const contacts: StaffContact[] = [];

      records.forEach((r, i) => {
        if (!r.name) return;
        const role: StaffContact['role'] = r.role.toLowerCase() === 'admin' ? 'Admin' : 'Pembina';
        const statusMatch = (['Online', 'Bertugas', 'Standby'] as const).find((st) => st.toLowerCase() === r.status.toLowerCase());
        contacts.push({
          id: this.importId('staff-import', r.id, i, used),
          name: r.name,
          role,
          title: r.title || (role === 'Admin' ? 'Administrator Akses' : 'Pembina Teknis'),
          phone: r.phone || '+62 812-xxxx-xxxx',
          email: r.email || 'kontak@service-audio.id',
          status: statusMatch || 'Online',
          specialty: r.specialty || 'Dukungan Teknis Audio',
        });
      });

      if (contacts.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada kontak valid dalam data.' };
      }

      this.saveStaffContacts(contacts);
      return { success: true, count: contacts.length };
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : 'Gagal memproses data Staff' };
    }
  }

  // Helper template strings for CSV and clipboard copying
  public static getWhitelistTemplateCSV(): string {
    return `Nama_Lengkap,Departemen,Catatan
Vicky,Audio Specialist,Master Engineer - Fulltime
Agas Maulana,Class D Specialist,Master Engineer - Fulltime
Tommy Wijaya,Head of Engineering,Master Engineer - Fulltime
Rian Hidayat,Teknisi Audio,Akses 6 Bulan
Budi Santoso,Teknisi Perakitan,Akses 6 Bulan
Hendra Kurniawan,Quality Control,Akses 6 Bulan
Deni Pratama,Junior Tech,Akses 6 Bulan
Doni Saputra,Teknisi Lapangan,Akses 6 Bulan`;
  }

  public static getAnalysisTemplateCSV(): string {
    return `Nama_Unit,Serial_Number,Komponen_Rusak,Hasil_Diagnosa_dan_Solusi,Penyebab_Utama,Langkah_Perbaikan,Part_Pengganti,Tingkat_Kesulitan,Estimasi_Waktu
Power Amplifier CA20,SN-CA20-00891,Transistor Final 2SC5200 Short,Ganti sepasang TR Final 2SC5200 & 2SA1943 lalu setel ulang trimpot bias ke 25-30mA,Overheat akibat kipas pendingin macet,Bongkar heatsink;Ganti TR Final sepasang;Cek R Kapur 0.47 Ohm;Setel Bias Trimpot,2SC5200;2SA1943;R Kapur 0.47R 5W,Sedang,45 Menit
Power Amplifier RDW FA9000,SN-RDW-7712,Mosfet Driver IRFP260N Terbakar,Ganti Mosfet driver dan IC PWM IRS2092S. Pastikan deadtime generator normal,Beban impedansi di bawah 2 Ohm terlalu lama,Uji jalur gate driver;Ganti Mosfet IRFP260N;Uji output tanpa speaker,Mosfet IRFP260N;IC IRS2092S,Sulit,90 Menit
Subwoofer Aktif 18 Inch B&C,SN-SUB-3301,Spool / Voice Coil Speaker Gosong,Spool short akibat clip sinyal berlebih. Rekomendasi ganti recone kit 4 inch,Sinyal input clipping over gain dari mixer,Bongkar konus lama;Bersihkan celah magnet;Pasang kit spool baru;Lem epoxy,Recone Kit Subwoofer 4 Inch B&C,Sedang,60 Menit
Power Built Up Crown XLi 2500,SN-CRN-5521,Dioda Bridge Utama Korslet,Dioda penyearah 50A short menyebabkan MCB listrik langsung jeglek,Lonjakan tegangan PLN dan NTC softstart jebol,Cek NTC Softstart;Ganti KBU5010 Bridge;Uji bohlam 100W,Dioda Bridge KBPC5010 50A 1000V,Mudah,30 Menit`;
  }

  public static getStaffTemplateCSV(): string {
    return `Nama,Peran,Jabatan,No_WhatsApp,Email,Spesialisasi
Tommy Wijaya,Pembina,Master Audio Engineer & Pengawas Teknis Utama,+62 812-3456-7890,tommy.wijaya@service-audio.id,Troubleshooting Daya Tinggi & Topologi Power Amp
Agas Maulana,Pembina,Spesialis Power Amp Kelas D & SMPS,+62 813-9876-5432,agas.maulana@service-audio.id,Modulasi PWM & Mosfet Driver IRS2092
Vicky,Pembina,Spesialis Karakteristik Komponen & Akustik,+62 821-4567-8910,vicky.audio@service-audio.id,Karakteristik Transistor & Recone Speaker
Lestari Simatupang,Admin,Koordinator Akses Spreadsheet & Registrasi,+62 857-1234-5678,lestari.admin@service-audio.id,Validasi Hak Akses 6 Bulan & Manajemen Database
Mentari Redempta,Admin,Sekretaris Teknis & Lisensi Siswa,+62 878-8765-4321,mentari.license@service-audio.id,Perpanjangan Akun & Layanan Pengaduan Siswa`;
  }

  public static getServiceLogTemplateCSV(): string {
    return `Nama_Yang_Mengerjakan,Nomor_Service,Analisa_Kerusakan,Komponen_Yang_Diganti,Tanggal
Vicky,SRV-2025-001,Power CA20 mati total TR final short 4 set dan bias pincang,Toshiba 2SC5200 & 2SA1943 (4 set); Zener 15V (2 pcs); R Kapur 0.22 Ohm 5W,2025-05-10
Agas Maulana,SRV-2025-002,Ampli Kelas D D2K SMPS suara serak di volume tinggi LC filter overheat,IC IR2110 driver (1 pcs); Mosfet IRFP4227 (2 pcs); Induktor toroid 22uH,2025-05-11
Tommy Wijaya,SRV-2025-003,Speaker aktif 15 inch protek terus menerus DCO bocor 18V ke woofer,Transistor 2N5401 diff-amp (2 pcs); Trimpot DCO 1k multi-turn,2025-05-12`;
  }

  // Trigger browser download of CSV file
  public static downloadCSV(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Parse 2D array of rows from Google Sheets (API or CSV) into AnalisisUnitRecord[]
  public static parseAnalysisRows(rows: any[][]): AnalisisUnitRecord[] {
    if (!rows || rows.length < 2) return [];

    const headers = (rows[0] || []).map(h => String(h || '').trim().toLowerCase());

    // Locate header column indices intelligently
    let unitCol = headers.findIndex(h => h.includes('unit') || h.includes('nama') || h.includes('ampli') || h.includes('tipe'));
    let serialCol = headers.findIndex(h => h.includes('serial') || h.includes('sn') || h.includes('nomor'));
    let damagedCol = headers.findIndex(h => h.includes('komponen') || h.includes('rusak') || h.includes('gejala') || h.includes('temuan'));
    let solutionCol = headers.findIndex(h => h.includes('diagnosa') || h.includes('solusi') || h.includes('hasil') || h.includes('tindakan') || h.includes('langkah'));

    // Fallbacks if headers differ
    if (unitCol === -1) unitCol = 0;
    if (serialCol === -1) serialCol = 1;
    if (damagedCol === -1) damagedCol = 2;
    if (solutionCol === -1) solutionCol = 3;

    const records: AnalisisUnitRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const unitName = String(r[unitCol] || '').trim();
      const damagedComponent = String(r[damagedCol] || '').trim();
      if (!unitName || !damagedComponent) continue;

      const serialNumber = String(r[serialCol] || '').trim() || 'SN-GENERIC';
      const diagnosisResult = String(r[solutionCol] || '').trim() || 'Kerusakan komponen terkonfirmasi di spreadsheet';
      const rootCause = String(r[4] || `Kerusakan ${damagedComponent} pada unit ${unitName}`).trim();
      const repairStepsStr = String(r[5] || diagnosisResult).trim();
      const repairSteps = repairStepsStr.split(/[\n;]/).map(s => s.trim()).filter(Boolean);
      if (repairSteps.length === 0) repairSteps.push(diagnosisResult);

      const partsStr = String(r[6] || damagedComponent).trim();
      const recommendedParts = partsStr.split(/[\n,;]/).map(p => p.trim()).filter(Boolean);
      if (recommendedParts.length === 0) recommendedParts.push(damagedComponent);

      records.push({
        id: `ana-live-${i}-${Date.now()}`,
        unitName,
        serialNumber,
        damagedComponent,
        diagnosisResult,
        rootCause,
        repairSteps,
        recommendedParts,
        difficulty: 'Sedang',
        estimatedTime: '30-45 Menit'
      });
    }

    return records;
  }

  // Real-time analysis fetcher: force-refreshes straight from the master
  // spreadsheet (via Apps Script) before querying, so the check always
  // reflects the latest data even if another device just edited it.
  public static async fetchRealtimeAnalysis(): Promise<{
    success: boolean;
    records: AnalisisUnitRecord[];
    source: 'spreadsheet' | 'local';
    message?: string;
    count: number;
  }> {
    try {
      await analisisStore.refresh();
      const fetchError = analisisStore.getLastError();
      if (fetchError) throw new Error(fetchError);
      const records = this.getAnalysisRecords();
      return {
        success: true,
        records,
        source: 'spreadsheet',
        count: records.length,
        message: `Berhasil mengambil ${records.length} data terbaru dari spreadsheet.`
      };
    } catch (e: any) {
      const localRecords = this.getAnalysisRecords();
      return {
        success: false,
        records: localRecords,
        source: 'local',
        count: localRecords.length,
        message: 'Tidak dapat terhubung ke spreadsheet. Menampilkan data yang terakhir tersimpan.'
      };
    }
  }

  // Find Diagnosis in spreadsheet
  // Step 1: nama unit, Step 2: serial number, Step 3: hasil pengecekan apakah ada komponen yang rusak
  // lalu menampilkan apakah ada data yang sesuai dengan yang di spreadsheet, jika tidak ada akan muncul " tanyakan pada pembina "
  public static queryAnalysis(
    unitName: string, 
    serialNumber: string = '', 
    damagedComponent: string = '',
    recordsOverride?: AnalisisUnitRecord[]
  ): { found: boolean; record?: AnalisisUnitRecord; message?: string } {
    const records = recordsOverride && recordsOverride.length > 0 ? recordsOverride : this.getAnalysisRecords();
    const uClean = (unitName || '').trim().toLowerCase();
    const sClean = (serialNumber || '').trim().toLowerCase();
    const dClean = (damagedComponent || '').trim().toLowerCase();

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uNorm = normalize(uClean);

    // Match criteria:
    // 1. Exact match by Serial Number if provided
    let match = records.find(r => 
      sClean && r.serialNumber && normalize(r.serialNumber) === normalize(sClean)
    );

    // 2. Or matching Unit Name + keyword from damagedComponent
    if (!match && uClean) {
      match = records.find(r => {
        const rUnit = r.unitName.toLowerCase();
        const rUnitNorm = normalize(rUnit);
        
        const unitMatches = rUnit.includes(uClean) || uClean.includes(rUnit) || rUnitNorm.includes(uNorm) || uNorm.includes(rUnitNorm);
        if (!unitMatches) return false;

        // If no damage keywords specified, unit match is enough
        if (!dClean) return true;
        
        // Check if damaged component shares key terms
        const keywords = dClean.split(/[\s,./-]+/).filter(k => k.length >= 2);
        if (keywords.length === 0) return true;

        const rDamaged = r.damagedComponent.toLowerCase();
        const rDiag = r.diagnosisResult.toLowerCase();
        const rRoot = r.rootCause.toLowerCase();

        return keywords.some(k => 
          rDamaged.includes(k) || 
          rDiag.includes(k) || 
          rRoot.includes(k)
        );
      });

      // Fallback: If unit name matches exactly or closely, use unit match even if keyword differs
      if (!match) {
        match = records.find(r => {
          const rUnit = r.unitName.toLowerCase();
          const rUnitNorm = normalize(rUnit);
          return rUnit === uClean || rUnit.includes(uClean) || uClean.includes(rUnit) || (uNorm.length >= 3 && (rUnitNorm.includes(uNorm) || uNorm.includes(rUnitNorm)));
        });
      }
    }

    if (match) {
      return {
        found: true,
        record: match
      };
    }

    return {
      found: false,
      message: 'tanyakan pada pembina'
    };
  }

  // Spreadsheet URL configuration
  public static getSheetConfig(): SpreadsheetConfig {
    return this.getStored<SpreadsheetConfig>(STORAGE_KEYS.SHEET_CONFIG, {
      sheetUrl: '',
      isConnected: false,
      lastSynced: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rowCount: INITIAL_WHITELIST.length + INITIAL_ANALISIS_DATABASE.length,
      autoSyncEnabled: true
    });
  }

  public static saveSheetConfig(config: SpreadsheetConfig): void {
    this.setStored(STORAGE_KEYS.SHEET_CONFIG, config);
  }

  // ==========================================
  // REAL-TIME AUTO-SYNC TO SPREADSHEET METHODS
  // (Syncs new / updated data on the web to Google Spreadsheet)
  // ==========================================

  /**
   * Sync a single analysis record to Google Spreadsheet in real-time
   */
  // These three used to push data to Google Sheets via a separate OAuth
  // connection. They're no-ops now: saveAnalysisRecords()/addServiceLog()
  // already write straight to the master spreadsheet through the Apps
  // Script backend, so there's nothing extra left to sync. Kept as thin
  // wrappers so existing call sites don't need to change.
  public static async syncAnalysisRecordToSpreadsheet(
    record: AnalisisUnitRecord
  ): Promise<{ success: boolean; message: string; method?: string }> {
    await analisisStore.whenIdle();
    const err = analisisStore.getLastWriteError();
    if (err) return { success: false, method: 'apps_script', message: `Gagal menyimpan ke spreadsheet: ${err}` };
    return { success: true, method: 'apps_script', message: `Data untuk "${record.unitName}" tersimpan ke spreadsheet.` };
  }

  public static async syncServiceLogToSpreadsheet(
    log: ServiceLogRecord
  ): Promise<{ success: boolean; message: string; method?: string }> {
    await serviceLogStore.whenIdle();
    const err = serviceLogStore.getLastWriteError();
    if (err) return { success: false, method: 'apps_script', message: `Gagal menyimpan ke spreadsheet: ${err}` };
    return { success: true, method: 'apps_script', message: `Catatan ${log.nomorService} tersimpan ke spreadsheet.` };
  }

  public static async syncAllAnalysisToSpreadsheet(
    records?: AnalisisUnitRecord[]
  ): Promise<{ success: boolean; message: string }> {
    const list = records || this.getAnalysisRecords();
    await analisisStore.whenIdle();
    const err = analisisStore.getLastWriteError();
    if (err) return { success: false, message: `Gagal menyimpan ke spreadsheet: ${err}` };
    return { success: true, message: `${list.length} data analisis tersimpan ke spreadsheet.` };
  }

  // ==========================================
  // SERVICE LOG RECORDS (Catatan Nomor Service)
  // Format: Nama Yang Mengerjakan, Nomor Service, Analisa Kerusakan, Komponen Yang Diganti
  // ==========================================
  public static getServiceLogs(): ServiceLogRecord[] {
    return serviceLogStore.isReady() ? serviceLogStore.getAll() : INITIAL_SERVICE_LOGS;
  }

  public static saveServiceLogs(records: ServiceLogRecord[]): void {
    this.fire(serviceLogStore.replaceAll(records));
  }

  public static addServiceLog(record: {
    namaYangMengerjakan: string;
    nomorService: string;
    analisaKerusakan: string;
    komponenDiganti: string;
  }): ServiceLogRecord {
    const newLog: ServiceLogRecord = {
      id: `srv-${Date.now()}`,
      namaYangMengerjakan: record.namaYangMengerjakan.trim(),
      nomorService: record.nomorService.trim(),
      analisaKerusakan: record.analisaKerusakan.trim(),
      komponenDiganti: record.komponenDiganti.trim(),
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.fire(serviceLogStore.add(newLog));

    // Auto-sync in background to Google Spreadsheet (legacy manual OAuth path,
    // safe to leave: the automatic mirror now runs via GitHub Actions).
    this.syncServiceLogToSpreadsheet(newLog).catch(e => {
      console.warn('Background auto-sync service log:', e);
    });

    return newLog;
  }

  public static deleteServiceLog(id: string): void {
    this.fire(serviceLogStore.remove(id));
  }

  public static importServiceLogsText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length === 0) {
        return { success: false, count: 0, error: 'Data kosong. Tempelkan baris data nomor service.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.serviceLog, [
        'namaYangMengerjakan', 'nomorService', 'analisaKerusakan', 'komponenDiganti', 'createdAt',
      ]);
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const used = new Set<string>();
      const newLogs: ServiceLogRecord[] = [];

      records.forEach((r, i) => {
        if (!r.namaYangMengerjakan || !r.nomorService) return;
        newLogs.push({
          id: this.importId('srv-imp', '', i, used),
          namaYangMengerjakan: r.namaYangMengerjakan,
          nomorService: r.nomorService,
          analisaKerusakan: r.analisaKerusakan || '-',
          komponenDiganti: r.komponenDiganti || '-',
          createdAt: r.createdAt || today,
        });
      });

      if (newLogs.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'Format data tidak sesuai. Pastikan ada kolom: Nama Yang Mengerjakan, Nomor Service, Analisa Kerusakan, Komponen Yang Diganti',
        };
      }

      // Hanya MENAMBAH catatan baru (satu permintaan) - catatan yang sudah ada
      // (termasuk milik akun lain) tidak ikut ditulis ulang / ditimpa.
      this.fire(serviceLogStore.addMany(newLogs));
      return { success: true, count: newLogs.length };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memproses data';
      return { success: false, count: 0, error: msg };
    }
  }

  public static exportServiceLogsCSV(): string {
    const logs = this.getServiceLogs();
    const header = 'Nama_Yang_Mengerjakan,Nomor_Service,Analisa_Kerusakan,Komponen_Yang_Diganti,Tanggal';
    const rows = logs.map(l => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        escape(l.namaYangMengerjakan),
        escape(l.nomorService),
        escape(l.analisaKerusakan),
        escape(l.komponenDiganti),
        escape(l.createdAt)
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  // Parse CSV from Google Sheets export URL with auto detection
  public static async syncFromSheetUrl(
    url: string,
    confirmReplace?: (tabLabel: string) => boolean
  ): Promise<{ success: boolean; count: number; detectedType?: string; error?: string }> {
    try {
      if (!url || !url.startsWith('http')) {
        throw new Error('URL Spreadsheet tidak valid. Harap gunakan link Google Sheets publish to web CSV.');
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Gagal mengambil data dari Google Sheets (HTTP ${res.status})`);
      }

      const text = await res.text();
      // Jenis tab dikenali dari NAMA kolom di baris pertama (format template
      // maupun nama kolom asli di Sheet). Kalau tidak dikenali, impor
      // DIBATALKAN - tidak lagi diam-diam dianggap Whitelist.
      const h = this.normHeader(text.split(/\r?\n/)[0] || '');
      const has = (...keys: string[]) => keys.some((k) => h.includes(k));

      let detectedType: string;
      let run: (t: string) => { success: boolean; count: number; error?: string };

      if (has('nomorservice', 'namayangmengerjakan')) {
        detectedType = 'Catatan Nomor Service';
        run = (t) => this.importServiceLogsText(t);
      } else if (has('serialnumber', 'unitname', 'namaunit')) {
        detectedType = 'Database Analisis Unit';
        run = (t) => this.importAnalysisText(t);
      } else if (has('namaalat', 'soppemakaian', 'fungsimejakerja', 'howtouse')) {
        detectedType = 'Tab 1: Alat-Alat Meja Kerja';
        run = (t) => this.importToolsText(t);
      } else if (has('namaampli', 'classtype', 'dayarms', 'powerrange')) {
        detectedType = 'Tab 2: Nama & Tipe Ampli';
        run = (t) => this.importAmpliText(t);
      } else if (has('tindakansop', 'tipsproteksi', 'targetnormal')) {
        detectedType = 'Tab 4: Pengetesan Amplifier';
        run = (t) => this.importTestAmpliText(t);
      } else if (has('metodeuji', 'prosedursop', 'responnormal')) {
        detectedType = 'Tab 5: Pengetesan Speaker';
        run = (t) => this.importTestSpeakerText(t);
      } else if (has('judulkomponen', 'gejalanormal', 'componentname')) {
        detectedType = 'Tab 3: Komponen Rusak/Bagus';
        run = (t) => this.importMediaText(t);
      } else if (has('nowhatsapp', 'jabatan', 'spesialisasi')) {
        detectedType = 'Kontak Pembina & Admin';
        run = (t) => this.importStaffText(t);
      } else if (has('namalengkap', 'departemen')) {
        detectedType = 'Whitelist Pengguna';
        run = (t) => this.importWhitelistText(t);
      } else {
        throw new Error('Jenis tabel tidak dikenali dari baris header. Pastikan baris pertama berisi nama kolom sesuai template.');
      }

      if (confirmReplace && !confirmReplace(detectedType)) {
        return { success: false, count: 0, detectedType, error: 'Impor dibatalkan.' };
      }

      const result = run(text);
      if (!result.success) {
        throw new Error(result.error);
      }

      this.saveSheetConfig({
        sheetUrl: url,
        isConnected: true,
        lastSynced: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rowCount: result.count
      });

      return { success: true, count: result.count, detectedType };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi';
      return { success: false, count: 0, error: msg };
    }
  }

  // ==========================================
  // TAB 1: ALAT-ALAT KERJA (TOOLS)
  // ==========================================
  public static getToolsList(): ToolItem[] {
    return toolsStore.isReady() ? toolsStore.getAll() : INITIAL_TOOLS;
  }

  public static saveToolsList(items: ToolItem[]): void {
    this.fire(toolsStore.replaceAll(items));
  }

  public static addToolItem(data: Omit<ToolItem, 'id'>): ToolItem {
    const newItem: ToolItem = { ...data, id: `tool-${Date.now()}` };
    this.fire(toolsStore.add(newItem));
    return newItem;
  }

  public static updateToolItem(item: ToolItem): void {
    this.fire(toolsStore.update(item));
  }

  public static deleteToolItem(id: string): void {
    this.fire(toolsStore.remove(id));
  }

  public static resetToolsList(): ToolItem[] {
    this.saveToolsList(INITIAL_TOOLS);
    return INITIAL_TOOLS;
  }

  // ==========================================
  // TAB 2: NAMA & TIPE AMPLI MANAGEMENT
  // ==========================================
  public static getAmpliList(): AmpliItem[] {
    return ampliStore.isReady() ? ampliStore.getAll() : INITIAL_AMPLIS;
  }

  public static saveAmpliList(items: AmpliItem[]): void {
    this.fire(ampliStore.replaceAll(items));
  }

  public static addAmpliItem(data: Omit<AmpliItem, 'id'>): AmpliItem {
    const newItem: AmpliItem = { ...data, id: `amp-${Date.now()}` };
    this.fire(ampliStore.add(newItem));
    return newItem;
  }

  public static updateAmpliItem(item: AmpliItem): void {
    this.fire(ampliStore.update(item));
  }

  public static deleteAmpliItem(id: string): void {
    this.fire(ampliStore.remove(id));
  }

  public static resetAmpliList(): AmpliItem[] {
    this.saveAmpliList(INITIAL_AMPLIS);
    return INITIAL_AMPLIS;
  }

  // ==========================================
  // TAB 3: MEDIA GUIDES / KOMPONEN RUSAK BAGUS
  // ==========================================
  public static addMediaGuideItem(data: Omit<ComponentMediaGuide, 'id'>): ComponentMediaGuide {
    const newItem: ComponentMediaGuide = { ...data, id: `guide-${Date.now()}` };
    this.fire(mediaGuideStore.add(newItem));
    return newItem;
  }

  public static updateMediaGuideItem(item: ComponentMediaGuide): void {
    this.fire(mediaGuideStore.update(item));
  }

  public static deleteMediaGuideItem(id: string): void {
    this.fire(mediaGuideStore.remove(id));
  }

  public static resetMediaGuides(): ComponentMediaGuide[] {
    this.saveMediaGuides(COMPONENT_MEDIA_GUIDES);
    return COMPONENT_MEDIA_GUIDES;
  }

  // ==========================================
  // TAB 4: PENGETESAN AMPLIFIER STEPS
  // ==========================================
  public static getTestAmpliList(): TesAmpliItem[] {
    return tesAmpliStore.isReady() ? tesAmpliStore.getAll() : INITIAL_TEST_AMPLI_STEPS;
  }

  public static saveTestAmpliList(items: TesAmpliItem[]): void {
    this.fire(tesAmpliStore.replaceAll(items));
  }

  public static addTestAmpliItem(data: Omit<TesAmpliItem, 'id'>): TesAmpliItem {
    const newItem: TesAmpliItem = { ...data, id: `step-amp-${Date.now()}` };
    this.fire(tesAmpliStore.add(newItem));
    return newItem;
  }

  public static updateTestAmpliItem(item: TesAmpliItem): void {
    this.fire(tesAmpliStore.update(item));
  }

  public static deleteTestAmpliItem(id: string): void {
    this.fire(tesAmpliStore.remove(id));
  }

  public static resetTestAmpliList(): TesAmpliItem[] {
    this.saveTestAmpliList(INITIAL_TEST_AMPLI_STEPS);
    return INITIAL_TEST_AMPLI_STEPS;
  }

  // ==========================================
  // TAB 5: PENGETESAN SPEAKER STEPS
  // ==========================================
  public static getTestSpeakerList(): TesSpeakerItem[] {
    return tesSpeakerStore.isReady() ? tesSpeakerStore.getAll() : INITIAL_TEST_SPEAKER_STEPS;
  }

  public static saveTestSpeakerList(items: TesSpeakerItem[]): void {
    this.fire(tesSpeakerStore.replaceAll(items));
  }

  public static addTestSpeakerItem(data: Omit<TesSpeakerItem, 'id'>): TesSpeakerItem {
    const newItem: TesSpeakerItem = { ...data, id: `step-spk-${Date.now()}` };
    this.fire(tesSpeakerStore.add(newItem));
    return newItem;
  }

  public static updateTestSpeakerItem(item: TesSpeakerItem): void {
    this.fire(tesSpeakerStore.update(item));
  }

  public static deleteTestSpeakerItem(id: string): void {
    this.fire(tesSpeakerStore.remove(id));
  }

  public static resetTestSpeakerList(): TesSpeakerItem[] {
    this.saveTestSpeakerList(INITIAL_TEST_SPEAKER_STEPS);
    return INITIAL_TEST_SPEAKER_STEPS;
  }

  // ==========================================
  // TEMPLATES & EXPORT/IMPORT CSV FOR ALL 5 TABS
  // ==========================================

  // --- TAB 1: ALAT KERJA ---
  public static getToolsTemplateCSV(): string {
    return `ID,Nama_Alat,Kategori,Spesifikasi,Deskripsi,Fungsi_Meja_Kerja,SOP_Pemakaian,Tips_K3,Media_URL,Tipe_Media
tool-1,Multimeter Digital True RMS,Pengukuran,6000 Counts AC/DC 1000V,Alat ukur presisi untuk tegangan DC DCO dan bias,Mengukur tegangan rail catu daya dan DCO,Nyalakan mode auto-range | Pasang probe hitam ke ground,Gunakan probe berinsulasi tinggi saat mengukur tegangan tinggi,https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop,image
tool-2,Osiloskop Digital Dual Channel,Pengukuran,100MHz Bandwidth 1GSa/s,Menganalisis bentuk gelombang output sinus kliping dan osilasi,Visualisasi sinyal audio riil,Hubungkan probe x10 ke output dummy load,Gunakan isolator ground jika osiloskop tidak berisolasi,https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop,image
tool-3,Solder Station Temperature Controlled,Solder & Pasang,60W - 80W 200C - 480C Adjustable,Penyolderan presisi komponen PCB audio tanpa merusak jalur tembaga,Pemasangan transistor dan komponen pasif,Set suhu 320C untuk timah 60/40,Selalu bersihkan mata solder di sponge basah,https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop,image`;
  }

  public static exportToolsCSV(): string {
    const list = this.getToolsList();
    const header = 'ID,Nama_Alat,Kategori,Spesifikasi,Deskripsi,Fungsi_Meja_Kerja,SOP_Pemakaian,Tips_K3,Media_URL,Tipe_Media';
    const rows = list.map(t => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        escape(t.id),
        escape(t.name),
        escape(t.category),
        escape(t.specs),
        escape(t.description),
        escape(t.functionDesc || ''),
        escape((t.howToUse || []).join(' | ')),
        escape((t.safetyTips || []).join(' | ')),
        escape(t.mediaUrl || ''),
        escape(t.mediaType || 'image')
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  public static importToolsText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { hasHeader, records } = this.readTable(rows, this.ALIAS.tools, [
        'id', 'name', 'category', 'specs', 'description', 'functionDesc', 'howToUse', 'safetyTips', 'mediaUrl', 'mediaType',
      ]);
      const used = new Set<string>();
      const tools: ToolItem[] = [];
      records.forEach((r, i) => {
        const name = r.name || (!hasHeader ? r.id : '');
        if (!name) return;
        tools.push({
          id: this.importId('tool', r.name ? r.id : '', i, used),
          name,
          category: (r.category || 'Pengukuran') as ToolItem['category'],
          specs: r.specs,
          description: r.description,
          functionDesc: r.functionDesc,
          howToUse: this.splitList(r.howToUse),
          safetyTips: this.splitList(r.safetyTips),
          mediaUrl: r.mediaUrl,
          mediaType: this.detectMediaType(r.mediaUrl, r.mediaType),
        });
      });
      if (tools.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris alat yang valid.' };
      }
      this.saveToolsList(tools);
      return { success: true, count: tools.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Gagal memproses data Alat Kerja' };
    }
  }

  // --- TAB 2: TIPE AMPLI ---
  public static getAmpliTemplateCSV(): string {
    // Urutan kolom SAMA dengan tab Tipe_Ampli di Google Sheet.
    return `ID,Nama_Ampli,Kategori_Produk,Daya_RMS,Tegangan_PSU,Deskripsi,Karakteristik,Titik_Rawan,Tips_Teknisi,Semikonduktor_Utama,Media_URL,Tipe_Media
amp-contoh-1,ZA-2240 (contoh),Amplifier Low Impedance,(isi daya RMS unit),(isi tegangan kerja),Contoh deskripsi singkat produk,Karakteristik pertama | Karakteristik kedua,Titik rawan pertama | Titik rawan kedua,Contoh tips teknisi saat servis,(isi semikonduktor utama),,image`;
  }

  public static exportAmpliCSV(): string {
    const list = this.getAmpliList();
    const header = 'ID,Nama_Ampli,Kategori_Produk,Daya_RMS,Tegangan_PSU,Deskripsi,Karakteristik,Titik_Rawan,Tips_Teknisi,Semikonduktor_Utama,Media_URL,Tipe_Media';
    const rows = list.map((a) =>
      [
        a.id, a.name, a.classType, a.powerRange, a.voltageSupply, a.description,
        (a.characteristics || []).join(' | '), (a.commonFailures || []).join(' | '),
        a.schematicTips || '', a.typicalTransistors || '', a.mediaUrl || '', a.mediaType || 'image',
      ].map((v) => this.csvCell(v)).join(',')
    );
    return [header, ...rows].join('\n');
  }

  public static importAmpliText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { hasHeader, records } = this.readTable(rows, this.ALIAS.ampli, [
        'id', 'name', 'classType', 'powerRange', 'voltageSupply', 'description',
        'characteristics', 'commonFailures', 'schematicTips', 'typicalTransistors', 'mediaUrl', 'mediaType',
      ]);
      const used = new Set<string>();
      const amplis: AmpliItem[] = [];
      records.forEach((r, i) => {
        const name = r.name || (!hasHeader ? r.id : '');
        if (!name) return;
        amplis.push({
          id: this.importId('amp', r.name ? r.id : '', i, used),
          name,
          classType: this.normalizeClassType(r.classType),
          powerRange: r.powerRange,
          voltageSupply: r.voltageSupply,
          typicalTransistors: r.typicalTransistors,
          description: r.description,
          characteristics: this.splitList(r.characteristics),
          commonFailures: this.splitList(r.commonFailures),
          schematicTips: r.schematicTips,
          mediaUrl: r.mediaUrl,
          mediaType: this.detectMediaType(r.mediaUrl, r.mediaType),
        });
      });
      if (amplis.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris tipe ampli yang valid.' };
      }
      this.saveAmpliList(amplis);
      return { success: true, count: amplis.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Gagal memproses data Tipe Ampli' };
    }
  }

  // --- TAB 3: KOMPONEN RUSAK/BAGUS (MEDIA) ---
  public static getMediaTemplateCSV(): string {
    // Urutan kolom SAMA dengan tab Komponen_Rusak_Bagus di Google Sheet.
    return `ID,Judul_Komponen,Tipe_Media,URL_Media,Keterangan,Nama_Komponen,Gejala_Normal,Gejala_Rusak,Metode_Pengujian,Nilai_Normal,Nilai_Rusak
guide-contoh-1,Transistor Final (contoh),video,https://www.youtube.com/watch?v=ID_VIDEO,Keterangan singkat media,Transistor Bipolar NPN,Gejala saat komponen normal,Gejala saat komponen rusak,Uji skala Dioda Multimeter Digital,Nilai ukur normal,Nilai ukur rusak`;
  }

  public static exportMediaCSV(): string {
    const list = this.getMediaGuides();
    const header = 'ID,Judul_Komponen,Tipe_Media,URL_Media,Keterangan,Nama_Komponen,Gejala_Normal,Gejala_Rusak,Metode_Pengujian,Nilai_Normal,Nilai_Rusak';
    const rows = list.map((g) =>
      [
        g.id, g.title, g.mediaType, g.mediaUrl, g.caption, g.componentName,
        g.goodSymptom, g.badSymptom, g.testMethod, g.normalValue, g.damagedValue,
      ].map((v) => this.csvCell(v)).join(',')
    );
    return [header, ...rows].join('\n');
  }

  // --- TAB 4: PENGETESAN AMPLIFIER ---
  public static getTestAmpliTemplateCSV(): string {
    return `ID,Nomor_Urut,Judul_Langkah,Kategori_Tag,Tindakan_SOP,Target_Normal,Tanda_Kerusakan,Tips_Proteksi,Media_URL,Tipe_Media
step-amp-contoh-1,1,Judul langkah pengetesan (contoh),Proteksi Wajib,Tindakan yang dilakukan,Hasil yang diharapkan normal,Tanda bila ada kerusakan,Tips pengaman,,image`;
  }

  public static exportTestAmpliCSV(): string {
    const list = this.getTestAmpliList();
    const header = 'ID,Nomor_Urut,Judul_Langkah,Kategori_Tag,Tindakan_SOP,Target_Normal,Tanda_Kerusakan,Tips_Proteksi,Media_URL,Tipe_Media';
    const rows = list.map((s) =>
      [s.id, String(s.num), s.title, s.tag, s.action, s.target, s.failure, s.tips, s.mediaUrl || '', s.mediaType || 'image']
        .map((v) => this.csvCell(v)).join(',')
    );
    return [header, ...rows].join('\n');
  }

  public static importTestAmpliText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.tesAmpli, [
        'id', 'num', 'title', 'tag', 'action', 'target', 'failure', 'tips', 'mediaUrl', 'mediaType',
      ]);
      const used = new Set<string>();
      const steps: TesAmpliItem[] = [];
      records.forEach((r, i) => {
        if (!r.title) return;
        steps.push({
          id: this.importId('step-amp', r.id, i, used),
          num: Number(r.num) || steps.length + 1,
          title: r.title,
          tag: r.tag || 'Pengujian SOP',
          action: r.action,
          target: r.target,
          failure: r.failure,
          tips: r.tips,
          mediaUrl: r.mediaUrl,
          mediaType: this.detectMediaType(r.mediaUrl, r.mediaType),
        });
      });
      if (steps.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris langkah tes ampli yang valid.' };
      }
      this.saveTestAmpliList(steps);
      return { success: true, count: steps.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Gagal memproses data Pengetesan Amplifier' };
    }
  }

  // --- TAB 5: PENGETESAN SPEAKER ---
  public static getTestSpeakerTemplateCSV(): string {
    return `ID,Nomor_Urut,Judul_Langkah,Metode_Uji,Prosedur_SOP,Respon_Normal,Gejala_Rusak,Tips_Teknisi,Media_URL,Tipe_Media
step-spk-contoh-1,1,Judul langkah pengetesan speaker (contoh),Visual & Sentuhan,Prosedur yang dilakukan,Respon saat normal,Gejala saat rusak,Tips teknisi,,image`;
  }

  public static exportTestSpeakerCSV(): string {
    const list = this.getTestSpeakerList();
    const header = 'ID,Nomor_Urut,Judul_Langkah,Metode_Uji,Prosedur_SOP,Respon_Normal,Gejala_Rusak,Tips_Teknisi,Media_URL,Tipe_Media';
    const rows = list.map((s) =>
      [s.id, String(s.num), s.title, s.method, s.sop, s.normal, s.defect, s.tip, s.mediaUrl || '', s.mediaType || 'image']
        .map((v) => this.csvCell(v)).join(',')
    );
    return [header, ...rows].join('\n');
  }

  public static importTestSpeakerText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const { records } = this.readTable(rows, this.ALIAS.tesSpeaker, [
        'id', 'num', 'title', 'method', 'sop', 'normal', 'defect', 'tip', 'mediaUrl', 'mediaType',
      ]);
      const used = new Set<string>();
      const steps: TesSpeakerItem[] = [];
      records.forEach((r, i) => {
        if (!r.title) return;
        steps.push({
          id: this.importId('step-spk', r.id, i, used),
          num: Number(r.num) || steps.length + 1,
          title: r.title,
          method: r.method,
          sop: r.sop,
          normal: r.normal,
          defect: r.defect,
          tip: r.tip,
          mediaUrl: r.mediaUrl,
          mediaType: this.detectMediaType(r.mediaUrl, r.mediaType),
        });
      });
      if (steps.length === 0) {
        return { success: false, count: 0, error: 'Tidak ada baris langkah tes speaker yang valid.' };
      }
      this.saveTestSpeakerList(steps);
      return { success: true, count: steps.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Gagal memproses data Pengetesan Speaker' };
    }
  }

}


