# SlideFlow — HTML + PPTX Generator

**SlideFlow** adalah aplikasi web berbasis Next.js 16 yang mengubah dokumen sumber — teks, PDF, Word, Excel, PowerPoint, CSV, dan praktis semua format file lain — menjadi **deck presentasi beranimasi (1280×800) dengan jumlah slide fleksibel (3–24)** yang bisa diedit langsung di kanvas, lalu diekspor sebagai **.html interaktif** atau **.pptx** (PowerPoint dengan chart asli).

## Fitur Utama

- **Input dokumen sumber semua format** — unggah `.txt`, `.md`, `.csv`, `.json`, `.log`, `.xml`, `.html`, `.rtf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.odt`, `.pdf`, dan banyak lagi (maks. 20 MB), atau tempel teks langsung ke panel sumber.
- **12 template gaya desain** — 5 template bawaan (Motion Studio, Soft Cards, Neo Grid, Aurora Glow, Ink & Paper) **plus 7 gaya dari Panduan Desain Corporate**: Bento Glassmorphism, Cinematic Parallax, Neo-Brutalism, Editorial Minimalis, Data Glow 3D, Kinetic Typographic, dan Holographic Timeline — masing-masing dengan pratinjau langsung.
- **Tema font & warna, bisa kustom** — 6 tema font + 7 tema warna siap pakai, **plus opsi Kustom**: tentukan sendiri warna utama/aksen/tinta (palet lengkap & irisan chart tersusun otomatis) dan nama font Google Fonts pilihan Anda.
- **Warna latar slide** — default **putih**, bisa diganti kustom (pemilih warna + preset) untuk semua slide terang.
- **Pilihan animasi** — 4 preset transisi (Cinematic, Energetic, Smooth, Minimal) + count-up angka, judul flip per huruf, donat 3D interaktif, batang 3D, dan parallax.
- **Elemen tambahan** — 8 elemen siap pakai (KPI chip, kutipan, callout, progres, butir, badge, pemisah, strip statistik) plus **elemen HTML kustom** buatan sendiri yang bisa digeser langsung di kanvas.
- **Logo & ornamen latar kustom** — unggah logo instansi (PNG/JPG/WebP/SVG/GIF) untuk sampul atau semua slide (posisi pojok, ukuran, opasitas), dan hiasi latar dengan gambar, **GIF beranimasi**, SVG, bahkan **video MP4/WebM**: bebas menentukan target slide (semua/sampul/slide tertentu), 9 posisi + mode penuhi-slide, ukuran, opasitas, dan lapisan depan/belakang. Gambar besar otomatis dikompres; GIF & video tetap beranimasi di ekspor .html (di .pptx menjadi gambar statis).
- **Generate deck fleksibel** — AI memilih 6–16 slide sesuai kekayaan dokumen (fallback parser 3–14); sampul & penutup selalu di ujung, jenis slide bervariasi (KPI, donat, tabel+corong, tren, program, poin, langkah).
- **Mode edit** — klik-teks langsung di kanvas (contenteditable) atau lewat panel data terstruktur; perubahan tersinkron dua arah dan tersimpan otomatis (localStorage).
- **Ekspor .html & .pptx** — HTML self-contained dengan animasi penuh; PPTX dengan chart PowerPoint asli + speaker notes per slide.
- **Import HTML custom** — muat kembali berkas HTML deck untuk disunting atau dipresentasikan kembali.
- **AI opsional** — perluasan konten cerdas via `z-ai-web-dev-sdk` (hanya tersedia di lingkungan Z.ai); di host lain aplikasi otomatis memakai parser aturan sehingga tetap berfungsi penuh.
- **Simpan/buka proyek** — autosave localStorage plus ekspor/impor proyek sebagai `.json`.

## Menjalankan di Localhost

### Prasyarat

Salah satu dari berikut:

