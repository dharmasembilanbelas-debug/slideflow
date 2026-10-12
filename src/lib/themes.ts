// ─── Sistem Tema SlideFlow ──────────────────────────────────────────────
// 4 lapis gaya yang bisa dikombinasikan user:
//   1. DesignTemplate — "gaya desain" : motif, radius, bayangan, background
//   2. FontTheme      — "tema font"   : pasangan font judul & isi (Google Fonts)
//   3. ColorTheme     — "tema warna"  : palet lengkap + warna irisan chart
//   4. AnimPreset     — "gaya animasi": transisi slide, judul, count-up
// Semua dirender via CSS variables → deck HTML & preview otomatis mengikuti.

// ---------- util warna ----------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function clamp(n: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
}
/** Campur dua warna heks. t=0 → a, t=1 → b */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
/** rgba() string dari heks */
export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

// ---------- 1 · Tema warna ----------
export interface ColorTheme {
  id: string
  name: string
  hint: string
  /** warna primer (menggantikan teal) */
  teal: string
  tealD: string
  tealHi: string
  tealS: string
  /** warna aksen (menggantikan oranye) */
  org: string
  orgS: string
  orgDeep: string
  ink: string
  inkS: string
  paper: string
  /** aksen terang di atas latar gelap */
  mint: string
  /** pendar latar gelap */
  coverGlow: string
  /** 6 warna irisan donat / legenda / corong */
  slices: string[]
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'lagoon',
    name: 'Lagoon',
    hint: 'Teal & oranye cerah — segar, energik (bawaan)',
    teal: '#00A896', tealD: '#00807A', tealHi: '#2BD9C7', tealS: '#D6F7F1',
    org: '#FF8A2B', orgS: '#FFE9D5', orgDeep: '#C25A0A',
    ink: '#12333A', inkS: '#2A4A50', paper: '#F6FBFA',
    mint: '#4ADBC8', coverGlow: '#BFF0E8',
    slices: ['#00A896', '#FF8A2B', '#FFC53D', '#2BD9C7', '#FF6B8A', '#0B6B75'],
  },
  {
    id: 'ember',
    name: 'Ember',
    hint: 'Merah bara & amber cerah — tegas, berani',
    teal: '#F4532E', tealD: '#D13A1B', tealHi: '#FF8A5C', tealS: '#FFE4D9',
    org: '#FFB020', orgS: '#FFF0CE', orgDeep: '#C07A08',
    ink: '#33150E', inkS: '#54322A', paper: '#FFF9F5',
    mint: '#FFB59A', coverGlow: '#FFE0C4',
    slices: ['#F4532E', '#FFB020', '#FFC53D', '#FF8A5C', '#E8455F', '#7A2E1D'],
  },
  {
    id: 'forest',
    name: 'Forest',
    hint: 'Hijau daun & emas cerah — segar, terpercaya',
    teal: '#1FAE5F', tealD: '#128A4A', tealHi: '#4EDD8E', tealS: '#DCF7E7',
    org: '#F5B82E', orgS: '#FDF2D2', orgDeep: '#B7810E',
    ink: '#0F2E1E', inkS: '#2E4A3A', paper: '#F5FBF7',
    mint: '#7FE0AE', coverGlow: '#CFF2DD',
    slices: ['#1FAE5F', '#F5B82E', '#00B4A0', '#4EDD8E', '#FF8A5C', '#147A46'],
  },
  {
    id: 'noir',
    name: 'Noir Gold',
    hint: 'Emas antik & terracotta — berkelas namun cerah',
    teal: '#C99A2E', tealD: '#A87B16', tealHi: '#E8BC55', tealS: '#FBEFD4',
    org: '#E85D3A', orgS: '#FCE4DB', orgDeep: '#B03A1E',
    ink: '#2B2013', inkS: '#4A3C28', paper: '#FDF9F0',
    mint: '#F0D48A', coverGlow: '#FBEFD4',
    slices: ['#C99A2E', '#E85D3A', '#E8BC55', '#B03A1E', '#F0D48A', '#6B5230'],
  },
  {
    id: 'plum',
    name: 'Plum',
    hint: 'Ungu & pink cerah — kreatif, playful',
    teal: '#9D4EDD', tealD: '#7B2FBF', tealHi: '#C575F2', tealS: '#F1E3FB',
    org: '#FF5C8D', orgS: '#FFE1EB', orgDeep: '#C22E62',
    ink: '#2A1233', inkS: '#483052', paper: '#FCF7FD',
    mint: '#D9A8F5', coverGlow: '#EDD9FB',
    slices: ['#9D4EDD', '#FF5C8D', '#FFB020', '#C575F2', '#00C2A8', '#5E2B7A'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    hint: 'Koral & mangga cerah — hangat, ramah',
    teal: '#FF6B42', tealD: '#E04E26', tealHi: '#FF9A70', tealS: '#FFE3D6',
    org: '#FFC53D', orgS: '#FFF2CE', orgDeep: '#C2870E',
    ink: '#33201A', inkS: '#563C32', paper: '#FFF8F3',
    mint: '#FFB59E', coverGlow: '#FFE8D9',
    slices: ['#FF6B42', '#FFC53D', '#E8455F', '#FF9A70', '#00B4A0', '#8A4A32'],
  },
  {
    id: 'electric',
    name: 'Electric',
    hint: 'Biru elektrik & cyan cerah — modern, futuristik (Panduan Corporate)',
    teal: '#2563EB', tealD: '#1D4ED8', tealHi: '#5BA9F9', tealS: '#DCEBFE',
    org: '#00B8D9', orgS: '#D2F5FB', orgDeep: '#008CA8',
    ink: '#101B33', inkS: '#2A3A55', paper: '#F7FAFE',
    mint: '#35E0E8', coverGlow: '#D2EDFE',
    slices: ['#2563EB', '#00B8D9', '#FFB020', '#5BA9F9', '#E8455F', '#153E8A'],
  },
]

