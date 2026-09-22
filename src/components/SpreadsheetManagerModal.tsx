import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet, 
  Plus, 
  RefreshCw, 
  Check, 
  Users, 
  FileSearch, 
  Tv, 
  ExternalLink,
  Save,
  Trash2,
  AlertCircle,
  Download,
  Copy,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
  ClipboardList,
  Upload,
  FileUp,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Loader2,
  Wrench,
  Cpu,
  Activity,
  Volume2,
  Pencil
} from 'lucide-react';
import { SpreadsheetService } from '../services/spreadsheetService';
import { 
  WhitelistEntry, 
  AnalisisUnitRecord, 
  ComponentMediaGuide, 
  StaffContact, 
  User, 
  ServiceLogRecord,
  ToolItem,
  AmpliItem,
  TesAmpliItem,
  TesSpeakerItem
} from '../types';
import { APPS_SCRIPT_URL, isBackendConfigured, pingBackend } from '../services/backendService';

export type ManagerTab = 
  | 'templates' 
  | 'tools' 
  | 'ampli' 
  | 'media' 
  | 'testAmpli' 
  | 'testSpeaker' 
  | 'servicelogs' 
  | 'whitelist' 
  | 'diagnosis' 
  | 'staff' 
  | 'settings';

interface SpreadsheetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: () => void;
  currentUser?: User | null;
  initialTab?: string;
}

