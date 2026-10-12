# Panduan GitHub — Menjalankan SlideFlow via GitHub

Panduan ini menjelaskan **semua cara** membawa proyek **SlideFlow** ke GitHub dan menjalankannya dari sana — mulai dari mengunggah kode, menjalankannya di komputer lain, menjalankannya **langsung di peramban** (tanpa install apa pun), sampai men-deploy-nya **online gratis** lewat Vercel.

Semua perintah contoh ditulis untuk **PowerShell (Windows)**. Pengguna macOS/Linux cukup mengganti `cd $HOME\Downloads` menjadi `cd ~/Downloads` dan menghapus tanda `.\` pada nama skrip.

---

## 0 · Pilih Jalur Anda

| Jalur | Butuh install? | Cocok untuk | Waktu |
| --- | --- | --- | --- |
| **A — Upload via website GitHub** | Tidak sama sekali | Pemula, sekali unggah | ± 5 menit |
| **B — Git CLI via PowerShell** ⭐ | Git saja | Cara standar, bisa update berkala | ± 5 menit |
| **C — GitHub Desktop** | Aplikasi GitHub Desktop | Yang suka klik-klik tanpa terminal | ± 5 menit |
| **D — Clone dari GitHub** (komputer lain) | Git + Node.js | Menjalankan proyek di mesin lain | ± 10 menit |
| **E — GitHub Codespaces** (jalan di peramban) | Tidak sama sekali | Coba cepat tanpa setup | ± 5 menit |
| **F — Deploy Vercel dari GitHub** | Tidak sama sekali | Aplikasi ONLINE permanen, bisa diakses siapa pun | ± 5 menit |

> Rekomendasi: **Jalur B** (atau A jika ingin cepat) untuk mengunggah → lalu **Jalur F** untuk membuat aplikasi online. Jalur E bila ingin mencoba tanpa menginstal apa pun.

---

## 1 · Siapkan Folder Proyek

Jika Anda mulai dari file ZIP (`slideflow.zip`):

```powershell
cd $HOME\Downloads
Expand-Archive -Path .\slideflow.zip -DestinationPath .\slideflow -Force
cd slideflow
Get-ChildItem          # pastikan package.json terlihat
```

> Panduan lengkap ekstraksi + menjalankan lokal ada di **[PANDUAN-POWERSHELL.md](./PANDUAN-POWERSHELL.md)**.

**Penting:** folder `node_modules`, `.next`, dan `.git` **tidak perlu** ikut ke GitHub — file `.gitignore` bawaan proyek sudah mengecualikannya secara otomatis. Dependensi akan dipasang ulang dengan `npm install` setelah di-clone.

---

## 2 · Jalur A — Upload ke GitHub via Website (Tanpa Install Git)

1. Buat akun di <https://github.com> (gratis).
2. Klik ikon **+** di kanan atas → **New repository**.
3. Isi form:
   - **Repository name**: `slideflow`
   - **Public** (agar Vercel & orang lain bisa mengakses; Private juga bisa)
   - **Jangan** centang "Add a README file", ".gitignore", maupun "license" (biarkan repo kosong).
4. Klik **Create repository**.
5. Di halaman repo yang muncul, klik tautan **"uploading an existing file"**.
6. **Buka File Explorer**, masuk ke folder proyek, aktifkan **View → Show → Hidden items** agar file tersembunyi (`.gitignore`, `.env.example`, `.github`) ikut terlihat.
7. **Seleksi SEMUA isi folder** (`Ctrl + A`) — kecuali folder `node_modules` bila ada — lalu **drag & drop** ke area unggah di GitHub.
8. Tunggu proses unggah selesai (± 1–2 menit), isi kolom *Commit changes* dengan `SlideFlow - initial commit`, klik **Commit changes**.
9. Selesai! Kode Anda sekarang ada di `https://github.com/<username>/slideflow`.

