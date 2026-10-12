/**
 * file-parser.server.ts — Universal file → plain-text parser (SERVER ONLY).
 *
 * Mengubah berbagai jenis file sumber (teks, PDF, Office, OpenDocument,
 * presentasi, RTF, HTML, dll.) menjadi teks biasa untuk dikonsumsi AI/deck.
 *
 * PENTING:
 * - File ini SERVER-ONLY. Jangan pernah meng-import modul ini di client.
 * - Tidak menggunakan z-ai-web-dev-sdk.
 * - Semua handler dibungkus try/catch — modul ini TIDAK pernah melempar
 *   error ke pemanggil; kegagalan dilaporkan lewat `ok: false` + `warning`.
 *
 * Nilai `kind` yang mungkin:
 *   "text" | "pdf" | "docx" | "doc" | "spreadsheet" | "pptx" | "ppt" |
 *   "odt" | "html" | "rtf" | "binary-unsupported"
 */

import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { extractText, getDocumentProxy } from 'unpdf'
import mammothUntyped from 'mammoth'
import WordExtractorUntyped from 'word-extractor'

// ---------------------------------------------------------------------------
// Tipe & konstanta publik
// ---------------------------------------------------------------------------

/** Nilai yang mungkin untuk `ParsedFile.kind`. */
export type ParsedFileKind =
  | 'text'
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'spreadsheet'
  | 'pptx'
  | 'ppt'
  | 'odt'
  | 'html'
  | 'rtf'
  | 'binary-unsupported'

export interface ParsedFile {
  ok: boolean
  /** Teks hasil ekstraksi (boleh multi-baris). Kosong bila ok=false. */
  text: string
  /** Jenis ekstraksi, lihat `ParsedFileKind`. */
  kind: string
  name: string
  size: number
  /** Catatan untuk user (format lama, PDF hasil scan, error, dsb.). */
  warning?: string
}

export interface SupportedFormatGroup {
  group: string
  items: string[]
}

/** Batas ukuran file upload (20 MB). */
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024

/** String untuk attribute `accept` pada <input type="file">. */
export const SUPPORTED_UPLOAD_ACCEPT =
  '.txt,.md,.markdown,.csv,.tsv,.json,.log,.xml,.yaml,.yml,.ini,.env,.tex,.srt,.vtt,.sql,.sh,.py,.js,.ts,.css,.html,.htm,.rtf,.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.ods,.ppt,.pptx,.odt,.msg,.eml,.ics,.vcf'

/** Ringkasan format yang didukung, untuk ditampilkan di UI. */
export const SUPPORTED_FORMATS_LABEL: SupportedFormatGroup[] = [
  { group: 'Teks & Data', items: ['TXT', 'MD', 'CSV', 'TSV', 'JSON', 'LOG', 'XML', 'YAML'] },
  { group: 'Dokumen', items: ['PDF', 'DOC', 'DOCX', 'RTF', 'ODT', 'HTML'] },
  { group: 'Spreadsheet', items: ['XLSX', 'XLS', 'XLSM', 'ODS'] },
  { group: 'Presentasi', items: ['PPTX', 'PPT'] },
]

// ---------------------------------------------------------------------------
// Tipe util untuk lib pihak ketiga tanpa type definition yang baik
// ---------------------------------------------------------------------------

/** Bentuk minimal API `mammoth` (paket tanpa .d.ts). */
interface MammothApi {
  extractRawText(input: { buffer: Buffer }): Promise<{ value: string; messages: unknown[] }>
}

/** Bentuk minimal dokumen hasil `word-extractor` (paket tanpa .d.ts). */
interface WordExtractorDocument {
  getBody(): string
}

/** Bentuk minimal API `word-extractor` (paket tanpa .d.ts). */
interface WordExtractorApi {
  extract(input: Buffer | string): Promise<WordExtractorDocument>
}

const mammoth = mammothUntyped as unknown as MammothApi
const WordExtractor = WordExtractorUntyped as unknown as new () => WordExtractorApi

