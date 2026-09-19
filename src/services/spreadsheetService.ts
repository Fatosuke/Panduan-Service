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
  KonsultasiTicket
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
  konsultasiStore,
  subscribeToAnyDataChange,
  refreshAllStoresNow,
  pingBackend,
  isBackendConfigured,
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
  // Real login/register/logout now live in firebaseService.ts (Firebase
  // Authentication, real password verification) and are called directly
  // from AuthScreen.tsx / App.tsx. The old name-matching verifyNameAccess()
  // and the fake localStorage-only registerUser()/login() are gone - they
  // let anyone become a fulltime admin just by typing "Vicky" as their
  // name. Whether someone can edit is now decided by the `accessType`
  // field on their account document in Firestore, which only an existing
  // fulltime admin (or Vicky herself, once, from the Firebase Console) can
  // set - and that rule is enforced server-side by firestore.rules.

  // Whitelist / roster - kept as an informational list (e.g. "daftar siswa
  // yang pernah magang"). It is no longer used to decide who gets fulltime
  // access; that is entirely controlled by each account's Firestore
  // `accessType` field via the "Kelola Akun" panel.
  public static getWhitelist(): WhitelistEntry[] {
    return whitelistStore.isReady() ? whitelistStore.getAll() : INITIAL_WHITELIST;
  }

  public static saveWhitelist(entries: WhitelistEntry[]): void {
    void whitelistStore.replaceAll(entries);
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
    void whitelistStore.add({ ...entryData, id: tempId });
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
   * Subscribe to ANY change in the shared Firestore data (local edit or a
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

  // Component Media Guides (Image / Video) for Cara Mengenali Komponen Rusak/Bagus
  public static getMediaGuides(): ComponentMediaGuide[] {
    return mediaGuideStore.isReady() ? mediaGuideStore.getAll() : COMPONENT_MEDIA_GUIDES;
  }

  public static saveMediaGuides(guides: ComponentMediaGuide[]): void {
    void mediaGuideStore.replaceAll(guides);
  }

  public static addOrUpdateMediaGuide(guide: ComponentMediaGuide): void {
    const exists = this.getMediaGuides().some(g => g.id === guide.id);
    if (exists) {
      void mediaGuideStore.update(guide);
    } else {
      const id = guide.id || `media-${Date.now()}`;
      void mediaGuideStore.add({ ...guide, id });
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
    void analisisStore.replaceAll(records);
  }

  // Staff Contacts (Pembina & Admin)
  public static getStaffContacts(): StaffContact[] {
    return staffStore.isReady() ? staffStore.getAll() : STAFF_CONTACTS;
  }

  public static saveStaffContacts(contacts: StaffContact[]): void {
    void staffStore.replaceAll(contacts);
  }

  // ==========================================
  // KATALOG KOMPONEN ELEKTRONIKA (Pasif / Aktif)
  // ==========================================
  public static getKomponenKatalog(): KomponenItem[] {
    return komponenKatalogStore.isReady() ? komponenKatalogStore.getAll() : INITIAL_KOMPONEN;
  }

  public static saveKomponenKatalog(items: KomponenItem[]): void {
    void komponenKatalogStore.replaceAll(items);
  }

  public static addKomponenKatalogItem(data: Omit<KomponenItem, 'id'>): KomponenItem {
    const newItem: KomponenItem = { ...data, id: `komp-${Date.now()}` };
    void komponenKatalogStore.add(newItem);
    return newItem;
  }

  public static updateKomponenKatalogItem(item: KomponenItem): void {
    void komponenKatalogStore.update(item);
  }

  public static deleteKomponenKatalogItem(id: string): void {
    void komponenKatalogStore.remove(id);
  }

  public static resetKomponenKatalog(): KomponenItem[] {
    this.saveKomponenKatalog(INITIAL_KOMPONEN);
    return INITIAL_KOMPONEN;
  }

  // ==========================================
  // TIKET KONSULTASI ("Tanyakan Pada Pembina")
  // Siapapun yang sudah login & disetujui (bukan cuma Fulltime/Editor) bisa
  // membuat tiket - hanya akun Fulltime/Editor yang bisa menjawab / mengubah
  // statusnya (lihat requireSignedIn_ vs requireEditAccess_ di Code.gs).
  // ==========================================
  public static getKonsultasiTickets(): KonsultasiTicket[] {
    return konsultasiStore.isReady() ? konsultasiStore.getAll() : [];
  }

  public static addKonsultasiTicket(data: Omit<KonsultasiTicket, 'id' | 'status' | 'createdAt'>): KonsultasiTicket {
    const newTicket: KonsultasiTicket = {
      ...data,
      id: `tiket-${Date.now()}`,
      status: 'Menunggu',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    void konsultasiStore.add(newTicket);
    return newTicket;
  }

  public static answerKonsultasiTicket(id: string, jawaban: string): void {
    const ticket = this.getKonsultasiTickets().find(t => t.id === id);
    if (!ticket) return;
    const updated: KonsultasiTicket = {
      ...ticket,
      jawaban,
      status: 'Dijawab',
      answeredAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    void konsultasiStore.update(updated);
  }

  // Robust CSV / TSV parser that supports quotes, commas, tabs (copy-paste from Google Sheets)
  public static parseDelimitedText(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const rows: string[][] = [];

    for (const line of lines) {
      // Determine delimiter: tab (if copy-pasted from spreadsheet) or comma
      const isTab = line.includes('\t');
      const delimiter = isTab ? '\t' : ',';

      const row: string[] = [];
      let inQuotes = false;
      let cell = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(cell.trim().replace(/^["']|["']$/g, ''));
          cell = '';
        } else {
          cell += char;
        }
      }
      row.push(cell.trim().replace(/^["']|["']$/g, ''));
      rows.push(row);
    }

    return rows;
  }

  // Import Whitelist from TSV/CSV string
  public static importWhitelistText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki header dan 1 baris data.' };
      }

      // Check header or skip header if it starts with "nama"
      const startIndex = rows[0][0].toLowerCase().includes('nama') ? 1 : 0;
      const entries: WhitelistEntry[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const name = row[0]?.trim();
        if (!name) continue;

        entries.push({
          id: `wl-import-${Date.now()}-${i}`,
          name,
          accessType: row[1]?.toLowerCase().includes('full') ? 'fulltime' : '6months',
          department: row[1] || 'Teknisi Audio',
          notes: row[2] || 'Diimpor dari Google Sheets'
        });
      }

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
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki header dan 1 baris data.' };
      }

      const startIndex = (rows[0][0].toLowerCase().includes('judul') || rows[0][0].toLowerCase().includes('title')) ? 1 : 0;
      const mediaList: ComponentMediaGuide[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const title = row[0]?.trim();
        const rawType = row[1]?.trim().toLowerCase();
        const mediaType: 'video' | 'image' = rawType.includes('image') || rawType.includes('gambar') || rawType.includes('foto') ? 'image' : 'video';
        const mediaUrl = row[2]?.trim();
        const componentName = row[3]?.trim() || 'Komponen Elektronika';
        const caption = row[4]?.trim() || 'Panduan media komponen audio';

        if (!title || !mediaUrl) continue;

        mediaList.push({
          id: `med-import-${Date.now()}-${i}`,
          title,
          mediaType,
          mediaUrl,
          componentName,
          caption,
          goodSymptom: row[5]?.trim() || 'Kondisi normal / parameter baik',
          badSymptom: row[6]?.trim() || 'Kondisi rusak / korslet / short',
          testMethod: row[7]?.trim() || 'Uji menggunakan Multimeter Digital',
          normalValue: 'Normal',
          damagedValue: 'Rusak'
        });
      }

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
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki header dan 1 baris data.' };
      }

      const startIndex = (rows[0][0].toLowerCase().includes('unit') || rows[0][0].toLowerCase().includes('nama')) ? 1 : 0;
      const records: AnalisisUnitRecord[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const unitName = row[0]?.trim();
        const serialNumber = row[1]?.trim() || 'SN-GENERIC';
        const damagedComponent = row[2]?.trim();
        const diagnosisResult = row[3]?.trim() || 'Kerusakan sirkuit teridentifikasi';
        const rootCause = row[4]?.trim() || 'Beban berlebih / usia komponen';
        const repairStepsStr = row[5]?.trim() || 'Periksa fisik, Ganti komponen, Uji daya';
        const partsStr = row[6]?.trim() || damagedComponent || 'Komponen Pengganti';
        const rawDiff = row[7]?.trim().toLowerCase();
        let difficulty: 'Mudah' | 'Sedang' | 'Sulit' | 'Kritis' = 'Sedang';
        if (rawDiff === 'mudah') difficulty = 'Mudah';
        else if (rawDiff === 'sulit' || rawDiff === 'tinggi') difficulty = 'Sulit';
        else if (rawDiff === 'kritis') difficulty = 'Kritis';
        const estimatedTime = row[8]?.trim() || '45 Menit';

        if (!unitName || !damagedComponent) continue;

        records.push({
          id: `ana-import-${Date.now()}-${i}`,
          unitName,
          serialNumber,
          damagedComponent,
          diagnosisResult,
          rootCause,
          repairSteps: repairStepsStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean),
          recommendedParts: partsStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean),
          difficulty,
          estimatedTime
        });
      }

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
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki header dan 1 baris data.' };
      }

      const startIndex = rows[0][0].toLowerCase().includes('nama') ? 1 : 0;
      const contacts: StaffContact[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const name = row[0]?.trim();
        const role = (row[1]?.trim() === 'Admin' ? 'Admin' : 'Pembina') as 'Pembina' | 'Admin';
        const title = row[2]?.trim() || (role === 'Admin' ? 'Administrator Akses' : 'Pembina Teknis');
        const phone = row[3]?.trim() || '+62 812-xxxx-xxxx';
        const email = row[4]?.trim() || 'kontak@service-audio.id';
        const specialty = row[5]?.trim() || 'Dukungan Teknis Audio';

        if (!name) continue;

        contacts.push({
          id: `staff-import-${Date.now()}-${i}`,
          name,
          role,
          title,
          phone,
          email,
          status: 'Online',
          specialty
        });
      }

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
      sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_SAMPLE_AUDIO_SERVICE_DB/pub?output=csv',
      isConnected: true,
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
    return {
      success: true,
      method: 'apps_script',
      message: `Data untuk "${record.unitName}" tersimpan ke spreadsheet.`
    };
  }

  public static async syncServiceLogToSpreadsheet(
    log: ServiceLogRecord
  ): Promise<{ success: boolean; message: string; method?: string }> {
    return {
      success: true,
      method: 'apps_script',
      message: `Catatan ${log.nomorService} tersimpan ke spreadsheet.`
    };
  }

  public static async syncAllAnalysisToSpreadsheet(
    records?: AnalisisUnitRecord[]
  ): Promise<{ success: boolean; message: string }> {
    const list = records || this.getAnalysisRecords();
    return {
      success: true,
      message: `${list.length} data analisis tersimpan ke spreadsheet.`
    };
  }

  // ==========================================
  // SERVICE LOG RECORDS (Catatan Nomor Service)
  // Format: Nama Yang Mengerjakan, Nomor Service, Analisa Kerusakan, Komponen Yang Diganti
  // ==========================================
  public static getServiceLogs(): ServiceLogRecord[] {
    return serviceLogStore.isReady() ? serviceLogStore.getAll() : INITIAL_SERVICE_LOGS;
  }

  public static saveServiceLogs(records: ServiceLogRecord[]): void {
    void serviceLogStore.replaceAll(records);
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
    void serviceLogStore.add(newLog);

    // Auto-sync in background to Google Spreadsheet (legacy manual OAuth path,
    // safe to leave: the automatic mirror now runs via GitHub Actions).
    this.syncServiceLogToSpreadsheet(newLog).catch(e => {
      console.warn('Background auto-sync service log:', e);
    });

    return newLog;
  }

  public static deleteServiceLog(id: string): void {
    void serviceLogStore.remove(id);
  }

  public static importServiceLogsText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        return { success: false, count: 0, error: 'Data kosong. Tempelkan baris data nomor service.' };
      }

      const newLogs: ServiceLogRecord[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip header if present
        if (i === 0 && (
          line.toLowerCase().includes('nama') || 
          line.toLowerCase().includes('nomor') || 
          line.toLowerCase().includes('service') ||
          line.toLowerCase().includes('analisa')
        )) {
          continue;
        }

        // Split by comma or tab or semicolon
        const parts = line.includes('\t') 
          ? line.split('\t') 
          : line.includes(';') 
          ? line.split(';') 
          : line.split(',');

        if (parts.length >= 4) {
          const nama = parts[0]?.trim();
          const noSrv = parts[1]?.trim();
          const analisa = parts[2]?.trim();
          const komponen = parts[3]?.trim();
          const tanggal = parts[4]?.trim() || new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          if (nama && noSrv) {
            newLogs.push({
              id: `srv-imp-${Date.now()}-${i}`,
              namaYangMengerjakan: nama,
              nomorService: noSrv,
              analisaKerusakan: analisa || '-',
              komponenDiganti: komponen || '-',
              createdAt: tanggal
            });
          }
        }
      }

      if (newLogs.length === 0) {
        return { 
          success: false, 
          count: 0, 
          error: 'Format data tidak sesuai. Pastikan ada 4 kolom: Nama Yang Mengerjakan, Nomor Service, Analisa Kerusakan, Komponen Yang Diganti' 
        };
      }

      const existing = this.getServiceLogs();
      const merged = [...newLogs, ...existing];
      this.saveServiceLogs(merged);
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
  public static async syncFromSheetUrl(url: string): Promise<{ success: boolean; count: number; detectedType?: string; error?: string }> {
    try {
      if (!url || !url.startsWith('http')) {
        throw new Error('URL Spreadsheet tidak valid. Harap gunakan link Google Sheets publish to web CSV.');
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Gagal mengambil data dari Google Sheets (HTTP ${res.status})`);
      }

      const text = await res.text();
      const firstLine = text.split(/\r?\n/)[0]?.toLowerCase() || '';

      let result: { success: boolean; count: number; error?: string };
      let detectedType = 'Whitelist';

      if (firstLine.includes('nomor') && (firstLine.includes('service') || firstLine.includes('analisa') || firstLine.includes('komponen'))) {
        detectedType = 'Catatan Nomor Service';
        result = this.importServiceLogsText(text);
      } else if (firstLine.includes('unit') || firstLine.includes('serial') || firstLine.includes('diagnosa')) {
        detectedType = 'Database Analisis Unit';
        result = this.importAnalysisText(text);
      } else if (firstLine.includes('alat') || firstLine.includes('sop_pemakaian') || firstLine.includes('fungsi_meja')) {
        detectedType = 'Tab 1: Alat-Alat Meja Kerja';
        result = this.importToolsText(text);
      } else if (firstLine.includes('ampli') && (firstLine.includes('kelas') || firstLine.includes('daya') || firstLine.includes('tegangan'))) {
        detectedType = 'Tab 2: Nama & Tipe Ampli';
        result = this.importAmpliText(text);
      } else if (firstLine.includes('pengetesan_ampli') || (firstLine.includes('langkah') && (firstLine.includes('proteksi') || firstLine.includes('dco')))) {
        detectedType = 'Tab 4: Pengetesan Amplifier';
        result = this.importTestAmpliText(text);
      } else if (firstLine.includes('speaker') || (firstLine.includes('langkah') && (firstLine.includes('spul') || firstLine.includes('metode_uji')))) {
        detectedType = 'Tab 5: Pengetesan Speaker';
        result = this.importTestSpeakerText(text);
      } else if (firstLine.includes('video') || firstLine.includes('gambar') || firstLine.includes('media') || firstLine.includes('gejala_normal')) {
        detectedType = 'Tab 3: Komponen Rusak/Bagus';
        result = this.importMediaText(text);
      } else if (firstLine.includes('pembina') || firstLine.includes('jabatan') || firstLine.includes('spesialisasi')) {
        detectedType = 'Kontak Pembina & Admin';
        result = this.importStaffText(text);
      } else {
        detectedType = 'Whitelist Pengguna';
        result = this.importWhitelistText(text);
      }

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
    void toolsStore.replaceAll(items);
  }

  public static addToolItem(data: Omit<ToolItem, 'id'>): ToolItem {
    const newItem: ToolItem = { ...data, id: `tool-${Date.now()}` };
    void toolsStore.add(newItem);
    return newItem;
  }

  public static updateToolItem(item: ToolItem): void {
    void toolsStore.update(item);
  }

  public static deleteToolItem(id: string): void {
    void toolsStore.remove(id);
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
    void ampliStore.replaceAll(items);
  }

  public static addAmpliItem(data: Omit<AmpliItem, 'id'>): AmpliItem {
    const newItem: AmpliItem = { ...data, id: `amp-${Date.now()}` };
    void ampliStore.add(newItem);
    return newItem;
  }

  public static updateAmpliItem(item: AmpliItem): void {
    void ampliStore.update(item);
  }

  public static deleteAmpliItem(id: string): void {
    void ampliStore.remove(id);
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
    void mediaGuideStore.add(newItem);
    return newItem;
  }

  public static updateMediaGuideItem(item: ComponentMediaGuide): void {
    void mediaGuideStore.update(item);
  }

  public static deleteMediaGuideItem(id: string): void {
    void mediaGuideStore.remove(id);
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
    void tesAmpliStore.replaceAll(items);
  }

  public static addTestAmpliItem(data: Omit<TesAmpliItem, 'id'>): TesAmpliItem {
    const newItem: TesAmpliItem = { ...data, id: `step-amp-${Date.now()}` };
    void tesAmpliStore.add(newItem);
    return newItem;
  }

  public static updateTestAmpliItem(item: TesAmpliItem): void {
    void tesAmpliStore.update(item);
  }

  public static deleteTestAmpliItem(id: string): void {
    void tesAmpliStore.remove(id);
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
    void tesSpeakerStore.replaceAll(items);
  }

  public static addTestSpeakerItem(data: Omit<TesSpeakerItem, 'id'>): TesSpeakerItem {
    const newItem: TesSpeakerItem = { ...data, id: `step-spk-${Date.now()}` };
    void tesSpeakerStore.add(newItem);
    return newItem;
  }

  public static updateTestSpeakerItem(item: TesSpeakerItem): void {
    void tesSpeakerStore.update(item);
  }

  public static deleteTestSpeakerItem(id: string): void {
    void tesSpeakerStore.remove(id);
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
      const startIndex = rows[0][1]?.toLowerCase().includes('nama') || rows[0][0]?.toLowerCase().includes('id') ? 1 : 0;
      const tools: ToolItem[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1] && !r[0]) continue;
        const name = String(r[1] || r[0]).trim();
        if (!name) continue;
        tools.push({
          id: String(r[0] && r[0].startsWith('tool-') ? r[0] : `tool-${Date.now()}-${i}`),
          name: name,
          category: (r[2] || 'Pengukuran') as any,
          specs: String(r[3] || ''),
          description: String(r[4] || ''),
          functionDesc: String(r[5] || ''),
          howToUse: r[6] ? String(r[6]).split('|').map(s => s.trim()).filter(Boolean) : [],
          safetyTips: r[7] ? String(r[7]).split('|').map(s => s.trim()).filter(Boolean) : [],
          mediaUrl: String(r[8] || '').trim(),
          mediaType: (r[9] === 'video' || String(r[8] || '').includes('youtu')) ? 'video' : 'image'
        });
      }
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
    return `ID,Nama_Ampli,Kelas_Topologi,Daya_RMS,Tegangan_PSU,Semikonduktor_Utama,Deskripsi,Karakteristik,Titik_Rawan,Tips_Teknisi,Media_URL,Tipe_Media
amp-1,SOCL 504 (Super OCL),Kelas AB,500W - 800W RMS @ 4Ω,45V - 65V CT DC,2SC5200 / 2SA1943 (4-8 Set),Driver legendaris lapangan dengan karakter suara bass nendang dan vokal tebal,Karakter flat-sub | Skema simetris sederhana | Mudah dimodifikasi,Transistor VAS (MJE340) panas over | Dioda bias 1N4148 | DCO geser saat panas,Gunakan trimpot multi-turn 1k untuk setting DCO yang presisi,https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop,image
amp-2,SOCL 506 (DC Servo),Kelas AB,500W - 1000W RMS @ 4Ω,45V - 75V CT DC,2SC5200 / 2SA1943 (4-10 Set),Penyempurnaan SOCL 504 dengan auto DCO servo menggunakan IC TL071,DCO otomatis stabil 0.00V | Vokal jernih minim distorsi | Stabil di lapangan,IC TL071 palsu menyebabkan DCO melonjak | Jalur feedback servo putus,Pastikan pin 4 (-15V) dan pin 7 (+15V) IC TL071 tepat simetris via zener 15V,https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop,image
amp-3,Power CA20 Class H,Kelas H,1300W - 2000W RMS @ 4Ω,Low 55V CT / High 110V CT,Toshiba 2SC5200 / 2SA1943 + Mosfet IRFP260N,Power amplifier bertingkat efisiensi tinggi untuk subwoofer panggung konser besar,Efisiensi tinggi | Heatsink dingin saat volume pelan | Dinamika hentakan bass sangat kuat,Dioda stepper MUR1560 jebol | Mosfet switch short | Elco rel tegangan tinggi melar,Wajib kalibrasi sensor bias dan cek switching gate mosfet menggunakan osiloskop,https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop,image`;
  }

  public static exportAmpliCSV(): string {
    const list = this.getAmpliList();
    const header = 'ID,Nama_Ampli,Kelas_Topologi,Daya_RMS,Tegangan_PSU,Semikonduktor_Utama,Deskripsi,Karakteristik,Titik_Rawan,Tips_Teknisi,Media_URL,Tipe_Media';
    const rows = list.map(a => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        escape(a.id),
        escape(a.name),
        escape(a.classType),
        escape(a.powerRange),
        escape(a.voltageSupply),
        escape(a.typicalTransistors || ''),
        escape(a.description),
        escape((a.characteristics || []).join(' | ')),
        escape((a.commonFailures || []).join(' | ')),
        escape(a.schematicTips || ''),
        escape(a.mediaUrl || ''),
        escape(a.mediaType || 'image')
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  public static importAmpliText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const startIndex = rows[0][1]?.toLowerCase().includes('nama') || rows[0][0]?.toLowerCase().includes('id') ? 1 : 0;
      const amplis: AmpliItem[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1] && !r[0]) continue;
        const name = String(r[1] || r[0]).trim();
        if (!name) continue;
        amplis.push({
          id: String(r[0] && r[0].startsWith('amp-') ? r[0] : `amp-${Date.now()}-${i}`),
          name: name,
          classType: (r[2] || 'Kelas AB') as any,
          powerRange: String(r[3] || ''),
          voltageSupply: String(r[4] || ''),
          typicalTransistors: String(r[5] || ''),
          description: String(r[6] || ''),
          characteristics: r[7] ? String(r[7]).split('|').map(s => s.trim()).filter(Boolean) : [],
          commonFailures: r[8] ? String(r[8]).split('|').map(s => s.trim()).filter(Boolean) : [],
          schematicTips: String(r[9] || ''),
          mediaUrl: String(r[10] || '').trim(),
          mediaType: (r[11] === 'video' || String(r[10] || '').includes('youtu')) ? 'video' : 'image'
        });
      }
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
    return `ID,Judul_Komponen,Tipe_Media,URL_Media,Nama_Komponen,Gejala_Normal,Gejala_Rusak,Metode_Pengujian,Nilai_Normal,Nilai_Rusak
guide-1,Transistor Final Toshiba 2SC5200 (NPN),video,https://www.youtube.com/watch?v=dQw4w9WgXcQ,Transistor Bipolar NPN,Junction B-C dan B-E tembus searah C-E terbuka,Kaki B-C B-E atau C-E short nol ohm bolak-balik,Uji skala Dioda Multimeter Digital,B-C: 0.500V - 0.650V B-E: 0.520V - 0.670V C-E: OL,0.000V (Short jebol) atau OL di semua kaki (Open)
guide-2,Elco Power Supply 10000uF 80V/100V,image,https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop,Kapasitor Elektrolit,Kapasitansi mendekati rating ESR sangat rendah < 0.05Ω,Fisik kembung meledak nilai uF drop drastis atau bocor DC,Uji Kapasitansi & ESR Meter,9200uF - 10500uF ESR < 0.05 Ohm,Kapasitansi < 5000uF atau ESR > 1 Ohm (Kering)
guide-3,Dioda Bridge Sisir / Kotak 35A - 50A,video,https://www.youtube.com/watch?v=dQw4w9WgXcQ,Dioda Penyearah AC-DC,Arus hanya mengalir satu arah pada tiap 4 dioda internal,Salah satu anoda-katoda short menembus AC ke DC,Uji Skala Dioda Multimeter Digital,Tegangan maju 0.450V - 0.600V tiap segmen dioda,Bunyi bip continue 0.00V atau OL dua arah`;
  }

  public static exportMediaCSV(): string {
    const list = this.getMediaGuides();
    const header = 'ID,Judul_Komponen,Tipe_Media,URL_Media,Nama_Komponen,Gejala_Normal,Gejala_Rusak,Metode_Pengujian,Nilai_Normal,Nilai_Rusak';
    const rows = list.map(g => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        escape(g.id),
        escape(g.title),
        escape(g.mediaType),
        escape(g.mediaUrl),
        escape(g.componentName),
        escape(g.goodSymptom),
        escape(g.badSymptom),
        escape(g.testMethod),
        escape(g.normalValue),
        escape(g.damagedValue)
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  // --- TAB 4: PENGETESAN AMPLIFIER ---
  public static getTestAmpliTemplateCSV(): string {
    return `ID,Nomor_Urut,Judul_Langkah,Kategori_Tag,Tindakan_SOP,Target_Normal,Tanda_Kerusakan,Tips_Proteksi,Media_URL
step-amp-1,1,Uji Keamanan Awal via Bohlam Seri 100W (Current Limiter),Proteksi Wajib,Pasang steker amplifier ke stop kontak bohlam seri 100W AC,Bohlam menyala terang sesaat lalu redup padam,Bohlam terus menyala terang benderang (ada jalur short),Jangan pernah mem-bypass bohlam seri sebelum langkah DCO aman,https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop
step-amp-2,2,Pengukuran Simetri Tegangan Catu Daya (+VCC GND -VCC),Power Supply DC,Ukur probe merah ke rel (+) lalu ke rel (-) terhadap Ground chasis,Kedua rel seimbang (misal +65.2V dan -65.1V),Salah satu rel drop (misal +65V tapi -20V),Ketidakseimbangan tegangan rel memicu DCO tinggi di speaker,https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop
step-amp-3,3,Pengukuran Tegangan DCO (DC Offset di Terminal Speaker),Kritis Speaker,Ukur terminal output speaker (+) terhadap Ground tanpa musik,DCO di bawah 20mV (idealnya mendekati 0.00mV),DCO melonjak di atas 50mV apalagi belasan volt (SPUL TERBAKAR),Putar trimpot DCO perlahan dengan obeng keramik,https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop`;
  }

  public static exportTestAmpliCSV(): string {
    const list = this.getTestAmpliList();
    const header = 'ID,Nomor_Urut,Judul_Langkah,Kategori_Tag,Tindakan_SOP,Target_Normal,Tanda_Kerusakan,Tips_Proteksi,Media_URL';
    const rows = list.map(s => {
      const escape = (val: string) => `"${(val ?? '').toString().replace(/"/g, '""')}"`;
      return [
        escape(s.id),
        escape(s.num.toString()),
        escape(s.title),
        escape(s.tag),
        escape(s.action),
        escape(s.target),
        escape(s.failure),
        escape(s.tips),
        escape(s.mediaUrl || '')
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  public static importTestAmpliText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const startIndex = rows[0][2]?.toLowerCase().includes('judul') || rows[0][0]?.toLowerCase().includes('id') ? 1 : 0;
      const steps: TesAmpliItem[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const r = rows[i];
        const title = String(r[2] || r[1] || r[0]).trim();
        if (!title) continue;
        steps.push({
          id: String(r[0] && r[0].startsWith('step-') ? r[0] : `step-amp-${Date.now()}-${i}`),
          num: Number(r[1]) || (steps.length + 1),
          title: title,
          tag: String(r[3] || 'Pengujian SOP'),
          action: String(r[4] || ''),
          target: String(r[5] || ''),
          failure: String(r[6] || ''),
          tips: String(r[7] || ''),
          mediaUrl: String(r[8] || '').trim(),
          mediaType: String(r[8] || '').includes('youtu') ? 'video' : 'image'
        });
      }
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
    return `ID,Nomor_Urut,Judul_Langkah,Metode_Uji,Prosedur_SOP,Respon_Normal,Gejala_Rusak,Tips_Teknisi,Media_URL
step-spk-1,1,Inspeksi Fisik Membran Rubber Surround Spider & Dust Cap,Visual & Sentuhan,Periksa cone surround dan spider dari robek atau lapuk,Daun speaker utuh kaku spider merekat kuat di frame,Daun robek bergetar surround mengeras spider lepas,Gunakan lem khusus gasket hitam jika merekatkan surround,https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop
step-spk-2,2,Pengukuran Hambatan Kumparan Spul (DCR - DC Resistance),Multimeter Digital Ohm,Tempelkan probe merah dan hitam ke terminal (+) dan (-) speaker,Speaker 8 Ohm terbaca 5.6Ω - 7.2Ω speaker 4 Ohm terbaca 2.8Ω - 3.6Ω,Terbaca 0.0 Ohm (short terbakar) atau OL tak terhingga (putus),Nilai DCR selalu sedikit lebih rendah dari impedansi nominal AC,https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop
step-spk-3,3,Uji Gerak Bebas & Polaritas Baterai 1.5V (Battery Pop Test),Baterai AA 1.5V DC,Sentuhkan kutub positif baterai ke (+) dan negatif ke (-) secara sesaat,Bunyi POP mantap dan daun speaker bergerak MAJU simetris,Tidak ada bunyi (putus) atau gerakan seret tidak mau maju,Jika daun bergerak mundur saat kutub positif menyentuh merah polaritas terbalik,https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop`;
  }

  public static exportTestSpeakerCSV(): string {
    const list = this.getTestSpeakerList();
    const header = 'ID,Nomor_Urut,Judul_Langkah,Metode_Uji,Prosedur_SOP,Respon_Normal,Gejala_Rusak,Tips_Teknisi,Media_URL';
    const rows = list.map(s => {
      const escape = (val: string) => `"${(val ?? '').toString().replace(/"/g, '""')}"`;
      return [
        escape(s.id),
        escape(s.num.toString()),
        escape(s.title),
        escape(s.method),
        escape(s.sop),
        escape(s.normal),
        escape(s.defect),
        escape(s.tip),
        escape(s.mediaUrl || '')
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  public static importTestSpeakerText(text: string): { success: boolean; count: number; error?: string } {
    try {
      const rows = this.parseDelimitedText(text);
      if (rows.length < 2) {
        return { success: false, count: 0, error: 'Data kosong atau minimal harus memiliki baris header dan 1 baris data.' };
      }
      const startIndex = rows[0][2]?.toLowerCase().includes('judul') || rows[0][0]?.toLowerCase().includes('id') ? 1 : 0;
      const steps: TesSpeakerItem[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const r = rows[i];
        const title = String(r[2] || r[1] || r[0]).trim();
        if (!title) continue;
        steps.push({
          id: String(r[0] && r[0].startsWith('step-') ? r[0] : `step-spk-${Date.now()}-${i}`),
          num: Number(r[1]) || (steps.length + 1),
          title: title,
          method: String(r[3] || ''),
          sop: String(r[4] || ''),
          normal: String(r[5] || ''),
          defect: String(r[6] || ''),
          tip: String(r[7] || ''),
          mediaUrl: String(r[8] || '').trim(),
          mediaType: String(r[8] || '').includes('youtu') ? 'video' : 'image'
        });
      }
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


