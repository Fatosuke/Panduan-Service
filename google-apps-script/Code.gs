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
  // ownerId = id akun pemilik catatan (diisi server dari sesi login). Kolom ini
  // ditaruh PALING BELAKANG supaya data lama tidak bergeser. Baris lama yang
  // ownerId-nya kosong tetap dicocokkan lewat nama pengerjanya.
  Nomor_Service: ['id', 'namaYangMengerjakan', 'nomorService', 'analisaKerusakan', 'komponenDiganti', 'createdAt', 'ownerId'],
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

// Tab yang boleh dibaca lewat getBatch (Akun_Pengguna & Sessions TIDAK pernah).
const READABLE_SHEETS = [
  'Alat_Kerja', 'Tipe_Ampli', 'Komponen_Rusak_Bagus', 'Pengetesan_Amplifier',
  'Pengetesan_Speaker', 'Nomor_Service', 'Whitelist_Siswa', 'Analisis_Kerusakan',
  'Kontak_Staff', 'Katalog_Komponen', 'Chat_Threads', 'Chat_Pesan',
];

// Aksi yang hanya membaca: tidak perlu antre di LockService, jadi tidak
// tertahan oleh orang yang sedang menyimpan data.
const READ_ONLY_ACTIONS = ['getBatch', 'validateToken', 'listUsers'];

// Kolom angka (tidak diformat teks). Semua kolom lain ditulis sebagai TEKS
// supaya Google Sheets tidak mengubah tanggal / nomor telepon / teks berawalan
// "=" secara diam-diam.
const NUMERIC_FIELDS = {
  Pengetesan_Amplifier: ['num'],
  Pengetesan_Speaker: ['num'],
  Akun_Pengguna: ['askTokens'],
};

const MAX_CELL_CHARS = 49000;          // batas Google Sheets 50.000 / sel
const MAX_UPLOAD_BASE64_CHARS = 28 * 1024 * 1024; // ~20 MB file asli
const MAX_CHAT_CHARS = 2000;
const MEDIA_FOLDER_NAME = 'Panduan Service - Media';
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_SECONDS = 600;

const DEFAULT_ASK_TOKENS = 5;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

// ============================================================================
// ENTRY POINTS
// ============================================================================
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (action === 'ping') {
      return jsonResponse_({ ok: true, time: new Date().toISOString() });
    }
    // Pembacaan data SEKARANG wajib login -> lewat POST getBatch (token tidak
    // ikut tercatat di URL). Aksi getAll lama sengaja ditutup.
    return jsonResponse_({ ok: false, error: 'Aksi GET tidak dikenal. Perbarui aplikasi web ke versi terbaru.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  let lock = null;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;

    if (READ_ONLY_ACTIONS.indexOf(action) === -1) {
      lock = LockService.getScriptLock();
      lock.waitLock(30000);
    }

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
      case 'getBatch':
        return jsonResponse_(handleGetBatch_(body));
      case 'startChatThread':
        return jsonResponse_(handleStartChatThread_(body));
      case 'sendChatMessage':
        return jsonResponse_(handleSendChatMessage_(body));
      case 'closeChatThread':
        return jsonResponse_(handleCloseChatThread_(body));
      case 'uploadMedia':
        return jsonResponse_(handleUploadMedia_(body));
      case 'add':
        return jsonResponse_(handleAdd_(body));
      case 'addMany':
        return jsonResponse_(handleAddMany_(body));
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
    const msg = String(err && err.message ? err.message : err);
    if (msg.indexOf('Could not obtain lock') !== -1 || msg.indexOf('Lock timeout') !== -1) {
      return jsonResponse_({ ok: false, error: 'Server sedang sibuk. Coba lagi sebentar.' });
    }
    return jsonResponse_({ ok: false, error: msg });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (ignore) { /* sudah dilepas */ }
    }
  }
}

