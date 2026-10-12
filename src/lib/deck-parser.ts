import type { BulletGroup, Deck, DeckSlide, SlideKind } from './types'
import { MAX_SLIDES, SLIDE_LABEL, genSlideId } from './types'

// ─── Parser aturan (fallback tanpa AI) — JUMLAH SLIDE FLEKSIBEL ─────────────
// Dokumen dipecah menjadi babak per heading (markdown / HURUF BESAR / baris
// berakhir ":"), lalu tiap babak dianalisis: tabel, corong, tren bulanan,
// pasangan "Label: angka", atau butir — dan menjadi 1 slide yang sesuai.
// Hasil: sampul + N slide konten + penutup (umumnya 5–16 slide).

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'ags', 'sep', 'okt', 'nov', 'des',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september',
  'oktober', 'november', 'desember',
]

const RE_PROGRAM = /program|kegiatan|strategi|inisiatif|andel|workstream/i
const RE_STEPS = /langkah|tahap|rencana|perbaikan|rekomendasi|tindak lanjut|solusi|roadmap|strategi perbaikan/i
const RE_CLOSING = /penutup|kesimpulan|simpulan|terima kasih|close|closing|arah |ke depan|rekomendasi/i
const RE_SPLIT_TWO = /\bdan\b|\b&\b|vs\.?|hambatan|capaian|temuan|solusi|dampak|manfaat|tantangan/i

export function parseIdNumber(raw: string): number | null {
  if (!raw) return null
  let s = raw.trim().replace(/[^\d.,-]/g, '')
  if (!s || /^-?$/.test(s)) return null
  const neg = s.startsWith('-')
  s = s.replace(/-/g, '')
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length >= 3) s = parts.join('')
    else s = s.replace(',', '.')
  } else if (hasDot) {
    const parts = s.split('.')
    if (parts.length > 1 && parts[parts.length - 1].length === 3 && parts[0].length <= 3) {
      s = parts.join('')
    } else {
      s = s.replace(/\./g, '')
    }
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return neg ? -n : n
}

interface Pair {
  label: string
  value: number
  suffix: string
  decimals: number
  rest: string
}