// ---------------------------------------------------------------------------
// Klasifikasi ekstensi
// ---------------------------------------------------------------------------

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'log', 'xml', 'yaml', 'yml',
  'ini', 'env', 'tex', 'srt', 'vtt', 'sql', 'sh', 'py', 'js', 'ts', 'css',
  // file email/kontak/kalender → diperlakukan sebagai teks
  'msg', 'eml', 'ics', 'vcf',
])
const HTML_EXTS = new Set(['html', 'htm'])
const RTF_EXTS = new Set(['rtf'])
const PDF_EXTS = new Set(['pdf'])
const DOCX_EXTS = new Set(['docx'])
const DOC_EXTS = new Set(['doc'])
const SPREADSHEET_EXTS = new Set(['xlsx', 'xlsm', 'xls', 'ods'])
const PPTX_EXTS = new Set(['pptx'])
const PPT_EXTS = new Set(['ppt'])
const ODT_EXTS = new Set(['odt'])

/** Ekstensi biner yang jelas-jelas tidak bisa diekstrak teksnya. */
const KNOWN_BINARY_EXTS = new Set([
  'zip', 'rar', '7z', 'gz', 'tgz', 'bz2', 'xz', 'tar',
  'exe', 'dll', 'so', 'dylib', 'bin', 'dat', 'dmg', 'iso', 'img', 'apk', 'jar',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tif', 'tiff',
  'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv',
  'psd', 'sketch', 'fig', 'db', 'sqlite', 'mdb', 'accdb',
  'woff', 'woff2', 'ttf', 'otf', 'eot', 'class',
])

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0 || dot === fileName.length - 1) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

function kindForExtension(ext: string): ParsedFileKind {
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (DOCX_EXTS.has(ext)) return 'docx'
  if (DOC_EXTS.has(ext)) return 'doc'
  if (SPREADSHEET_EXTS.has(ext)) return 'spreadsheet'
  if (PPTX_EXTS.has(ext)) return 'pptx'
  if (PPT_EXTS.has(ext)) return 'ppt'
  if (ODT_EXTS.has(ext)) return 'odt'
  if (HTML_EXTS.has(ext)) return 'html'
  if (RTF_EXTS.has(ext)) return 'rtf'
  return 'text'
}

// ---------------------------------------------------------------------------
// Helper umum teks
// ---------------------------------------------------------------------------

/** Normalisasi teks: CRLF → LF, buang null byte, rapikan baris kosong. */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Decode buffer menjadi string. Utamakan UTF-8; bila banyak karakter rusak
 * (U+FFFD) coba latin1; dukung BOM UTF-16 LE/BE.
 */
function decodeTextBuffer(buffer: Buffer): string {
  if (
    buffer.length >= 2 &&
    ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff))
  ) {
    return buffer.subarray(2).toString('utf16le').split('\u0000').join('')
  }

  let buf = buffer
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3) // BOM UTF-8
  }

  const utf8 = buf.toString('utf8')
  const bad = countSuspiciousChars(utf8)
  if (bad > 0 && bad / Math.max(utf8.length, 1) > 0.005) {
    const latin1 = buf.toString('latin1')
    if (countSuspiciousChars(latin1) < bad) return latin1
  }
  return utf8
}

/** Rasio karakter "mencurigakan" (control char & U+FFFD) dalam teks. */
function countSuspiciousChars(text: string): number {
  let bad = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code === 0xfffd) bad++
    else if (code < 32 && code !== 9 && code !== 10 && code !== 13) bad++
    else if (code === 127) bad++
  }
  return bad
}

function suspiciousCharRatio(text: string): number {
  if (!text.length) return 1
  return countSuspiciousChars(text) / text.length
}

/** Decode XML/HTML entity dasar + bentuk numerik. `&amp;` diproses terakhir. */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function prettifyJson(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return raw // bukan JSON valid — kembalikan apa adanya
  }
}

// ---------------------------------------------------------------------------
// Handler: HTML
// ---------------------------------------------------------------------------

