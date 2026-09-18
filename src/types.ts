export type AccessType = 'fulltime' | '6months' | 'none';

export interface User {
  id: string;
  fullName: string;
  email: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string;
  accessType: AccessType;
  accessExpiry?: string; // ISO date string for 6 months access
  registeredAt: string;
}

export interface WhitelistEntry {
  id: string;
  name: string;
  accessType: AccessType;
  notes?: string;
  department?: string;
}

export interface KomponenItem {
  id: string;
  name: string;
  category: 'pasif' | 'aktif';
  subType: string;
  symbol: string;
  description: string;
  functionDesc: string;
  howToTest: string;
  goodCondition: string;
  badCondition: string;
  safetyNote?: string;
  pinoutOrColorCode?: string;
  image?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: 'Utama' | 'Pengukuran' | 'Solder & Pasang' | 'Keamanan';
  specs: string;
  description: string;
  functionDesc: string;
  howToUse: string[];
  safetyTips: string[];
  image?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface AmpliItem {
  id: string;
  name: string;
  classType: 'Kelas AB' | 'Kelas D' | 'Kelas H' | 'Built-up / Komersial' | 'Kelas OCL / BTL';
  powerRange: string;
  voltageSupply: string;
  description: string;
  characteristics: string[];
  commonFailures: string[];
  schematicTips: string;
  typicalTransistors?: string;
  image?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface TesAmpliItem {
  id: string;
  num: number;
  title: string;
  tag: string;
  action: string;
  target: string;
  failure: string;
  tips: string;
  image?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface TesSpeakerItem {
  id: string;
  num: number;
  title: string;
  method: string;
  sop: string;
  normal: string;
  defect: string;
  tip: string;
  image?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface ComponentMediaGuide {
  id: string;
  title: string;
  mediaType: 'video' | 'image';
  mediaUrl: string;
  caption: string;
  componentName: string;
  goodSymptom: string;
  badSymptom: string;
  testMethod: string;
  normalValue: string;
  damagedValue: string;
}

export interface AnalisisUnitRecord {
  id: string;
  unitName: string;
  serialNumber: string;
  damagedComponent: string;
  diagnosisResult: string;
  rootCause: string;
  repairSteps: string[];
  recommendedParts: string[];
  difficulty: 'Mudah' | 'Sedang' | 'Sulit' | 'Kritis';
  estimatedTime: string;
}

export interface StaffContact {
  id: string;
  name: string;
  role: 'Pembina' | 'Admin';
  title: string;
  phone: string;
  email: string;
  status: 'Online' | 'Bertugas' | 'Standby';
  specialty: string;
}

export interface SpreadsheetConfig {
  sheetUrl: string;
  isConnected: boolean;
  lastSynced: string;
  rowCount: number;
  googleSpreadsheetId?: string;
  googleSpreadsheetTitle?: string;
  googleAccountEmail?: string;
  appsScriptUrl?: string;
  autoSyncEnabled?: boolean;
  lastAutoSyncStatus?: string;
}

export interface ServiceLogRecord {
  id: string;
  namaYangMengerjakan: string;
  nomorService: string;
  analisaKerusakan: string;
  komponenDiganti: string;
  createdAt: string;
}