// ============================================================================
// BACA DATA (wajib login; chat & Nomor Service disaring per akun di SERVER)
// ============================================================================
function handleGetBatch_(body) {
  const user = getUserBySessionToken_(body.token);
  if (!user) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType === 'none') {
    return { ok: false, code: 'pending', error: 'Akun Anda masih menunggu persetujuan admin.' };
  }

  const names = Array.isArray(body.sheets) ? body.sheets : [];
  const out = {};
  names.forEach((name) => {
    if (READABLE_SHEETS.indexOf(name) === -1) {
      out[name] = { error: 'Sheet tidak bisa dibaca: ' + name };
      return;
    }
    try {
      out[name] = { data: readSheetForUser_(name, user) };
    } catch (err) {
      out[name] = { error: String(err && err.message ? err.message : err) };
    }
  });
  return { ok: true, data: out };
}

function readSheetForUser_(name, user) {
  const rows = sheetToObjects_(name);
  const isFull = user.accessType === 'fulltime';
  const canEdit = isFull || user.accessType === 'editor';

  if (name === 'Chat_Threads') {
    return isFull ? rows : rows.filter((t) => t.askerId === user.id);
  }
  if (name === 'Chat_Pesan') {
    if (isFull) return rows;
    const mine = {};
    sheetToObjects_('Chat_Threads').forEach((t) => {
      if (t.askerId === user.id) mine[t.id] = true;
    });
    return rows.filter((m) => mine[m.threadId]);
  }
  if (name === 'Nomor_Service') {
    return isFull ? rows : rows.filter((r) => ownsServiceLog_(r, user));
  }
  if (name === 'Whitelist_Siswa') {
    // Daftar nama siswa hanya untuk yang boleh mengelola data.
    return canEdit ? rows : [];
  }
  return rows;
}

function ownsServiceLog_(row, user) {
  if (row.ownerId) return row.ownerId === user.id;
  return normName_(row.namaYangMengerjakan) === normName_(user.fullName);
}

function normName_(s) {
  return String(s || '').trim().toLowerCase();
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================
function handleRegister_(body) {
  const fullName = (body.fullName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!fullName) return { ok: false, error: 'Nama lengkap wajib diisi.' };
  if (!email || email.indexOf('@') === -1) return { ok: false, error: 'Email wajib diisi dengan benar.' };
  if (!password || password.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  if (fullName.length > 100 || email.length > 150 || password.length > 200) {
    return { ok: false, error: 'Data pendaftaran terlalu panjang.' };
  }

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
  return { ok: true, user: stripSecretsFromUser_(effectiveUser_(newUser)), token };
}

function handleLogin_(body) {
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  // Batasi tebak-tebak kata sandi: 5x salah -> kunci 10 menit untuk email itu.
  const cache = CacheService.getScriptCache();
  const failKey = 'loginfail_' + Utilities.base64EncodeWebSafe(email || '-').slice(0, 100);
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= LOGIN_MAX_FAILS) {
    return { ok: false, error: 'Terlalu banyak percobaan gagal. Coba lagi dalam 10 menit.' };
  }

  const users = sheetToObjects_('Akun_Pengguna');
  const user = users.find((u) => (u.email || '').toLowerCase() === email);

  if (!user || hashPassword_(password, user.passwordSalt) !== user.passwordHash) {
    cache.put(failKey, String(fails + 1), LOGIN_LOCK_SECONDS);
    return { ok: false, error: 'Email atau kata sandi salah.' };
  }
  cache.remove(failKey);

  purgeExpiredSessions_();
  const token = createSession_(user.id);
  return { ok: true, user: stripSecretsFromUser_(effectiveUser_(user)), token };
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
  if (!requester) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa melihat daftar akun.' };
  }
  // Admin melihat level akses ASLI di sheet, plus penanda accessExpired.
  const users = sheetToObjects_('Akun_Pengguna').map((u) => stripSecretsFromUser_(markExpired_(u)));
  return { ok: true, data: users };
}

function handleSetAccess_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester || requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa mengubah akses pengguna.' };
  }
  const targetId = body.targetUserId;
  const accessType = body.accessType;
  if (['fulltime', 'editor', '6months', 'none'].indexOf(accessType) === -1) {
    return { ok: false, error: 'Level akses tidak valid.' };
  }

  // Jangan sampai tidak ada admin Fulltime tersisa.
  if (targetId === requester.id && accessType !== 'fulltime') {
    const fulltimeCount = sheetToObjects_('Akun_Pengguna').filter((u) => u.accessType === 'fulltime').length;
    if (fulltimeCount <= 1) {
      return { ok: false, error: 'Tidak bisa menurunkan akses: ini satu-satunya akun Fulltime.' };
    }
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
  sheet.getRange(rowIndex, headers.indexOf('accessExpiry') + 1).setNumberFormat('@').setValue(accessExpiry);

  return { ok: true };
}

