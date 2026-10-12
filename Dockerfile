# syntax=docker/dockerfile:1

# =============================================================================
# SlideFlow — Dockerfile produksi (multi-stage, optimized)
#
# Catatan tata letak hasil build (penting):
#   - next.config.ts memakai `output: "standalone"`, sehingga `next build`
#     menghasilkan server mandiri di .next/standalone/server.js
#     (lengkap dengan node_modules minimal hasil tracing Next.js).
#   - Script "build" di package.json adalah:
#       next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
#     sehingga SETELAH build, folder .next/standalone SUDAH berisi
#     .next/static dan public di dalamnya. Stage runner di bawah tetap
#     menyalin keduanya secara defensif (idempoten — bila sudah ada dari
#     standalone, penyalinan ulang hanya menimpa dengan konten identik).
# =============================================================================

###############################################################################
# Stage 1 — deps + builder
###############################################################################
FROM oven/bun:1 AS builder

WORKDIR /app

# 1) Salin manifest dependensi dulu agar layer ter-cache:
#    `bun install` hanya dijalankan ulang bila package.json / bun.lock berubah.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) Salin seluruh source code, lalu build produksi.
#    Hasil: /app/.next/standalone/{server.js, .next/static/, public/, node_modules/}
#    (.dockerignore menjaga context tetap kecil — src/, public/, dan file
#    konfigurasi saja yang benar-benar dikirim ke builder.)
COPY . .
RUN bun run build

###############################################################################
# Stage 2 — runner (image akhir yang ramping)
###############################################################################
FROM oven/bun:1-slim AS runner

LABEL org.opencontainers.image.title="SlideFlow" \
      org.opencontainers.image.description="Generator presentasi 7 slide beranimasi (HTML + ekspor PPTX) dari dokumen sumber segala format — Next.js 16, Tailwind 4, shadcn/ui" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy hasil standalone (server.js + .next + node_modules minimal).
# .next/static dan public SUDAH berada di dalam folder ini berkat
# script "build" (lihat catatan di atas).
COPY --from=builder /app/.next/standalone ./

# Defensif: pastikan static & public tersedia walau script "build" berubah
# dan tidak lagi menyalinnya ke dalam standalone (bila sudah ada, konten
# identik saling menimpa — tidak ada efek samping).
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# Jalankan server standalone Next.js dengan Bun.
CMD ["bun", ".next/standalone/server.js"]