// ---------- 2 · Tema font ----------
export interface FontTheme {
  id: string
  name: string
  tagline: string
  /** CSS font-family untuk judul */
  head: string
  /** CSS font-family untuk isi */
  body: string
  /** query param families untuk Google Fonts */
  google: string
}

export const FONT_THEMES: FontTheme[] = [
  {
    id: 'exo-mont',
    name: 'Exo 2 · Montserrat',
    tagline: 'Futuristik & tegas (bawaan)',
    head: "'Exo 2','Montserrat',sans-serif",
    body: "'Montserrat',system-ui,Segoe UI,Arial,sans-serif",
    google: 'Exo+2:wght@500;700;800;900&family=Montserrat:wght@400;500;600;700;800',
  },
  {
    id: 'playfair-lato',
    name: 'Playfair · Lato',
    tagline: 'Elegan & klasik',
    head: "'Playfair Display',Georgia,serif",
    body: "'Lato',system-ui,sans-serif",
    google: 'Playfair+Display:wght@700;800;900&family=Lato:wght@400;700',
  },
  {
    id: 'space-inter',
    name: 'Space Grotesk · Inter',
    tagline: 'Modern & bersih',
    head: "'Space Grotesk',system-ui,sans-serif",
    body: "'Inter',system-ui,sans-serif",
    google: 'Space+Grotesk:wght@500;700&family=Inter:wght@400;500;700',
  },
  {
    id: 'dm-editorial',
    name: 'DM Serif · DM Sans',
    tagline: 'Editorial & berkelas',
    head: "'DM Serif Display',Georgia,serif",
    body: "'DM Sans',system-ui,sans-serif",
    google: 'DM+Serif+Display&family=DM+Sans:wght@400;500;700',
  },
  {
    id: 'archivo-sora',
    name: 'Archivo · Sora',
    tagline: 'Kokoh & futuristik',
    head: "'Archivo',system-ui,sans-serif",
    body: "'Sora',system-ui,sans-serif",
    google: 'Archivo:wght@600;800;900&family=Sora:wght@400;600;700',
  },
]

// ---------- 3 · Template gaya desain ----------
export interface DesignTemplate {
  id: string
  name: string
  tagline: string
  /** motif dekoratif di slide */
  decor:
    | 'orbs' | 'blobs' | 'rings' | 'dots' | 'grid'
    | 'glass' | 'beams' | 'pop' | 'lines' | 'glow' | 'typo' | 'pulse'
  /** motif panel samping pada slide sampul */
  coverBand:
    | 'seam' | 'stack' | 'block' | 'arch' | 'outline'
    | 'bento' | 'cinema' | 'sticker' | 'folio' | 'panel' | 'giant' | 'holo'
  radius: string
  radiusS: string
  /** nilai box-shadow kartu (boleh memakai var(--inkA*)) */
  shadow: string
  /** border kartu, mis. 'none' atau '1.5px solid var(--line)' */
  cardBorder: string
}