function handleSetAskTokens_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester || requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa mengubah jatah token bertanya.' };
  }
  const targetId = body.targetUserId;
  const askTokens = Math.floor(Number(body.askTokens));
  if (isNaN(askTokens) || askTokens < 0 || askTokens > 1000) {
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

// Mulai percakapan baru. Akun non-fulltime memakai 1 token. Kalau token sudah
// habis, percakapan hanya boleh dimulai bila usedExemption=true (tantangan
// fisik). Kalau token MASIH ada, token tetap dikurangi - usedExemption tidak
// bisa dipakai untuk menghindari pengurangan.
function handleStartChatThread_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (requester.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }

  const pembinaName = (body.pembinaName || '').trim();
  const subject = (body.subject || '').trim();
  const firstMessage = (body.firstMessage || '').trim();
  if (!pembinaName || !firstMessage) {
    return { ok: false, error: 'Pilih Pembina dan tulis pertanyaan Anda.' };
  }
  if (firstMessage.length > MAX_CHAT_CHARS) {
    return { ok: false, error: 'Pertanyaan terlalu panjang (maksimal ' + MAX_CHAT_CHARS + ' karakter).' };
  }

  const isFulltime = requester.accessType === 'fulltime';
  if (!isFulltime) {
    const currentTokens = Number(requester.askTokens || 0);
    if (currentTokens > 0) {
      const sheet = getSheet_('Akun_Pengguna');
      const rowIndex = findRowIndexById_(sheet, requester.id);
      if (rowIndex === -1) return { ok: false, error: 'Akun tidak ditemukan.' };
      const headers = SCHEMAS.Akun_Pengguna;
      sheet.getRange(rowIndex, headers.indexOf('askTokens') + 1).setValue(currentTokens - 1);
    } else if (!body.usedExemption) {
      return { ok: false, error: 'no_tokens' };
    }
  }

  const threadId = 'thread-' + Utilities.getUuid().slice(0, 8);
  const now = new Date().toISOString();
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

// Balas pesan di percakapan yang sudah ada - gratis, tidak makan token.
// Hanya penanya sendiri atau akun fulltime yang boleh membalas, dan hanya di
// percakapan yang masih aktif.
function handleSendChatMessage_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (requester.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }
  const threadId = body.threadId;
  const text = (body.text || '').trim();
  if (!threadId || !text) return { ok: false, error: 'Pesan tidak boleh kosong.' };
  if (text.length > MAX_CHAT_CHARS) {
    return { ok: false, error: 'Pesan terlalu panjang (maksimal ' + MAX_CHAT_CHARS + ' karakter).' };
  }

  const threadSheet = getSheet_('Chat_Threads');
  const rowIndex = findRowIndexById_(threadSheet, threadId);
  if (rowIndex === -1) return { ok: false, error: 'Percakapan tidak ditemukan.' };
  const tHeaders = SCHEMAS.Chat_Threads;
  const threadRow = threadSheet.getRange(rowIndex, 1, 1, tHeaders.length).getValues()[0];
  const askerId = threadRow[tHeaders.indexOf('askerId')];
  const status = threadRow[tHeaders.indexOf('status')];
  if (askerId !== requester.id && requester.accessType !== 'fulltime') {
    return { ok: false, error: 'Anda tidak punya izin membalas percakapan ini.' };
  }
  if (status === 'closed') {
    return { ok: false, error: 'Percakapan ini sudah ditutup.' };
  }

  const message = {
    id: 'msg-' + Utilities.getUuid().slice(0, 8),
    threadId,
    senderId: requester.id,
    senderName: requester.fullName,
    senderRole: requester.accessType,
    text,
    createdAt: new Date().toISOString(),
  };
  appendRow_('Chat_Pesan', message);
  return { ok: true, message };
}