> Catatan: unggah via web tidak menyertakan riwayat versi. Untuk pengelolaan jangka panjang, gunakan Jalur B atau C.

---

## 3 · Jalur B — Git CLI via PowerShell (Disarankan) ⭐

### 3.1 Pasang Git (sekali saja)

```powershell
winget install --id Git.Git -e
```

**Tutup dan buka ulang PowerShell**, lalu verifikasi:

```powershell
git --version    # harapannya git version 2.x
```

> Jika `winget` tidak tersedia, unduh installer dari <https://git-scm.com/download/win>.

### 3.2 Identitas Git (sekali saja)

```powershell
git config --global user.name  "Nama Anda"
git config --global user.email "email-anda@contoh.com"
```

### 3.3 Inisialisasi & Push ke GitHub

```powershell
# Masuk ke folder proyek
cd $HOME\Downloads\slideflow

# Mulai pelacakan git (file .gitignore otomatis bekerja di sini)
git init
git add .
git commit -m "SlideFlow - initial commit"
git branch -M main
```

Sekarang buat **repo kosong** di <https://github.com/new> (nama `slideflow`, **tanpa** README/gitignore/license), lalu kaitkan dan unggah:

```powershell
git remote add origin https://github.com/<username>/slideflow.git
git push -u origin main
```

### 3.4 Login Pertama Kali

Saat `git push`, jendela **Git Credential Manager** akan muncul:

- Pilih **"Sign in with your browser"** → browser terbuka → klik **Authorize** → selesai. Kredensial tersimpan di Windows sehingga push berikutnya tidak menanyakan lagi.

Alternatif tanpa jendela popup (pakai **Personal Access Token**):

1. GitHub → klik foto profil → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
2. Centang scope **repo**, beri masa berlaku, klik **Generate**.
3. **Salin token** (hanya tampil sekali!) — saat git menanyakan *Password*, tempel token tersebut (username = username GitHub Anda).

Atau pasang GitHub CLI dan login sekali:

```powershell
winget install --id GitHub.cli -e
gh auth login     # ikuti wizard: GitHub.com → HTTPS → Login with web browser
```

Setelah push berhasil, muat ulang halaman repo — seluruh kode (termasuk `.github/workflows/ci.yml`) sudah naik.

---

## 4 · Jalur C — GitHub Desktop (Klik-Klik, Tanpa Terminal)

1. Unduh & install <https://desktop.github.com>, lalu login dengan akun GitHub.
2. Menu **File → Add local repository…** → klik **Choose…** → pilih folder proyek.
3. Muncul pesan "not a git repository"? Klik tautan **"create a repository here instead"**:
   - Name: `slideflow` · biarkan Git ignore: `Node` bila diminta
   - Klik **Create Repository**.
4. Klik **Publish repository** di bar atas (boleh centang *Keep this code private* sesuai selera).
5. Selesai — repo muncul di akun GitHub Anda.

Untuk update berikutnya: ubah file → GitHub Desktop otomatis mendeteksi → tulis ringkasan → **Commit to main** → **Push origin**.

---

## 5 · Jalur D — Menjalankan Proyek dari GitHub di Komputer Mana Pun

Siapa pun (termasuk Anda di komputer lain) dapat menjalankan proyek hanya dari tautan GitHub:

```powershell
# 1. Clone repositori
git clone https://github.com/<username>/slideflow.git
cd slideflow

# 2. Pasang dependensi (wajib — node_modules tidak ikut di-clone)
npm install

# 3. Jalankan mode development
npm run dev
```

Buka **http://localhost:3000** — aplikasi berjalan penuh.