export const TEMPLATES: DesignTemplate[] = [
  {
    id: 'motion',
    name: 'Motion Studio',
    tagline: 'Seam miring & orb paralaks — hidup, sinematik (bawaan)',
    decor: 'orbs', coverBand: 'seam',
    radius: '20px', radiusS: '16px',
    shadow: '0 10px 28px var(--inkA08)', cardBorder: 'none',
  },
  {
    id: 'soft',
    name: 'Soft Cards',
    tagline: 'Kartu lembut & blob organik — ramah, hangat',
    decor: 'blobs', coverBand: 'stack',
    radius: '28px', radiusS: '22px',
    shadow: '0 16px 40px var(--inkA10)', cardBorder: 'none',
  },
  {
    id: 'grid',
    name: 'Neo Grid',
    tagline: 'Garis grid & blok tegas — teknis, presisi',
    decor: 'grid', coverBand: 'block',
    radius: '10px', radiusS: '6px',
    shadow: '0 8px 22px var(--inkA08)', cardBorder: '1.5px solid var(--line)',
  },
  {
    id: 'aurora',
    name: 'Aurora Glow',
    tagline: 'Cincin cahaya & gradasi berpendar — elegan, futuristik',
    decor: 'rings', coverBand: 'arch',
    radius: '22px', radiusS: '16px',
    shadow: '0 14px 44px var(--tealA16)', cardBorder: 'none',
  },
  {
    id: 'inkpaper',
    name: 'Ink & Paper',
    tagline: 'Halftone & bayangan offset — brutalist, berani',
    decor: 'dots', coverBand: 'outline',
    radius: '4px', radiusS: '2px',
    shadow: '6px 6px 0 var(--inkA85)', cardBorder: '2px solid var(--ink)',
  },
  // ── 7 gaya dari "Panduan Desain & Animasi Presentasi HTML Corporate" ──
  {
    id: 'bento',
    name: 'Bento Glassmorphism',
    tagline: 'Kartu kaca blur & modul bento — fungsi produk (Panduan #1)',
    decor: 'glass', coverBand: 'bento',
    radius: '20px', radiusS: '16px',
    shadow: '0 12px 32px var(--inkA14)', cardBorder: '1px solid var(--line)',
  },
  {
    id: 'scroll',
    name: 'Cinematic Parallax',
    tagline: 'Layar sinematik & balok cahaya — narasi, laporan tahunan (Panduan #2)',
    decor: 'beams', coverBand: 'cinema',
    radius: '14px', radiusS: '10px',
    shadow: '0 18px 48px var(--inkA14)', cardBorder: 'none',
  },
  {
    id: 'brutal',
    name: 'Neo-Brutalism',
    tagline: 'Blok tegas & bayangan offset elastis — kampanye kreatif (Panduan #3)',
    decor: 'pop', coverBand: 'sticker',
    radius: '12px', radiusS: '8px',
    shadow: '8px 8px 0 var(--ink)', cardBorder: '3px solid var(--ink)',
  },
  {
    id: 'editorial',
    name: 'Editorial Minimalis',
    tagline: 'Tipografi dominan & garis halus — kepemimpinan, akademik (Panduan #4)',
    decor: 'lines', coverBand: 'folio',
    radius: '2px', radiusS: '2px',
    shadow: '0 6px 18px var(--inkA08)', cardBorder: '1px solid var(--line)',
  },
  {
    id: 'data3d',
    name: 'Data Glow 3D',
    tagline: 'Grafik berpendar & fokus data — keuangan, kinerja (Panduan #5)',
    decor: 'glow', coverBand: 'panel',
    radius: '14px', radiusS: '10px',
    shadow: '0 12px 40px var(--tealA25)', cardBorder: '1px solid var(--tealA45)',
  },
  {
    id: 'kinetic',
    name: 'Kinetic Typographic',
    tagline: 'Tipografi raksasa berlapis & kedalaman 3D — visi, strategi (Panduan #6)',
    decor: 'typo', coverBand: 'giant',
    radius: '18px', radiusS: '14px',
    shadow: '0 14px 40px var(--inkA10)', cardBorder: 'none',
  },
  {
    id: 'holo',
    name: 'Holographic Timeline',
    tagline: 'Jalur cahaya & orb kaca — roadmap, alur operasional (Panduan #7)',
    decor: 'pulse', coverBand: 'holo',
    radius: '24px', radiusS: '18px',
    shadow: '0 14px 44px var(--tealA16)', cardBorder: '1px solid var(--mintA50)',
  },
]

// ---------- 4 · Preset animasi ----------
export interface AnimPreset {
  id: string
  name: string
  tagline: string
  /** sapuan garis seam antar slide */
  seam: boolean
  ease: string
  sdur: string
  countDur: number
  /** jeda per huruf judul (detik) */
  charDelay: number
}

export const ANIM_PRESETS: AnimPreset[] = [
  {
    id: 'cinematic', name: 'Cinematic',
    tagline: 'Seam menyapu + judul flip per huruf (bawaan)',
    seam: true, ease: 'cubic-bezier(.65,0,.35,1)', sdur: '.55s', countDur: 1100, charDelay: 0.03,
  },
  {
    id: 'energetic', name: 'Energetic',
    tagline: 'Pantul springy, cepat & membesar',
    seam: true, ease: 'cubic-bezier(.34,1.56,.64,1)', sdur: '.42s', countDur: 850, charDelay: 0.022,
  },
  {
    id: 'smooth', name: 'Smooth',
    tagline: 'Geser lembut, mengalir tanpa sentakan',
    seam: false, ease: 'cubic-bezier(.22,1,.36,1)', sdur: '.6s', countDur: 1200, charDelay: 0.03,
  },
  {
    id: 'minimal', name: 'Minimal',
    tagline: 'Fade halus saja — tenang & fokus',
    seam: false, ease: 'cubic-bezier(.4,0,.2,1)', sdur: '.32s', countDur: 1400, charDelay: 0.04,
  },
]

// ---------- Pilihan kustom user ----------
export interface CustomColorInput {
  /** warna utama (menggantikan teal/primer) */
  primary: string
  /** warna aksen (menggantikan oranye) */
  accent: string
  /** warna tinta gelap untuk teks */
  ink: string
}

export const DEFAULT_CUSTOM_COLOR: CustomColorInput = {
  primary: '#0E8F8A',
  accent: '#FF7A2E',
  ink: '#132B30',
}

export interface CustomFontInput {
  /** nama keluarga font judul — sebaiknya tersedia di Google Fonts, mis. "Poppins" */
  head: string
  /** nama keluarga font isi, mis. "Nunito" */
  body: string
}

export const DEFAULT_CUSTOM_FONT: CustomFontInput = {
  head: 'Poppins',
  body: 'Nunito',
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** true bila string adalah warna hex valid (#rgb / #rrggbb) */
export function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v.trim())
}

function pickHex(v: unknown, fallback: string): string {
  return isHexColor(v) ? v.trim() : fallback
}

const FONT_NAME_RE = /^[A-Za-z0-9 _-]{1,40}$/

function sanitizeCustomFont(raw: unknown): CustomFontInput {
  const f = (raw ?? {}) as Record<string, unknown>
  const name = (v: unknown, fb: string) => {
    const s = typeof v === 'string' ? v.trim().slice(0, 40) : ''
    return FONT_NAME_RE.test(s) ? s : fb
  }
  return {
    head: name(f.head, DEFAULT_CUSTOM_FONT.head),
    body: name(f.body, DEFAULT_CUSTOM_FONT.body),
  }
}