// Menutup percakapan - boleh dilakukan oleh penanya sendiri atau akun
// fulltime manapun.
function handleCloseChatThread_(body) {
  const requester = getUserBySessionToken_(body.token);
  if (!requester) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };

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
// UNGGAH FOTO / VIDEO KE GOOGLE DRIVE
// Sel Google Sheets dibatasi 50.000 karakter, jadi foto/video tidak bisa
// disimpan langsung di sel. File disimpan di folder Drive "Panduan Service -
// Media" (akses: siapa pun yang punya link, hanya lihat) dan yang masuk ke
// Sheet hanya link-nya.
// Butuh izin Google Drive: jalankan fungsi authorizeDrive() sekali dari editor.
// ============================================================================
function handleUploadMedia_(body) {
  const user = getUserBySessionToken_(body.token);
  if (!user) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType !== 'fulltime' && user.accessType !== 'editor') {
    return { ok: false, error: 'Akses Ditolak: hanya akun Fulltime atau Editor yang bisa mengunggah media.' };
  }

  const mime = String(body.mimeType || '').toLowerCase();
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  if (allowed.indexOf(mime) === -1) {
    return { ok: false, error: 'Format file tidak didukung (gunakan JPG/PNG/WebP atau MP4/WebM).' };
  }
  const data = String(body.dataBase64 || '');
  if (!data) return { ok: false, error: 'File kosong.' };
  if (data.length > MAX_UPLOAD_BASE64_CHARS) {
    return { ok: false, error: 'Ukuran file terlalu besar (maksimal sekitar 20 MB).' };
  }

  let file;
  try {
    const ext = mime.split('/')[1].replace('jpeg', 'jpg');
    const safeName = String(body.fileName || 'media').replace(/[^\w.\- ]/g, '_').slice(0, 60);
    const blob = Utilities.newBlob(Utilities.base64Decode(data), mime, Date.now() + '-' + safeName + '.' + ext);
    file = getMediaFolder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    return {
      ok: false,
      error: 'Gagal menyimpan ke Google Drive. Pastikan fungsi authorizeDrive sudah dijalankan di editor Apps Script lalu deploy ulang. Detail: ' + String(err && err.message ? err.message : err),
    };
  }

  const id = file.getId();
  const isVideo = mime.indexOf('video/') === 0;
  const url = isVideo
    ? 'https://drive.google.com/file/d/' + id + '/preview'
    : 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1200';
  return { ok: true, url, type: isVideo ? 'video' : 'image', fileId: id };
}

function getMediaFolder_() {
  const it = DriveApp.getFoldersByName(MEDIA_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(MEDIA_FOLDER_NAME);
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
  if (body.sheet === 'Nomor_Service') {
    payload.ownerId = check.user.id; // selalu dari sesi login, bukan dari client
  }
  assertCellsOk_(body.sheet, payload);
  appendRow_(body.sheet, payload);
  return { ok: true, data: payload };
}

// Tambah banyak baris sekaligus (dipakai impor) - divalidasi semua dulu, lalu
// ditulis dalam satu operasi, jadi tidak ada impor yang separuh jalan.
function handleAddMany_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return { ok: true, data: [] };
  if (items.length > 500) return { ok: false, error: 'Terlalu banyak baris sekaligus (maksimal 500).' };

  const sheet = getSheet_(body.sheet);
  const existingIds = {};
  sheetToObjects_(body.sheet).forEach((r) => { existingIds[r.id] = true; });

  items.forEach((item) => {
    if (!item.id || existingIds[item.id]) item.id = idPrefix_(body.sheet) + '-' + Utilities.getUuid().slice(0, 8);
    existingIds[item.id] = true;
    if (body.sheet === 'Nomor_Service') item.ownerId = check.user.id;
    assertCellsOk_(body.sheet, item);
  });

  const rows = items.map((item) => objectToRow_(body.sheet, item));
  const start = sheet.getLastRow() + 1;
  ensureRows_(sheet, start + rows.length - 1);
  formatTextColumns_(sheet, body.sheet, start, rows.length);
  sheet.getRange(start, 1, rows.length, SCHEMAS[body.sheet].length).setValues(rows);
  return { ok: true, data: items };
}

