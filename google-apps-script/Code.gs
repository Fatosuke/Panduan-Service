/**
 * Code.gs
 * ---------------------------------------------------------------------------
 * Backend API untuk Panduan Service, jalan di dalam Google Apps Script,
 * memakai Google Sheet ini sebagai database utama (bukan salinan/cadangan -
 * ini betul-betul database-nya).
 *
 * Cara pasang: lihat SETUP_GUIDE.md. Singkatnya - buka Google Sheet master,
 * Extensions > Apps Script, hapus isi default, tempel seluruh isi file ini,
 * lalu Deploy > New deployment > Web app (Execute as: Me, Who has access:
 * Anyone), dan salin URL yang diberikan ke Spreadsheet Manager di aplikasi.
 *
 * Tidak butuh Firebase, tidak butuh kartu kredit, gratis selamanya dalam
 * kuota wajar Google Apps Script (jauh lebih dari cukup untuk toko servis).
 * ---------------------------------------------------------------------------
 */

// ============================================================================
// SKEMA TAB (nama kolom, urutan harus konsisten dengan header di baris 1)
// ============================================================================
const SCHEMAS = {
  Alat_Kerja: ['id', 'name', 'category', 'specs', 'description', 'functionDesc', 'howToUse', 'safetyTips', 'mediaUrl', 'mediaType'],
  Tipe_Ampli: ['id', 'name', 'classType', 'powerRange', 'voltageSupply', 'description', 'characteristics', 'commonFailures', 'schematicTips', 'typicalTransistors', 'mediaUrl', 'mediaType'],
  Komponen_Rusak_Bagus: ['id', 'title', 'mediaType', 'mediaUrl', 'caption', 'componentName', 'goodSymptom', 'badSymptom', 'testMethod', 'normalValue', 'damagedValue'],
  Pengetesan_Amplifier: ['id', 'num', 'title', 'tag', 'action', 'target', 'failure', 'tips', 'mediaUrl', 'mediaType'],
  Pengetesan_Speaker: ['id', 'num', 'title', 'method', 'sop', 'normal', 'defect', 'tip', 'mediaUrl', 'mediaType'],
  Nomor_Service: ['id', 'namaYangMengerjakan', 'nomorService', 'analisaKerusakan', 'komponenDiganti', 'createdAt'],
  Whitelist_Siswa: ['id', 'name', 'accessType', 'department', 'notes'],
  Analisis_Kerusakan: ['id', 'unitName', 'serialNumber', 'damagedComponent', 'diagnosisResult', 'rootCause', 'repairSteps', 'recommendedParts', 'difficulty', 'estimatedTime'],
  Kontak_Staff: ['id', 'name', 'role', 'title', 'phone', 'email', 'status', 'specialty'],
  Katalog_Komponen: ['id', 'name', 'category', 'subType', 'symbol', 'description', 'functionDesc', 'howToTest', 'goodCondition', 'badCondition', 'safetyNote', 'pinoutOrColorCode', 'image'],
  // Chat "Tanyakan Pada Pembina": satu baris = satu percakapan.
  Chat_Threads: ['id', 'askerId', 'askerName', 'pembinaName', 'subject', 'status', 'createdAt'],
  // Satu baris = satu pesan di dalam sebuah percakapan (threadId).
  Chat_Pesan: ['id', 'threadId', 'senderId', 'senderName', 'senderRole', 'text', 'createdAt'],
  // Akun_Pengguna menyimpan passwordHash & passwordSalt - dua kolom ini
  // TIDAK PERNAH dikirim ke client (lihat stripSecrets_). askTokens = sisa
  // jatah bertanya ke Pembina bulan ini (diisi manual oleh admin Fulltime).
  Akun_Pengguna: ['id', 'fullName', 'email', 'gender', 'birthDate', 'accessType', 'accessExpiry', 'registeredAt', 'passwordHash', 'passwordSalt', 'askTokens'],
  // Sessions bersifat internal, tidak pernah diekspos lewat getAll.
  Sessions: ['token', 'userId', 'createdAt', 'expiresAt'],
};