> **Cara instan:** setelah clone, cukup jalankan skrip launcher bawaan proyek — ia otomatis memasang dependensi, menjalankan server, dan membuka peramban:
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\jalankan.ps1
> ```

### Mode Produksi (opsional)

```powershell
npm run build
$env:NODE_ENV="production"; node .next\standalone\server.js
```

> Prasyarat komputer: **Node.js ≥ 20** (`winget install OpenJS.NodeJS.LTS`) — detail di PANDUAN-POWERSHELL.md.

### Tanpa Git: Unduh ZIP dari GitHub

Buka repo di GitHub → tombol hijau **Code** → **Download ZIP** → ekstrak → lanjut `npm install` + `npm run dev` (sama seperti di atas).

---

## 6 · Jalur E — GitHub Codespaces: Jalan Langsung di Peramban

Tidak ingin menginstall apa pun di komputer? Jalankan proyek **di dalam peramban** dengan Codespaces:

1. Buka repo Anda di GitHub (mis. `github.com/<username>/slideflow`).
2. Klik tombol hijau **Code** → tab **Codespaces** → **Create codespace on main**.
3. Tunggu ± 30–60 detik — VS Code terbuka langsung di peramban.
4. Di terminal bawah, jalankan:

   ```bash
   npm install
   npm run dev
   ```

5. Muncul notifikasi **"Your application running on port 3000 is available"** → klik **Open in Browser**.
6. Aplikasi tampil di URL seperti `https://<nama-codespace>-3000.app.github.dev` — bisa dipakai, bisa diedit, tersimpan di cloud.

> Kuota akun gratis: 120 jam-inti/bulan (≈ 60 jam untuk mesin 2-core) — jauh lebih dari cukup untuk mencoba dan mengembangkan. Hentikan codespace lewat menu **Codespaces** (kanan bawah) bila tidak dipakai agar kuota tidak terpakai.

---

## 7 · Jalur F — Deploy ONLINE Gratis: Vercel dari GitHub ⭐

Cara paling praktis membuat aplikasi **online permanen** dan bisa diakses dari mana saja:

1. Buka <https://vercel.com/new> → **Continue with GitHub** (atau login akun Vercel lalu hubungkan GitHub).
2. Cari repo `slideflow` di daftar → klik **Import**.
3. Vercel otomatis mendeteksi **Next.js** — biarkan **semua pengaturan bawaan**; **tidak ada environment variable yang wajib**.
4. Klik **Deploy** → tunggu ± 2 menit.
5. Aplikasi ONLINE di `https://slideflow.vercel.app` (nama bisa diubah di Settings → Domains).

**Yang terjadi setelahnya (otomatis):**

| Kejadian | Hasil |
| --- | --- |
| `git push` ke branch `main` | Redeploy otomatis (versi terbaru langsung online) |
| Pull Request | URL *preview* unik untuk mencoba versi tersebut |
| Repo diperbarui via web editor GitHub | Redeploy otomatis juga |

**Catatan fitur AI:** paket `z-ai-web-dev-sdk` hanya aktif di lingkungan sandbox Z.ai. Di Vercel, route `/api/generate` **otomatis beralih ke parser aturan bawaan** — aplikasi **tetap berfungsi penuh** (deck 7 slide, mode edit, ekspor HTML/PPTX semuanya normal), hanya tanpa perluasan narasi AI.

**Alternatif satu-perintah** (tanpa membuka web): dari folder proyek yang sudah di-clone,

```powershell
npm i -g vercel
vercel          # jawab wizard sekali; perintah sama dipakai untuk update berikutnya
```

---

## 8 · CI Otomatis (GitHub Actions)

Proyek ini sudah menyertakan workflow **`.github/workflows/ci.yml`**: setiap push/PR di-*lint* otomatis dengan Bun.

- Lihat hasilnya di tab **Actions** pada halaman repo GitHub.
- Tanda ✅ hijau = kode lolos lint; ❌ merah = ada masalah gaya/kode yang perlu dibersihkan.

---

## 9 · Update Kode (Push Perubahan Berikutnya)

Setelah repo berdiri, siklus update hanya tiga perintah:

```powershell
cd path\ke\slideflow
git add .
git commit -m "Deskripsi perubahan"
git push
```