function handleUpdate_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const payload = body.payload || {};
  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, payload.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };

  if (body.sheet === 'Nomor_Service') {
    const existing = rowToObject_('Nomor_Service', sheet.getRange(rowIndex, 1, 1, SCHEMAS.Nomor_Service.length).getValues()[0]);
    if (check.user.accessType !== 'fulltime' && !ownsServiceLog_(existing, check.user)) {
      return { ok: false, error: 'Anda hanya bisa mengubah catatan nomor service milik sendiri.' };
    }
    payload.ownerId = existing.ownerId || (check.user.accessType === 'fulltime' ? '' : check.user.id);
  }
  assertCellsOk_(body.sheet, payload);
  writeRow_(sheet, rowIndex, body.sheet, payload);
  return { ok: true };
}

function handleDelete_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;

  const sheet = getSheet_(body.sheet);
  const rowIndex = findRowIndexById_(sheet, body.id);
  if (rowIndex === -1) return { ok: false, error: 'Data tidak ditemukan.' };

  if (body.sheet === 'Nomor_Service' && check.user.accessType !== 'fulltime') {
    const existing = rowToObject_('Nomor_Service', sheet.getRange(rowIndex, 1, 1, SCHEMAS.Nomor_Service.length).getValues()[0]);
    if (!ownsServiceLog_(existing, check.user)) {
      return { ok: false, error: 'Anda hanya bisa menghapus catatan nomor service milik sendiri.' };
    }
  }
  sheet.deleteRow(rowIndex);
  return { ok: true };
}

// Mengganti SELURUH isi satu tab (dipakai impor CSV / tombol reset).
// Pengaman: (1) semua baris divalidasi dulu sebelum ada yang ditulis,
// (2) isi lama disalin ke tab tersembunyi "_bak_<nama tab>" (tab itu bisa
// dipulihkan manual lewat View > Hidden sheets), (3) baris baru ditulis
// sekaligus, baru sisa baris lama dibersihkan - bukan hapus dulu baru tulis.
function handleReplaceAll_(body) {
  const check = requireEditAccess_(body.token, body.sheet);
  if (!check.ok) return check;
  if (body.sheet === 'Nomor_Service' && check.user.accessType !== 'fulltime') {
    return { ok: false, error: 'Hanya akun Fulltime yang bisa mengganti seluruh catatan nomor service.' };
  }

  const sheet = getSheet_(body.sheet);
  const headers = SCHEMAS[body.sheet];
  const items = Array.isArray(body.items) ? body.items : [];

  const seen = {};
  items.forEach((item) => {
    if (!item.id || seen[item.id]) item.id = idPrefix_(body.sheet) + '-' + Utilities.getUuid().slice(0, 8);
    seen[item.id] = true;
    assertCellsOk_(body.sheet, item);
  });
  const rows = items.map((item) => objectToRow_(body.sheet, item));

  backupSheet_(body.sheet);

  const oldLastRow = sheet.getLastRow();
  if (rows.length > 0) {
    ensureRows_(sheet, rows.length + 1);
    const range = sheet.getRange(2, 1, rows.length, headers.length);
    formatTextColumns_(sheet, body.sheet, 2, rows.length);
    range.setValues(rows);
  }
  const firstLeftover = rows.length + 2;
  if (oldLastRow >= firstLeftover) {
    sheet.getRange(firstLeftover, 1, oldLastRow - firstLeftover + 1, headers.length).clearContent();
  }
  return { ok: true, count: rows.length };
}

function requireEditAccess_(token, sheetName) {
  assertKnownSheet_(sheetName);
  if (PROTECTED_SHEETS.indexOf(sheetName) === -1) {
    return { ok: false, error: 'Sheet ini tidak bisa diubah lewat API.' };
  }
  const user = getUserBySessionToken_(token);
  if (!user) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType !== 'fulltime' && user.accessType !== 'editor') {
    return { ok: false, error: 'Akses Ditolak: hanya akun Fulltime atau Editor yang bisa mengubah data.' };
  }
  return { ok: true, user };
}