// Array field (dipisah per baris dalam satu sel, bukan JSON) supaya gampang
// diedit manusia langsung di spreadsheet.
const ARRAY_FIELDS = {
  Alat_Kerja: ['howToUse', 'safetyTips'],
  Tipe_Ampli: ['characteristics', 'commonFailures'],
  Analisis_Kerusakan: ['repairSteps', 'recommendedParts'],
};

// Sheet data yang HANYA boleh ditulis oleh akun fulltime/editor lewat aksi
// add/update/delete/replaceAll generik.
const PROTECTED_SHEETS = [
  'Alat_Kerja', 'Tipe_Ampli', 'Komponen_Rusak_Bagus', 'Pengetesan_Amplifier',
  'Pengetesan_Speaker', 'Nomor_Service', 'Whitelist_Siswa', 'Analisis_Kerusakan',
  'Kontak_Staff', 'Katalog_Komponen',
];

// Chat_Threads & Chat_Pesan TIDAK masuk PROTECTED_SHEETS ataupun
// OPEN_ADD_SHEETS - keduanya hanya boleh ditulis lewat aksi khusus
// (startChatThread / sendChatMessage / closeChatThread) supaya identitas
// pengirim selalu diambil dari sesi login, bukan dari input client.
const OPEN_ADD_SHEETS = [];

const DEFAULT_ASK_TOKENS = 5;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

// ============================================================================
// ENTRY POINTS
// ============================================================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'ping') {
      return jsonResponse_({ ok: true, time: new Date().toISOString() });
    }
    if (action === 'getAll') {
      const sheetName = e.parameter.sheet;
      assertKnownSheet_(sheetName);
      const rows = sheetToObjects_(sheetName);
      return jsonResponse_({ ok: true, data: stripSecrets_(sheetName, rows) });
    }
    return jsonResponse_({ ok: false, error: 'Aksi GET tidak dikenal.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    switch (action) {
      case 'register':
        return jsonResponse_(handleRegister_(body));
      case 'login':
        return jsonResponse_(handleLogin_(body));
      case 'logout':
        return jsonResponse_(handleLogout_(body));
      case 'validateToken':
        return jsonResponse_(handleValidateToken_(body));
      case 'listUsers':
        return jsonResponse_(handleListUsers_(body));
      case 'setAccess':
        return jsonResponse_(handleSetAccess_(body));
      case 'setAskTokens':
        return jsonResponse_(handleSetAskTokens_(body));
      case 'startChatThread':
        return jsonResponse_(handleStartChatThread_(body));
      case 'sendChatMessage':
        return jsonResponse_(handleSendChatMessage_(body));
      case 'closeChatThread':
        return jsonResponse_(handleCloseChatThread_(body));
      case 'add':
        return jsonResponse_(handleAdd_(body));
      case 'update':
        return jsonResponse_(handleUpdate_(body));
      case 'delete':
        return jsonResponse_(handleDelete_(body));
      case 'replaceAll':
        return jsonResponse_(handleReplaceAll_(body));
      default:
        return jsonResponse_({ ok: false, error: 'Aksi POST tidak dikenal: ' + action });
    }
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================
function handleRegister_(body) {
  const fullName = (body.fullName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!fullName) return { ok: false, error: 'Nama lengkap wajib diisi.' };
  if (!email) return { ok: false, error: 'Email wajib diisi.' };
  if (!password || password.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };

  const users = sheetToObjects_('Akun_Pengguna');
  if (users.some((u) => (u.email || '').toLowerCase() === email)) {
    return { ok: false, error: 'Email tersebut sudah terdaftar. Silakan login.' };
  }

  const salt = generateSalt_();
  const id = 'usr-' + Utilities.getUuid();
  const newUser = {
    id,
    fullName,
    email,
    gender: body.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
    birthDate: body.birthDate || '',
    accessType: 'none', // menunggu persetujuan admin
    accessExpiry: '',
    registeredAt: new Date().toISOString(),
    passwordHash: hashPassword_(password, salt),
    passwordSalt: salt,
    askTokens: DEFAULT_ASK_TOKENS,
  };
  appendRow_('Akun_Pengguna', newUser);

  const token = createSession_(id);
  return { ok: true, user: stripSecretsFromUser_(newUser), token };
}

function handleLogin_(body) {
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const users = sheetToObjects_('Akun_Pengguna');
  const user = users.find((u) => (u.email || '').toLowerCase() === email);

  if (!user) return { ok: false, error: 'Email atau kata sandi salah.' };
  const computedHash = hashPassword_(password, user.passwordSalt);
  if (computedHash !== user.passwordHash) {
    return { ok: false, error: 'Email atau kata sandi salah.' };
  }

  const token = createSession_(user.id);
  return { ok: true, user: stripSecretsFromUser_(user), token };
}

function handleLogout_(body) {
  deleteSessionRow_(body.token);
  return { ok: true };
}

function handleValidateToken_(body) {
  const user = getUserBySessionToken_(body.token);
  if (!user) return { ok: true, valid: false };
  return { ok: true, valid: true, user: stripSecretsFromUser_(user) };
}

function handleListUsers_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  const users = sheetToObjects_('Akun_Pengguna').map(stripSecretsFromUser_);
  return { ok: true, data: users };
}