/** Susun palet ColorTheme lengkap dari 3 warna kustom user (untuk resolver & pratinjau UI) */
export function deriveColor(inp: CustomColorInput): ColorTheme {
  const teal = isHexColor(inp.primary) ? inp.primary : DEFAULT_CUSTOM_COLOR.primary
  const org = isHexColor(inp.accent) ? inp.accent : DEFAULT_CUSTOM_COLOR.accent
  const ink = isHexColor(inp.ink) ? inp.ink : DEFAULT_CUSTOM_COLOR.ink
  return {
    id: 'custom',
    name: 'Kustom',
    hint: 'Palet kustom dari warna pilihan user',
    teal,
    tealD: mix(teal, '#000000', 0.28),
    tealHi: mix(teal, '#FFFFFF', 0.32),
    tealS: mix(teal, '#FFFFFF', 0.87),
    org,
    orgS: mix(org, '#FFFFFF', 0.86),
    orgDeep: mix(org, '#000000', 0.3),
    ink,
    inkS: mix(ink, '#FFFFFF', 0.32),
    paper: mix(ink, '#FFFFFF', 0.97),
    mint: mix(teal, '#FFFFFF', 0.52),
    coverGlow: mix(ink, teal, 0.42),
    slices: [
      teal, org, ink,
      mix(teal, '#FFFFFF', 0.34),
      mix(org, '#FFFFFF', 0.4),
      mix(ink, '#FFFFFF', 0.35),
    ],
  }
}

/** Susun FontTheme dari nama font kustom user */
function deriveFont(inp: CustomFontInput): FontTheme {
  const safe = sanitizeCustomFont(inp)
  const head = safe.head || DEFAULT_CUSTOM_FONT.head
  const body = safe.body || DEFAULT_CUSTOM_FONT.body
  const q = (n: string) => n.replace(/\s+/g, '+')
  return {
    id: 'custom',
    name: 'Kustom',
    tagline: 'Font pilihan user (dimuat dari Google Fonts)',
    head: `'${head}',system-ui,sans-serif`,
    body: `'${body}',system-ui,sans-serif`,
    google: `${q(head)}:wght@500;700;800;900&family=${q(body)}:wght@400;500;600;700`,
  }
}

// ---------- DeckStyle & resolver ----------
export interface DeckStyle {
  template: string
  font: string
  color: string
  anim: string
  /** warna latar slide terang — default putih (#FFFFFF) */
  bg: string
  /** dipakai saat color === 'custom' */
  customColor: CustomColorInput
  /** dipakai saat font === 'custom' */
  customFont: CustomFontInput
}

export const DEFAULT_STYLE: DeckStyle = {
  template: 'motion',
  font: 'exo-mont',
  color: 'lagoon',
  anim: 'cinematic',
  bg: '#FFFFFF',
  customColor: { ...DEFAULT_CUSTOM_COLOR },
  customFont: { ...DEFAULT_CUSTOM_FONT },
}

export interface ResolvedStyle {
  tpl: DesignTemplate
  font: FontTheme
  color: ColorTheme
  anim: AnimPreset
  /** warna latar slide terang pilihan user (default putih) */
  bg: string
}

const byId = <T extends { id: string }>(list: T[], id: string | undefined, fallback: T): T =>
  list.find((x) => x.id === id) ?? fallback

export function resolveStyle(style?: Partial<DeckStyle> | null): ResolvedStyle {
  const s = { ...DEFAULT_STYLE, ...(style ?? {}) }
  const color =
    s.color === 'custom'
      ? deriveColor({ ...DEFAULT_CUSTOM_COLOR, ...(s.customColor ?? {}) })
      : byId(COLOR_THEMES, s.color, COLOR_THEMES[0])
  const font =
    s.font === 'custom'
      ? deriveFont({ ...DEFAULT_CUSTOM_FONT, ...(s.customFont ?? {}) })
      : byId(FONT_THEMES, s.font, FONT_THEMES[0])
  return {
    tpl: byId(TEMPLATES, s.template, TEMPLATES[0]),
    font,
    color,
    anim: byId(ANIM_PRESETS, s.anim, ANIM_PRESETS[0]),
    bg: pickHex(s.bg, DEFAULT_STYLE.bg),
  }
}

/** Validasi style dari project JSON / localStorage — id tak dikenal diganti default */
export function sanitizeStyle(raw: unknown): DeckStyle {
  const r = (raw ?? {}) as Record<string, unknown>
  const pick = (v: unknown, list: string[], fb: string) =>
    typeof v === 'string' && list.includes(v) ? v : fb
  return {
    template: pick(r.template, TEMPLATES.map((t) => t.id), DEFAULT_STYLE.template),
    font: pick(r.font, [...FONT_THEMES.map((f) => f.id), 'custom'], DEFAULT_STYLE.font),
    color: pick(r.color, [...COLOR_THEMES.map((c) => c.id), 'custom'], DEFAULT_STYLE.color),
    anim: pick(r.anim, ANIM_PRESETS.map((a) => a.id), DEFAULT_STYLE.anim),
    bg: pickHex(r.bg, DEFAULT_STYLE.bg),
    customColor: sanitizeCustomColor(r.customColor),
    customFont: sanitizeCustomFont(r.customFont),
  }
}

