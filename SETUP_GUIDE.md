# Panduan Setup - Google Sheets sebagai Database + Apps Script

Arsitektur baru ini 100% gratis selamanya, tidak butuh kartu kredit, dan
tidak terikat batasan project Firebase AI Studio sama sekali. Total waktu:
sekitar 15-20 menit.

---

## Ringkasan Arsitektur

- **Google Sheets** = database utama sesungguhnya (bukan salinan/cadangan).
- **Google Apps Script** (jalan di dalam Sheet itu sendiri) = backend API:
  menangani login/password (di-hash, diverifikasi server-side) dan semua
  baca/tulis data.
- **Web app** memanggil Apps Script itu, dan mengecek pembaruan tiap ±15
  detik - jadi kalau Anda edit langsung di spreadsheet, App akan otomatis
  membacanya juga dalam waktu singkat. Dua arah.
- Tidak ada Firebase, tidak ada Firestore, tidak ada billing apapun.

---

## Langkah 1 - Buat Google Sheet Master

1. Buka [sheets.google.com](https://sheets.google.com/), buat spreadsheet baru.
2. Beri nama, misalnya **"Panduan Service - Database Master"**.
3. Biarkan kosong dulu (tab-tab yang dibutuhkan akan dibuat otomatis di Langkah 3).

## Langkah 2 - Buka Editor Apps Script

1. Di dalam Sheet tadi, klik menu **Extensions > Apps Script**.
2. Akan terbuka tab baru berisi editor kode dengan file `Code.gs` kosong/bawaan.
3. Hapus semua isi default di sana.
4. Buka file **`google-apps-script/Code.gs`** dari folder project yang saya kirimkan, salin **seluruh isinya**, lalu tempel ke editor Apps Script tadi.
5. Klik ikon simpan (💾) atau tekan `Ctrl+S` / `Cmd+S`.

## Langkah 3 - Buat Semua Tab Otomatis

1. Di bagian atas editor Apps Script, ada dropdown pilihan fungsi (biasanya bertuliskan `doGet` secara default). Ubah jadi **`setupSheets`**.
2. Klik tombol **Run** (▶️).
3. Pertama kali jalan, Google akan minta izin ("Authorization required"). Klik **Review permissions**, pilih akun Google Anda, klik **Advanced** kalau muncul peringatan "unverified app", lalu **Go to [nama project] (unsafe)** dan **Allow**. Ini aman - itu script milik Anda sendiri.
4. Setelah selesai jalan (tidak ada tanda error merah di bawah), kembali ke tab Google Sheet - Anda akan lihat 10 tab baru sudah otomatis dibuat: `Alat_Kerja`, `Tipe_Ampli`, `Komponen_Rusak_Bagus`, `Pengetesan_Amplifier`, `Pengetesan_Speaker`, `Nomor_Service`, `Whitelist_Siswa`, `Analisis_Kerusakan`, `Kontak_Staff`, `Akun_Pengguna` - masing-masing dengan header kolom yang sudah sesuai.

*(Opsional: kalau Anda punya data lama, tinggal copy-paste isinya ke tab yang sesuai, di bawah baris header. Jangan ubah nama kolom di baris pertama.)*

## Langkah 4 - Deploy sebagai Web App

1. Masih di editor Apps Script, klik tombol **Deploy** (pojok kanan atas) > **New deployment**.
2. Klik ikon gerigi (⚙️) di sebelah "Select type", pilih **Web app**.
3. Isi:
   - Description: bebas, misalnya "Panduan Service API"
   - Execute as: **Me** (akun Anda)
   - Who has access: **Anyone**
4. Klik **Deploy**.
5. Google akan minta otorisasi lagi (sama seperti Langkah 3) - izinkan.
6. Setelah selesai, akan muncul **Web app URL** yang formatnya seperti:
   `https://script.google.com/macros/s/AKfycb.../exec`
   **Salin URL ini** - akan dipakai di Langkah 5.

## Langkah 5 - Sambungkan Web App ke URL Apps Script

1. Di folder project (yang saya kirimkan), buat file baru bernama **`.env.local`** (kalau belum ada), sejajar dengan `package.json`.
2. Isi dengan:
   ```
   VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycb.../exec"
   ```
   (ganti dengan URL asli dari Langkah 4)
3. Simpan.

## Langkah 6 - Install & Coba Jalankan

```bash
npm install
npm run dev
```

Buka di browser sesuai alamat yang muncul di terminal. Coba **Registrasi Akun Baru** dengan email & password Anda sendiri - kalau berhasil, berarti koneksi ke Apps Script sudah benar.

## Langkah 7 - Jadikan Diri Sendiri Admin (Fulltime) Pertama

Sengaja tidak ada nama admin yang di-hardcode di kode (itu justru celah keamanan yang ingin kita hindari). Jadi langkah ini dilakukan manual sekali saja:

1. Setelah daftar di Langkah 6, buka Google Sheet master Anda.
2. Buka tab **`Akun_Pengguna`**.
3. Cari baris dengan email Anda.
4. Ubah kolom **`accessType`** dari `none` menjadi `fulltime` (ketik langsung di sel-nya).
5. Kembali ke aplikasi, logout lalu login lagi. Anda sekarang admin Fulltime - akan muncul tombol **Kelola Akun** di header.
6. Untuk akun berikutnya (Agas, Tommy, dst), mereka tinggal daftar sendiri lewat halaman registrasi, lalu Anda klik **Kelola Akun** di app dan atur level aksesnya (Fulltime/6 Bulan) - tidak perlu lagi buka spreadsheet secara manual.

## Langkah 8 - Deploy Ulang Aplikasi Web

Cara deploy-nya sama seperti sebelumnya (lewat AI Studio / hosting yang sudah Anda pakai). Pastikan environment variable `VITE_APPS_SCRIPT_URL` juga diisi di pengaturan hosting/secrets-nya (bukan cuma di `.env.local` lokal Anda), supaya versi yang online juga tersambung.

---

## Cara Kerja Sehari-hari

- **Edit lewat app**: fulltime login → tambah/edit/hapus data → langsung tersimpan ke spreadsheet lewat Apps Script.
- **Edit langsung di spreadsheet**: boleh juga - buka Sheet, ubah sel manapun di tab manapun. App akan otomatis membaca perubahan itu dalam ±15 detik.
- **Device lain**: begitu ada perubahan (dari app manapun atau dari spreadsheet), semua device yang sedang membuka app akan menampilkannya dalam ±15 detik tanpa perlu refresh manual.
- **Pendaftaran akun baru**: siapapun bisa daftar, langsung bisa *melihat* semua panduan. Baru bisa *mengedit* setelah admin Fulltime menyetujui lewat **Kelola Akun**.
- **Sinkronkan Sekarang**: ada tombol manual di menu Spreadsheet Sync kalau ingin memaksa app menarik data terbaru saat itu juga, tanpa menunggu 15 detik.

## Pemecahan Masalah

- **"Backend Belum Dikonfigurasi" saat buka app** - `VITE_APPS_SCRIPT_URL` belum diisi di `.env.local`, atau salah ketik. Ulangi Langkah 5.
- **"Gagal terhubung ke Apps Script" / status merah di Spreadsheet Sync** - Buka URL Apps Script Anda langsung di browser dengan tambahan `?action=ping` di belakangnya (jadi `.../exec?action=ping`). Harusnya muncul teks JSON `{"ok":true,...}`. Kalau muncul halaman login Google atau error, cek lagi pengaturan **Who has access: Anyone** di Langkah 4.
- **Register/login gagal terus** - buka Apps Script Editor > menu **Executions** (ikon jam di sidebar kiri) untuk lihat log error detail dari percobaan terakhir.
- **Setelah ubah kode `Code.gs`, perubahan tidak muncul di app** - Anda perlu bikin **New deployment** lagi tiap kali mengubah `Code.gs` (Deploy > Manage deployments > ikon pensil > pilih versi baru > Deploy), URL-nya biasanya tetap sama jadi tidak perlu ganti `.env.local` lagi, kecuali Anda memilih "New deployment" murni.
- **Tombol "Kelola Akun" tidak muncul** - akun Anda belum `accessType: fulltime` di tab `Akun_Pengguna`, ulangi Langkah 7.
- **Data hilang/kosong padahal tadinya ada** - cek tab yang bersangkutan di Google Sheet langsung, karena Sheet itu sendiri adalah sumber datanya. Kalau baris masih ada di Sheet tapi tidak muncul di app, klik **Sinkronkan Sekarang** di menu Spreadsheet Sync.