export const SpreadsheetManagerModal: React.FC<SpreadsheetManagerModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
  currentUser,
  initialTab
}) => {
  const canEdit = SpreadsheetService.canEditSpreadsheet(currentUser);
  const [activeTab, setActiveTab] = useState<ManagerTab>(
    (initialTab as ManagerTab) || 'templates'
  );
  
  // Tab 1: Alat Meja Kerja (Tools)
  const [toolsList, setToolsList] = useState<ToolItem[]>(SpreadsheetService.getToolsList());
  const [pasteToolsText, setPasteToolsText] = useState('');
  const [showPasteTools, setShowPasteTools] = useState(false);

  // Tab 2: Tipe Ampli
  const [ampliList, setAmpliList] = useState<AmpliItem[]>(SpreadsheetService.getAmpliList());
  const [pasteAmpliText, setPasteAmpliText] = useState('');
  const [showPasteAmpli, setShowPasteAmpli] = useState(false);

  // Tab 4: Pengetesan Amplifier
  const [testAmpliList, setTestAmpliList] = useState<TesAmpliItem[]>(SpreadsheetService.getTestAmpliList());
  const [pasteTestAmpliText, setPasteTestAmpliText] = useState('');
  const [showPasteTestAmpli, setShowPasteTestAmpli] = useState(false);

  // Tab 5: Pengetesan Speaker
  const [testSpeakerList, setTestSpeakerList] = useState<TesSpeakerItem[]>(SpreadsheetService.getTestSpeakerList());
  const [pasteTestSpeakerText, setPasteTestSpeakerText] = useState('');
  const [showPasteTestSpeaker, setShowPasteTestSpeaker] = useState(false);

  // Whitelist management
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>(SpreadsheetService.getWhitelist());
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('Teknisi Audio');
  const [pasteWhitelistText, setPasteWhitelistText] = useState('');
  const [showPasteWhitelist, setShowPasteWhitelist] = useState(false);

  // Media management
  const [mediaGuides, setMediaGuides] = useState<ComponentMediaGuide[]>(SpreadsheetService.getMediaGuides());
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'video' | 'image'>('video');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaComp, setNewMediaComp] = useState('Transistor Bipolar');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [pasteMediaText, setPasteMediaText] = useState('');
  const [showPasteMedia, setShowPasteMedia] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [isModalProcessingFile, setIsModalProcessingFile] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Diagnosis management
  const [diagnosisList, setDiagnosisList] = useState<AnalisisUnitRecord[]>(SpreadsheetService.getAnalysisRecords());
  const [newUnitName, setNewUnitName] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newDamagedComp, setNewDamagedComp] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newRepairStepsText, setNewRepairStepsText] = useState('');
  const [newRecommendedPartsText, setNewRecommendedPartsText] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<AnalisisUnitRecord['difficulty']>('Sedang');
  const [newEstimatedTime, setNewEstimatedTime] = useState('');
  const [editingDiagnosisId, setEditingDiagnosisId] = useState<string | null>(null);
  const [pasteDiagnosisText, setPasteDiagnosisText] = useState('');
  const [showPasteDiagnosis, setShowPasteDiagnosis] = useState(false);

  // Staff management
  const [staffList, setStaffList] = useState<StaffContact[]>(SpreadsheetService.getStaffContacts());
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Pembina' | 'Admin'>('Pembina');
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');
  const [pasteStaffText, setPasteStaffText] = useState('');
  const [showPasteStaff, setShowPasteStaff] = useState(false);

  // Service Logs management (Catatan Nomor Service)
  const [serviceLogs, setServiceLogs] = useState<ServiceLogRecord[]>(SpreadsheetService.getServiceLogs());
  const [newLogNama, setNewLogNama] = useState(currentUser?.fullName || '');
  const [newLogNoSrv, setNewLogNoSrv] = useState('');
  const [newLogAnalisa, setNewLogAnalisa] = useState('');
  const [newLogKomponen, setNewLogKomponen] = useState('');
  const [pasteServiceLogText, setPasteServiceLogText] = useState('');
  const [showPasteServiceLog, setShowPasteServiceLog] = useState(false);

  // Keep every list above in sync with Firestore in real time, so edits
  // made from another device (or by this same admin a moment ago) always
  // show up here without needing to close/reopen the modal.
  useEffect(() => {
    const unsub = SpreadsheetService.subscribeToDataChanges(() => {
      setToolsList(SpreadsheetService.getToolsList());
      setAmpliList(SpreadsheetService.getAmpliList());
      setTestAmpliList(SpreadsheetService.getTestAmpliList());
      setTestSpeakerList(SpreadsheetService.getTestSpeakerList());
      setWhitelist(SpreadsheetService.getWhitelist());
      setMediaGuides(SpreadsheetService.getMediaGuides());
      setDiagnosisList(SpreadsheetService.getAnalysisRecords());
      setStaffList(SpreadsheetService.getStaffContacts());
      setServiceLogs(SpreadsheetService.getServiceLogs());
    });
    return unsub;
  }, []);

  // Settings
  const [sheetUrl, setSheetUrl] = useState(SpreadsheetService.getSheetConfig().sheetUrl);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Apps Script backend connection status
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error' | 'unconfigured'>('checking');
  const [backendMsg, setBackendMsg] = useState<string | null>(null);
  const [autoSyncNotice, setAutoSyncNotice] = useState<{ status: 'syncing' | 'success' | 'error' | 'idle'; text: string } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth'
      });
    }
  };

  const checkBackendStatus = async () => {
    if (!isBackendConfigured()) {
      setBackendStatus('unconfigured');
      return;
    }
    setBackendStatus('checking');
    try {
      await pingBackend();
      setBackendStatus('connected');
      setBackendMsg(null);
    } catch (e: any) {
      setBackendStatus('error');
      setBackendMsg(e?.message || 'Gagal terhubung ke Apps Script.');
    }
  };

  React.useEffect(() => {
    if (isOpen) checkBackendStatus();
  }, [isOpen]);

  const handleRefreshNow = async () => {
    setIsSyncing(true);
    setSyncStatus('Menarik data terbaru dari spreadsheet...');
    try {
      await SpreadsheetService.refreshAllNow();
      setToolsList(SpreadsheetService.getToolsList());
      setAmpliList(SpreadsheetService.getAmpliList());
      setMediaGuides(SpreadsheetService.getMediaGuides());
      setTestAmpliList(SpreadsheetService.getTestAmpliList());
      setTestSpeakerList(SpreadsheetService.getTestSpeakerList());
      setWhitelist(SpreadsheetService.getWhitelist());
      setDiagnosisList(SpreadsheetService.getAnalysisRecords());
      setStaffList(SpreadsheetService.getStaffContacts());
      setServiceLogs(SpreadsheetService.getServiceLogs());
      onDataUpdated();
      setSyncStatus('Data berhasil diperbarui dari spreadsheet.');
    } catch (e: any) {
      setSyncStatus('Gagal memperbarui data: ' + (e?.message || 'Koneksi terputus'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSheet = async () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!sheetUrl.trim()) {
      alert('Masukkan URL publish-to-web CSV terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Mengimpor data dari URL CSV...');
    try {
      const res = await SpreadsheetService.syncFromSheetUrl(sheetUrl.trim());
      if (res.success) {
        setToolsList(SpreadsheetService.getToolsList());
        setAmpliList(SpreadsheetService.getAmpliList());
        setMediaGuides(SpreadsheetService.getMediaGuides());
        setTestAmpliList(SpreadsheetService.getTestAmpliList());
        setTestSpeakerList(SpreadsheetService.getTestSpeakerList());
        setWhitelist(SpreadsheetService.getWhitelist());
        setDiagnosisList(SpreadsheetService.getAnalysisRecords());
        setStaffList(SpreadsheetService.getStaffContacts());
        setServiceLogs(SpreadsheetService.getServiceLogs());
        onDataUpdated();
        setSyncStatus(`Berhasil mengimpor ${res.count} baris (${res.detectedType}).`);
      } else {
        setSyncStatus('Gagal impor: ' + (res.error || ''));
      }
    } catch (e: any) {
      setSyncStatus('Gagal impor: ' + (e?.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Handlers for 5 Core Tabs ---
  const handleImportTools = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteToolsText.trim()) return;
    const res = SpreadsheetService.importToolsText(pasteToolsText);
    if (res.success) {
      setToolsList(SpreadsheetService.getToolsList());
      setPasteToolsText('');
      setShowPasteTools(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Alat Meja Kerja dari Spreadsheet/CSV!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleDeleteTool = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (window.confirm('Hapus alat ini dari database?')) {
      SpreadsheetService.deleteToolItem(id);
      setToolsList(SpreadsheetService.getToolsList());
      onDataUpdated();
    }
  };

  const handleImportAmpli = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteAmpliText.trim()) return;
    const res = SpreadsheetService.importAmpliText(pasteAmpliText);
    if (res.success) {
      setAmpliList(SpreadsheetService.getAmpliList());
      setPasteAmpliText('');
      setShowPasteAmpli(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Tipe Ampli dari Spreadsheet/CSV!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleDeleteAmpli = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (window.confirm('Hapus tipe ampli ini dari database?')) {
      SpreadsheetService.deleteAmpliItem(id);
      setAmpliList(SpreadsheetService.getAmpliList());
      onDataUpdated();
    }
  };

  const handleImportTestAmpli = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteTestAmpliText.trim()) return;
    const res = SpreadsheetService.importTestAmpliText(pasteTestAmpliText);
    if (res.success) {
      setTestAmpliList(SpreadsheetService.getTestAmpliList());
      setPasteTestAmpliText('');
      setShowPasteTestAmpli(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} langkah Pengetesan Amplifier!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleDeleteTestAmpli = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (window.confirm('Hapus langkah tes ampli ini dari database?')) {
      SpreadsheetService.deleteTestAmpliItem(id);
      setTestAmpliList(SpreadsheetService.getTestAmpliList());
      onDataUpdated();
    }
  };

  const handleImportTestSpeaker = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteTestSpeakerText.trim()) return;
    const res = SpreadsheetService.importTestSpeakerText(pasteTestSpeakerText);
    if (res.success) {
      setTestSpeakerList(SpreadsheetService.getTestSpeakerList());
      setPasteTestSpeakerText('');
      setShowPasteTestSpeaker(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} langkah Pengetesan Speaker!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleDeleteTestSpeaker = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (window.confirm('Hapus langkah tes speaker ini dari database?')) {
      SpreadsheetService.deleteTestSpeakerItem(id);
      setTestSpeakerList(SpreadsheetService.getTestSpeakerList());
      onDataUpdated();
    }
  };



  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const DENIED_ALERT = 'Akses Ditolak: Hanya akun Fulltime yang memiliki hak mengedit atau menyinkronkan data spreadsheet.';

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!newMemberName.trim()) return;

    SpreadsheetService.addWhitelistEntry(newMemberName.trim(), newMemberDept);
    setWhitelist(SpreadsheetService.getWhitelist());
    setNewMemberName('');
    onDataUpdated();
  };

  const handleDeleteMember = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    const updated = whitelist.filter(w => w.id !== id);
    SpreadsheetService.saveWhitelist(updated);
    setWhitelist(updated);
    onDataUpdated();
  };

  const handleImportWhitelist = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteWhitelistText.trim()) return;
    const res = SpreadsheetService.importWhitelistText(pasteWhitelistText);
    if (res.success) {
      setWhitelist(SpreadsheetService.getWhitelist());
      setPasteWhitelistText('');
      setShowPasteWhitelist(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Whitelist!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsModalProcessingFile(true);
    setModalFileName(file.name);

    if (!newMediaTitle) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNewMediaTitle(clean);
    }
    if (file.type.startsWith('video/')) {
      setNewMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setNewMediaType('image');
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setNewMediaUrl(dataUrl);
      setIsModalProcessingFile(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file lokal.');
      setIsModalProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!newMediaTitle.trim() || !newMediaUrl.trim()) return;

    const newGuide: ComponentMediaGuide = {
      id: `media-${Date.now()}`,
      title: newMediaTitle.trim(),
      mediaType: newMediaType,
      mediaUrl: newMediaUrl.trim(),
      componentName: newMediaComp,
      caption: newMediaCaption || 'Ditambahkan via Spreadsheet Manager',
      goodSymptom: 'Parameter normal terbaca stabil',
      badSymptom: 'Korslet atau putus total',
      testMethod: 'Uji dengan Multimeter Digital',
      normalValue: 'Normal',
      damagedValue: 'Rusak / Short'
    };

    SpreadsheetService.addOrUpdateMediaGuide(newGuide);
    setMediaGuides(SpreadsheetService.getMediaGuides());
    setNewMediaTitle('');
    setNewMediaUrl('');
    setNewMediaCaption('');
    setModalFileName('');
    onDataUpdated();
  };

  const handleDeleteMedia = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    const updated = mediaGuides.filter(m => m.id !== id);
    SpreadsheetService.saveMediaGuides(updated);
    setMediaGuides(updated);
    onDataUpdated();
  };

  const handleImportMedia = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteMediaText.trim()) return;
    const res = SpreadsheetService.importMediaText(pasteMediaText);
    if (res.success) {
      setMediaGuides(SpreadsheetService.getMediaGuides());
      setPasteMediaText('');
      setShowPasteMedia(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Media Video & Gambar!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!newUnitName.trim() || !newDamagedComp.trim()) return;

    const repairSteps = newRepairStepsText.split('\n').map(s => s.trim()).filter(Boolean);
    const recommendedParts = newRecommendedPartsText.split('\n').map(s => s.trim()).filter(Boolean);

    const recordData = {
      unitName: newUnitName.trim(),
      serialNumber: newSerial.trim() || 'SN-GENERIC',
      damagedComponent: newDamagedComp.trim(),
      diagnosisResult: newSolution || 'Kerusakan sirkuit teridentifikasi',
      rootCause: newRootCause.trim() || 'Beban lebih atau usia pakai',
      repairSteps: repairSteps.length > 0 ? repairSteps : ['Periksa komponen terkait', 'Ganti komponen rusak dengan part original', 'Uji dengan Bohlam Seri 100W'],
      recommendedParts: recommendedParts.length > 0 ? recommendedParts : [newDamagedComp.trim()],
      difficulty: newDifficulty,
      estimatedTime: newEstimatedTime.trim() || '1 Jam'
    };

    let updated: AnalisisUnitRecord[];
    let newRecord: AnalisisUnitRecord;
    if (editingDiagnosisId) {
      newRecord = { id: editingDiagnosisId, ...recordData };
      updated = diagnosisList.map(d => d.id === editingDiagnosisId ? newRecord : d);
    } else {
      newRecord = { id: `ana-${Date.now()}`, ...recordData };
      updated = [newRecord, ...diagnosisList];
    }

    SpreadsheetService.saveAnalysisRecords(updated);
    setDiagnosisList(updated);
    resetDiagnosisForm();
    onDataUpdated();

    // Auto-sync real-time ke Google Spreadsheet
    setAutoSyncNotice({
      status: 'syncing',
      text: `Menyinkronkan data [${newRecord.unitName}] ke Google Spreadsheet...`
    });

    try {
      const res = await SpreadsheetService.syncAnalysisRecordToSpreadsheet(newRecord);
      if (res.success) {
        setAutoSyncNotice({
          status: 'success',
          text: `Berhasil! Data [${newRecord.unitName}] otomatis masuk ke Google Spreadsheet.`
        });
      } else {
        setAutoSyncNotice({
          status: 'idle',
          text: res.message
        });
      }
    } catch (err: any) {
      setAutoSyncNotice({
        status: 'error',
        text: `Tersimpan di web lokal. Sinkronisasi spreadsheet: ${err?.message || 'Menunggu otentikasi'}`
      });
    }
  };

  const resetDiagnosisForm = () => {
    setEditingDiagnosisId(null);
    setNewUnitName('');
    setNewSerial('');
    setNewDamagedComp('');
    setNewSolution('');
    setNewRootCause('');
    setNewRepairStepsText('');
    setNewRecommendedPartsText('');
    setNewDifficulty('Sedang');
    setNewEstimatedTime('');
  };

  const handleEditDiagnosis = (rec: AnalisisUnitRecord) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    setEditingDiagnosisId(rec.id);
    setNewUnitName(rec.unitName);
    setNewSerial(rec.serialNumber === 'SN-GENERIC' ? '' : rec.serialNumber);
    setNewDamagedComp(rec.damagedComponent);
    setNewSolution(rec.diagnosisResult);
    setNewRootCause(rec.rootCause);
    setNewRepairStepsText((rec.repairSteps || []).join('\n'));
    setNewRecommendedPartsText((rec.recommendedParts || []).join('\n'));
    setNewDifficulty(rec.difficulty);
    setNewEstimatedTime(rec.estimatedTime);
  };

  const handleDeleteDiagnosis = async (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (editingDiagnosisId === id) resetDiagnosisForm();
    const updated = diagnosisList.filter(d => d.id !== id);
    SpreadsheetService.saveAnalysisRecords(updated);
    setDiagnosisList(updated);
    onDataUpdated();

    // Sync deletion to spreadsheet
    setAutoSyncNotice({
      status: 'syncing',
      text: 'Memperbarui baris data di Google Spreadsheet...'
    });
    const res = await SpreadsheetService.syncAllAnalysisToSpreadsheet(updated);
    if (res.success) {
      setAutoSyncNotice({
        status: 'success',
        text: 'Google Spreadsheet berhasil disinkronkan dengan data terbaru!'
      });
    } else {
      setAutoSyncNotice({
        status: 'idle',
        text: res.message
      });
    }
  };

  const handleImportDiagnosis = async () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteDiagnosisText.trim()) return;
    const res = SpreadsheetService.importAnalysisText(pasteDiagnosisText);
    if (res.success) {
      const records = SpreadsheetService.getAnalysisRecords();
      setDiagnosisList(records);
      setPasteDiagnosisText('');
      setShowPasteDiagnosis(false);
      onDataUpdated();

      setAutoSyncNotice({
        status: 'syncing',
        text: `Menyinkronkan ${res.count} data impor ke Google Spreadsheet...`
      });
      const syncRes = await SpreadsheetService.syncAllAnalysisToSpreadsheet(records);
      if (syncRes.success) {
        setAutoSyncNotice({
          status: 'success',
          text: `Berhasil mengimpor & menyinkronkan ${res.count} data ke Google Spreadsheet!`
        });
      } else {
        setAutoSyncNotice({
          status: 'idle',
          text: `Impor lokal sukses (${res.count} data). ${syncRes.message}`
        });
      }
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!newStaffName.trim()) return;

    const newStaff: StaffContact = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      title: newStaffTitle.trim() || (newStaffRole === 'Admin' ? 'Administrator Sistem' : 'Pembina Audio'),
      phone: newStaffPhone.trim() || '+62 812-xxxx-xxxx',
      email: newStaffEmail.trim() || 'info@service-audio.id',
      status: 'Online',
      specialty: newStaffSpecialty.trim() || 'Bantuan Teknis Audio'
    };

    const updated = [newStaff, ...staffList];
    SpreadsheetService.saveStaffContacts(updated);
    setStaffList(updated);
    setNewStaffName('');
    setNewStaffTitle('');
    setNewStaffPhone('');
    setNewStaffEmail('');
    setNewStaffSpecialty('');
    onDataUpdated();
  };

  const handleDeleteStaff = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    const updated = staffList.filter(s => s.id !== id);
    SpreadsheetService.saveStaffContacts(updated);
    setStaffList(updated);
    onDataUpdated();
  };

  const handleImportStaff = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteStaffText.trim()) return;
    const res = SpreadsheetService.importStaffText(pasteStaffText);
    if (res.success) {
      setStaffList(SpreadsheetService.getStaffContacts());
      setPasteStaffText('');
      setShowPasteStaff(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Kontak Pembina & Admin!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleAddServiceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!newLogNama.trim() || !newLogNoSrv.trim() || !newLogAnalisa.trim() || !newLogKomponen.trim()) {
      alert('Harap isi semua kolom: Nama yang mengerjakan, nomor service, analisa kerusakan, dan komponen yang diganti.');
      return;
    }

    const created = SpreadsheetService.addServiceLog({
      namaYangMengerjakan: newLogNama,
      nomorService: newLogNoSrv,
      analisaKerusakan: newLogAnalisa,
      komponenDiganti: newLogKomponen
    });

    setServiceLogs(SpreadsheetService.getServiceLogs());
    setNewLogNoSrv('');
    setNewLogAnalisa('');
    setNewLogKomponen('');
    onDataUpdated();

    setAutoSyncNotice({
      status: 'syncing',
      text: `Menyinkronkan catatan nomor service [${created.nomorService}] ke Google Spreadsheet...`
    });

    try {
      const res = await SpreadsheetService.syncServiceLogToSpreadsheet(created);
      if (res.success) {
        setAutoSyncNotice({
          status: 'success',
          text: `Berhasil! Catatan service [${created.nomorService}] otomatis masuk ke Google Spreadsheet.`
        });
      } else {
        setAutoSyncNotice({
          status: 'idle',
          text: res.message
        });
      }
    } catch (err: any) {
      setAutoSyncNotice({
        status: 'error',
        text: `Catatan tersimpan di web. Sinkronisasi spreadsheet: ${err?.message || 'Menunggu otentikasi'}`
      });
    }
  };

  const handleDeleteServiceLog = (id: string) => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (window.confirm('Hapus catatan nomor service ini?')) {
      SpreadsheetService.deleteServiceLog(id);
      setServiceLogs(SpreadsheetService.getServiceLogs());
      onDataUpdated();
    }
  };

  const handleImportServiceLog = () => {
    if (!canEdit) {
      alert(DENIED_ALERT);
      return;
    }
    if (!pasteServiceLogText.trim()) return;
    const res = SpreadsheetService.importServiceLogsText(pasteServiceLogText);
    if (res.success) {
      setServiceLogs(SpreadsheetService.getServiceLogs());
      setPasteServiceLogText('');
      setShowPasteServiceLog(false);
      onDataUpdated();
      alert(`Berhasil mengimpor ${res.count} data Catatan Nomor Service!`);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };



  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Modal Header with Prominent Back Button */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Tombol Back Cepat ke Aplikasi */}
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
              title="Kembali ke Layar Utama Aplikasi"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Kembali</span>
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600/20 text-emerald-400 hidden xs:flex items-center justify-center border border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="truncate">
              <h3 className="font-bold text-white text-sm sm:text-base truncate flex items-center gap-1.5">
                <span>Pusat Integrasi Spreadsheet</span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Format tabel, edit data, copy-paste, dan sinkronisasi Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab !== 'templates' && (
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className="hidden md:flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Kembali ke Pratinjau Template"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format Template</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Selesai</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - With Left/Right Arrow controls and mouse-wheel horizontal scrolling */}
        <div className="relative flex items-center border-b border-slate-800 bg-slate-950/90 px-2 py-2">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-md shrink-0 cursor-pointer mr-1 z-10 transition-all active:scale-95"
            title="Geser Tab ke Kiri"
            aria-label="Geser Tab ke Kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Tabs */}
          <div 
            ref={tabsContainerRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center overflow-x-auto gap-2 no-scrollbar scroll-smooth flex-1 py-0.5 px-1"
          >
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Template &amp; Format Kolom</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>1. Alat Kerja ({toolsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ampli')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'ampli'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>2. Tipe Ampli ({ampliList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>3. Komponen Rusak/Bagus ({mediaGuides.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('testAmpli')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'testAmpli'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>4. Tes Ampli ({testAmpliList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('testSpeaker')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'testSpeaker'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>5. Tes Speaker ({testSpeakerList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('servicelogs')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'servicelogs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              <span>6. Nomor Service ({serviceLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whitelist')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'whitelist'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>7. Whitelist ({whitelist.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnosis')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'diagnosis'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <FileSearch className="w-4 h-4 text-sky-400" />
              <span>8. Database Analisa ({diagnosisList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-violet-400" />
              <span>9. Pembina &amp; Admin ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>10. Google Sheets (Sync)</span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-md shrink-0 cursor-pointer ml-1 z-10 transition-all active:scale-95"
            title="Geser Tab ke Kanan"
            aria-label="Geser Tab ke Kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Status Izin Akses & Pengeditan Spreadsheet */}
          {canEdit ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Hak Akses Editor Penuh Terverifikasi</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-semibold">
                      Master Editor
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    Masuk sebagai <strong>{currentUser?.fullName}</strong>. Anda memiliki wewenang penuh untuk menambah, mengedit, menghapus, dan menyinkronkan data Spreadsheet.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0 font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                Authorized Editor: Vicky • Agas Maulana • Tommy Wijaya
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <div className="font-bold text-amber-100 flex items-center gap-2">
                  <span>Mode Hanya Lihat (Read-Only)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-700 font-semibold">
                    Izin Terbatas
                  </span>
                </div>
                <p className="text-[11px] text-amber-300/90 mt-1">
                  Akun Anda (<strong>{currentUser?.fullName || 'Pengguna'}</strong>) memiliki akses untuk melihat seluruh isi panduan. Namun sesuai kebijakan sistem, <strong>pengeditan, penambahan, penghapusan, dan sinkronisasi data Spreadsheet hanya dapat dilakukan oleh akun berstatus Fulltime</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 0: TEMPLATE & FORMAT SPREADSHEET */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs sm:text-sm text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">
                      Format &amp; Struktur Google Spreadsheet (Pratinjau)
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Halaman ini menampilkan <strong>contoh format kolom tabel</strong>. Untuk <strong>menambah, mengedit, atau menghapus data langsung</strong>, klik tab nomor <strong>1 s/d 5</strong> di bilah atas, atau klik tombol cepat <span className="text-emerald-300 font-semibold">"✏️ Isi / Edit Data Ini"</span> pada tabel di bawah.
                    </p>
                  </div>
                </div>
              </div>

              {/* ⭐ 5 TAB UTAMA PANDUAN AUDIO (DATABASE GOOGLE SHEETS) ⭐ */}
              <div className="pt-2 pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>5 Tab Utama Panduan Teknisi Audio (Dapat Diedit Langsung di Spreadsheet)</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Format tabel ini sinkron 1:1 dengan aplikasi web dan Google Spreadsheet Anda.
                </p>
              </div>

              {/* Template Tab 1: Alat Kerja */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold border border-amber-700 uppercase">
                      Sheet: Alat_Kerja (Tab 1)
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Alat-Alat Meja Kerja &amp; Alat Ukur Audio</h5>
                    <p className="text-xs text-slate-400">
                      Kolom: ID, Nama_Alat, Kategori, Spesifikasi, Deskripsi, Fungsi_Meja_Kerja, SOP_Pemakaian, Tips_K3, Media_URL, Tipe_Media
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tools')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Tab 1 (Alat Kerja) ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getToolsTemplateCSV(), 'tools_fmt')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'tools_fmt' ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'tools_fmt' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Alat_Kerja_Template.csv', SpreadsheetService.getToolsTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Nama_Alat</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Spesifikasi</th>
                        <th className="p-2.5">Deskripsi</th>
                        <th className="p-2.5">Media_URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-amber-400">tool-multimeter</td>
                        <td className="p-2 text-white font-sans font-bold">Multimeter Digital True RMS</td>
                        <td className="p-2">Pengukuran</td>
                        <td className="p-2 font-sans">True RMS 6000 Count, Auto-Range</td>
                        <td className="p-2 font-sans">Instrumen wajib untuk mengukur tegangan DC/AC</td>
                        <td className="p-2 text-slate-400 truncate max-w-xs">https://images.unsplash.com/...</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-amber-400">tool-dim-bulb</td>
                        <td className="p-2 text-white font-sans font-bold">Bohlam Seri Pengaman (Dim Bulb Tester)</td>
                        <td className="p-2">Keamanan</td>
                        <td className="p-2 font-sans">Bohlam Pijar Filamen 100W/220V</td>
                        <td className="p-2 font-sans">Sirkuit pengaman wajib saat uji pertama power amplifier</td>
                        <td className="p-2 text-slate-400 truncate max-w-xs">https://images.unsplash.com/...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Tab 2: Tipe Ampli */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold border border-blue-700 uppercase">
                      Sheet: Tipe_Ampli (Tab 2)
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Katalog &amp; Arsitektur Tipe Power Amplifier</h5>
                    <p className="text-xs text-slate-400">
                      Kolom: ID, Nama_Ampli, Kelas_Topologi, Daya_RMS, Tegangan_PSU, Semikonduktor_Utama, Deskripsi, Karakteristik, Titik_Rawan, Tips_Teknisi, Media_URL, Tipe_Media
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ampli')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Tab 2 (Tipe Ampli) ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getAmpliTemplateCSV(), 'ampli_fmt')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'ampli_fmt' ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'ampli_fmt' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Tipe_Ampli_Template.csv', SpreadsheetService.getAmpliTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Nama_Ampli</th>
                        <th className="p-2.5">Kelas_Topologi</th>
                        <th className="p-2.5">Daya_RMS</th>
                        <th className="p-2.5">Tegangan_PSU</th>
                        <th className="p-2.5">Semikonduktor_Utama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-blue-400">ampli-apex-b500</td>
                        <td className="p-2 text-white font-sans font-bold">Apex B500 Standard</td>
                        <td className="p-2">Kelas AB</td>
                        <td className="p-2">500W RMS @ 4Ω</td>
                        <td className="p-2 font-sans">±65VDC s/d ±85VDC CT</td>
                        <td className="p-2 font-sans">2SC5200 / 2SA1943 (4-6 set)</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-blue-400">ampli-d900-d2k</td>
                        <td className="p-2 text-white font-sans font-bold">Class D D900 / D2K SMPS</td>
                        <td className="p-2">Kelas D</td>
                        <td className="p-2">900W - 2000W RMS</td>
                        <td className="p-2 font-sans">±75VDC s/d ±90VDC CT</td>
                        <td className="p-2 font-sans">IRFP4227 Mosfet + IR2110 Driver</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Tab 3: Komponen Rusak Bagus */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700 uppercase">
                      Sheet: Komponen_Rusak_Bagus (Tab 3)
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Video &amp; Gambar Pengujian Komponen Rusak vs Bagus</h5>
                    <p className="text-xs text-slate-400">
                      Kolom: ID, Judul_Komponen, Tipe_Media, URL_Media, Nama_Komponen, Gejala_Normal, Gejala_Rusak, Metode_Pengujian, Nilai_Normal, Nilai_Rusak
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('media')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Tab 3 (Video &amp; Media) ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getMediaTemplateCSV(), 'media_fmt')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'media_fmt' ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'media_fmt' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Komponen_Rusak_Bagus_Template.csv', SpreadsheetService.getMediaTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Judul_Komponen</th>
                        <th className="p-2.5">Tipe_Media</th>
                        <th className="p-2.5">Gejala_Normal</th>
                        <th className="p-2.5">Gejala_Rusak</th>
                        <th className="p-2.5">Metode_Pengujian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-indigo-400">media-tr-final</td>
                        <td className="p-2 text-white font-sans font-bold">Pengujian Transistor Final 2SC5200 / 2SA1943</td>
                        <td className="p-2 text-emerald-400">video</td>
                        <td className="p-2 font-sans">Drop tegangan B-C dan B-E 0.5V - 0.7V</td>
                        <td className="p-2 font-sans text-rose-400">Beep korslet 0.00V atau putus (OL)</td>
                        <td className="p-2 font-sans">Diode Mode pada Multimeter Digital</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Tab 4: Pengetesan Ampli */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700 uppercase">
                      Sheet: Pengetesan_Amplifier (Tab 4)
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">SOP &amp; Prosedur Pengetesan Amplifier</h5>
                    <p className="text-xs text-slate-400">
                      Kolom: ID, Nomor_Urut, Judul_Langkah, Kategori_Tag, Tindakan_SOP, Target_Normal, Tanda_Kerusakan, Tips_Proteksi, Media_URL
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('testAmpli')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Tab 4 (Tes Ampli) ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getTestAmpliTemplateCSV(), 'test_ampli_fmt')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'test_ampli_fmt' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'test_ampli_fmt' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Pengetesan_Amplifier_Template.csv', SpreadsheetService.getTestAmpliTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Judul_Langkah</th>
                        <th className="p-2.5">Kategori_Tag</th>
                        <th className="p-2.5">Target_Normal</th>
                        <th className="p-2.5">Tanda_Kerusakan</th>
                        <th className="p-2.5">Tips_Proteksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-emerald-400 font-bold">1</td>
                        <td className="p-2 text-white font-sans font-bold">Uji Bohlam Seri (Dim Bulb Tester)</td>
                        <td className="p-2">Proteksi Awal</td>
                        <td className="p-2 font-sans">Bohlam menyala sekejap (charging elco) lalu redup total</td>
                        <td className="p-2 font-sans text-rose-400">Bohlam menyala terang benderang terus menerus</td>
                        <td className="p-2 font-sans">JANGAN sambungkan beban speaker sebelum bohlam redup!</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-emerald-400 font-bold">2</td>
                        <td className="p-2 text-white font-sans font-bold">Uji DC Offset (DCO) Tanpa Beban</td>
                        <td className="p-2">Keamanan Speaker</td>
                        <td className="p-2 font-sans">DCO berada di bawah ±20mV (0.00V s/d 0.02V)</td>
                        <td className="p-2 font-sans text-rose-400">DCO tinggi mendekati tegangan rel rel PSU</td>
                        <td className="p-2 font-sans">Gunakan multimeter skala DC milivolt</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Tab 5: Pengetesan Speaker */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700 uppercase">
                      Sheet: Pengetesan_Speaker (Tab 5)
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">SOP &amp; Prosedur Pengetesan Speaker</h5>
                    <p className="text-xs text-slate-400">
                      Kolom: ID, Nomor_Urut, Judul_Langkah, Metode_Uji, Prosedur_SOP, Respon_Normal, Gejala_Rusak, Tips_Teknisi, Media_URL
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('testSpeaker')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Tab 5 (Tes Speaker) ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getTestSpeakerTemplateCSV(), 'test_spk_fmt')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'test_spk_fmt' ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'test_spk_fmt' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Pengetesan_Speaker_Template.csv', SpreadsheetService.getTestSpeakerTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Judul_Langkah</th>
                        <th className="p-2.5">Metode_Uji</th>
                        <th className="p-2.5">Respon_Normal</th>
                        <th className="p-2.5">Gejala_Rusak</th>
                        <th className="p-2.5">Tips_Teknisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-purple-400 font-bold">1</td>
                        <td className="p-2 text-white font-sans font-bold">Uji Resistansi Voice Coil (DCR)</td>
                        <td className="p-2 font-sans">Ohm Meter Multimeter Digital</td>
                        <td className="p-2 font-sans">Terbaca nilai DCR 3.2Ω - 3.8Ω untuk speaker 4Ω, atau 6.2Ω - 7.2Ω untuk speaker 8Ω</td>
                        <td className="p-2 font-sans text-rose-400">Terbaca 0Ω (korslet total) atau OL (kawat coil putus)</td>
                        <td className="p-2 font-sans">Sentuh probe saat speaker terpasang di meja kerja</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-purple-400 font-bold">2</td>
                        <td className="p-2 text-white font-sans font-bold">Uji Bunyi Klik &amp; Polaritas Baterai 1.5V</td>
                        <td className="p-2 font-sans">Baterai AA / AAA 1.5V</td>
                        <td className="p-2 font-sans">Bunyi 'klik' bersih dan daun speaker terdorong ke DEPAN saat kutub (+) baterai ke terminal (+)</td>
                        <td className="p-2 font-sans text-rose-400">Tidak ada suara klik sama sekali atau bunyi gesekan sreeek</td>
                        <td className="p-2 font-sans">Gunakan baterai kecil 1.5V, JANGAN gunakan adaptor tegangan tinggi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 📋 SHEET SISTEM & ADMINISTRASI */}
              <div className="pt-4 pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Sheet Sistem, Whitelist &amp; Catatan Nomor Service</span>
                </div>
              </div>

              {/* Template 1: Whitelist */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700 uppercase">
                      Sheet 1: WHITELIST_USER
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Daftar Izin Registrasi & Masa Akses Akun</h5>
                    <p className="text-xs text-slate-400">
                      Daftar nama ini bersifat informasional (roster). Status akses sesungguhnya (Fulltime / 6 Bulan / Menunggu) sekarang diatur lewat panel <strong>Kelola Akun</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('whitelist')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Isi &amp; Edit Whitelist ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getWhitelistTemplateCSV(), 'wl')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'wl' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'wl' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Template_Whitelist_Panduan_Service.csv', SpreadsheetService.getWhitelistTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Nama_Lengkap</th>
                        <th className="p-2.5">Departemen</th>
                        <th className="p-2.5">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-emerald-300 font-sans font-bold">Vicky</td>
                        <td className="p-2">Audio Specialist</td>
                        <td className="p-2">Master Engineer - Fulltime</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-emerald-300 font-sans font-bold">Agas Maulana</td>
                        <td className="p-2">Class D Specialist</td>
                        <td className="p-2">Master Engineer - Fulltime</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-emerald-300 font-sans font-bold">Tommy Wijaya</td>
                        <td className="p-2">Head of Engineering</td>
                        <td className="p-2">Master Engineer - Fulltime</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans">Rian Hidayat</td>
                        <td className="p-2">Teknisi Audio</td>
                        <td className="p-2">Akses 6 Bulan</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans">Budi Santoso</td>
                        <td className="p-2">Teknisi Perakitan</td>
                        <td className="p-2">Akses 6 Bulan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template 2: Media Video & Gambar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold border border-blue-700 uppercase">
                      Sheet 2: MEDIA_KOMPONEN
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Video YouTube Embed & Foto Fisik Komponen Rusak/Bagus</h5>
                    <p className="text-xs text-slate-400">
                      Tampil di Tab <em>Cara Mengenali Komponen Rusak/Bagus</em> pada bagian atas panduan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('media')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Video/Foto ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getMediaTemplateCSV(), 'med')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'med' ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'med' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Template_Media_Video_Gambar.csv', SpreadsheetService.getMediaTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Judul_Media</th>
                        <th className="p-2.5">Tipe</th>
                        <th className="p-2.5">URL_Media</th>
                        <th className="p-2.5">Nama_Komponen</th>
                        <th className="p-2.5">Kondisi_Bagus</th>
                        <th className="p-2.5">Kondisi_Rusak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-white font-sans">Cara Tes TR Final TOSHIBA 2SC5200</td>
                        <td className="p-2 text-blue-400 font-bold">video</td>
                        <td className="p-2 truncate max-w-xs">https://drive.google.com/file/d/1vXYZ_video_final_toshiba/view</td>
                        <td className="p-2">Transistor Final 2SC5200</td>
                        <td className="p-2 text-emerald-400">Forward bias 0.6V</td>
                        <td className="p-2 text-rose-400">Short 0.00V / Putus</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans">Identifikasi Elco Kembung / Bocor</td>
                        <td className="p-2 text-purple-400 font-bold">image</td>
                        <td className="p-2 truncate max-w-xs">https://images.unsplash.com/photo-1518770660439-4636190af475?w=800</td>
                        <td className="p-2">Elco PSU 10000uF/100V</td>
                        <td className="p-2 text-emerald-400">Tutup datar, ESR &lt; 0.2R</td>
                        <td className="p-2 text-rose-400">Cembung &amp; karat</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template 3: Database Analisis Unit */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700 uppercase">
                      Sheet 3: DATABASE_ANALISIS
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Pencarian Diagnosa Unit Berdasarkan Kerusakan</h5>
                    <p className="text-xs text-slate-400">
                      Dipakai saat teknisi mengisi Form Analisa Kerusakan Unit. Jika tidak ada yang cocok, sistem memunculkan <strong>"tanyakan pada pembina"</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('diagnosis')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Database Analisa ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getAnalysisTemplateCSV(), 'ana')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'ana' ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'ana' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Template_Database_Analisis_Unit.csv', SpreadsheetService.getAnalysisTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Nama_Unit</th>
                        <th className="p-2.5">Serial_Number</th>
                        <th className="p-2.5">Komponen_Rusak</th>
                        <th className="p-2.5">Hasil_Diagnosa_dan_Solusi</th>
                        <th className="p-2.5">Tingkat_Kesulitan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Power Amplifier CA20</td>
                        <td className="p-2">SN-CA20-00891</td>
                        <td className="p-2 text-rose-400">Transistor Final 2SC5200 Short</td>
                        <td className="p-2 font-sans">Ganti sepasang TR Final &amp; setel ulang bias 25-30mA</td>
                        <td className="p-2 text-amber-400">Sedang</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Power RDW FA9000</td>
                        <td className="p-2">SN-RDW-7712</td>
                        <td className="p-2 text-rose-400">Mosfet IRFP260N Terbakar</td>
                        <td className="p-2 font-sans">Ganti Mosfet driver dan IC PWM IRS2092S</td>
                        <td className="p-2 text-rose-400">Tinggi</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Subwoofer 18 Inch B&amp;C</td>
                        <td className="p-2">SN-SUB-3301</td>
                        <td className="p-2 text-rose-400">Spool Voice Coil Gosong</td>
                        <td className="p-2 font-sans">Ganti recone kit 4 inch akibat clip over gain</td>
                        <td className="p-2 text-amber-400">Sedang</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template 4: Pembina & Admin */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700 uppercase">
                      Sheet 4: KONTAK_PEMBINA
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Daftar Kontak Pembina Teknis &amp; Administrator Lisensi</h5>
                    <p className="text-xs text-slate-400">
                      Tampil pada halaman <em>Pusat Bantuan &amp; Kontak Pembina</em> ketika siswa butuh konsultasi.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('staff')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Kelola Kontak Pembina ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getStaffTemplateCSV(), 'stf')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'stf' ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'stf' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Template_Kontak_Pembina_Admin.csv', SpreadsheetService.getStaffTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Nama</th>
                        <th className="p-2.5">Peran</th>
                        <th className="p-2.5">No_WhatsApp</th>
                        <th className="p-2.5">Spesialisasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Tommy Wijaya</td>
                        <td className="p-2 text-emerald-400 font-bold">Pembina</td>
                        <td className="p-2">+62 812-3456-7890</td>
                        <td className="p-2 font-sans">Troubleshooting Daya Tinggi &amp; Topologi Power</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Agas Maulana</td>
                        <td className="p-2 text-emerald-400 font-bold">Pembina</td>
                        <td className="p-2">+62 813-9876-5432</td>
                        <td className="p-2 font-sans">Power Kelas D &amp; SMPS Switching</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Vicky</td>
                        <td className="p-2 text-emerald-400 font-bold">Pembina</td>
                        <td className="p-2">+62 821-4567-8910</td>
                        <td className="p-2 font-sans">Karakteristik Komponen &amp; Akustik Speaker</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Lestari Simatupang</td>
                        <td className="p-2 text-blue-400 font-bold">Admin</td>
                        <td className="p-2">+62 857-1234-5678</td>
                        <td className="p-2 font-sans">Validasi Hak Akses 6 Bulan &amp; Whitelist</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template 5: Catatan Nomor Service */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700 uppercase">
                      Sheet 5: NOMOR_SERVICE
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1">Pencatatan Nomor Service yang Dikerjakan</h5>
                    <p className="text-xs text-slate-400">
                      Format kolom: <strong>Nama Yang Mengerjakan, Nomor Service, Analisa Kerusakan, Komponen Yang Diganti</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('servicelogs')}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>✏️ Isi &amp; Kelola Nomor Service ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(SpreadsheetService.getServiceLogTemplateCSV(), 'srv')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'srv' ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'srv' ? 'Tersalin!' : 'Salin Format'}
                    </button>
                    <button
                      onClick={() => SpreadsheetService.downloadCSV('Template_Nomor_Service.csv', SpreadsheetService.getServiceLogTemplateCSV())}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                        <th className="p-2">Kolom A: Nama Yang Mengerjakan</th>
                        <th className="p-2">Kolom B: Nomor Service</th>
                        <th className="p-2">Kolom C: Analisa Kerusakan</th>
                        <th className="p-2">Kolom D: Komponen Yang Diganti</th>
                        <th className="p-2">Kolom E: Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Vicky</td>
                        <td className="p-2 text-cyan-400 font-bold">SRV-2025-001</td>
                        <td className="p-2 font-sans">Power CA20 mati total, TR final short 4 set dan bias pincang</td>
                        <td className="p-2 text-emerald-400 font-sans">Toshiba 2SC5200 &amp; 2SA1943 (4 set), Zener 15V, R Kapur 0.22Ω</td>
                        <td className="p-2">2025-05-10</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Agas Maulana</td>
                        <td className="p-2 text-cyan-400 font-bold">SRV-2025-002</td>
                        <td className="p-2 font-sans">Ampli Kelas D D2K SMPS suara serak di volume tinggi, LC filter panas</td>
                        <td className="p-2 text-emerald-400 font-sans">IC IR2110 driver (1 pcs), Mosfet IRFP4227, Toroid 22uH</td>
                        <td className="p-2">2025-05-11</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white font-sans font-bold">Tommy Wijaya</td>
                        <td className="p-2 text-cyan-400 font-bold">SRV-2025-003</td>
                        <td className="p-2 font-sans">Speaker aktif 15 inch protek terus, DCO bocor 18V ke woofer</td>
                        <td className="p-2 text-emerald-400 font-sans">Transistor diff-amp 2N5401 (2 pcs), Trimpot DCO 1k multi-turn</td>
                        <td className="p-2">2025-05-12</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ALAT-ALAT MEJA KERJA */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Database Alat-Alat Meja Kerja (Sheet: Alat_Kerja)</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Daftar instrumen ukur, solder, dan alat keselamatan yang tampil di Tab Alat Meja Kerja.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs text-amber-300">
                  Total: {toolsList.length} Alat
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowPasteTools(!showPasteTools)}
                      className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      {showPasteTools ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => SpreadsheetService.downloadCSV('Alat_Kerja.csv', SpreadsheetService.exportToolsCSV())}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Unduh CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(SpreadsheetService.getToolsTemplateCSV(), 'tools_csv_copy')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'tools_csv_copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'tools_csv_copy' ? 'Tersalin!' : 'Salin Format'}</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400">Sinkron otomatis dengan Tab Alat Meja Kerja</span>
              </div>

              {/* Quick Paste Box */}
              {canEdit && showPasteTools && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-400">
                      Tempelkan baris data dari Google Sheets / Excel di sini:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Format CSV / Tab-Delimited</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteToolsText}
                    onChange={(e) => setPasteToolsText(e.target.value)}
                    placeholder="ID,Nama_Alat,Kategori,Spesifikasi,Deskripsi,Fungsi_Meja_Kerja,SOP_Pemakaian,Tips_K3,Media_URL,Tipe_Media&#10;tool-analog,Multimeter Analog Sanwa,Pengukuran,Sensitivitas 20kΩ/V,Uji kebocoran transistor,Kalibrasi jarum 0 ohm,Atur selektor DCV,Awas skala tegangan tinggi,https://...,image"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteTools(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImportTools}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                    >
                      Impor Sekarang ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Tools Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Alat &amp; ID</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Spesifikasi</th>
                      <th className="p-3">Deskripsi Singkat</th>
                      <th className="p-3">Media</th>
                      {canEdit && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {toolsList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{t.name}</div>
                          <div className="text-[10px] text-amber-400 font-mono">{t.id}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-[11px]">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 text-[11px] max-w-xs">{t.specs}</td>
                        <td className="p-3 text-slate-400 text-[11px] max-w-xs line-clamp-2">{t.description}</td>
                        <td className="p-3">
                          {t.mediaUrl || t.image ? (
                            <a
                              href={t.mediaUrl || t.image}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTool(t.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Hapus Alat Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TIPE AMPLIFIER */}
          {activeTab === 'ampli' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Database Tipe Power Amplifier (Sheet: Tipe_Ampli)</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Katalog kelas topologi ampli, tegangan kerja PSU, daya output, dan titik rawan kerusakan.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs text-blue-300">
                  Total: {ampliList.length} Tipe
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowPasteAmpli(!showPasteAmpli)}
                      className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      {showPasteAmpli ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => SpreadsheetService.downloadCSV('Tipe_Ampli.csv', SpreadsheetService.exportAmpliCSV())}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Unduh CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(SpreadsheetService.getAmpliTemplateCSV(), 'ampli_csv_copy')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'ampli_csv_copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ampli_csv_copy' ? 'Tersalin!' : 'Salin Format'}</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400">Sinkron otomatis dengan Tab Tipe Ampli</span>
              </div>

              {/* Quick Paste Box */}
              {canEdit && showPasteAmpli && (
                <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-blue-400">
                      Tempelkan baris data dari Google Sheets / Excel di sini:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Format CSV / Tab-Delimited</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteAmpliText}
                    onChange={(e) => setPasteAmpliText(e.target.value)}
                    placeholder="ID,Nama_Ampli,Kelas_Topologi,Daya_RMS,Tegangan_PSU,Semikonduktor_Utama,Deskripsi,Karakteristik,Titik_Rawan,Tips_Teknisi,Media_URL,Tipe_Media&#10;ampli-socl-504,SOCL 504 Super OCL,Kelas AB,500W RMS @ 4Ω,±45VDC - ±65VDC CT,2SC5200 / 2SA1943,Power amplifier sejuta umat,Suara bass empuk | Karakter low sub,Bias tidak seimbang | DCO bocor,Set trimpot DCO ke 0.00V,https://...,image"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteAmpli(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImportAmpli}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                    >
                      Impor Sekarang ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Ampli Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Ampli &amp; ID</th>
                      <th className="p-3">Kelas Topologi</th>
                      <th className="p-3">Daya Output RMS</th>
                      <th className="p-3">Tegangan PSU</th>
                      <th className="p-3">Semikonduktor Utama</th>
                      <th className="p-3">Media</th>
                      {canEdit && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {ampliList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{a.name}</div>
                          <div className="text-[10px] text-blue-400 font-mono">{a.id}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[11px]">
                            {a.classType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-bold">{a.powerRange}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{a.voltageSupply}</td>
                        <td className="p-3 text-slate-300 text-[11px] max-w-xs">{a.typicalTransistors || '-'}</td>
                        <td className="p-3">
                          {a.mediaUrl || a.image ? (
                            <a
                              href={a.mediaUrl || a.image}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteAmpli(a.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Hapus Ampli Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PENGETESAN AMPLIFIER */}
          {activeTab === 'testAmpli' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Database Pengetesan Amplifier (Sheet: Pengetesan_Amplifier)</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Prosedur langkah demi langkah SOP pengujian bohlam seri, kalibrasi DCO, arus bias, dan uji beban.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs text-emerald-300">
                  Total: {testAmpliList.length} Langkah
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowPasteTestAmpli(!showPasteTestAmpli)}
                      className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      {showPasteTestAmpli ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => SpreadsheetService.downloadCSV('Pengetesan_Amplifier.csv', SpreadsheetService.exportTestAmpliCSV())}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Unduh CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(SpreadsheetService.getTestAmpliTemplateCSV(), 'test_ampli_csv_copy')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'test_ampli_csv_copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'test_ampli_csv_copy' ? 'Tersalin!' : 'Salin Format'}</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400">Sinkron otomatis dengan Tab Pengetesan Ampli</span>
              </div>

              {/* Quick Paste Box */}
              {canEdit && showPasteTestAmpli && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-emerald-400">
                      Tempelkan baris data dari Google Sheets / Excel di sini:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Format CSV / Tab-Delimited</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteTestAmpliText}
                    onChange={(e) => setPasteTestAmpliText(e.target.value)}
                    placeholder="ID,Nomor_Urut,Judul_Langkah,Kategori_Tag,Tindakan_SOP,Target_Normal,Tanda_Kerusakan,Tips_Proteksi,Media_URL&#10;test-1,1,Uji Bohlam Seri (Dim Bulb Tester),Proteksi Awal,Pasang bohlam seri 100W pada jala-jala 220V,Bohlam redup total setelah charging,Bohlam menyala terang benderang,Jangan pasang beban sebelum redup,https://..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteTestAmpli(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImportTestAmpli}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                    >
                      Impor Sekarang ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Test Ampli Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3 text-center">No</th>
                      <th className="p-3">Judul Langkah</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Target Normal</th>
                      <th className="p-3">Tanda Kerusakan</th>
                      <th className="p-3">Media</th>
                      {canEdit && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {testAmpliList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-center font-bold text-emerald-400">{t.num}</td>
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{t.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[11px]">
                            {t.tag}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-300 text-[11px] max-w-xs">{t.target}</td>
                        <td className="p-3 text-rose-400 text-[11px] max-w-xs">{t.failure}</td>
                        <td className="p-3">
                          {t.mediaUrl || t.image ? (
                            <a
                              href={t.mediaUrl || t.image}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTestAmpli(t.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Hapus Langkah Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PENGETESAN SPEAKER */}
          {activeTab === 'testSpeaker' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Volume2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Database Pengetesan Speaker (Sheet: Pengetesan_Speaker)</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Prosedur SOP pengujian resistansi DCR voice coil, uji getar baterai 1.5V, uji gesek membran dan sweep generator.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs text-purple-300">
                  Total: {testSpeakerList.length} Langkah
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowPasteTestSpeaker(!showPasteTestSpeaker)}
                      className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      {showPasteTestSpeaker ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => SpreadsheetService.downloadCSV('Pengetesan_Speaker.csv', SpreadsheetService.exportTestSpeakerCSV())}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Unduh CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(SpreadsheetService.getTestSpeakerTemplateCSV(), 'test_spk_csv_copy')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'test_spk_csv_copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'test_spk_csv_copy' ? 'Tersalin!' : 'Salin Format'}</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400">Sinkron otomatis dengan Tab Pengetesan Speaker</span>
              </div>

              {/* Quick Paste Box */}
              {canEdit && showPasteTestSpeaker && (
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-400">
                      Tempelkan baris data dari Google Sheets / Excel di sini:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Format CSV / Tab-Delimited</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteTestSpeakerText}
                    onChange={(e) => setPasteTestSpeakerText(e.target.value)}
                    placeholder="ID,Nomor_Urut,Judul_Langkah,Metode_Uji,Prosedur_SOP,Respon_Normal,Gejala_Rusak,Tips_Teknisi,Media_URL&#10;spk-1,1,Uji Resistansi Voice Coil (DCR),Ohm Meter Digital,Ukur resistansi terminal (+) dan (-),Terbaca 3.2Ω - 3.8Ω (speaker 4Ω),0Ω (short) atau OL (putus),Sentuh probe stabil,https://..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteTestSpeaker(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImportTestSpeaker}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                    >
                      Impor Sekarang ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Test Speaker Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3 text-center">No</th>
                      <th className="p-3">Judul Langkah</th>
                      <th className="p-3">Metode Uji</th>
                      <th className="p-3">Respon Normal</th>
                      <th className="p-3">Gejala Rusak</th>
                      <th className="p-3">Media</th>
                      {canEdit && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {testSpeakerList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-center font-bold text-purple-400">{t.num}</td>
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{t.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                        </td>
                        <td className="p-3 text-slate-300 text-[11px]">{t.method}</td>
                        <td className="p-3 text-purple-300 text-[11px] max-w-xs">{t.normal}</td>
                        <td className="p-3 text-rose-400 text-[11px] max-w-xs">{t.defect}</td>
                        <td className="p-3">
                          {t.mediaUrl || t.image ? (
                            <a
                              href={t.mediaUrl || t.image}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTestSpeaker(t.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Hapus Langkah Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'whitelist' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Aturan Hak Akses:</strong> Pengguna harus terdaftar di tabel Whitelist ini agar bisa registrasi.
                  Status akses (Fulltime / 6 Bulan) setiap akun sekarang diatur langsung oleh admin lewat panel <em>Kelola Akun</em>, bukan berdasarkan nama.
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPasteWhitelist(!showPasteWhitelist)}
                    className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {showPasteWhitelist ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                  </button>
                )}
                <span className="text-xs text-slate-400">Total Anggota Whitelist: {whitelist.length}</span>
              </div>

              {/* Quick Paste Area */}
              {canEdit && showPasteWhitelist && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-fadeIn">
                  <label className="block text-xs font-semibold text-emerald-400">
                    Tempelkan Baris Data dari Google Sheets / Excel di sini:
                  </label>
                  <textarea
                    rows={4}
                    value={pasteWhitelistText}
                    onChange={(e) => setPasteWhitelistText(e.target.value)}
                    placeholder="Nama_Lengkap,Departemen,Catatan&#10;Rian Hidayat,Teknisi Audio,Akses 6 Bulan&#10;Budi Santoso,Teknisi Perakitan,Akses 6 Bulan"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleImportWhitelist}
                      className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Data Whitelist
                    </button>
                  </div>
                </div>
              )}

              {/* Add form - Only for authorized editors */}
              {canEdit ? (
                <form onSubmit={handleAddMember} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tambah Nama Baru Manual:
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Contoh: Rian Hidayat, Budi Santoso..."
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Departemen / Bagian:
                    </label>
                    <input
                      type="text"
                      value={newMemberDept}
                      onChange={(e) => setNewMemberDept(e.target.value)}
                      placeholder="Teknisi Audio"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Penambahan dan pengeditan nama Whitelist dikunci. Hanya dapat diubah oleh <strong>akun Fulltime</strong>.</span>
                </div>
              )}

              {/* Table of Whitelisted Members */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Anggota</th>
                      <th className="p-3">Hak Akses</th>
                      <th className="p-3">Departemen</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3 text-right">{canEdit ? 'Aksi' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {whitelist.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">{w.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.accessType === 'fulltime'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {w.accessType === 'fulltime' ? 'Fulltime (Seumur Hidup)' : '6 Bulan Akses'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{w.department}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{w.notes}</td>
                        <td className="p-3 text-right">
                          {canEdit ? (
                            <button
                              onClick={() => handleDeleteMember(w.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus dari Whitelist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-600 inline-flex items-center gap-1 text-[11px]" title="Hanya editor yang dapat mengubah">
                              <Lock className="w-3 h-3 text-slate-600" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO & GAMBAR KOMPONEN */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Bebas YouTube — Media Komponen Fleksibel:</strong> Anda dapat mengunggah file video MP4/MOV atau foto langsung dari komputer/HP Anda, atau memasukkan link file yang Anda upload ke <strong>Google Drive</strong> (dengan izin 'Siapa saja yang memiliki link'). Media ini otomatis tampil di tab <em>"Cara Mengenali Komponen Rusak/Bagus"</em>.
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPasteMedia(!showPasteMedia)}
                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {showPasteMedia ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                  </button>
                )}
                <span className="text-xs text-slate-400">Total Panduan Media: {mediaGuides.length}</span>
              </div>

              {/* Quick Paste Area */}
              {canEdit && showPasteMedia && (
                <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3 animate-fadeIn">
                  <label className="block text-xs font-semibold text-blue-400">
                    Tempelkan Baris Data Media dari Google Sheets di sini:
                  </label>
                  <textarea
                    rows={4}
                    value={pasteMediaText}
                    onChange={(e) => setPasteMediaText(e.target.value)}
                    placeholder="Judul_Media,Tipe,URL_Media,Nama_Komponen,Keterangan&#10;Cara Tes TR Final,video,https://drive.google.com/file/d/1vXYZ/view,Transistor Final,Panduan tes hFE"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleImportMedia}
                      className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Data Media
                    </button>
                  </div>
                </div>
              )}

              {/* Add media form - Only for authorized editors */}
              {canEdit ? (
                <form onSubmit={handleAddMedia} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      Tambah Panduan Media Baru (File Lokal atau Google Drive):
                    </h4>
                  </div>

                  {/* Option to upload directly from device */}
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                        <FileUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Pilih File Video / Gambar dari Perangkat</p>
                        <p className="text-[11px] text-slate-400">
                          {modalFileName ? `File terpilih: ${modalFileName}` : 'Mendukung MP4, MOV, WebM, JPG, PNG'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={modalFileInputRef}
                      onChange={handleModalFileChange}
                      accept="video/mp4,video/webm,video/quicktime,image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      {isModalProcessingFile ? 'Memproses...' : 'Pilih File'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Panduan:</label>
                      <input
                        type="text"
                        required
                        value={newMediaTitle}
                        onChange={(e) => setNewMediaTitle(e.target.value)}
                        placeholder="Contoh: Video Pengujian Transistor Final Toshiba"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tipe Media:</label>
                      <select
                        value={newMediaType}
                        onChange={(e) => setNewMediaType(e.target.value as 'video' | 'image')}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="video">Video (MP4 / Google Drive Video)</option>
                        <option value="image">Gambar / Foto Fisik</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL Media (Link Google Drive / Direct URL / File Lokal):
                      </label>
                      <input
                        type="text"
                        required
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... atau https://..."
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Target Nama Komponen:</label>
                      <input
                        type="text"
                        value={newMediaComp}
                        onChange={(e) => setNewMediaComp(e.target.value)}
                        placeholder="Contoh: Transistor Bipolar / MOSFET"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan / Caption Ringkas:</label>
                    <input
                      type="text"
                      value={newMediaCaption}
                      onChange={(e) => setNewMediaCaption(e.target.value)}
                      placeholder="Contoh: Uji probe merah di Base, probe hitam di Collector"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Simpan Media ke Spreadsheet
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Upload dan penambahan media video/gambar dikunci. Hanya dapat diubah oleh <strong>akun Fulltime</strong>.</span>
                </div>
              )}

              {/* Media List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediaGuides.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.mediaType === 'video' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {m.mediaType === 'video' ? 'VIDEO' : 'GAMBAR'}
                        </span>
                        <span className="font-semibold text-white truncate">{m.title}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] truncate">Komponen: <span className="text-slate-200">{m.componentName}</span></p>
                      <p className="text-slate-500 text-[10px] truncate font-mono">{m.mediaUrl}</p>
                    </div>
                    {canEdit ? (
                      <button
                        onClick={() => handleDeleteMedia(m.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Hapus Media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-1.5 text-slate-600" title="Terkunci">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE ANALISA KERUSAKAN */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Database Analisis Kerusakan Unit:</strong> Data ini akan dicocokkan saat teknisi menggunakan fitur <em>Analisis Kerusakan Unit</em> di sidebar kiri atas.
                  Jika serial number atau unit/kerusakan yang dicari tidak ditemukan di database ini, sistem otomatis memunculkan rekomendasi: <strong>"tanyakan pada pembina"</strong>.
                </div>
              </div>

              {/* REAL-TIME AUTO-SYNC INDICATOR BANNER */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-300 font-bold">Auto-Sync Google Spreadsheet Aktif</strong>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        Real-Time
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Setiap data analisis unit yang Anda tambahkan atau hapus di web ini akan otomatis disinkronkan ke Google Spreadsheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isBackendConfigured() ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono text-[11px]">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Terhubung ke Spreadsheet</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Hubungkan Spreadsheet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Notification Message */}
              {autoSyncNotice && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all animate-fadeIn ${
                  autoSyncNotice.status === 'syncing'
                    ? 'bg-blue-950/70 border-blue-600/60 text-blue-200'
                    : autoSyncNotice.status === 'success'
                    ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200'
                    : autoSyncNotice.status === 'error'
                    ? 'bg-rose-950/70 border-rose-600/60 text-rose-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {autoSyncNotice.status === 'syncing' && <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
                    {autoSyncNotice.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {autoSyncNotice.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {autoSyncNotice.status === 'idle' && <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span>{autoSyncNotice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSyncNotice(null)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPasteDiagnosis(!showPasteDiagnosis)}
                    className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {showPasteDiagnosis ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                  </button>
                )}
                <span className="text-xs text-slate-400">Total Kasus Tercatat: {diagnosisList.length}</span>
              </div>

              {/* Quick Paste Area */}
              {canEdit && showPasteDiagnosis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-fadeIn">
                  <label className="block text-xs font-semibold text-indigo-400">
                    Tempelkan Baris Data Analisis dari Google Sheets di sini:
                  </label>
                  <textarea
                    rows={4}
                    value={pasteDiagnosisText}
                    onChange={(e) => setPasteDiagnosisText(e.target.value)}
                    placeholder="Nama_Unit,Serial_Number,Komponen_Rusak,Hasil_Diagnosa_dan_Solusi&#10;Power CA20,SN-CA20-00891,Transistor Final Short,Ganti TR Final sepasang dan setel bias"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleImportDiagnosis}
                      className="py-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Data Analisis
                    </button>
                  </div>
                </div>
              )}

              {/* Add Diagnosis Record form - Only for authorized editors */}
              {canEdit ? (
                <form onSubmit={handleAddDiagnosis} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white text-xs">
                      {editingDiagnosisId ? 'Edit Catatan Kerusakan & Solusi:' : 'Tambah Catatan Kerusakan & Solusi Baru:'}
                    </h4>
                    {editingDiagnosisId && (
                      <button
                        type="button"
                        onClick={resetDiagnosisForm}
                        className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Batal edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Unit / Model:</label>
                      <input
                        type="text"
                        required
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Contoh: Power Amplifier CA20"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number (Opsional):</label>
                      <input
                        type="text"
                        value={newSerial}
                        onChange={(e) => setNewSerial(e.target.value)}
                        placeholder="Contoh: SN-CA20-00891"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Komponen Rusak / Gejala:</label>
                    <input
                      type="text"
                      required
                      value={newDamagedComp}
                      onChange={(e) => setNewDamagedComp(e.target.value)}
                      placeholder="Contoh: Transistor Final 2SC5200 Short Korslet"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hasil Diagnosa & Solusi Perbaikan:</label>
                    <input
                      type="text"
                      value={newSolution}
                      onChange={(e) => setNewSolution(e.target.value)}
                      placeholder="Contoh: Ganti TR Final sepasang 2SC5200 & 2SA1943 lalu setel trimpot bias 25mA"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Penyebab Utama (Root Cause):</label>
                    <input
                      type="text"
                      value={newRootCause}
                      onChange={(e) => setNewRootCause(e.target.value)}
                      placeholder="Contoh: Beban lebih atau usia pakai komponen"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Langkah-Langkah Solusi Servis (satu langkah per baris):
                    </label>
                    <textarea
                      rows={3}
                      value={newRepairStepsText}
                      onChange={(e) => setNewRepairStepsText(e.target.value)}
                      placeholder={'Periksa komponen terkait\nGanti komponen rusak dengan part original\nUji dengan Bohlam Seri 100W'}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Kosongkan untuk pakai 3 langkah standar bawaan.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Komponen / Part Pengganti yang Disarankan (satu per baris):
                    </label>
                    <textarea
                      rows={2}
                      value={newRecommendedPartsText}
                      onChange={(e) => setNewRecommendedPartsText(e.target.value)}
                      placeholder="Contoh: Transistor 2SC5200\nTransistor 2SA1943"
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Kesulitan:</label>
                      <select
                        value={newDifficulty}
                        onChange={(e) => setNewDifficulty(e.target.value as AnalisisUnitRecord['difficulty'])}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Mudah">Mudah</option>
                        <option value="Sedang">Sedang</option>
                        <option value="Sulit">Sulit</option>
                        <option value="Kritis">Kritis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Estimasi Waktu Pengerjaan:</label>
                      <input
                        type="text"
                        value={newEstimatedTime}
                        onChange={(e) => setNewEstimatedTime(e.target.value)}
                        placeholder="Contoh: 1 Jam, 30 Menit, 2-3 Jam"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingDiagnosisId ? 'Simpan Perubahan' : 'Tambah Catatan Unit ke Spreadsheet'}
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Penambahan dan pengeditan database analisis unit dikunci. Hanya dapat diubah oleh <strong>akun Fulltime</strong>.</span>
                </div>
              )}

              {/* Records List */}
              <div className="space-y-2">
                {diagnosisList.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rec.unitName}</span>
                        <span className="font-mono text-slate-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          SN: {rec.serialNumber}
                        </span>
                      </div>
                      <p className="text-rose-300"><strong>Gejala:</strong> {rec.damagedComponent}</p>
                      <p className="text-slate-300"><strong>Hasil & Solusi:</strong> {rec.diagnosisResult}</p>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditDiagnosis(rec)}
                          className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Edit Catatan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiagnosis(rec.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-1.5 text-slate-600 shrink-0" title="Terkunci">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PEMBINA & ADMIN */}
          {activeTab === 'staff' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Kontak Pembina & Admin:</strong> Ditampilkan di Pusat Bantuan saat siswa menghadapi kendala teknis atau butuh lisensi spreadsheet baru.
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPasteStaff(!showPasteStaff)}
                    className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {showPasteStaff ? 'Tutup Input Paste' : '📋 Quick Import: Paste dari Google Sheets (Ctrl+V)'}
                  </button>
                )}
                <span className="text-xs text-slate-400">Total Kontak: {staffList.length}</span>
              </div>

              {/* Quick Paste Area */}
              {canEdit && showPasteStaff && (
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3 animate-fadeIn">
                  <label className="block text-xs font-semibold text-purple-400">
                    Tempelkan Baris Kontak dari Google Sheets di sini:
                  </label>
                  <textarea
                    rows={4}
                    value={pasteStaffText}
                    onChange={(e) => setPasteStaffText(e.target.value)}
                    placeholder="Nama,Peran,Jabatan,No_WhatsApp,Email,Spesialisasi&#10;Tommy Wijaya,Pembina,Master Audio Engineer,+62 812-3456-7890,tommy@service-audio.id,Troubleshooting"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleImportStaff}
                      className="py-1.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Data Kontak
                    </button>
                  </div>
                </div>
              )}

              {/* Add form - Only for authorized editors */}
              {canEdit ? (
                <form onSubmit={handleAddStaff} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-semibold text-white text-xs">Tambah Kontak Pembina / Admin Baru:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="Contoh: Tommy Wijaya"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Peran:</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as 'Pembina' | 'Admin')}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="Pembina">Pembina (Konsultasi Teknis)</option>
                        <option value="Admin">Admin (Akses & Spreadsheet)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">No WhatsApp:</label>
                      <input
                        type="text"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        placeholder="+62 812-xxxx-xxxx"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Jabatan / Spesialisasi:</label>
                      <input
                        type="text"
                        value={newStaffSpecialty}
                        onChange={(e) => setNewStaffSpecialty(e.target.value)}
                        placeholder="Contoh: Spesialis Power Kelas D & SMPS"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email:</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="email@service-audio.id"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Kontak
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Penambahan dan pengelolaan kontak pembina dikunci. Hanya dapat diubah oleh <strong>akun Fulltime</strong>.</span>
                </div>
              )}

              {/* Staff List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staffList.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.role === 'Pembina' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {s.role}
                        </span>
                        <span className="font-semibold text-white truncate">{s.name}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] truncate">{s.specialty}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{s.phone} • {s.email}</p>
                    </div>
                    {canEdit ? (
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
                        title="Hapus Kontak"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-1.5 text-slate-600 shrink-0" title="Terkunci">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CATATAN NOMOR SERVICE */}
          {activeTab === 'servicelogs' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    Catatan Nomor Service yang Dikerjakan
                  </p>
                  <p className="text-slate-400 text-xs">
                    Format Spreadsheet: <strong>Nama yang mengerjakan, nomor service, analisa kerusakan dan komponen yang diganti</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(SpreadsheetService.exportServiceLogsCSV(), 'srv_all')}
                    className="py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'srv_all' ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'srv_all' ? 'Tersalin!' : 'Salin Semua CSV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => SpreadsheetService.downloadCSV('Catatan_Nomor_Service.csv', SpreadsheetService.exportServiceLogsCSV())}
                    className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowPasteServiceLog(!showPasteServiceLog)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{showPasteServiceLog ? 'Tutup Paste' : 'Quick Import (Paste)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* REAL-TIME AUTO-SYNC INDICATOR BANNER FOR SERVICE LOGS */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-cyan-300 font-bold">Auto-Sync Catatan Servis Aktif</strong>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                        Real-Time
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Setiap catatan nomor service yang diinput dari tombol mengambang ataupun form ini otomatis tersinkron ke Google Spreadsheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isBackendConfigured() ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono text-[11px]">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Terhubung ke Spreadsheet</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Hubungkan Spreadsheet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Notification Message */}
              {autoSyncNotice && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all animate-fadeIn ${
                  autoSyncNotice.status === 'syncing'
                    ? 'bg-blue-950/70 border-blue-600/60 text-blue-200'
                    : autoSyncNotice.status === 'success'
                    ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200'
                    : autoSyncNotice.status === 'error'
                    ? 'bg-rose-950/70 border-rose-600/60 text-rose-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {autoSyncNotice.status === 'syncing' && <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
                    {autoSyncNotice.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {autoSyncNotice.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {autoSyncNotice.status === 'idle' && <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span>{autoSyncNotice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSyncNotice(null)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Paste Importer */}
              {showPasteServiceLog && canEdit && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Paste Data dari Tab Google Sheets (Ctrl+V):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kolom: Nama | No Service | Analisa Kerusakan | Komponen Diganti
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteServiceLogText}
                    onChange={(e) => setPasteServiceLogText(e.target.value)}
                    placeholder="Nama Yang Mengerjakan,Nomor Service,Analisa Kerusakan,Komponen Yang Diganti&#10;Vicky,SRV-2025-001,Power CA20 mati total TR final short,Toshiba 2SC5200 4 set&#10;Agas Maulana,SRV-2025-002,Ampli Kelas D suara serak di volume tinggi,IC IR2110 driver"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleImportServiceLog}
                      className="py-1.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Data Nomor Service
                    </button>
                  </div>
                </div>
              )}

              {/* Add form - Only for authorized editors */}
              {canEdit ? (
                <form onSubmit={handleAddServiceLog} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    Tambah Catatan Nomor Service Baru:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama yang Mengerjakan *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newLogNama}
                        onChange={(e) => setNewLogNama(e.target.value)}
                        placeholder="Contoh: Vicky / Agas Maulana / Tommy Wijaya"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nomor Service *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newLogNoSrv}
                        onChange={(e) => setNewLogNoSrv(e.target.value)}
                        placeholder="Contoh: SRV-2025-004 atau No. Nota"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Analisa Kerusakan *:
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={newLogAnalisa}
                        onChange={(e) => setNewLogAnalisa(e.target.value)}
                        placeholder="Contoh: TR final jebol karena over voltage, bias pincang 75mA"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Komponen yang Diganti *:
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={newLogKomponen}
                        onChange={(e) => setNewLogKomponen(e.target.value)}
                        placeholder="Contoh: 2SC5200 (2 pcs), 2SA1943 (2 pcs), Resistor kapur 0.22Ω"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan Catatan Service</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Penambahan catatan service dikunci. Pengeditan master spreadsheet hanya dapat dilakukan oleh <strong>akun Fulltime</strong>.</span>
                </div>
              )}

              {/* Service Logs Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Daftar Pekerjaan Service ({serviceLogs.length} Data):
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Tersimpan di Penyimpanan Aplikasi &amp; Siap Ekspor ke Google Sheets
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="p-3">No</th>
                        <th className="p-3">Nama Yang Mengerjakan</th>
                        <th className="p-3">Nomor Service</th>
                        <th className="p-3">Analisa Kerusakan</th>
                        <th className="p-3">Komponen Yang Diganti</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {serviceLogs.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3 font-semibold text-white">{item.namaYangMengerjakan}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-800/70">
                              {item.nomorService}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">{item.analisaKerusakan}</td>
                          <td className="p-3 max-w-xs text-emerald-300">{item.komponenDiganti}</td>
                          <td className="p-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{item.createdAt}</td>
                          <td className="p-3 text-right">
                            {canEdit ? (
                              <button
                                onClick={() => handleDeleteServiceLog(item.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="p-1.5 text-slate-600 inline-block" title="Terkunci">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KONEKSI SPREADSHEET (APPS SCRIPT) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">

              {/* SECTION 1: STATUS KONEKSI APPS SCRIPT */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          Spreadsheet Master (Google Apps Script)
                        </h4>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          backendStatus === 'connected'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                            : backendStatus === 'error'
                            ? 'bg-rose-950 text-rose-300 border-rose-700/60'
                            : backendStatus === 'unconfigured'
                            ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {backendStatus === 'connected' && 'Terhubung'}
                          {backendStatus === 'error' && 'Gagal Terhubung'}
                          {backendStatus === 'unconfigured' && 'Belum Dikonfigurasi'}
                          {backendStatus === 'checking' && 'Memeriksa...'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Spreadsheet Google Sheets adalah database utama aplikasi ini. Data disinkronkan otomatis tiap ±15 detik lewat Google Apps Script - dua arah: ubah di web atau langsung di spreadsheet, keduanya nyambung.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={checkBackendStatus}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cek Ulang</span>
                  </button>
                </div>

                {backendStatus === 'unconfigured' && (
                  <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 border bg-amber-950/60 border-amber-700/80 text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <code>VITE_APPS_SCRIPT_URL</code> belum diisi di file <code>.env.local</code>. Deploy <code>google-apps-script/Code.gs</code> sebagai Web App dulu, lalu tempel URL-nya - lihat SETUP_GUIDE.md.
                    </span>
                  </div>
                )}

                {backendStatus === 'error' && (
                  <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 border bg-rose-950/60 border-rose-700/80 text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{backendMsg || 'Gagal terhubung ke Apps Script.'}</span>
                  </div>
                )}

                {backendStatus === 'connected' && (
                  <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 border bg-emerald-950/60 border-emerald-700/80 text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Terhubung ke Apps Script. Semua data (Alat_Kerja, Tipe_Ampli, Komponen_Rusak_Bagus, Pengetesan_Amplifier, Pengetesan_Speaker, Nomor_Service, Whitelist_Siswa, Analisis_Kerusakan, Kontak_Staff, Akun_Pengguna) dibaca &amp; ditulis langsung dari/ke spreadsheet Anda.</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleRefreshNow}
                    className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>

                {syncStatus && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300">
                    {syncStatus}
                  </div>
                )}
              </div>

              {/* SECTION 2: ALTERNATIVE PUBLISH WEB CSV (MANUAL, SEKALI PAKAI) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-slate-200 text-xs font-bold border-b border-slate-800 pb-2">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>Alternatif: Impor Sekali dari Link Publikasi CSV Google Sheets</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <p className="font-semibold text-white">
                    Berguna untuk migrasi data lama satu kali saja (bukan sinkronisasi rutin - itu sudah otomatis lewat Apps Script di atas):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed text-[11px]">
                    <li>Buka dokumen Google Spreadsheet lama Anda.</li>
                    <li>Klik menu <strong>File &rarr; Bagikan (Share) &rarr; Publikasikan ke Web (Publish to web)</strong>.</li>
                    <li>Pada pilihan format, pilih <strong>Nilai yang dipisahkan koma (.csv)</strong> lalu klik tombol <em>Publikasikan</em>.</li>
                    <li>Salin link CSV yang diberikan oleh Google dan tempelkan pada kotak input di bawah.</li>
                  </ol>
                </div>

                {!canEdit && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2.5">
                    <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Impor CSV hanya dapat dijalankan oleh <strong>akun Fulltime</strong>.</span>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    URL Google Sheets Publish CSV:
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!canEdit || isSyncing}
                      onClick={handleSyncSheet}
                      className="py-2.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Mengimpor...' : 'Impor dari CSV'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer with Clear Back Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Data tersimpan secara otomatis dan aman di browser Anda.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeTab !== 'templates' && (
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Format Template</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Web (Selesai)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