function handleSetAccess_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester || requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa mengubah akses pengguna.' };
  }
  const targetId = body.targetUserId;
  const accessType = body.accessType;
  if (!['fulltime', 'editor', '6months', 'none'].includes(accessType)) {
    return { ok: false, error: 'Level akses tidak valid.' };
  }

  const sheet = getSheet_('Akun_Pengguna');
  const rowIndex = findRowIndexById_(sheet, targetId);
  if (rowIndex === -1) return { ok: false, error: 'Pengguna tidak ditemukan.' };

  const headers = SCHEMAS.Akun_Pengguna;
  let accessExpiry = '';
  if (accessType === '6months') {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    accessExpiry = d.toISOString();
  }
  sheet.getRange(rowIndex, headers.indexOf('accessType') + 1).setValue(accessType);
  sheet.getRange(rowIndex, headers.indexOf('accessExpiry') + 1).setValue(accessExpiry);

  return { ok: true };
}

function handleSetAskTokens_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester || requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa mengubah jatah token bertanya.' };
  }
  const targetId = body.targetUserId;
  const askTokens = Number(body.askTokens);
  if (isNaN(askTokens) || askTokens < 0) {
    return { ok: false, error: 'Jumlah token tidak valid.' };
  }

  const sheet = getSheet_('Akun_Pengguna');
  const rowIndex = findRowIndexById_(sheet, targetId);
  if (rowIndex === -1) return { ok: false, error: 'Pengguna tidak ditemukan.' };

  const headers = SCHEMAS.Akun_Pengguna;
  sheet.getRange(rowIndex, headers.indexOf('askTokens') + 1).setValue(askTokens);

  return { ok: true };
}

// ============================================================================
// CHAT "TANYAKAN PADA PEMBINA" (token-gated untuk akun non-fulltime)
// ============================================================================

// Mulai percakapan baru. Akun non-fulltime memakai 1 token, KECUALI
// usedExemption=true (sudah menyelesaikan tantangan fisik sebagai ganti
// token yang habis - lihat AskPembinaBubble.tsx di frontend).
function handleStartChatThread_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  if (requester.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }

  const pembinaName = (body.pembinaName || '').trim();
  const subject = (body.subject || '').trim();
  const firstMessage = (body.firstMessage || '').trim();
  if (!pembinaName || !firstMessage) {
    return { ok: false, error: 'Pilih Pembina dan tulis pertanyaan Anda.' };
  }

  const isFulltime = requester.accessType === 'fulltime';
  if (!isFulltime) {
    const currentTokens = Number(requester.askTokens || 0);
    if (currentTokens <= 0 && !body.usedExemption) {
      return { ok: false, error: 'no_tokens' };
    }
    if (currentTokens > 0 && !body.usedExemption) {
      const sheet = getSheet_('Akun_Pengguna');
      const rowIndex = findRowIndexById_(sheet, requester.id);
      const headers = SCHEMAS.Akun_Pengguna;
      sheet.getRange(rowIndex, headers.indexOf('askTokens') + 1).setValue(currentTokens - 1);
    }
  }

  const threadId = 'thread-' + Utilities.getUuid().slice(0, 8);
  const now = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const thread = {
    id: threadId,
    askerId: requester.id,
    askerName: requester.fullName,
    pembinaName,
    subject: subject || firstMessage.slice(0, 60),
    status: 'active',
    createdAt: now,
  };
  appendRow_('Chat_Threads', thread);

  const message = {
    id: 'msg-' + Utilities.getUuid().slice(0, 8),
    threadId,
    senderId: requester.id,
    senderName: requester.fullName,
    senderRole: requester.accessType,
    text: firstMessage,
    createdAt: now,
  };
  appendRow_('Chat_Pesan', message);

  return { ok: true, thread, message };
}