function sanitizeCustomColor(raw: unknown): CustomColorInput {
  const c = (raw ?? {}) as Record<string, unknown>
  return {
    primary: pickHex(c.primary, DEFAULT_CUSTOM_COLOR.primary),
    accent: pickHex(c.accent, DEFAULT_CUSTOM_COLOR.accent),
    ink: pickHex(c.ink, DEFAULT_CUSTOM_COLOR.ink),
  }
}

// ---------- CSS variables ----------
const P = (s: string) => s // penanda agar mudah dibaca

/** Susun isi blok :root { … } untuk deck HTML / preview */
export function rootVarsCss(r: ResolvedStyle): string {
  const c = r.color
  const t = r.tpl

  const gray = P(mix(c.inkS, c.paper, 0.35))
  const mintSoft = mix(c.mint, '#FFFFFF', 0.22)
  const mintFaint = mix(c.mint, '#FFFFFF', 0.5)
  const mintPale = mix(c.mint, '#FFFFFF', 0.72)
  const line = mix(c.tealS, '#FFFFFF', 0.45)
  const zebra = mix(c.tealS, '#FFFFFF', 0.55)
  const dot = mix(c.mint, c.ink, 0.28)

  // wajah batang 3D
  const barFrontA = c.tealHi
  const barFrontB = c.tealD
  const barTop = mix(c.tealHi, '#FFFFFF', 0.22)
  const barSide = mix(c.tealD, '#000000', 0.22)
  const barLeft = mix(c.tealD, '#000000', 0.1)
  const pFrontA = mix(c.org, '#FFFFFF', 0.16)
  const pFrontB = c.org
  const pTop = mix(c.org, '#FFFFFF', 0.34)
  const pSide = mix(c.orgDeep, '#000000', 0.08)
  const pLeft = mix(c.orgDeep, '#FFFFFF', 0.08)

  const vars: Array<[string, string]> = [
    // palet inti
    ['--teal', c.teal], ['--tealD', c.tealD], ['--tealHi', c.tealHi], ['--tealS', c.tealS],
    ['--org', c.org], ['--orgS', c.orgS], ['--orgDeep', c.orgDeep],
    ['--ink', c.ink], ['--inkS', c.inkS], ['--paper', c.paper], ['--white', '#FFFFFF'],
    ['--gray', gray],
    ['--mint', c.mint], ['--mintSoft', mintSoft], ['--mintFaint', mintFaint], ['--mintPale', mintPale],
    // alpha
    ['--tealA03', rgba(c.teal, 0.03)], ['--tealA06', rgba(c.teal, 0.06)], ['--tealA10', rgba(c.teal, 0.1)],
    ['--tealA16', rgba(c.teal, 0.16)], ['--tealA25', rgba(c.teal, 0.25)], ['--tealA28', rgba(c.teal, 0.28)],
    ['--tealA45', rgba(c.teal, 0.45)], ['--tealA50', rgba(c.teal, 0.5)],
    ['--orgA03', rgba(c.org, 0.03)], ['--orgA06', rgba(c.org, 0.06)], ['--orgA10', rgba(c.org, 0.1)],
    ['--orgA16', rgba(c.org, 0.16)], ['--orgA40', rgba(c.org, 0.4)], ['--orgA55', rgba(c.org, 0.55)],
    ['--inkA06', rgba(c.ink, 0.06)], ['--inkA07', rgba(c.ink, 0.07)], ['--inkA08', rgba(c.ink, 0.08)],
    ['--inkA10', rgba(c.ink, 0.1)], ['--inkA14', rgba(c.ink, 0.14)], ['--inkA35', rgba(c.ink, 0.35)],
    ['--inkA85', rgba(c.ink, 0.85)],
    ['--mintA50', rgba(c.mint, 0.5)], ['--mintA12', rgba(c.mint, 0.12)],
    ['--whiteA16', 'rgba(255,255,255,.16)'],
    // turunan komponen
    ['--line', line], ['--zebra', zebra], ['--dot', dot],
    ['--barFrontA', barFrontA], ['--barFrontB', barFrontB], ['--barTop', barTop],
    ['--barSide', barSide], ['--barLeft', barLeft],
    ['--pFrontA', pFrontA], ['--pFrontB', pFrontB], ['--pTop', pTop],
    ['--pSide', pSide], ['--pLeft', pLeft],
    ['--funnel1', `linear-gradient(90deg,${c.tealD},${c.teal})`],
    ['--funnel2', `linear-gradient(90deg,${c.teal},${c.tealHi})`],
    ['--funnel3', `linear-gradient(90deg,${c.org},${mix(c.org, '#FFFFFF', 0.28)})`],
    ['--funnel4', `linear-gradient(90deg,${c.inkS},${mix(c.inkS, c.tealHi, 0.35)})`],
    // font
    ['--fHead', r.font.head], ['--fBody', r.font.body],
    // token template
    ['--radius', t.radius], ['--radiusS', t.radiusS],
    ['--shadow', t.shadow], ['--cardBorder', t.cardBorder],
    // animasi
    ['--ease', r.anim.ease], ['--sdur', r.anim.sdur],
    // irisan chart (0-5)
    ...c.slices.map((s, i) => [`--slice${i}`, s] as [string, string]),
    // latar slide
    ...slideBackgrounds(r),
  ]
  return vars.map(([k, v]) => `  ${k}:${v};`).join('\n')
}