function collectPairs(lines: string[]): Pair[] {
  const pairs: Pair[] = []
  const re =
    /^[-*•·]?\s*[_*#`]*(.{2,48}?)[_*`]*\s*[:：=]\s*\**\s*([\-−]?[\d][\d.,]*)\s*(%|:1|x|×|poin|orang|unit|murid|siswa|keluarga)?\s*\**[.,;]?\s*(.*)$/i
  for (const line of lines) {
    const m = line.trim().match(re)
    if (!m) continue
    const value = parseIdNumber(m[2])
    if (value === null) continue
    const label = m[1].replace(/[#*_`]/g, '').trim()
    if (!label || /^\d+$/.test(label)) continue
    const decimals = m[2].includes(',') && /,\d{1,2}$/.test(m[2]) ? 1 : 0
    pairs.push({
      label,
      value,
      suffix: m[3] ? (m[3].toLowerCase() === '%' ? '%' : m[3].toLowerCase() === ':1' ? ':1' : '') : '',
      decimals,
      rest: (m[4] || '').trim(),
    })
  }
  return pairs
}

function collectTable(lines: string[]): { columns: string[]; rows: string[][] } | null {
  const mdRows = lines.filter((l) => /^\s*\|.*\|\s*$/.test(l))
  if (mdRows.length >= 3) {
    const cells = mdRows
      .map((r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim()),
      )
      .filter((c) => !c.every((x) => /^:?-{2,}:?$/.test(x)))
    if (cells.length >= 2) {
      const width = Math.max(...cells.map((c) => c.length))
      return {
        columns: cells[0].concat(Array.from({ length: Math.max(0, width - cells[0].length) }, () => '—')).slice(0, 6),
        rows: cells.slice(1, 8).map((r) => r.concat(Array.from({ length: Math.max(0, width - r.length) }, () => '—')).slice(0, 6)),
      }
    }
  }
  const tabRows = lines
    .filter((l) => l.includes('\t'))
    .map((l) => l.split('\t').map((c) => c.trim()))
  if (tabRows.length >= 3 && tabRows[0].length >= 2) {
    return { columns: tabRows[0].slice(0, 6), rows: tabRows.slice(1, 8).map((r) => r.slice(0, 6)) }
  }
  const semiRows = lines
    .filter((l) => (l.match(/;/g) || []).length >= 2)
    .map((l) => l.split(';').map((c) => c.trim()))
  if (semiRows.length >= 3 && semiRows[0].length >= 2) {
    return { columns: semiRows[0].slice(0, 6), rows: semiRows.slice(1, 8).map((r) => r.slice(0, 6)) }
  }
  return null
}

function collectFunnel(lines: string[]): { label: string; value: number }[] {
  const funnel: { label: string; value: number }[] = []
  const arrowLines = lines.filter((l) => l.includes('→') || l.includes('->'))
  for (const line of arrowLines) {
    const segs = line.split(/→|->/)
    for (const seg of segs) {
      const m = seg.trim().match(/^(.*?)[\s:]*([\d][\d.,]*)\s*$/)
      if (!m) continue
      const value = parseIdNumber(m[2])
      const label = m[1].replace(/^[-*•·]|corong|funnel|tahap/gi, '').trim()
      if (value !== null && label) funnel.push({ label: label.slice(0, 22), value })
    }
    if (funnel.length >= 3) break
  }
  const dec: typeof funnel = []
  let prev = Infinity
  for (const f of funnel.slice(0, 4)) {
    const v = Math.min(f.value, prev)
    dec.push({ label: f.label, value: v })
    prev = v
  }
  return dec
}

function collectTrend(lines: string[]): { label: string; value: number }[] {
  const points: { label: string; value: number }[] = []
  const re = /^[-*•·]?\s*#*\s*([A-Za-z]{3,9})\s*[^:\d]*[:：]?\s*\**\s*([\d][\d.,]*)/i
  for (const line of lines) {
    const m = line.trim().match(re)
    if (!m) continue
    const first = m[1].toLowerCase()
    const isMonth = MONTHS.some((mo) => first === mo || first.startsWith(mo))
    if (!isMonth) continue
    const value = parseIdNumber(m[2])
    if (value === null) continue
    const label = m[1].slice(0, 3).toUpperCase()
    if (points.some((p) => p.label === label)) continue
    points.push({ label, value })
  }
  return points.slice(0, 12)
}

function collectBullets(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => /^[-*•·]\s+/.test(l) || /^\d+[.)]\s+/.test(l))
    .map((l) => l.replace(/^[-*•·]\s+|^\d+[.)]\s+/, '').trim())
    .filter((l) => l.length > 3)
}

