// ─── Branding: Logo & Ornamen Latar ─────────────────────────────────────────
// Logo = satu slot gambar (data URL) yang dicetak di pojok slide.
// Ornamen = aset gambar/GIF/video milik user + daftar penempatan (placement)
// yang mengatur di slide mana, posisi apa, seberapa besar, dan di depan /
// di belakang konten. Semua ikut terekspor ke .html & .pptx.

/** Posisi ornamen: 9 jangkar + 'full' (penuhi seluruh slide sebagai latar) */
export type OrnPos = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br' | 'full'

export const ORN_POS_LABEL: Record<OrnPos, string> = {
  tl: 'Kiri Atas',
  tc: 'Tengah Atas',
  tr: 'Kanan Atas',
  ml: 'Kiri Tengah',
  mc: 'Tengah',
  mr: 'Kanan Tengah',
  bl: 'Kiri Bawah',
  bc: 'Tengah Bawah',
  br: 'Kanan Bawah',
  full: 'Penuhi Slide (latar)',
}

export const ORN_POS_GRID: OrnPos[] = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']

export type LogoPos = 'tl' | 'tr' | 'bl' | 'br'
export type BrandTarget = 'all' | 'cover' | string // 'all' | 'cover' | id slide

export interface LogoConfig {
  /** data URL gambar (png/jpg/webp/svg/gif) */
  src: string
  name: string
  /** tampil hanya di sampul atau semua slide */
  apply: 'cover' | 'all'
  pos: LogoPos
  /** lebar logo dalam px pada panggung 1280×800 */
  size: number
  /** 0.2 – 1 */
  opacity: number
}

export interface OrnamentAsset {
  id: string
  name: string
  /** image = gambar/gif/svg/webp · video = mp4/webm */
  kind: 'image' | 'video'
  src: string
  /** frame tangkapan untuk PPTX & thumbnail video */
  poster: string
  /** dimensi asli (px) — dipakai geometri PPTX */
  w: number
  h: number
  kb: number
}

export interface OrnamentPlacement {
  id: string
  assetId: string
  /** 'all' | 'cover' | id slide */
  target: BrandTarget
  pos: OrnPos
  /** lebar dalam % panggung (untuk full diabaikan) */
  w: number
  /** 0.2 – 1 */
  opacity: number
  /** true → di belakang konten slide */
  behind: boolean
}

export interface Branding {
  logo: LogoConfig | null
  assets: OrnamentAsset[]
  ornaments: OrnamentPlacement[]
}

export const DEFAULT_BRANDING: Branding = { logo: null, assets: [], ornaments: [] }

export function newBrandId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const LOGO_POS: LogoPos[] = ['tl', 'tr', 'bl', 'br']
const ORN_POS: OrnPos[] = [...ORN_POS_GRID, 'full']

function dataUrl(v: unknown, maxChars: number): string {
  return typeof v === 'string' && v.startsWith('data:') && v.length <= maxChars ? v : ''
}

/** Bersihkan branding hasil localStorage / project JSON agar selalu valid */
export function sanitizeBranding(raw: unknown): Branding {
  const out: Branding = { logo: null, assets: [], ornaments: [] }
  if (!raw || typeof raw !== 'object') return out
  const b = raw as Record<string, unknown>

  if (b.logo && typeof b.logo === 'object') {
    const l = b.logo as Record<string, unknown>
    const src = dataUrl(l.src, 1_500_000)
    if (src) {
      out.logo = {
        src,
        name: typeof l.name === 'string' ? l.name.slice(0, 80) : 'logo',
        apply: l.apply === 'all' ? 'all' : 'cover',
        pos: LOGO_POS.includes(l.pos as LogoPos) ? (l.pos as LogoPos) : 'tl',
        size: Math.max(40, Math.min(300, Number(l.size) || 110)),
        opacity: Math.max(0.2, Math.min(1, Number(l.opacity) || 1)),
      }
    }
  }

  if (Array.isArray(b.assets)) {
    for (const item of b.assets) {
      const a = (item ?? {}) as Record<string, unknown>
      const src = dataUrl(a.src, 4_500_000)
      if (!src || typeof a.id !== 'string' || !a.id) continue
      out.assets.push({
        id: a.id.slice(0, 40),
        name: typeof a.name === 'string' ? a.name.slice(0, 80) : 'aset',
        kind: a.kind === 'video' ? 'video' : 'image',
        src,
        poster: dataUrl(a.poster, 800_000),
        w: Math.max(1, Number(a.w) || 800),
        h: Math.max(1, Number(a.h) || 450),
        kb: Math.max(0, Number(a.kb) || 0),
      })
    }
  }

  const assetIds = new Set(out.assets.map((a) => a.id))
  if (Array.isArray(b.ornaments)) {
    for (const item of b.ornaments) {
      const o = (item ?? {}) as Record<string, unknown>
      if (typeof o.id !== 'string' || !o.id || typeof o.assetId !== 'string' || !assetIds.has(o.assetId)) continue
      out.ornaments.push({
        id: o.id.slice(0, 40),
        assetId: o.assetId.slice(0, 40),
        target: typeof o.target === 'string' && o.target ? o.target.slice(0, 40) : 'all',
        pos: ORN_POS.includes(o.pos as OrnPos) ? (o.pos as OrnPos) : 'br',
        w: Math.max(6, Math.min(100, Number(o.w) || 24)),
        opacity: Math.max(0.2, Math.min(1, Number(o.opacity) || 1)),
        behind: o.behind !== false,
      })
    }
  }
  return out
}

/** Perkiraan ukuran JSON state (untuk penjaga kuota localStorage) */
export function estimateBrandingBytes(b: Branding): number {
  let n = 2
  if (b.logo) n += b.logo.src.length
  for (const a of b.assets) n += a.src.length + a.poster.length + 200
  for (const o of b.ornaments) n += 160
  return n
}
