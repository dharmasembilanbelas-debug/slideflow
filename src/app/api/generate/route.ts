import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { parseDocumentToDeck } from '@/lib/deck-parser'
import { normalizeDeck } from '@/lib/deck-normalizer'
import type { Deck, DeckSlide } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

// ─── Preset instruksi konteks (di-expand di server) ─────────────────────────
export const PRESET_INSTRUCTIONS: Record<string, string> = {
  outline:
    'Kemas setiap slide HANYA sebagai garis besar: judul tajam, angka-angka kunci besar, dan frasa pendek. Jangan pernah menulis paragraf panjang atau detail deskripsi di slide.',
  verbal:
    'Pindahkan seluruh detail deskripsi, penjelasan, konteks, dan angka pendukung ke "note" (catatan pembicara) tiap slide sebagai naskah yang akan dibacakan/dilisankan saat presentasi — bukan ditampilkan di slide.',
  professional:
    'Gaya presentasi profesional dan hidup: catatan pembicara ditulis sebagai naskah lisan yang mengalir (bercerita, ada transisi antar poin, ada penekanan), BUKAN membacakan data di layar. Presenter bercerita; slide hanya kerangka.',
  accurate:
    'Anti-halusinasi: gunakan HANYA angka dan fakta yang benar-benar ada di dokumen sumber. Jangan mengarang, menambah, atau membulatkan angka. Jika data tidak tersedia untuk suatu bagian, gunakan nilai netral dan sebutkan di catatan bahwa data perlu dilengkapi.',
  executive:
    'Sasaran audiens pimpinan/executive: fokus pada implikasi keputusan, capaian vs target, risiko, dan permintaan dukungan yang spesifik. Bahasa ringkas dan tegas.',
  story:
    'Nada bercerita (storytelling): buka dengan situasi awal, bangun alur konflik-masalah, tunjukkan lompatan hasil, tutup dengan visi ke depan. Catatan pembicara memakai alur cerita ini.',
}

const SYSTEM_PROMPT = `Anda adalah perancang deck presentasi laporan korporat berbahasa Indonesia yang sangat ahli.

TUGAS: mengubah dokumen sumber menjadi JSON deck presentasi dengan JUMLAH SLIDE FLEKSIBEL (ikuti kelengkapan isi dokumen — dokumen padat bisa 10–16 slide, dokumen ringkas cukup 6–8) dengan prinsip "slide garis besar + detail lisan":
- Slide menampilkan KERANGKA: judul tajam, angka kunci, frasa pendek. TANPA paragraf panjang.
- Seluruh detail deskripsi dipindahkan ke "note" tiap slide (catatan pembicara) sebagai NASKA LISAN yang hidup — presenter bercerita, bukan membaca data. Setiap note 60–160 kata, bahasa lisan elegan, menyebut angka secara verbal (mis. "delapan ratus tiga puluh tujuh"), dan menjelaskan makna di balik angka.

STRUKTUR JSON YANG WAJIB DIKEMBALIKAN (hanya JSON, tanpa teks lain, tanpa markdown fence):
{
  "identity": { "org": "", "division": "", "period": "", "title": "JUDUL BESAR", "subtitle": "", "date": "" },
  "slides": [
    { "kind": "cover", "note": "naskah pembuka" },
    { "kind": "kpi", "title": "maks 70 karakter", "subtitle": "maks 120 karakter", "kpis": [ { "label": "maks 28 karakter", "value": 837, "suffix": ""|"%"|":1"|"x"|"+"|"", "decimals": 0, "note": "maks 90 karakter" } ], "note": "..." },
    { "kind": "composition", "title": "...", "subtitle": "...", "centerLabel": "Total", "centerValue": "837", "slices": [ { "label": "maks 22", "value": 0 } ], "note": "..." },
    { "kind": "table", "title": "...", "subtitle": "...", "columns": ["",""], "rows": [["",""]], "funnelTitle": "Corong Konversi", "funnel": [ { "label": "", "value": 0 } ], "note": "..." },
    { "kind": "trend", "title": "...", "subtitle": "...", "points": [ { "label": "Feb", "value": 0 } ], "insight": "maks 140 karakter", "note": "..." },
    { "kind": "programs", "title": "...", "subtitle": "...", "items": [ { "name": "maks 34", "detail": "maks 110", "badge": "maks 18" } ], "note": "..." },
    { "kind": "bullets", "title": "...", "subtitle": "...", "groups": [ { "heading": "maks 34", "items": ["maks 110 karakter"] } ], "note": "..." },
    { "kind": "steps", "title": "...", "subtitle": "...", "items": [ { "name": "maks 34", "detail": "maks 110", "badge": "1" } ], "note": "..." },
    { "kind": "closing", "title": "...", "message": "satu kalimat bermakna", "bullets": ["maks 48 karakter"], "contact": "", "note": "..." }
  ]
}

ATURAN MUTLAK:
1. Slide PERTAMA harus kind "cover", slide TERAKHIR harus kind "closing". Urutan tengah bebas sesuai alur dokumen.
2. PILIH JENIS SLIDE SESUAI ISI DOKUMEN — jangan memaksakan semua jenis. Pecah topik besar dokumen menjadi beberapa slide (tiap program/topik bisa punya slide sendiri, mis. "bullets" untuk capaian & hambatan, "steps" untuk langkah perbaikan, "programs" untuk daftar kegiatan, "table" untuk data tabular, "composition" untuk sebaran kategori, "trend" untuk data per periode).
3. Satu slide "kpi" cukup (2–4 kpis; slide pertama setelah cover). Jenis lain boleh berulang bila dokumen memang punya banyak bagian — total slide 6–16.
4. Angka WAJIB berasal dari dokumen sumber — dilarang mengarang. funnel harus menurun; jika tidak ada data tren, JANGAN buat slide "trend". composition butuh >=2 irisan; tabel 2–6 kolom x 2–7 baris.
5. kpis.decimals: 1 untuk desimal seperti 94,4; else 0. suffix "%" untuk persen. Angka tanpa pemisah ribuan di JSON (2847).
6. Bahasa Indonesia profesional. Judul slide TANPA titik di akhir. Setiap slide WAJIB punya "note" (60–160 kata).
7. Kembalikan HANYA JSON valid.`

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

