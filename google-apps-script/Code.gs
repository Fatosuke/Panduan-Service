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
  // Akun_Pengguna menyimpan passwordHash & passwordSalt - dua kolom ini
  // TIDAK PERNAH dikirim ke client (lihat stripSecrets_).
  Akun_Pengguna: ['id', 'fullName', 'email', 'gender', 'birthDate', 'accessType', 'accessExpiry', 'registeredAt', 'passwordHash', 'passwordSalt'],
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

// Sheet data yang HANYA boleh ditulis oleh akun fulltime.
const PROTECTED_SHEETS = [
  'Alat_Kerja', 'Tipe_Ampli', 'Komponen_Rusak_Bagus', 'Pengetesan_Amplifier',
  'Pengetesan_Speaker', 'Nomor_Service', 'Whitelist_Siswa', 'Analisis_Kerusakan',
  'Kontak_Staff',
];

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
  if (!['fulltime', '6months', 'none'].includes(accessType)) {
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

// ============================================================================
// DATA CRUD HANDLERS (dilindungi: hanya akun fulltime yang boleh menulis)
// ============================================================================
function handleAdd_(body) {
  const check = requireFulltime_(body.token, body.sheet);
  if (!check.ok) return check;

  const payload = body.payload || {};
  if (!payload.id) payload.id = idPrefix_(body.sheet) + '-' + Utilities.getUuid().slice(0, 8);
  appendRow_(body.sheet, payload);
  return { ok: true, data: payload };
}

function handleUpdate_(body) {
  const check = requireFulltime_(body.token, body.sheet);
  if (!check.ok) return check;

  const payload = body.payload || {};
  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, payload.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };
  writeRow_(sheet, rowIndex, body.sheet, payload);
  return { ok: true };
}

function handleDelete_(body) {
  const check = requireFulltime_(body.token, body.sheet);
  if (!check.ok) return check;

  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, body.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };
  sheet.deleteRow(rowIndex);
  return { ok: true };
}

function handleReplaceAll_(body) {
  const check = requireFulltime_(body.token, body.sheet);
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

function requireFulltime_(token, sheetName) {
  assertKnownSheet_(sheetName);
  if (PROTECTED_SHEETS.indexOf(sheetName) === -1) {
    return { ok: false, error: 'Sheet ini tidak bisa diubah lewat API.' };
  }
  const user = getUserBySessionToken_(token);
  if (!user) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType !== 'fulltime') {
    return { ok: false, error: 'Akses Ditolak: hanya akun Fulltime yang bisa mengubah data.' };
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
    Kontak_Staff: 'staff',
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