/** kalimat kunci: baris prosa cukup panjang — untuk slide poin */
function collectSentences(lines: string[], max = 6): string[] {
  return lines
    .map((l) => l.trim().replace(/^#+\s*/, ''))
    .filter((l) => l.length >= 18 && l.length <= 130 && !/[:：]\s*[\d.,]/.test(l) && !/^\|/.test(l) && !/^[-*•·]/.test(l))
    .slice(0, max)
}

function firstHeader(lines: string[]): { title: string; org: string; division: string; period: string } {
  let title = ''
  let org = ''
  let division = ''
  let period = ''
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^organisasi|instansi|perusahaan|sekolah\s*:/i.test(line) && !org) {
      org = line.split(/[:：]/).slice(1).join(':').trim()
      continue
    }
    if (/^divisi|unit|bidang|departemen\s*:/i.test(line) && !division) {
      division = line.split(/[:：]/).slice(1).join(':').trim()
      continue
    }
    if (/^periode|tahun\s*(:|\b)/i.test(line) && !period) {
      period = line.split(/[:：]/).slice(1).join(':').trim()
      continue
    }
    if (/^(#{1,3})\s+/.test(line) && !title) {
      title = line.replace(/^#{1,3}\s+/, '').trim()
      continue
    }
    if (!title && line.length >= 8 && line.length <= 80 && !/[:：]/.test(line) && !/^\|/.test(line)) {
      title = line.replace(/[#*_`]/g, '').trim()
    }
    if (title && org) break
  }
  if (!title) title = 'LAPORAN KINERJA'
  if (!org) org = 'Organisasi Internal'
  if (!division) division = 'Tim Pelaporan'
  if (!period) {
    const now = new Date()
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ]
    period = `Periode ${bulan[now.getMonth()]} ${now.getFullYear()}`
  }
  return { title, org, division, period }
}

// ─── Pemecahan babak dokumen ────────────────────────────────────────────────

interface Section {
  heading: string
  lines: string[]
}

const HEADING_RE = /^(#{2,6})\s+(.+)$/

function isAllCapsHeading(line: string): boolean {
  const t = line.trim().replace(/[:：]$/, '')
  if (t.length < 6 || t.length > 80) return false
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length < 4) return false
  return letters === letters.toUpperCase() && /[A-Z]{3,}/.test(t)
}

function splitSections(lines: string[]): Section[] {
  const sections: Section[] = []
  let cur: Section = { heading: '', lines: [] }
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    const md = line.match(HEADING_RE)
    if (md) {
      if (cur.lines.length || cur.heading) sections.push(cur)
      cur = { heading: md[2].trim(), lines: [] }
      continue
    }
    if (!md && isAllCapsHeading(line)) {
      if (cur.lines.length || cur.heading) sections.push(cur)
      cur = { heading: line.trim().replace(/[:：]$/, '').replace(/[#*_`]/g, '').trim(), lines: [] }
      continue
    }
    cur.lines.push(line)
  }
  if (cur.lines.length || cur.heading) sections.push(cur)
  return sections
}

/** Heading yang muncul berulang (≥3×) hampir pasti label baris tabel, bukan babak —
 *  turunkan menjadi baris biasa agar pemecah babak tidak menghasilkan slide duplikat. */
function demoteNoisyHeadings(sections: Section[]): Section[] {
  const freq = new Map<string, number>()
  for (const s of sections) {
    if (!s.heading) continue
    const k = s.heading.toLowerCase()
    freq.set(k, (freq.get(k) ?? 0) + 1)
  }
  const noisy = new Set([...freq.entries()].filter(([, n]) => n >= 3).map(([k]) => k))
  if (!noisy.size) return sections
  const out: Section[] = []
  for (const s of sections) {
    const k = s.heading?.toLowerCase() ?? ''
    if (k && noisy.has(k)) {
      const target = out[out.length - 1]
      if (target) target.lines.push(s.heading, ...s.lines)
      else out.push({ heading: '', lines: [s.heading, ...s.lines] })
      continue
    }
    out.push({ heading: s.heading, lines: s.lines })
  }
  return out
}

/** Judul bagian: baris pendek tanpa tanda akhir di awal chunk; fallback "Bagian N" */
function pickTitle(chunkLines: string[], fallbackNo: number, used: Set<string>): string {
  const dateLike = /^[\d\s:.,\-–/]+$/
  for (const raw of chunkLines.slice(0, 4)) {
    const t = raw.trim().replace(/^[-*•·#\s]+/, '').replace(/[.:：;,]+$/, '').trim()
    if (t.length < 6 || t.length > 60) continue
    if (dateLike.test(t)) continue
    if (/^[+(-]?\d/.test(t)) continue // mulai dengan angka/kurung — bukan judul
    if (/^\(.+\)$/.test(t)) continue
    if ((t.match(/\d/g) || []).length > t.length * 0.3) continue // terlalu banyak digit
    if (/^aspek$|^tanggal$|^keterangan$|^satuan$|^target$/i.test(t)) continue
    if (/\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i.test(t)) continue // tanggal/bulan — bukan judul
    const key = t.toLowerCase()
    if (used.has(key)) continue
    used.add(key)
    return titleCase(t)
  }
  let n = fallbackNo
  let t = `Bagian ${n}`
  while (used.has(t.toLowerCase())) t = `Bagian ${++n}`
  used.add(t.toLowerCase())
  return t
}

/** Mode datar (teks DOCX/PDF tanpa heading): pecah baris menjadi N babak proporsional
 *  agar jumlah slide mengikuti tebal dokumen — inti "jumlah slide fleksibel". */
function flatSections(lines: string[]): Section[] {
  const body = lines.map((l) => l.trim()).filter((l) => l.length > 0)
  if (body.length < 12) return []
  const target = Math.max(3, Math.min(14, Math.round(body.length / 16)))
  const size = Math.ceil(body.length / target)
  const used = new Set<string>()
  const out: Section[] = []
  for (let i = 0; i < body.length; i += size) {
    const chunk = body.slice(i, i + size)
    if (!chunk.length) continue
    out.push({ heading: pickTitle(chunk, out.length + 1, used), lines: chunk })
  }
  return out
}


function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s|[-–—(])([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .slice(0, 70)
}

function verbal(n: number, decimals: number, suffix: string): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: decimals }) + suffix
}

/** catatan lisan generik per jenis slide — menyebut data aktual */
function makeNote(kind: SlideKind, o: {
  heading: string
  pairs: Pair[]
  slices: { label: string; value: number }[]
  funnel: { label: string; value: number }[]
  trend: { label: string; value: number }[]
  bullets: string[]
  rows: string[][]
}): string {
  const top = (arr: { label: string; value: number }[], n: number) =>
    arr.slice(0, n).map((s) => `${s.label.toLowerCase()} ${verbal(s.value, 0, '')}`).join(', ')
  switch (kind) {
    case 'composition':
      return `Masuk ke rincian komposisi${o.heading ? ` untuk ${o.heading.toLowerCase()}` : ''}. Di layar sengaja hanya proporsinya; saya sebutkan angkanya secara lisan: ${top(o.slices, 3)}${o.slices.length > 3 ? ', dan sisanya menyusul dengan porsi lebih kecil' : ''}. Perhatikan porsi terbesar — di situlah fokus kerja kita berikutnya, dan akan saya jelaskan mengapa distribusinya berbentuk seperti ini.`
    case 'table':
      return `Tabel ini merangkum ${o.heading ? o.heading.toLowerCase() : 'data rinci'} dengan ${o.rows.length} baris data. Saya akan menceritakan alurnya per baris secara naratif — baris mana yang paling sehat, di mana celahnya, dan apa tindak lanjutnya${o.funnel.length >= 2 ? `. Corong di kanan menunjukkan penurunan dari ${o.funnel[0].label.toLowerCase()} menuju ${o.funnel[o.funnel.length - 1].label.toLowerCase()}` : ''}. Detail angka per sel saya sampaikan lisan agar layar tetap bersih.`
    case 'trend': {
      const peak = o.trend.reduce((a, b) => (b.value > a.value ? b : a), o.trend[0])
      return `Perhatikan bentuk grafiknya dulu, bukan angkanya. Ada kenaikan bertahap dengan puncak di ${peak.label} sebesar ${verbal(peak.value, 0, '')}, lalu penyesuaian setelahnya. Secara lisan saya akan menjelaskan apa yang terjadi di tiap titik belok — kegiatan apa yang menyala, faktor eksternal apa yang berpengaruh, dan pelajarannya untuk periode berikutnya.`
    }
    case 'programs':
      return `${o.bullets.length} butir di layar hanya judulnya${o.heading ? ` untuk ${o.heading.toLowerCase()}` : ''}. Untuk masing-masing, saya sampaikan lisan: latarnya, indikator keberhasilannya, dan satu cerita konkret dari lapangan — mulai dari ${o.bullets[0]?.toLowerCase() ?? 'butir pertama'}. Dengan begitu slide tetap bersih, tetapi ceritanya utuh.`
    case 'bullets':
      return `${o.heading ? o.heading + ' — ' : ''}poin-poin di layar adalah kerangkanya. Detail, konteks, dan angka pendukungnya saya sampaikan lisan: mengapa poin ini penting, apa yang sudah berjalan, dan apa yang masih menjadi catatan. Silakan fokus mendengarkan alurnya, bukan membaca slide.`
    case 'steps':
      return `Ada ${o.bullets.length} langkah yang diusulkan${o.heading ? ` dalam ${o.heading.toLowerCase()}` : ''}. Urutannya sengaja dibuat logis: dari yang paling cepat memberi dampak menuju yang paling struktural. Saya akan menjelaskan lisan siapa pelakunya, berapa perkiraan waktunya, dan indikator yang menunjukkan langkah ini berhasil.`
    default:
      return `Bagian ${o.heading ? o.heading.toLowerCase() : 'ini'} berisi ${o.pairs.length} data kunci: ${top(o.pairs, 3)}. Kerangkanya tampil di layar; makna di balik angka-angka itu saya ceritakan secara lisan pada bagian ini.`
  }
}

function kindForSection(sec: Section, pairs: Pair[], table: { columns: string[]; rows: string[][] } | null, trend: { label: string; value: number }[], bullets: string[]): SlideKind {
  const h = sec.heading
  if (table && table.rows.length >= 2) return 'table'
  if (trend.length >= 3) return 'trend'
  if (RE_STEPS.test(h) && bullets.length >= 2) return 'steps'
  if (RE_PROGRAM.test(h) && bullets.length >= 2) return 'programs'
  if (pairs.length >= 3) return 'composition'
  if (bullets.length >= 2) return 'bullets'
  if (pairs.length >= 1) return 'bullets'
  return 'bullets'
}

// ─── Parser utama ───────────────────────────────────────────────────────────

export function parseDocumentToDeck(doc: string): Deck {
  const lines = doc.split(/\r?\n/)
  const { title, org, division, period } = firstHeader(lines)
  const identity = {
    org,
    division,
    period,
    title: title.toUpperCase().slice(0, 60),
    subtitle: `Ringkasan laporan ${division} — disusun otomatis dari dokumen sumber`,
    date: period,
  }

  let sections = demoteNoisyHeadings(splitSections(lines))
  const headingCount = sections.filter((s) => s.heading).length
  // Dokumen datar (tanpa struktur heading — khas hasil ekstrak DOCX/PDF):
  // pecah proporsional agar jumlah slide menyesuaikan tebal dokumen.
  if (headingCount < 3) {
    const flat = flatSections(lines)
    if (flat.length > sections.filter((s) => s.lines.length >= 4).length) sections = flat
  }
  const used = new Set<string>()
  const mk = (kind: SlideKind, extra: Partial<DeckSlide>): DeckSlide =>
    ({ id: genSlideId(kind, used), kind, title: SLIDE_LABEL[kind], subtitle: '', note: '', ...extra }) as DeckSlide

  const cover = mk('cover', {
    title: identity.title,
    note: `Bapak/Ibu, pada sesi ini saya akan memandu ringkasan ${identity.title.toLowerCase()} milik ${identity.org} untuk ${identity.period}. Dokumen sumbernya cukup kaya, jadi saya pecah menjadi beberapa bagian: angka kunci dulu, lalu rincian per babak, dan kita tutup dengan tindak lanjut. Layar hanya menampilkan garis besar — detailnya saya sampaikan lisan di tiap slide.`,
  })

  // KPI global: pasangan terkuat dari seluruh dokumen
  const allPairs = collectPairs(lines)
  const kpiPairs = allPairs
    .filter((p) => Math.abs(p.value) > 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4)
  const kpiSlide = mk('kpi', {
    title: 'Angka Kunci',
    subtitle: 'Ringkasan capaian utama — detail deskripsi disampaikan lisan oleh pemateri',
    note: `Mari mulai dari angka-angka kunci. ${kpiPairs[0] ? `${kpiPairs[0].label.toLowerCase()} mencapai ${verbal(kpiPairs[0].value, kpiPairs[0].decimals, kpiPairs[0].suffix)}` : 'Angka utama akan saya sebutkan secara lisan'}${kpiPairs[1] ? `, dipengaruhi ${kpiPairs[1].label.toLowerCase()} sebesar ${verbal(kpiPairs[1].value, kpiPairs[1].decimals, kpiPairs[1].suffix)}` : ''}. Empat angka ini adalah ringkasan dari seluruh dokumen — makna di balik masing-masing akan saya jelaskan lisan, termasuk konteks pencapaiannya dibanding periode sebelumnya.`,
    kpis: kpiPairs.length
      ? kpiPairs.map((p) => ({
          label: p.label.slice(0, 28),
          value: Math.abs(p.value),
          suffix: p.suffix,
          decimals: p.decimals,
          note: p.rest ? p.rest.slice(0, 90) : 'Sumber: dokumen yang dimuat',
        }))
      : undefined,
  } as Partial<DeckSlide>) as DeckSlide
  if (!kpiPairs.length) {
    // tanpa data → KPI slide pakai placeholder minimal
    ;(kpiSlide as Extract<DeckSlide, { kind: 'kpi' }>).kpis = [
      { label: 'Data Kunci 1', value: 0, suffix: '', decimals: 0, note: 'Lengkapi dari dokumen' },
      { label: 'Data Kunci 2', value: 0, suffix: '', decimals: 0, note: 'Lengkapi dari dokumen' },
    ]
  }

  // Babak dokumen → slide konten
  const contentSlides: DeckSlide[] = []
  const closingSections: Section[] = []

  for (const sec of sections) {
    const body = sec.lines.filter((l) => l.trim())
    if (!sec.heading && !body.length) continue
    const pairs = collectPairs(body)
    const table = collectTable(body)
    const trend = collectTrend(body)
    const funnel = collectFunnel(body)
    const bullets = collectBullets(body)
    const heading = sec.heading

    // bagian penutup disimpan terpisah
    if (heading && RE_CLOSING.test(heading) && !pairs.length && !table && !trend.length) {
      closingSections.push(sec)
      continue
    }
    // babak tanpa heading & tanpa data (prolog identitas) dilewati
    if (!heading && !pairs.length && !table && !trend.length && bullets.length < 2) continue
    // babak identik dengan header identitas — lewati bila hanya berisi org/divisi/periode
    if (!heading && body.length <= 4 && body.every((l) => /^(organisasi|divisi|periode|tahun|instansi|unit|bidang|departemen)\s*:/i.test(l.trim()))) continue

    const kind = kindForSection(sec, pairs, table, trend, bullets)
    const stitle = heading ? titleCase(heading.replace(/^(laporan|ringkasan|bab)\s+/i, '')) : SLIDE_LABEL[kind]

    if (kind === 'table') {
      const t = table!
      contentSlides.push(
        mk('table', {
          title: stitle,
          subtitle: 'Tabel rinci — cerita per baris disampaikan lisan',
          note: makeNote('table', { heading, pairs, slices: [], funnel, trend: [], bullets, rows: t.rows }),
          columns: t.columns,
          rows: t.rows,
          funnelTitle: 'Corong Konversi',
          funnel:
            funnel.length >= 2
              ? funnel
              : pairs.slice(0, 3).sort((a, b) => b.value - a.value).map((p) => ({ label: p.label.slice(0, 22), value: Math.abs(p.value) })),
        } as Partial<DeckSlide>),
      )
      continue
    }
    if (kind === 'trend') {
      const peak = trend.reduce((a, b) => (b.value > a.value ? b : a), trend[0])
      contentSlides.push(
        mk('trend', {
          title: stitle,
          subtitle: 'Perkembangan antar periode — tahan & geser grafik untuk memutar',
          note: makeNote('trend', { heading, pairs, slices: [], funnel: [], trend, bullets, rows: [] }),
          points: trend,
          insight: `Puncak terjadi pada ${peak.label} (${peak.value.toLocaleString('id-ID')}) — pola ini perlu diantisipasi pada periode berikutnya.`,
        } as Partial<DeckSlide>),
      )
      continue
    }
    if (kind === 'composition') {
      const slices = pairs.slice(0, 6).map((p) => ({ label: p.label.slice(0, 22), value: Math.abs(p.value) }))
      const total = slices.reduce((a, b) => a + b.value, 0)
      contentSlides.push(
        mk('composition', {
          title: stitle,
          subtitle: 'Sebaran nilai menurut kategori — angka per irisan disebutkan lisan',
          note: makeNote('composition', { heading, pairs, slices, funnel: [], trend: [], bullets, rows: [] }),
          centerLabel: 'Total',
          centerValue: total ? total.toLocaleString('id-ID') : '—',
          slices,
        } as Partial<DeckSlide>),
      )
      continue
    }
    if (kind === 'programs') {
      const items = bullets.slice(0, 6).map((b) => {
        const badgeMatch = b.match(/\[([^\]]{2,20})\]/)
        const badge = badgeMatch ? badgeMatch[1] : ''
        const clean = b.replace(/\[[^\]]*\]/g, '').trim()
        const split = clean.split(/[—–\-:]/)
        const name = (split[0] || clean).trim().slice(0, 34)
        const detail = (split.length > 1 ? split.slice(1).join(' — ') : '').trim() || clean
        return { name, detail: detail.slice(0, 110), badge }
      })
      contentSlides.push(
        mk('programs', {
          title: stitle,
          subtitle: 'Judul di layar — cerita & indikator disampaikan lisan',
          note: makeNote('programs', { heading, pairs, slices: [], funnel: [], trend: [], bullets: items.map((i) => i.name), rows: [] }),
          items,
        } as Partial<DeckSlide>),
      )
      continue
    }
    if (kind === 'steps') {
      const items = bullets.slice(0, 6).map((b, i) => {
        const clean = b.replace(/\[[^\]]*\]/g, '').trim()
        const split = clean.split(/[—–:]/)
        return {
          name: (split[0] || clean).trim().slice(0, 34) || `Langkah ${i + 1}`,
          detail: (split.length > 1 ? split.slice(1).join(' — ') : clean).trim().slice(0, 110),
          badge: String(i + 1),
        }
      })
      contentSlides.push(
        mk('steps', {
          title: stitle,
          subtitle: 'Urutan tindak lanjut — penjelasan per langkah disampaikan lisan',
          note: makeNote('steps', { heading, pairs, slices: [], funnel: [], trend: [], bullets: items.map((i) => i.name), rows: [] }),
          items,
        } as Partial<DeckSlide>),
      )
      continue
    }

    // bullets — kelompok dua bila heading menandakan dua sisi (mis. Capaian dan Hambatan)
    let groups: BulletGroup[]
    let list = bullets.length >= 2 ? bullets : collectSentences(body, 6)
    if (!list.length) {
      // teks sangat datar (fragmen sel tabel): pakai baris pendek unik sebagai butir
      list = body
        .map((l) => l.trim().replace(/[.:：;,]+$/, ''))
        .filter((l) => l.length >= 4 && l.length <= 110 && !/^[\d\s:.,\-–/]+$/.test(l))
    }
    list = list.slice(0, 7)
    if (!list.length) continue
    if (list.length >= 4 && RE_SPLIT_TWO.test(heading)) {
      const mid = Math.ceil(list.length / 2)
      groups = [
        { heading: titleCase(heading.split(/\bdan\b|\b&\b/i)[0] || 'Aspek Positif'), items: list.slice(0, mid).map((s) => s.slice(0, 110)) },
        { heading: titleCase(heading.split(/\bdan\b|\b&\b/i)[1]?.trim() || 'Catatan Perbaikan'), items: list.slice(mid).map((s) => s.slice(0, 110)) },
      ]
    } else {
      groups = [{ heading: heading ? titleCase(heading) : 'Poin Utama', items: list.map((s) => s.slice(0, 110)) }]
    }
    contentSlides.push(
      mk('bullets', {
        title: stitle,
        subtitle: 'Kerangka poin — detail dan konteks disampaikan lisan',
        note: makeNote('bullets', { heading, pairs, slices: [], funnel: [], trend: [], bullets: list, rows: [] }),
        groups,
      } as Partial<DeckSlide>),
    )
  }

  // Batasi jumlah slide konten agar tetap presentabel
  const capped = contentSlides.slice(0, MAX_SLIDES - 3)

  // Penutup dari babak akhir (bila ada) atau default
  const lastSec = closingSections[closingSections.length - 1]
  const closingBulletsRaw = lastSec ? collectBullets(lastSec.lines) : collectBullets(sections[sections.length - 1]?.lines ?? [])
  const closingLine = lastSec
    ? lastSec.lines.map((l) => l.trim()).find((l) => l.length > 24 && !/^\s*[-*•|]/.test(l) && !/^kontak/i.test(l))
    : undefined
  const closing = mk('closing', {
    title: lastSec?.heading && /penutup|kesimpulan|terima kasih|penutup/i.test(lastSec.heading) ? titleCase(lastSec.heading) : 'Terima Kasih',
    subtitle: '',
    note: `Sebagai penutup, saya menyampaikan ${closingBulletsRaw.length || 3} hal secara lisan: capaian yang ingin kita kunci, risiko yang kita waspadai, dan permintaan dukungan spesifik kepada forum. Slide hanya menampilkan arah besarnya — keputusan yang saya mohon ada pada penjelasan lisan saya sekarang. Terima kasih.`,
    message: closingLine ? closingLine.replace(/^#+\s*/, '').slice(0, 110) : 'Terima kasih — diskusi dan arahan lebih lanjut kami nantikan.',
    bullets: (closingBulletsRaw.length ? closingBulletsRaw : ['Tindak lanjut akan ditetapkan bersama']).slice(0, 3).map((b) => b.replace(/\[[^\]]*\]/g, '').slice(0, 48)),
    contact: (() => {
      const src = lastSec?.lines ?? sections[sections.length - 1]?.lines ?? []
      const k = src.map((l) => l.trim()).find((l) => /^kontak\s*:/i.test(l))
      return k ? k.split(/[:：]/).slice(1).join(':').trim().slice(0, 60) : `${division} · ${org}`
    })(),
  } as Partial<DeckSlide>)

  const slides: DeckSlide[] = [cover]
  if (kpiPairs.length) slides.push(kpiSlide)
  slides.push(...capped)
  // jaga batas maksimum total
  const maxTotal = MAX_SLIDES - 1
  while (slides.length > maxTotal) slides.pop()
  slides.push(closing)

  return { identity, slides }
}