- **Bun ≥ 1.1** (disarankan) — instal dari [bun.sh](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- **Node.js ≥ 20** (beserta npm bawaannya)

### Langkah Menjalankan (mode development)

```bash
# 1. Instal dependensi
bun install          # atau: npm install

# 2. Jalankan server development (port 3000)
bun run dev          # atau: npm run dev
```

Lalu buka **http://localhost:3000** di peramban.

> **Pengguna Windows (PowerShell)?** Lihat **[PANDUAN-POWERSHELL.md](./PANDUAN-POWERSHELL.md)** — panduan lengkap ekstrak ZIP, instalasi, dan menjalankan aplikasi via PowerShell, plus skrip `jalankan.ps1` yang otomatis memeriksa Node.js, memasang dependensi, dan menjalankan server sekaligus membuka peramban.

> **Ingin lewat GitHub?** Lihat **[PANDUAN-GITHUB.md](./PANDUAN-GITHUB.md)** — panduan lengkap mengunggah proyek ke GitHub (web / git CLI / GitHub Desktop), menjalankannya dari clone, GitHub Codespaces (langsung di peramban), sampai deploy Vercel.

> Catatan: script `dev` menyalin log ke `dev.log` di root proyek. Tidak ada environment variable yang wajib diisi dan tidak ada database yang digunakan (seluruh state proyek disimpan di localStorage peramban).

### Build Produksi

```bash
# 1. Build produksi (next.config.ts memakai output: "standalone";
#    script build juga menyalin .next/static dan public ke dalam
#    .next/standalone sehingga hasilnya siap jalan mandiri)
bun run build        # atau: npm run build

# 2. Jalankan server produksi (standalone) di port 3000
bun run start        # atau: npm run start
```

## Deploy ke Vercel lewat GitHub

> **Panduan super lengkap langkah demi langkah (upload GitHub 3 cara, login/PAT, Codespaces, clone, Vercel, troubleshooting) ada di [PANDUAN-GITHUB.md](./PANDUAN-GITHUB.md).** Ringkasannya:

1. **Push repositori ini ke GitHub** (jika belum):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: SlideFlow"
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

2. **Buka [vercel.com/new](https://vercel.com/new)** lalu klik **Import** pada repositori tersebut (otorisasi akun GitHub bila diminta).

3. **Vercel mendeteksi Next.js secara otomatis** — preset framework "Next.js", Build Command `next build`, dan Output Directory terisi otomatis. **Biarkan semua pengaturan pada nilai bawaan.**

4. **Tidak ada environment variable wajib** — langsung klik **Deploy**. Setiap push ke branch utama akan memicu redeploy otomatis, dan setiap Pull Request mendapat URL preview.

5. Setelah selesai, aplikasi tersedia di `https://<proyek-anda>.vercel.app`.

### Catatan Penting: Fitur AI di Vercel

Paket `z-ai-web-dev-sdk` (yang dipakai route `/api/generate` untuk memperluas naskah slide secara cerdas) **hanya tersedia di lingkungan sandbox Z.ai**. Saat aplikasi di-deploy ke Vercel (atau host lain), SDK tersebut tidak tersedia, dan route `/api/generate` **otomatis beralih ke fallback parser aturan** (rule-based) yang mengekstrak judul, KPI, komposisi, tabel, corong, tren, dan program kerja langsung dari dokumen sumber Anda.

Akibatnya: **aplikasi tetap berfungsi penuh di Vercel** — deck fleksibel tetap dihasilkan dan seluruh fitur edit/ekspor berjalan normal, hanya tanpa perluasan narasi AI. Tidak diperlukan konfigurasi tambahan apa pun.

#### Opsi: Mengaktifkan AI di Host Sendiri (localhost / Vercel / Docker)

Punya API key Z.ai (atau endpoint API yang kompatibel)? Parser bisa memakainya. SDK `z-ai-web-dev-sdk` membaca kredensial dari file **`.z-ai-config`** (JSON) yang dicari di: root proyek → home directory → `/etc`.

1. Buat file `.z-ai-config` di **root proyek** (sejajar `package.json`):
   ```json
   {
     "baseUrl": "https://api.z.ai/api/v1",
     "apiKey": "API_KEY_ANDA"
   }
   ```
2. Jalankan ulang aplikasi (`npm run dev` / redeploy). Route `/api/generate` otomatis memakai key tersebut — tidak ada kode yang perlu diubah.
3. File `.z-ai-config` sengaja **diabaikan git** (ada di `.gitignore`) agar key tidak bocor ke repo publik. Untuk deploy Vercel dengan AI aktif: gunakan repo **privat** lalu paksa ikut ter-commit dengan `git add -f .z-ai-config`. Tanpa itu, aplikasi di Vercel tetap jalan penuh memakai parser aturan.

> Tanpa file ini, aplikasi **tetap jalan penuh** memakai parser aturan bawaan — hanya saja pembuatan deck tidak dibantu AI. Di sandbox Z.ai, key bawaan sudah tersedia otomatis lewat `/etc/.z-ai-config`, jadi tidak perlu setup apa pun.

## Jalankan dengan Docker

Cara alternatif untuk deployment mandiri (VPS, server internal, dsb.). Dockerfile memakai build multi-stage berbasis image resmi `oven/bun` dan menjalankan hasil `output: "standalone"` Next.js.

### Build & Jalankan Manual

```bash
# Build image
docker build -t slideflow .

# Jalankan container (port host 3000 → port container 3000)
docker run -p 3000:3000 slideflow
```

Buka **http://localhost:3000**. Untuk memakai port host lain, cukup ubah sisi kiri: `docker run -p 8080:3000 slideflow`.

### Menggunakan Docker Compose

```bash
docker compose up          # build + jalan di depan (lihat log)
docker compose up -d       # jalan di latar belakang (detached)
docker compose down        # hentikan dan hapus container
```

File `docker-compose.yml` sudah mengatur service `app` dengan port `3000:3000` dan `restart: unless-stopped`.

## Struktur Proyek

```
slideflow/
├── src/
│   ├── app/
│   │   ├── page.tsx             # Halaman utama (studio)
│   │   ├── layout.tsx           # Layout + metadata
│   │   └── api/
│   │       ├── parse-file/      # POST — parser file universal (semua format, maks 20 MB)
│   │       └── generate/        # POST — generate deck fleksibel (AI + fallback parser aturan)
│   ├── components/studio/       # UI studio: header, source-panel, design-panel, elements-panel, branding-panel, data-panel, slide-canvas
│   ├── hooks/                   # Hook utilitas (toast, mobile)
│   └── lib/                     # Logika inti: file-parser, deck-parser, deck-html, exporters, store
├── public/                      # Aset statis
├── prisma/                      # Skema Prisma (TIDAK dipakai aplikasi ini — tanpa database)
├── PANDUAN-POWERSHELL.md        # Panduan menjalankan via PowerShell (Windows)
├── PANDUAN-GITHUB.md            # Panduan GitHub: upload, clone, Codespaces, deploy Vercel
├── jalankan.ps1                 # Launcher otomatis PowerShell (cek Node → install → jalankan)
├── Dockerfile                   # Build image produksi (multi-stage, Bun + standalone)
├── docker-compose.yml           # Orkestrasi satu service
├── .env.example                 # Contoh environment (tidak ada variabel wajib)
└── .github/workflows/ci.yml     # CI: lint via Bun
```

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| **Port 3000 terpakai** | Matikan proses yang memakai port 3000: `lsof -i :3000` lalu `kill <PID>` (macOS/Linux), atau `netstat -ano | findstr :3000` (Windows). Alternatif: jalankan di port lain dengan `bunx next dev -p 3001`. |
| **`bun install --frozen-lockfile` gagal** | Lockfile tidak sinkron dengan `package.json`. Jalankan `bun install` (tanpa flag) untuk memperbarui `bun.lock`, lalu commit ulang. |
| **`bun run start` error "server.js not found"** | Jalankan `bun run build` terlebih dahulu — server produksi membutuhkan hasil build di `.next/standalone/`. |
| **Build produksi kehabisan memori** | Besarkan heap Node: `NODE_OPTIONS=--max-old-space-size=4096 bun run build`. |
| **Upload file ditolak** | Batas ukuran unggahan adalah 20 MB (`/api/parse-file`). Kompres/ekspor ulang dokumen sumber. |
| **Tombol generate AI "tidak aktif"/hasil tanpa ringkasan AI di Vercel** | Wajar dan by design — SDK AI hanya ada di lingkungan Z.ai. Aplikasi otomatis memakai parser aturan dan tetap berfungsi penuh. |
| **Perubahan tidak muncul di deck** | Deck tersimpan di localStorage peramban; coba muat ulang halaman, atau reset lewat tombol proyek (proyek baru). |

## Teknologi

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · pptxgenjs · unpdf · mammoth · SheetJS (xlsx) · JSZip · word-extractor
