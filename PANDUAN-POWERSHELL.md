# Panduan Penggunaan dengan PowerShell (Windows)

Panduan ini menjelaskan cara mengekstrak, menyiapkan, dan menjalankan **SlideFlow** di Windows menggunakan **PowerShell** — dari nol sampai aplikasi terbuka di peramban.

Semua perintah di bawah dijalankan di jendela **PowerShell** (bukan CMD). Buka PowerShell dengan menekan `Win + X` lalu pilih **Windows PowerShell** atau **Terminal**, atau cari "PowerShell" di menu Start.

---

## 1 · Prasyarat

Aplikasi ini butuh **salah satu** runtime berikut:

| Runtime | Versi minimal | Cara install via PowerShell |
| --- | --- | --- |
| **Node.js + npm** (paling umum) | Node ≥ 20 | `winget install OpenJS.NodeJS.LTS` |
| **Bun** (lebih cepat, opsional) | Bun ≥ 1.1 | `powershell -c "irm bun.sh/install.ps1 \| iex"` |

Setelah install, **tutup dan buka ulang jendela PowerShell**, lalu verifikasi:

```powershell
node --version    # harapannya v20.x atau lebih baru
npm --version
```

> Jika perintah `winget` tidak dikenali, unduh installer Node.js langsung dari <https://nodejs.org> dan jalankan wizard-nya, lalu buka ulang PowerShell.

---

## 2 · Ekstrak File ZIP

Asumsikan file `slideflow.zip` berada di folder `Downloads`:

```powershell
# Pindah ke folder Downloads
cd $HOME\Downloads

# Ekstrak ZIP ke folder baru "slideflow" di lokasi yang sama
Expand-Archive -Path .\slideflow.zip -DestinationPath .\slideflow -Force

# Masuk ke folder proyek
cd slideflow

# Lihat isi folder (pastikan package.json terlihat)
Get-ChildItem
```

> Cara alternatif: klik kanan file ZIP di File Explorer → **Extract All…**.

---

## 3 · Pasang Dependensi

```powershell
npm install
```

Proses ini mengunduh paket-paket yang dibutuhkan (sekali saja, sekitar 1–3 menit tergantung koneksi). Jika Anda memakai Bun:

```powershell
bun install
```

---

## 4 · Jalankan Aplikasi (Mode Development)

```powershell
npm run dev
```

Bila sukses akan muncul tulis kira-kira:

```
▲ Next.js 16
- Local:  http://localhost:3000
```

Buka **http://localhost:3000** di peramban (Chrome/Edge/Firefox) — aplikasi siap dipakai.

Untuk menghentikan server, tekan `Ctrl + C` di jendela PowerShell.

> **Cara cepat:** Anda juga bisa menjalankan skrip `jalankan.ps1` yang otomatis memeriksa Node.js, memasang dependensi bila belum ada, lalu menjalankan server:
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\jalankan.ps1
> ```

---

## 5 · Mode Produksi (Opsional, Lebih Ringan di RAM)

```powershell
# 1. Build produksi
npm run build

# 2. Jalankan server produksi di port 3000
npm run start
```

> Catatan: `npm run start` memakai Bun (`bun .next/standalone/server.js`). Jika Anda hanya memasang Node.js tanpa Bun, jalankan dengan Node:
>
> ```powershell
> $env:NODE_ENV="production"; node .next\standalone\server.js
> ```

---

## 6 · Tips & Masalah Umum di PowerShell

### 6.1 Skrip `.ps1` diblokir (ExecutionPolicy)

Jika muncul galat *"running scripts is disabled on this system"*, jalankan sekali per sesi:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Lalu jalankan lagi `.\jalankan.ps1`.

### 6.2 Port 3000 terpakai

```powershell
# Cari proses yang memakai port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Matikan prosesnya (ganti <PID> dengan angka dari perintah di atas)
Stop-Process -Id <PID> -Force
```

Atau jalankan aplikasi di port lain:

```powershell
npm run dev -- -p 3001
```

### 6.3 `npm install` gagal / lambat

```powershell
# Bersihkan cache npm lalu ulangi
npm cache clean --force
npm install
```

Pastikan koneksi internet aktif saat instalasi pertama.

### 6.4 Verifikasi file ter-ekstrak lengkap

```powershell
Get-ChildItem -Name   # harus memuat: package.json, src, public, next.config.ts, PANDUAN-POWERSHELL.md, PANDUAN-GITHUB.md
```

### 6.5 PowerShell versi lama

Panduan ini cocok untuk Windows PowerShell 5.1 maupun PowerShell 7+ (pwsh). Perintah `Expand-Archive` tersedia sejak Windows 10.

---

## 7 · Deploy ke Vercel (Opsional)

> **Ringkasan saja.** Panduan GitHub yang jauh lebih lengkap — tiga cara unggah ke GitHub (web/git CLI/GitHub Desktop), login & Personal Access Token, menjalankan dari clone, GitHub Codespaces di peramban, deploy Vercel, dan tabel masalah umum — ada di **[PANDUAN-GITHUB.md](./PANDUAN-GITHUB.md)**.

1. Buat akun di <https://github.com> dan <https://vercel.com> (bisa login pakai GitHub).
2. Dari folder proyek, jalankan:

   ```powershell
   git init
   git add .
   git commit -m "SlideFlow"
   # buat repo kosong di github.com/new dulu, lalu:
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

3. Buka <https://vercel.com/new>, klik **Import** pada repo tersebut, biarkan semua pengaturan bawaan, klik **Deploy**.
4. Aplikasi online di `https://<proyek-anda>.vercel.app` — tanpa environment variable apa pun.

> Catatan: fitur perluasan narasi AI (`z-ai-web-dev-sdk`) hanya aktif di lingkungan Z.ai. Di Vercel/localhost biasa, aplikasi otomatis memakai parser aturan bawaan dan **tetap berfungsi penuh**.

---

## 8 · Alur Pemakaian Aplikasi (Ringkas)

1. **Panel 1 — Sumber:** unggah dokumen apa pun (PDF, Word, Excel, PPT, CSV, MD, HTML, dst. maks 20 MB) atau tempel teks; tulis konteks tambahan bila perlu; klik **Generate**.
2. **Panel 2 — Gaya Desain & Animasi:** pilih salah satu dari **12 template** (termasuk 7 gaya dari Panduan Corporate: Bento Glassmorphism, Cinematic Parallax, Neo-Brutalism, Editorial Minimalis, Data Glow 3D, Kinetic Typographic, Holographic Timeline), **7 tema warna + Kustom** (utama/aksen/tinta pilihan sendiri), **6 tema font + Kustom** (nama font Google Fonts sendiri), **warna latar slide** (default putih, bisa kustom), dan **4 gaya animasi**.
3. **Panel 3 — Elemen:** tambah elemen siap pakai (KPI chip, kutipan, callout, progres, butir, badge, pemisah, strip statistik) atau **elemen HTML kustom** buatan sendiri; geser posisinya langsung di kanvas.
4. **Mode Edit:** klik teks langsung di slide, sunting data lewat panel, tulis catatan pembicara, atau **impor HTML custom** bila Anda sudah punya desain sendiri.
5. **Ekspor:** unduh `.html` (animasi penuh), `.pptx` (chart PowerPoint asli + catatan), atau proyek `.json` untuk dibuka kembali.

Seluruh kemajuan tersimpan otomatis di peramban (localStorage).

---

*SlideFlow — generator deck presentasi HTML + PPTX beranimasi.*