// Looser check for OPEN_ADD_SHEETS: any signed-in, approved account
// (fulltime / editor / 6months) may create a row - just not 'none' (still
// pending admin approval).
function requireSignedIn_(token, sheetName) {
  assertKnownSheet_(sheetName);
  const user = getUserBySessionToken_(token);
  if (!user) return { ok: false, code: 'invalid_session', error: 'Sesi tidak valid. Silakan login ulang.' };
  if (user.accessType === 'none') {
    return { ok: false, error: 'Akun Anda masih menunggu persetujuan admin.' };
  }
  return { ok: true, user };
}

function assertKnownSheet_(sheetName) {
  if (!SCHEMAS[sheetName]) {
    throw new Error('Sheet tidak dikenal: ' + sheetName);
  }
}

// Tolak data yang tidak muat di satu sel Google Sheets - lebih baik gagal
// dengan pesan jelas daripada tersimpan sebagian atau terpotong diam-diam.
function assertCellsOk_(sheetName, obj) {
  const arrayFields = ARRAY_FIELDS[sheetName] || [];
  SCHEMAS[sheetName].forEach((h) => {
    const v = obj[h];
    if (v === undefined || v === null) return;
    const len = Array.isArray(v) ? v.join('\n').length : String(v).length;
    if (len > MAX_CELL_CHARS) {
      throw new Error(
        'Isi kolom "' + h + '" terlalu panjang (' + len + ' karakter; batas Google Sheets 50.000 per sel). ' +
        (h === 'mediaUrl' || h === 'image'
          ? 'Gunakan unggah foto/video (disimpan ke Google Drive) atau tempel link.'
          : 'Persingkat isinya.')
      );
    }
    if (arrayFields.indexOf(h) !== -1 && !Array.isArray(v) && typeof v !== 'string') {
      throw new Error('Kolom "' + h + '" harus berupa daftar.');
    }
  });
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
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const now = Date.now();
  appendRow_('Sessions', {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_LIFETIME_MS).toISOString(),
  });
  return token;
}

// Cari lewat TextFinder (tidak membaca seluruh tab) supaya tetap cepat
// walaupun jumlah sesi / akun bertambah banyak.
function getUserBySessionToken_(token) {
  if (!token || typeof token !== 'string') return null;

  const sSheet = getSheet_('Sessions');
  const sRow = findRowByColumnValue_(sSheet, 1, token);
  if (sRow === -1) return null;
  const sHeaders = SCHEMAS.Sessions;
  const sValues = sSheet.getRange(sRow, 1, 1, sHeaders.length).getValues()[0];
  const expiresAt = sValues[sHeaders.indexOf('expiresAt')];
  const expMs = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (isNaN(expMs) || expMs < Date.now()) return null;
  const userId = sValues[sHeaders.indexOf('userId')];

  const uSheet = getSheet_('Akun_Pengguna');
  const uRow = findRowByColumnValue_(uSheet, 1, userId);
  if (uRow === -1) return null;
  const user = rowToObject_('Akun_Pengguna', uSheet.getRange(uRow, 1, 1, SCHEMAS.Akun_Pengguna.length).getValues()[0]);
  return effectiveUser_(user);
}

function deleteSessionRow_(token) {
  if (!token) return;
  const sheet = getSheet_('Sessions');
  const row = findRowByColumnValue_(sheet, 1, token);
  if (row !== -1) sheet.deleteRow(row);
}

// Hapus sesi yang sudah kedaluwarsa supaya tab Sessions tidak membengkak.
function purgeExpiredSessions_() {
  const sheet = getSheet_('Sessions');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const headers = SCHEMAS.Sessions;
  const idx = headers.indexOf('expiresAt');
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const now = Date.now();
  for (let i = values.length - 1; i >= 0; i--) {
    const exp = values[i][idx];
    const ms = exp instanceof Date ? exp.getTime() : new Date(exp).getTime();
    if (isNaN(ms) || ms < now) sheet.deleteRow(i + 2);
  }
}

// Akses 6 bulan yang sudah lewat dianggap 'none' (perlu disetujui ulang admin).
// Nilai di Sheet TIDAK diubah - hanya dihitung saat dipakai.
function isAccessExpired_(user) {
  if (user.accessType !== '6months' || !user.accessExpiry) return false;
  const ms = new Date(user.accessExpiry).getTime();
  return !isNaN(ms) && ms < Date.now();
}