Push ke GitHub otomatis memicu CI (lint) dan — bila Vercel sudah terhubung — redeploy produksi.

---

## 10 · Cheat Sheet Perintah Git

| Perintah | Fungsi |
| --- | --- |
| `git init` | Mulai pelacakan git di folder ini |
| `git status` | Lihat file yang berubah |
| `git add .` | Panggulkan semua perubahan |
| `git commit -m "pesan"` | Simpan snapshot perubahan |
| `git push` | Unggah commit ke GitHub |
| `git pull` | Tarik perubahan terbaru dari GitHub |
| `git clone <url>` | Unduh repo + riwayatnya |
| `git log --oneline` | Riwayat commit ringkas |
| `git remote -v` | Lihat alamat remote origin |
| `git remote set-url origin <url>` | Ganti alamat remote (mis. salah ketik) |

---

## 11 · Masalah Umum & Solusinya

| Masalah / Pesan Error | Solusi |
| --- | --- |
| `git : The term 'git' is not recognized` | Git belum terpasang / PowerShell belum direstart. Jalankan `winget install --id Git.Git -e`, tutup-buka ulang PowerShell. |
| `remote origin already exists` | Alamat remote sudah pernah diisi. Perbaiki: `git remote set-url origin https://github.com/<username>/<repo>.git` |
| Push gagal **403 / Authentication failed** | Login via Git Credential Manager ("Sign in with your browser"), atau pakai Personal Access Token sebagai password (bagian 3.4), atau `gh auth login`. |
| Push ditolak: `Updates were rejected` (repo berisi README) | Repo di GitHub tidak kosong. Tarik dulu lalu dorong: `git pull origin main --rebase --allow-unrelated-histories` lalu `git push -u origin main`. (Atau buat ulang repo kosong tanpa README.) |
| `fatal: not a git repository` | Anda belum berada di folder proyek. `cd` ke folder yang memuat `package.json` dulu. |
| File `.github`/`.gitignore` tidak ikut saat upload web | File/folder berawalan titik tersembunyi. Aktifkan **View → Show → Hidden items** di File Explorer, lalu drag ulang. |
| `npm install` gagal di belakang proxy/kantor | Coba `npm config set registry https://registry.npmjs.org/` atau gunakan jaringan lain; kebutuhan bandwidth ± 200–400 MB. |
| Port 3000 terpakai saat `npm run dev` | Jalankan di port lain: `npm run dev -- -p 3001` |
| Vercel build gagal di langkah `bun install --frozen-lockfile` | Itu milik CI GitHub, bukan Vercel — Vercel memakai `npm`/deteksi otomatis. Pastikan **Build Command** `next build` bawaan tidak diubah. |
| Repo terlalu besar / push sangat lama | Pastikan `node_modules` dan `.next` tidak ikut (`.gitignore` sudah menanganinya jika Anda mulai dari ZIP resmi). Cek dengan `git status` sebelum `git add .`. |

---

## 12 · Ringkasan Alur Lengkap (TL;DR)

```powershell
# === UNGGAH KE GITHUB (sekali) ===
cd $HOME\Downloads\slideflow
git init ; git add . ; git commit -m "SlideFlow"
# buat repo kosong di github.com/new lalu:
git remote add origin https://github.com/<username>/slideflow.git
git push -u origin main

# === JALANKAN DARI GITHUB (komputer mana pun) ===
git clone https://github.com/<username>/slideflow.git
cd slideflow ; npm install ; npm run dev
# → buka http://localhost:3000

# === BUAT ONLINE GRATIS ===
# vercel.com/new → Import repo → Deploy → selesai (auto-redeploy tiap push)
```

---

*SlideFlow — generator deck presentasi HTML + PPTX beranimasi. Panduan terkait: [PANDUAN-POWERSHELL.md](./PANDUAN-POWERSHELL.md) (menjalankan lokal di Windows) · [README.md](./README.md) (dokumentasi aplikasi).*