function extractJson(text: string): unknown {
  const cleaned = stripFences(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

/** Slide pertama dengan kind tertentu */
function findSlide(deck: Deck, kind: DeckSlide['kind']): DeckSlide | undefined {
  return deck.slides.find((s) => s.kind === kind)
}

export async function POST(req: NextRequest) {
  let body: { document?: string; context?: string; presets?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid' }, { status: 400 })
  }

  const document = (body.document || '').trim()
  const context = (body.context || '').trim()
  const presets = Array.isArray(body.presets) ? body.presets.filter((p) => typeof p === 'string') : []

  if (document.length < 40) {
    return NextResponse.json(
      { error: 'Dokumen terlalu pendek. Tempel teks laporan minimal ~40 karakter atau muat file sumber.' },
      { status: 400 },
    )
  }

  // Fallback selalu disiapkan (parser aturan — jumlah slide fleksibel)
  const fallback = parseDocumentToDeck(document)

  const presetLines = presets
    .map((p) => PRESET_INSTRUCTIONS[p])
    .filter(Boolean)
    .map((l, i) => `${i + 1}. ${l}`)
    .join('\n')

  const userContent = [
    '=== INSTRUKSI KONTEKS (WAJIB DIIKUTI) ===',
    presetLines || '(tidak ada preset aktif — terapkan prinsip umum slide garis besar + detail lisan)',
    context ? `\n=== INSTRUKSI TAMBAHAN DARI PENGGUNA ===\n${context.slice(0, 2000)}` : '',
    '\n=== DOKUMEN SUMBER ===',
    document.slice(0, 60000),
    '\n=== TUGAS ===',
    'Analisis dokumen di atas dan kembalikan JSON deck dengan jumlah slide yang SESUAI kelengkapan dokumen (6–16 slide; pecah topik besar menjadi beberapa slide). Ingat: slide = garis besar; detail = catatan pembicara yang hidup di "note" tiap slide.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      thinking: { type: 'disabled' },
    })
    const content = completion.choices[0]?.message?.content
    if (!content || content.trim().length < 50) throw new Error('Respons AI kosong')

    const raw = extractJson(content)
    if (!raw || typeof raw !== 'object') throw new Error('JSON dari AI tidak dapat diparse')

    const deck = normalizeDeck(raw)

    // Penggabungan pengaman: bila deck AI terlalu tipis, gunakan fallback;
    // bila deck AI kehilangan jenis data yang justru fallback punya, sisipkan dari fallback.
    let merged: Deck = deck
    const minSlides = 5
    if (deck.slides.length < minSlides) {
      merged = fallback
    } else {
      const extra: DeckSlide[] = []
      if (!findSlide(deck, 'kpi')) {
        const fKpi = findSlide(fallback, 'kpi')
        if (fKpi) extra.push(fKpi)
      }
      if (!findSlide(deck, 'table')) {
        const fTable = findSlide(fallback, 'table')
        if (fTable && fTable.kind === 'table' && fTable.rows.length >= 2) extra.push(fTable)
      }
      if (!findSlide(deck, 'trend')) {
        const fTrend = findSlide(fallback, 'trend')
        if (fTrend && fTrend.kind === 'trend' && fTrend.points.length >= 3) extra.push(fTrend)
      }
      if (extra.length) {
        const slides = [...deck.slides]
        const at = slides.length - 1 // sebelum penutup
        slides.splice(at, 0, ...extra)
        merged = { ...deck, slides }
      }
    }

    return NextResponse.json({ deck: merged, usedAI: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui'
    return NextResponse.json({
      deck: fallback,
      usedAI: false,
      warning:
        `AI tidak aktif di host ini (${message.slice(0, 110)}) — deck dibuat dengan parser aturan bawaan tanpa API key; ` +
        `hasilnya tetap bisa diedit & diekspor. ` +
        `Ingin mengaktifkan AI di localhost/Vercel? Buat file .z-ai-config di root proyek berisi ` +
        `{"baseUrl":"https://api.z.ai/api/v1","apiKey":"KEY_ANDA"} lalu jalankan ulang.`,
    })
  }
}