function markExpired_(user) {
  const copy = {};
  Object.keys(user).forEach((k) => { copy[k] = user[k]; });
  if (isAccessExpired_(user)) copy.accessExpired = true;
  return copy;
}

function effectiveUser_(user) {
  const copy = markExpired_(user);
  if (copy.accessExpired) copy.accessType = 'none';
  return copy;
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

// ============================================================================
// SHEET <-> OBJECT HELPERS
// ============================================================================
const CHECKED_SHEETS_ = {};

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    delete CHECKED_SHEETS_[name];
  }
  if (!CHECKED_SHEETS_[name]) {
    const headers = SCHEMAS[name];
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const hasHeaders = headers.every((h, i) => firstRow[i] === h);
    if (!hasHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    CHECKED_SHEETS_[name] = true;
  }
  return sheet;
}

function rowToObject_(sheetName, row) {
  const headers = SCHEMAS[sheetName];
  const arrayFields = ARRAY_FIELDS[sheetName] || [];
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
}

function sheetToObjects_(sheetName) {
  const sheet = getSheet_(sheetName);
  const headers = SCHEMAS[sheetName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter((row) => row.some((cell) => cell !== '' && cell !== null))
    .map((row) => rowToObject_(sheetName, row));
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

// Tandai kolom teks sebagai "Plain text" (hanya di baris yang sedang ditulis,
// data lain tidak disentuh). Kolom angka dibiarkan apa adanya.
function formatTextColumns_(sheet, sheetName, startRow, numRows) {
  const headers = SCHEMAS[sheetName];
  const numeric = NUMERIC_FIELDS[sheetName] || [];
  let runStart = -1;
  for (let c = 0; c <= headers.length; c++) {
    const isText = c < headers.length && numeric.indexOf(headers[c]) === -1;
    if (isText && runStart === -1) runStart = c;
    if (!isText && runStart !== -1) {
      sheet.getRange(startRow, runStart + 1, numRows, c - runStart).setNumberFormat('@');
      runStart = -1;
    }
  }
}

function ensureRows_(sheet, lastNeededRow) {
  const max = sheet.getMaxRows();
  if (max < lastNeededRow) sheet.insertRowsAfter(max, lastNeededRow - max);
}

function appendRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const row = objectToRow_(sheetName, obj);
  const target = sheet.getLastRow() + 1;
  ensureRows_(sheet, target);
  formatTextColumns_(sheet, sheetName, target, 1);
  sheet.getRange(target, 1, 1, row.length).setValues([row]);
}

function writeRow_(sheet, rowIndex, sheetName, obj) {
  const headers = SCHEMAS[sheetName];
  formatTextColumns_(sheet, sheetName, rowIndex, 1);
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([objectToRow_(sheetName, obj)]);
}

// Cadangan otomatis sebelum satu tab diganti total.
function backupSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const src = getSheet_(sheetName);
  if (src.getLastRow() < 2) return;
  const bakName = '_bak_' + sheetName;
  const old = ss.getSheetByName(bakName);
  if (old) ss.deleteSheet(old);
  const copy = src.copyTo(ss);
  copy.setName(bakName);
  copy.hideSheet();
}

function findRowIndexById_(sheet, id) {
  if (id === undefined || id === null || id === '') return -1;
  return findRowByColumnValue_(sheet, 1, String(id));
}

// Cari baris (nomor 1-based, selain baris header) yang kolom `col`-nya sama
// persis dengan `value`. Tidak membaca seluruh tab.
function findRowByColumnValue_(sheet, col, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const range = sheet.getRange(2, col, lastRow - 1, 1);
  const cell = range.createTextFinder(String(value)).matchEntireCell(true).matchCase(true).findNext();
  return cell ? cell.getRow() : -1;
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

// Jalankan SEKALI dari editor supaya Google meminta izin Drive (dipakai fitur
// unggah foto/video). Setelah itu: Deploy > Manage deployments > New version.
function authorizeDrive() {
  const folder = getMediaFolder_();
  Logger.log('Folder media siap: ' + folder.getUrl());
}

// Opsional: jalankan manual kalau ingin membersihkan sesi lama sekarang juga.
function cleanupSessions() {
  purgeExpiredSessions_();
  Logger.log('Sesi kedaluwarsa sudah dibersihkan.');
}