function htmlToText(html: string): string {
  let t = html
  t = t.replace(/<!--[\s\S]*?-->/g, ' ')
  t = t.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
  t = t.replace(/<br\s*\/?>/gi, '\n')
  // sel tabel diberi pemisah agar tabel masih terbaca
  t = t.replace(/<\/t[dh]\s*>/gi, ' | ')
  // tag blok → newline
  t = t.replace(
    /<\/?(p|div|li|tr|table|thead|tbody|ul|ol|dl|h[1-6]|blockquote|pre|section|article|header|footer|main|nav|aside|form|hr)\b[^>]*>/gi,
    '\n',
  )
  // sisa tag
  t = t.replace(/<[^>]+>/g, '')
  t = decodeEntities(t)
  t = t
    .split('\n')
    .map((line) =>
      line
        .replace(/[ \t]+/g, ' ')
        .trim()
        .replace(/\s*\|\s*$/, ''), // buang pemisah sel menggantung di akhir baris
    )
    .join('\n')
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

// ---------------------------------------------------------------------------
// Handler: RTF
// ---------------------------------------------------------------------------

/** Grup RTF yang isinya metadata/formatting — dibuang seluruhnya. */
const RTF_DROP_GROUPS = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'listtable', 'listoverridetable',
  'revtbl', 'rsidtbl', 'themedata', 'latentstyles', 'datastore', 'xmlnstbl',
  'generator', 'info', 'pict', 'object', 'header', 'footer', 'footnote',
  'pntext', 'panose', 'colorschememapping',
])

/**
 * Buang grup RTF tertentu dengan penghitungan kurung seimbang.
 * Grup RTF bisa bersarang, jadi diproses dengan stack: sekali berada di
 * dalam grup yang dibuang, SELURUH sub-grup di dalamnya ikut dibuang.
 * Grup `{\*...}` (destination khusus) juga selalu dibuang.
 */