function slideBackgrounds(r: ResolvedStyle): Array<[string, string]> {
  const c = r.color
  /** latar slide terang — mengikuti pilihan user (default putih) */
  const light = r.bg
  const gridPat = (col: string, gap: number) =>
    `repeating-linear-gradient(0deg,${col} 0 1px,transparent 1px ${gap}px),repeating-linear-gradient(90deg,${col} 0 1px,transparent 1px ${gap}px)`
  const halftone = (col: string, gap: number) =>
    `radial-gradient(${col} 1.5px,transparent 1.6px) 0 0/${gap}px ${gap}px repeat`

  const lightPatGrid = `${gridPat(rgba(c.ink, 0.06), 48)},`
  const lightPatDots = `${halftone(rgba(c.ink, 0.07), 18)},`

  // ── Sapuan cerah untuk sampul & penutup ──
  // Semua slide kini TERANG: gradasi pastel vivid + glow warna primer/aksen
  // di atas latar pilihan user (default putih). Tidak ada lagi latar gelap.
  const brightCover = (extra = '') =>
    extra +
    `radial-gradient(1150px 680px at 84% -14%, ${rgba(c.tealHi, 0.5)} 0%, transparent 56%),` +
    `radial-gradient(940px 640px at -12% 112%, ${rgba(c.org, 0.32)} 0%, transparent 54%),` +
    `linear-gradient(148deg,${mix(light, c.tealS, 0.55)} 0%,${light} 46%,${mix(light, c.orgS, 0.6)} 100%)`
  const brightClose = (extra = '') =>
    extra +
    `radial-gradient(1000px 620px at 12% -16%, ${rgba(c.org, 0.34)} 0%, transparent 56%),` +
    `radial-gradient(1150px 700px at 92% 114%, ${rgba(c.tealHi, 0.46)} 0%, transparent 56%),` +
    `linear-gradient(212deg,${mix(light, c.tealS, 0.55)} 0%,${light} 48%,${mix(light, c.orgS, 0.6)} 100%)`

  switch (r.tpl.id) {
    case 'soft':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover', `radial-gradient(1300px 800px at 50% -30%, ${rgba(c.tealHi, 0.4)} 0%, transparent 60%), ${brightCover()}`],
        ['--bgKpi', `linear-gradient(180deg,${light} 55%,${c.tealS})`],
        ['--bgComp', `linear-gradient(180deg,${light},${mix(light, c.teal, 0.04)})`],
        ['--bgTf', `linear-gradient(135deg,${light} 45%,${mix(light, c.org, 0.16)})`],
        ['--bgTrend', `linear-gradient(180deg,${c.tealS} 0%,${light} 62%)`],
        ['--bgProg', `linear-gradient(180deg,${mix(light, c.org, 0.05)},${light} 55%)`],
        ['--bgClose', brightClose()],
      ]
    case 'grid':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.92)],
        ['--bgCover', brightCover(lightPatGrid)],
        ['--bgKpi', `${lightPatGrid} ${light}`],
        ['--bgComp', `${lightPatGrid} ${light}`],
        ['--bgTf', `${lightPatGrid} linear-gradient(140deg,${light} 62%,${mix(light, c.org, 0.08)})`],
        ['--bgTrend', `${lightPatGrid} ${light}`],
        ['--bgProg', `${lightPatGrid} ${light}`],
        ['--bgClose', brightClose(lightPatGrid)],
      ]
    case 'aurora':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover',
          brightCover(`radial-gradient(760px 540px at 14% 10%, ${rgba(c.teal, 0.16)} 0%, transparent 62%),` +
            `radial-gradient(820px 600px at 88% 92%, ${rgba(c.org, 0.14)} 0%, transparent 60%), `)],
        ['--bgKpi', `radial-gradient(700px 460px at 8% 0%, ${rgba(c.teal, 0.12)} 0%, transparent 55%), ${light}`],
        ['--bgComp', `radial-gradient(600px 420px at 92% 4%, ${rgba(c.teal, 0.1)} 0%, transparent 60%), ${light}`],
        ['--bgTf', `radial-gradient(640px 460px at 4% 96%, ${rgba(c.org, 0.12)} 0%, transparent 58%), ${light}`],
        ['--bgTrend', `radial-gradient(680px 480px at 96% 96%, ${rgba(c.teal, 0.12)} 0%, transparent 58%), ${light}`],
        ['--bgProg', `radial-gradient(600px 420px at 88% 0%, ${rgba(c.org, 0.1)} 0%, transparent 60%), ${light}`],
        ['--bgClose', brightClose()],
      ]
    case 'inkpaper':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.92)],
        ['--bgCover', brightCover(lightPatDots)],
        ['--bgKpi', `${lightPatDots} ${light}`],
        ['--bgComp', `${lightPatDots} ${light}`],
        ['--bgTf', `${lightPatDots} ${light}`],
        ['--bgTrend', `${lightPatDots} ${light}`],
        ['--bgProg', `${lightPatDots} ${light}`],
        ['--bgClose', brightClose(lightPatDots)],
      ]
    case 'bento':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover',
          brightCover(`radial-gradient(900px 600px at 82% 8%, ${rgba(c.teal, 0.2)} 0%, transparent 55%),` +
            `radial-gradient(700px 520px at 12% 88%, ${rgba(c.org, 0.16)} 0%, transparent 55%), `)],
        ['--bgKpi', `radial-gradient(620px 420px at 88% 0%, ${rgba(c.teal, 0.08)} 0%, transparent 60%), ${light}`],
        ['--bgComp', `radial-gradient(560px 400px at 6% 90%, ${rgba(c.org, 0.07)} 0%, transparent 60%), ${light}`],
        ['--bgTf', light],
        ['--bgTrend', `radial-gradient(600px 420px at 92% 96%, ${rgba(c.teal, 0.07)} 0%, transparent 60%), ${light}`],
        ['--bgProg', light],
        ['--bgClose', brightClose()],
      ]
    case 'scroll':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.88)],
        ['--bgCover',
          brightCover(`radial-gradient(1400px 700px at 50% 118%, ${rgba(c.teal, 0.22)} 0%, transparent 60%), `)],
        ['--bgKpi', `radial-gradient(120% 100% at 50% 40%, ${light} 55%, ${mix(light, c.tealS, 0.7)} 100%)`],
        ['--bgComp', `radial-gradient(120% 100% at 50% 40%, ${light} 55%, ${mix(light, c.tealS, 0.5)} 100%)`],
        ['--bgTf', `radial-gradient(120% 100% at 50% 40%, ${light} 52%, ${mix(light, c.orgS, 0.8)} 100%)`],
        ['--bgTrend', `radial-gradient(120% 100% at 50% 40%, ${light} 55%, ${mix(light, c.tealS, 0.6)} 100%)`],
        ['--bgProg', `radial-gradient(120% 100% at 50% 40%, ${light} 55%, ${mix(light, c.ink, 0.05)} 100%)`],
        ['--bgClose', brightClose()],
      ]
    case 'brutal':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover', `${lightPatDots} linear-gradient(160deg,${mix(c.tealHi, '#FFFFFF', 0.25)},${c.tealS})`],
        ['--bgKpi', light],
        ['--bgComp', light],
        ['--bgTf', light],
        ['--bgTrend', light],
        ['--bgProg', light],
        ['--bgClose', `${lightPatDots} linear-gradient(160deg,${mix(c.org, '#FFFFFF', 0.4)},${c.orgS})`],
      ]
    case 'editorial':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.92)],
        ['--bgCover', `linear-gradient(180deg,${light},${mix(light, c.tealS, 0.65)} 78%,${mix(light, c.orgS, 0.7)})`],
        ['--bgKpi', light],
        ['--bgComp', light],
        ['--bgTf', light],
        ['--bgTrend', light],
        ['--bgProg', light],
        ['--bgClose', `linear-gradient(180deg,${light},${mix(light, c.orgS, 0.7)} 78%,${mix(light, c.tealS, 0.65)})`],
      ]
    case 'data3d':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover',
          brightCover(`radial-gradient(1000px 640px at 78% 10%, ${rgba(c.mint, 0.28)} 0%, transparent 58%),` +
            `radial-gradient(1300px 760px at 50% 115%, ${rgba(c.teal, 0.2)} 0%, transparent 62%), `)],
        ['--bgKpi', `radial-gradient(700px 460px at 90% 4%, ${rgba(c.teal, 0.1)} 0%, transparent 58%), ${light}`],
        ['--bgComp', `radial-gradient(640px 440px at 8% 92%, ${rgba(c.teal, 0.09)} 0%, transparent 58%), ${light}`],
        ['--bgTf', light],
        ['--bgTrend', `radial-gradient(680px 460px at 94% 90%, ${rgba(c.teal, 0.1)} 0%, transparent 58%), ${light}`],
        ['--bgProg', light],
        ['--bgClose', brightClose()],
      ]
    case 'kinetic':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover',
          brightCover(`radial-gradient(1200px 720px at 24% 20%, ${rgba(c.teal, 0.18)} 0%, transparent 60%),` +
            `radial-gradient(1000px 620px at 84% 84%, ${rgba(c.org, 0.16)} 0%, transparent 58%), `)],
        ['--bgKpi', light],
        ['--bgComp', light],
        ['--bgTf', light],
        ['--bgTrend', light],
        ['--bgProg', light],
        ['--bgClose', brightClose()],
      ]
    case 'holo':
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover',
          brightCover(`radial-gradient(900px 600px at 70% 40%, ${rgba(c.mint, 0.25)} 0%, transparent 55%), `)],
        ['--bgKpi', `radial-gradient(660px 440px at 90% 6%, ${rgba(c.teal, 0.08)} 0%, transparent 58%), ${light}`],
        ['--bgComp', light],
        ['--bgTf', light],
        ['--bgTrend', light],
        ['--bgProg', `radial-gradient(620px 420px at 8% 8%, ${rgba(c.teal, 0.07)} 0%, transparent 58%), ${light}`],
        ['--bgClose', brightClose()],
      ]
    case 'motion':
    default:
      return [
        ['--bgBody', mix(c.ink, '#FFFFFF', 0.9)],
        ['--bgCover', brightCover()],
        ['--bgKpi', `linear-gradient(160deg,${light} 55%,${c.tealS})`],
        ['--bgComp', light],
        ['--bgTf', `linear-gradient(140deg,${light} 60%,${mix(light, c.org, 0.12)})`],
        ['--bgTrend', `linear-gradient(165deg,${mix(light, c.teal, 0.06)} 55%,${mix(c.tealS, light, 0.3)})`],
        ['--bgProg', light],
        ['--bgClose', brightClose()],
      ]
  }
}