// Balas pesan di percakapan yang sudah ada - gratis, tidak makan token,
// dipakai baik oleh penanya maupun Pembina.
function handleSendChatMessage_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  if (requester.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }
  const threadId = body.threadId;
  const text = (body.text || '').trim();
  if (!threadId || !text) return { ok: false, error: 'Pesan tidak boleh kosong.' };

  const message = {
    id: 'msg-' + Utilities.getUuid().slice(0, 8),
    threadId,
    senderId: requester.id,
    senderName: requester.fullName,
    senderRole: requester.accessType,
    text,
    createdAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }),
  };
  appendRow_('Chat_Pesan', message);
  return { ok: true, message };
}

// Menutup percakapan - boleh dilakukan oleh penanya sendiri atau akun
// fulltime manapun.
function handleCloseChatThread_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };

  const sheet = getSheet_('Chat_Threads');
  const rowIndex = findRowIndexById_(sheet, body.threadId);
  if (rowIndex === -1) return { ok: false, error: 'Percakapan tidak ditemukan.' };

  const headers = SCHEMAS.Chat_Threads;
  const askerIdCol = headers.indexOf('askerId') + 1;
  const rowAskerId = sheet.getRange(rowIndex, askerIdCol).getValue();
  if (rowAskerId !== requester.id && requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Anda tidak punya izin menutup percakapan ini.' };
  }

  sheet.getRange(rowIndex, headers.indexOf('status') + 1).setValue('closed');
  return { ok: true };
}

// ============================================================================
// DATA CRUD HANDLERS (dilindungi: hanya akun fulltime atau editor yang boleh
// menulis. Editor biasanya anak PKL - bisa bantu edit data, tapi tidak bisa
// mengubah akses akun lain, lihat handleSetAccess_ di atas yang tetap
// mengharuskan 'fulltime').
// ============================================================================
function handleAdd_(body) {
  const check = OPEN_ADD_SHEETS.indexOf(body.sheet) !== -1
    ? requireSignedIn_(body.token, body.sheet)
    : requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const payload = body.payload || {};
  if (!payload.id) payload.id = idPrefix_(body.sheet) + '-' + Utilities.getUuid().slice(0, 8);
  appendRow_(body.sheet, payload);
  return { ok: true, data: payload };
}

function handleUpdate_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const payload = body.payload || {};
  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, payload.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };
  writeRow_(sheet, rowIndex, body.sheet, payload);
  return { ok: true };
}

function handleDelete_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, body.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };
  sheet.deleteRow(rowIndex);
  return { ok: true };
}

function handleReplaceAll_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const sheet = getSheet_(body.sheet);
  const headers = SCHEMAS[body.sheet];
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }
  const items = body.items || [];
  items.forEach((item, i) => {
    if (!item.id) item.id = idPrefix_(body.sheet) + '-' + Utilities.getUuid().slice(0, 8);
    const row = objectToRow_(body.sheet, item);
    sheet.getRange(i + 2, 1, 1, headers.length).setValues([row]);
  });
  return { ok: true };
}

function requireEditAccess_(token, sheetName) {
  assertKnownSheet_(sheetName);
  if (PROTECTED_SHEETS.indexOf(sheetName) === -1) {
    return { ok: false, error: 'Sheet ini tidak bisa diubah lewat API.' };
  }
  const user = getUserBySessionToken_(token);
  if (!user) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType !== 'fulltime' && user.accessType !== 'editor') {
    return { ok: false, error: 'Akses Ditolak: hanya akun Fulltime atau Editor yang bisa mengubah data.' };
  }
  return { ok: true };
}