function stripRtfGroups(input: string): string {
  const out: string[] = []
  const dropStack: boolean[] = []
  let i = 0
  const n = input.length
  while (i < n) {
    const c = input[i]
    const dropping = dropStack[dropStack.length - 1] ?? false
    if (c === '{') {
      const head = input.slice(i, Math.min(i + 40, n))
      const isStarGroup = /^\{\\\*/.test(head)
      const kwMatch = /^\{\\([a-zA-Z]+)/.exec(head)
      const dropSelf =
        isStarGroup ||
        (kwMatch !== null && RTF_DROP_GROUPS.has(kwMatch[1].toLowerCase()))
      dropStack.push(dropSelf || dropping)
      i++
      continue
    }
    if (c === '}') {
      dropStack.pop()
      i++
      continue
    }
    if (c === '\\') {
      // karakter berpasangan dengan backslash (\{ \} \\ \' \p ...) — jaga pasangan
      if (!dropping) out.push(c, input[i + 1] ?? '')
      i += 2
      continue
    }
    if (!dropping) out.push(c)
    i++
  }
  return out.join('')
}

function rtfToText(raw: string): string {
  let t = stripRtfGroups(raw)

  // escape unicode \uN (N bisa negatif) diikuti karakter substitusi opsional
  t = t.replace(/\\u(-?\d+)\s?\??/g, (_m, n: string) => {
    const code = ((parseInt(n, 10) % 65536) + 65536) % 65536
    return String.fromCharCode(code)
  })

  // penanda baris → newline
  t = t.replace(/\\(par|line|sect|page)\b/g, '\n')

  // hex byte latin-1 \'xx
  t = t.replace(/\\'([0-9a-fA-F]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16)))

  // simbol kontrol tanpa teks
  t = t.replace(/\\~/g, ' ') // non-breaking space
  t = t.replace(/\\[-|_*]/g, '')

  // control word umum (\rtf1, \ansi, \f0, \fs24, ...)
  t = t.replace(/\\[a-zA-Z]+-?\d* ?/g, '')

  // escape \{ \} \\
  t = t.replace(/\\([{}\\])/g, '$1')

  // sisa kurung grup yang tersisa
  t = t.replace(/[{}]/g, '')

  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

// ---------------------------------------------------------------------------
// Handler: PDF (via unpdf — aman untuk serverless)
// ---------------------------------------------------------------------------

async function pdfToText(buffer: Buffer): Promise<{ text: string; warning?: string }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  // mergePages:true → string; guard runtime untuk kasus array
  const raw = typeof text === 'string' ? text : (text as string[]).join('\n')
  const visible = raw.replace(/\s/g, '')
  let warning: string | undefined
  if (visible.length < 20) {
    warning =
      'PDF kemungkinan hasil scan/gambar — teks tidak bisa diekstrak (perlu OCR). Coba gunakan PDF berbasis teks atau salin-tempel isinya.'
  }
  return { text: normalizeText(raw), warning }
}

// ---------------------------------------------------------------------------
// Handler: DOCX (via mammoth) & DOC legacy (via word-extractor)
// ---------------------------------------------------------------------------

async function docxToText(buffer: Buffer): Promise<{ text: string; warning?: string }> {
  const { value } = await mammoth.extractRawText({ buffer })
  return { text: normalizeText(value) }
}

async function docToText(buffer: Buffer): Promise<{ text: string; warning?: string }> {
  const extractor = new WordExtractor()
  const doc = await extractor.extract(buffer)
  const body = doc.getBody()
  const warning =
    'Format .doc legacy (Word 97-2003): hasil ekstraksi bisa tidak sempurna. Untuk hasil terbaik, simpan ulang sebagai .docx.'
  return { text: normalizeText(body), warning }
}

// ---------------------------------------------------------------------------
// Handler: Spreadsheet (.xlsx .xlsm .xls .ods) via SheetJS
// ---------------------------------------------------------------------------

const MAX_ROWS_PER_SHEET = 500
const MAX_COLS_PER_ROW = 40

/** Batasi range sheet agar sheet raksasa tidak dikonversi penuh. */
function capWorksheet(ws: XLSX.WorkSheet): XLSX.WorkSheet {
  const ref = ws['!ref']
  if (typeof ref !== 'string') return ws
  try {
    const range = XLSX.utils.decode_range(ref)
    if (range.e.r - range.s.r + 1 <= MAX_ROWS_PER_SHEET) return ws
    const capped: XLSX.WorkSheet = {
      ...ws,
      '!ref': XLSX.utils.encode_range({
        s: range.s,
        e: { r: range.s.r + MAX_ROWS_PER_SHEET - 1, c: range.e.c },
      }),
    }
    return capped
  } catch {
    return ws
  }
}

function spreadsheetToText(buffer: Buffer): { text: string; warning?: string } {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []
  const warnings: string[] = []

  for (const sheetName of wb.SheetNames) {
    const original = wb.Sheets[sheetName]
    if (!original) continue

    const ws = capWorksheet(original)
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: '',
    })

    // total baris dari range asli (bukan hasil cap) untuk catatan pemotongan
    let totalRows = rows.length
    const origRef = original['!ref']
    if (typeof origRef === 'string') {
      try {
        const r = XLSX.utils.decode_range(origRef)
        totalRows = r.e.r - r.s.r + 1
      } catch {
        /* biarkan totalRows dari rows.length */
      }
    }

    parts.push(`## Sheet: ${sheetName}`)
    for (const row of rows) {
      const cells = (Array.isArray(row) ? row : []).map((c) =>
        c === null || c === undefined ? '' : String(c).trim(),
      )
      let line = cells.join(' | ')
      if (cells.length > MAX_COLS_PER_ROW) {
        line = cells.slice(0, MAX_COLS_PER_ROW).join(' | ')
        line += ` | … (+${cells.length - MAX_COLS_PER_ROW} kolom lagi)`
      }
      if (!line.replace(/\|/g, '').trim()) continue // lewati baris kosong
      parts.push(line)
    }
    const hiddenRows = Math.max(0, totalRows - MAX_ROWS_PER_SHEET)
    if (hiddenRows > 0) {
      parts.push(`… (${hiddenRows} baris lagi)`)
      warnings.push(`Sheet "${sheetName}" dipotong di ${MAX_ROWS_PER_SHEET} baris pertama.`)
    }
    parts.push('')
  }

  return { text: parts.join('\n').trim(), warning: warnings.join(' ') || undefined }
}

// ---------------------------------------------------------------------------
// Handler: PPTX (via JSZip) & PPT legacy (ekstraksi kasar)
// ---------------------------------------------------------------------------

/** Ekstrak isi semua elemen <a:t>...</a:t> dari XML slide. */
function extractAText(xml: string): string[] {
  const out: string[] = []
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const t = decodeEntities(m[1]).replace(/\s+/g, ' ').trim()
    if (t) out.push(t)
  }
  return out
}