// ---------- CSS animasi per preset ----------
export function animCss(r: ResolvedStyle): string {
  const { anim } = r
  const seamCss = anim.seam
    ? `#seamline{position:absolute;top:-10%;bottom:-10%;width:7px;background:linear-gradient(180deg,var(--org),var(--teal));z-index:9;left:-5%;transform:rotate(8deg);opacity:0;pointer-events:none}
#seamline.go{animation:sweep .55s cubic-bezier(.65,0,.35,1) both}
@keyframes sweep{0%{left:-6%;opacity:1}100%{left:104%;opacity:1}}`
    : ''

  let trans = ''
  let title = ''
  switch (anim.id) {
    case 'energetic':
      trans = `.slide.enter{animation:slideIn .42s cubic-bezier(.34,1.56,.64,1) both}
.slide.leave{animation:slideOut .3s ease-in both;z-index:3}
@keyframes slideIn{from{opacity:0;transform:scale(.94) translateY(26px)}to{opacity:1;transform:none}}
@keyframes slideOut{to{opacity:0;transform:scale(.96) translateY(-14px)}}`
      title = `.slide.active .cover-title .ch{animation:popIn .45s cubic-bezier(.34,1.8,.64,1) both}
@keyframes popIn{from{transform:scale(1.9);opacity:0}to{transform:none;opacity:1}}`
      break
    case 'smooth':
      trans = `.slide.enter{animation:slideIn .6s cubic-bezier(.22,1,.36,1) both}
.slide.leave{animation:slideOut .45s cubic-bezier(.22,1,.36,1) both;z-index:3}
@keyframes slideIn{from{opacity:0;transform:translateX(46px)}to{opacity:1;transform:none}}
@keyframes slideOut{to{opacity:0;transform:translateX(-32px)}}`
      title = `.slide.active .cover-title .ch{animation:riseIn .5s cubic-bezier(.22,1,.36,1) both}
@keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{transform:none;opacity:1}}`
      break
    case 'minimal':
      trans = `.slide.enter{animation:slideIn .32s cubic-bezier(.4,0,.2,1) both}
.slide.leave{animation:slideOut .26s ease both;z-index:3}
@keyframes slideIn{from{opacity:0}to{opacity:1}}
@keyframes slideOut{to{opacity:0}}`
      title = `.slide.active .cover-title .ch{animation:none}`
      break
    case 'cinematic':
    default:
      trans = `.slide.enter{animation:seamIn .55s cubic-bezier(.65,0,.35,1) both}
.slide.leave{animation:seamOut .55s cubic-bezier(.65,0,.35,1) both;z-index:3}
@keyframes seamIn{from{clip-path:polygon(0 0,0 0,-6% 100%,0 100%);transform:translateX(24px) skewX(-1.5deg)}to{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);transform:none}}
@keyframes seamOut{from{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);transform:none}to{clip-path:polygon(100% 0,106% 0,100% 100%,100% 100%);transform:translateX(-24px) skewX(-1.5deg)}}`
      title = `.slide.active .cover-title .ch{animation:flipIn .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes flipIn{from{transform:rotateX(95deg) translateY(14px);opacity:0}to{transform:none;opacity:1}}`
      break
  }
  return `${trans}\n${title}\n${seamCss}`
}

