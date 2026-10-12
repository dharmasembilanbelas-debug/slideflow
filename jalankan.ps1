# ============================================================
# SlideFlow - Launcher otomatis (Windows PowerShell)
# ============================================================
# Cara pakai (dari folder proyek):
#   powershell -ExecutionPolicy Bypass -File .\jalankan.ps1
# atau klik kanan file ini -> "Run with PowerShell"
#
# Skrip ini akan:
#   1. Memeriksa ketersediaan Node.js (fallback: Bun)
#   2. Memasang dependensi bila node_modules belum ada
#   3. Menjalankan server development di http://localhost:3000
# ============================================================

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=== SlideFlow ===" -ForegroundColor Cyan

# ---- 1. Deteksi runtime ----
$runner = $null
try {
    $null = node --version 2>$null
    $runner = 'npm'
    $nodeVer = (node --version)
    Write-Host "[OK] Node.js terdeteksi: $nodeVer" -ForegroundColor Green
} catch {
    try {
        $null = bun --version 2>$null
        $runner = 'bun'
        $bunVer = (bun --version)
        Write-Host "[OK] Bun terdeteksi: $bunVer" -ForegroundColor Green
    } catch {
        Write-Host "[GAGAL] Node.js maupun Bun tidak ditemukan." -ForegroundColor Red
        Write-Host "Silakan install Node.js LTS terlebih dahulu:" -ForegroundColor Yellow
        Write-Host "    winget install OpenJS.NodeJS.LTS"
        Write-Host "Lalu tutup dan buka ulang PowerShell, dan jalankan skrip ini lagi."
        Read-Host "Tekan Enter untuk keluar"
        exit 1
    }
}

# ---- 2. Pasang dependensi bila belum ada ----
if (-not (Test-Path -Path .\node_modules)) {
    Write-Host "[..] Memasang dependensi (sekali saja, mohon tunggu)..." -ForegroundColor Yellow
    if ($runner -eq 'bun') {
        bun install
    } else {
        npm install
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[GAGAL] Instalasi dependensi bermasalah. Periksa koneksi internet lalu ulangi." -ForegroundColor Red
        Read-Host "Tekan Enter untuk keluar"
        exit 1
    }
    Write-Host "[OK] Dependensi terpasang." -ForegroundColor Green
} else {
    Write-Host "[OK] Dependensi sudah terpasang." -ForegroundColor Green
}

# ---- 3. Jalankan server development ----
Write-Host ""
Write-Host "[GO] Menjalankan aplikasi di http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "     (buka alamat tersebut di peramban; tekan Ctrl+C di sini untuk berhenti)"
Write-Host ""

# Buka peramban otomatis setelah server siap
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 6
    Start-Process "http://localhost:3000"
} | Out-Null

if ($runner -eq 'bun') {
    bun run dev
} else {
    npm run dev
}