async function pptxToText(buffer: Buffer): Promise<{ text: string; warning?: string }> {
  const zip = await JSZip.loadAsync(buffer)

  // kumpulkan slide, urut ANGKA (slide10 setelah slide9)
  const slides = Object.keys(zip.files)
    .map((path) => {
      const m = /^ppt\/slides\/slide(\d+)\.xml$/i.exec(path)
      return m ? { path, num: parseInt(m[1], 10) } : null
    })
    .filter((x): x is { path: string; num: number } => x !== null)
    .sort((a, b) => a.num - b.num)

  // catatan pembicara per nomor slide
  const notesMap = new Map<number, string>()
  for (const path of Object.keys(zip.files)) {
    const m = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i.exec(path)
    if (!m) continue
    const xml = await zip.files[path].async('string')
    const joined = extractAText(xml).join(' ').trim()
    if (joined) notesMap.set(parseInt(m[1], 10), joined)
  }

  const parts: string[] = []
  for (const slide of slides) {
    const xml = await zip.files[slide.path].async('string')
    const texts = extractAText(xml)
    const notes = notesMap.get(slide.num)
    if (texts.length === 0 && !notes) continue // lewati slide kosong
    parts.push(`## Slide ${slide.num}`)
    for (const t of texts) parts.push(`- ${t}`)
    if (notes) parts.push(`Catatan: ${notes}`)
    parts.push('')
  }

  if (slides.length === 0) {
    throw new Error('Tidak menemukan slide PPTX di dalam file (bukan file .pptx valid?)')
  }

  return { text: parts.join('\n').trim() }
}