// Looser check for OPEN_ADD_SHEETS: any signed-in, approved account
// (fulltime / editor / 6months) may create a row - just not 'none' (still
// pending admin approval).
function requireSignedIn_(token, sheetName) {
  assertKnownSheet_(sheetName);
  const user = getUserBySessionToken_(token);
  if (!user) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }
  return { ok: true };
}

function assertKnownSheet_(sheetName) {
  if (!SCHEMAS[sheetName]) {
    throw new Error('Sheet tidak dikenal: ' + sheetName);
  }
}

function idPrefix_(sheetName) {
  const map = {
    Alat_Kerja: 'tool', Tipe_Ampli: 'amp', Komponen_Rusak_Bagus: 'guide',
    Pengetesan_Amplifier: 'step-amp', Pengetesan_Speaker: 'step-spk',
    Nomor_Service: 'srv', Whitelist_Siswa: 'wl', Analisis_Kerusakan: 'diag',
    Kontak_Staff: 'staff', Katalog_Komponen: 'komp', Chat_Threads: 'thread', Chat_Pesan: 'msg',
  };
  return map[sheetName] || 'item';
}

// ============================================================================
// SESSION HELPERS
// ============================================================================
function createSession_(userId) {
  const token = Utilities.getUuid();
  const now = Date.now();
  appendRow_('Sessions', {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_LIFETIME_MS).toISOString(),
  });
  return token;
}

function getUserBySessionToken_(token) {
  if (!token) return null;
  const sessions = sheetToObjects_('Sessions');
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;

  const users = sheetToObjects_('Akun_Pengguna');
  return users.find((u) => u.id === session.userId) || null;
}

function deleteSessionRow_(token) {
  const sheet = getSheet_('Sessions');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === token) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// ============================================================================
// PASSWORD HASHING (SHA-256 + salt acak per pengguna)
// ============================================================================
function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return bytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function stripSecretsFromUser_(user) {
  const copy = {};
  Object.keys(user).forEach((k) => {
    if (k !== 'passwordHash' && k !== 'passwordSalt') copy[k] = user[k];
  });
  return copy;
}

function stripSecrets_(sheetName, rows) {
  if (sheetName === 'Akun_Pengguna') return rows.map(stripSecretsFromUser_);
  return rows;
}

// ============================================================================
// SHEET <-> OBJECT HELPERS
// ============================================================================
function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  const headers = SCHEMAS[name];
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = headers.every((h, i) => firstRow[i] === h);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function sheetToObjects_(sheetName) {
  const sheet = getSheet_(sheetName);
  const headers = SCHEMAS[sheetName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const arrayFields = ARRAY_FIELDS[sheetName] || [];

  return values
    .filter((row) => row.some((cell) => cell !== '' && cell !== null))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (val === null || val === undefined) val = '';
        if (arrayFields.indexOf(h) !== -1) {
          obj[h] = String(val).split('\n').map((s) => s.trim()).filter(Boolean);
        } else {
          obj[h] = val instanceof Date ? val.toISOString() : val;
        }
      });
      return obj;
    });
}

function objectToRow_(sheetName, obj) {
  const headers = SCHEMAS[sheetName];
  const arrayFields = ARRAY_FIELDS[sheetName] || [];
  return headers.map((h) => {
    const val = obj[h];
    if (val === undefined || val === null) return '';
    if (arrayFields.indexOf(h) !== -1) {
      return Array.isArray(val) ? val.join('\n') : String(val);
    }
    return val;
  });
}

function appendRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  sheet.appendRow(objectToRow_(sheetName, obj));
}

function writeRow_(sheet, rowIndex, sheetName, obj) {
  const headers = SCHEMAS[sheetName];
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([objectToRow_(sheetName, obj)]);
}

function findRowIndexById_(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) return i + 1; // 1-based row number
  }
  return -1;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// SETUP SEKALI JALAN - jalankan manual dari editor Apps Script (pilih fungsi
// ini di dropdown atas, lalu klik Run) untuk membuat semua tab + header
// kosong. Aman dijalankan berkali-kali - tidak menimpa data yang sudah ada.
// ============================================================================
function setupSheets() {
  Object.keys(SCHEMAS).forEach((name) => getSheet_(name));
  Logger.log('Semua tab sudah siap: ' + Object.keys(SCHEMAS).join(', '));
}