/** <link> Google Fonts untuk tema font */
export function fontsLink(font: FontTheme): string {
  return (
    `<link rel="preconnect" href="https://fonts.googleapis.com">` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
    `<link href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap" rel="stylesheet">`
  )
}

/** JSON untuk dipakai runtime JS di dalam deck (warna irisan, durasi, motif) */
export function themeJson(r: ResolvedStyle): string {
  return JSON.stringify({
    template: r.tpl.id,
    coverBand: r.tpl.coverBand,
    decor: r.tpl.decor,
    slices: r.color.slices,
    countDur: r.anim.countDur,
    charDelay: r.anim.charDelay,
    teal: r.color.teal,
    org: r.color.org,
    ink: r.color.ink,
  }).replace(/</g, '\\u003c')
}

/** Palet heks untuk ekspor PPTX (tanpa '#') */
export interface PptxPalette {
  PRIMARY: string; PRIMARY_D: string; PRIMARY_HI: string; PRIMARY_S: string
  ACCENT: string; ACCENT_S: string; ACCENT_DEEP: string
  INK: string; INKS: string; PAPER: string; GRAY: string; MINT: string
}

export function pptxPalette(r: ResolvedStyle): PptxPalette {
  const c = r.color
  const strip = (s: string) => s.replace('#', '').toUpperCase()
  return {
    PRIMARY: strip(c.teal),
    PRIMARY_D: strip(c.tealD),
    PRIMARY_HI: strip(c.tealHi),
    PRIMARY_S: strip(c.tealS),
    ACCENT: strip(c.org),
    ACCENT_S: strip(c.orgS),
    ACCENT_DEEP: strip(c.orgDeep),
    INK: strip(c.ink),
    INKS: strip(c.inkS),
    PAPER: strip(c.paper),
    GRAY: strip(mix(c.inkS, c.paper, 0.35)),
    MINT: strip(c.mint),
  }
}

export function pptxFontFaces(r: ResolvedStyle): { head: string; body: string } {
  // ambil nama keluarga pertama dari daftar CSS
  const first = (css: string) => (css.split(',')[0] || '').trim().replace(/['"]/g, '')
  return { head: first(r.font.head), body: first(r.font.body) }
}