function pptLegacyToText(buffer: Buffer): { text: string; warning?: string; ok: boolean } {
  const raw = buffer.toString('latin1')
  const runs = raw.match(/[\x20-\x7e\u00a0-\uffff]{4,}/g) ?? []
  const kept = runs
    .filter((run) => /[a-zA-Z\u00c0-\u00ff]/.test(run))
    .filter((run) => !/^[0-9 .,;:()\-_/\\[\]{}=+*&^%$#@!~`'"<>?|]+$/.test(run))

  const text = normalizeText(kept.join('\n'))
  if (text.replace(/\s/g, '').length < 30) {
    return {
      ok: false,
      text: '',
      warning:
        'Tidak dapat mengekstrak teks dari file .ppt legacy (kemungkinan berisi gambar saja atau format tidak dikenali). Konversi ke .pptx terlebih dahulu.',
    }
  }
  return {
    ok: true,
    text,
    warning:
      'Format .ppt legacy: ekstraksi kasar, mungkin tidak lengkap. Untuk hasil terbaik konversi ke .pptx.',
  }
}

// ---------------------------------------------------------------------------
// Handler: ODT (OpenDocument Text via JSZip)
// ---------------------------------------------------------------------------

async function odtToText(buffer: Buffer): Promise<{ text: string; warning?: string }> {
  const zip = await JSZip.loadAsync(buffer)
  const entry = zip.files['content.xml']
  if (!entry) {
    throw new Error('content.xml tidak ditemukan (bukan file .odt valid?)')
  }
  const xml = await entry.async('string')
  let t = xml
  t = t.replace(/<text:(p|h)\b[^>]*\/>/g, '\n') // elemen kosong
  t = t.replace(/<\/text:(p|h)>/g, '\n')
  t = t.replace(/<text:line-break\b[^>]*\/>/g, '\n')
  t = t.replace(/<text:tab\b[^>]*\/>/g, '\t')
  t = t.replace(/<[^>]+>/g, ' ')
  t = decodeEntities(t)
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
  return { text: t.replace(/\n{3,}/g, '\n\n').trim() }
}

// ---------------------------------------------------------------------------
// Orkestrasi utama
// ---------------------------------------------------------------------------

function unsupportedMessage(ext: string): string {
  return `Format ${ext ? `.${ext}` : 'file ini'} belum didukung ekstraksi teksnya. Konversi ke PDF/DOCX/TXT atau salin-tempel teksnya.`
}

/**
 * Parser universal: file apa pun → teks biasa.
 * TIDAK pernah melempar error; kegagalan dikembalikan sebagai ok:false.
 */
export async function parseFileToText(
  fileName: string,
  buffer: Buffer,
  mimeType?: string,
): Promise<ParsedFile> {
  const name = fileName && fileName.trim() ? fileName.trim() : 'tanpa-nama'
  const ext = getExtension(name)
  const size = buffer.length
  const kind = kindForExtension(ext)

  if (size === 0) {
    return {
      ok: false,
      text: '',
      kind,
      name,
      size,
      warning: 'File kosong (0 byte). Periksa kembali file yang diunggah.',
    }
  }

  try {
    // --- Teks biasa (.txt .md .csv .json .log .xml .yaml .eml .vcf dst.) ---
    if (TEXT_EXTS.has(ext)) {
      const raw = decodeTextBuffer(buffer)
      const text = ext === 'json' ? prettifyJson(raw) : normalizeText(raw)
      return { ok: true, text, kind: 'text', name, size }
    }

    // --- HTML (.html .htm) ---
    if (HTML_EXTS.has(ext)) {
      const raw = decodeTextBuffer(buffer)
      return { ok: true, text: htmlToText(raw), kind: 'html', name, size }
    }

    // --- RTF ---
    if (RTF_EXTS.has(ext)) {
      const raw = decodeTextBuffer(buffer)
      return { ok: true, text: rtfToText(raw), kind: 'rtf', name, size }
    }

    // --- PDF ---
    if (PDF_EXTS.has(ext)) {
      const { text, warning } = await pdfToText(buffer)
      return { ok: true, text, kind: 'pdf', name, size, warning }
    }

    // --- DOCX ---
    if (DOCX_EXTS.has(ext)) {
      const { text, warning } = await docxToText(buffer)
      return { ok: true, text, kind: 'docx', name, size, warning }
    }

    // --- DOC legacy ---
    if (DOC_EXTS.has(ext)) {
      const { text, warning } = await docToText(buffer)
      return { ok: true, text, kind: 'doc', name, size, warning }
    }

    // --- Spreadsheet (.xlsx .xlsm .xls .ods) ---
    if (SPREADSHEET_EXTS.has(ext)) {
      const { text, warning } = spreadsheetToText(buffer)
      return { ok: true, text, kind: 'spreadsheet', name, size, warning }
    }

    // --- PPTX ---
    if (PPTX_EXTS.has(ext)) {
      const { text, warning } = await pptxToText(buffer)
      return { ok: true, text, kind: 'pptx', name, size, warning }
    }

    // --- PPT legacy (ekstraksi kasar) ---
    if (PPT_EXTS.has(ext)) {
      const result = pptLegacyToText(buffer)
      return {
        ok: result.ok,
        text: result.text,
        kind: 'ppt',
        name,
        size,
        warning: result.warning,
      }
    }

    // --- ODT ---
    if (ODT_EXTS.has(ext)) {
      const { text, warning } = await odtToText(buffer)
      return { ok: true, text, kind: 'odt', name, size, warning }
    }

    // --- Biner yang jelas-jelas tidak didukung ---
    if (KNOWN_BINARY_EXTS.has(ext)) {
      return {
        ok: false,
        text: '',
        kind: 'binary-unsupported',
        name,
        size,
        warning: unsupportedMessage(ext),
      }
    }

    // --- Fallback pintar untuk ekstensi tak dikenal ---
    const mime = (mimeType ?? '').toLowerCase()
    const mimeLooksTextual =
      mime.startsWith('text/') ||
      mime.includes('json') ||
      mime.includes('xml') ||
      mime.includes('csv') ||
      mime.includes('javascript')

    const raw = decodeTextBuffer(buffer)
    if (mimeLooksTextual || suspiciousCharRatio(raw) < 0.05) {
      if (raw.trim().length > 0) {
        return { ok: true, text: normalizeText(raw), kind: 'text', name, size }
      }
    }

    return {
      ok: false,
      text: '',
      kind: 'binary-unsupported',
      name,
      size,
      warning: unsupportedMessage(ext),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      text: '',
      kind,
      name,
      size,
      warning: `Gagal membaca file${ext ? ` .${ext}` : ''}: ${message}. Coba konversi ke PDF/DOCX/TXT atau salin-tempel teksnya.`,
    }
  }
}
