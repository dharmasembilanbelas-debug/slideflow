// ─── Tipe data inti SlideFlow ───────────────────────────────────────────
// Deck = identitas + DAFTAR SLIDE FLEKSIBEL (panjang & jenis bebas).
// Setiap slide punya kind, judul, subjudul, dan catatan pembicara sendiri.

export type SlideKind =
  | 'cover'
  | 'kpi'
  | 'composition'
  | 'table'
  | 'trend'
  | 'programs'
  | 'bullets'
  | 'steps'
  | 'closing'

export const SLIDE_KINDS: SlideKind[] = [
  'cover',
  'kpi',
  'composition',
  'table',
  'trend',
  'programs',
  'bullets',
  'steps',
  'closing',
]

export const SLIDE_LABEL: Record<SlideKind, string> = {
  cover: 'Sampul',
  kpi: 'KPI Utama',
  composition: 'Komposisi (Donat)',
  table: 'Tabel & Corong',
  trend: 'Tren (Batang)',
  programs: 'Kartu Program',
  bullets: 'Poin per Kategori',
  steps: 'Langkah Bernomor',
  closing: 'Penutup',
}

/** Deskripsi singkat tiap jenis slide — dipakai menu "Tambah Slide" */
export const SLIDE_DESC: Record<SlideKind, string> = {
  cover: 'Sampul: judul besar, organisasi & periode',
  kpi: 'Angka-angka kunci: 1 hero besar + kartu pendukung',
  composition: 'Donat 3D interaktif per kategori + legenda',
  table: 'Tabel rinci + corong konversi menurun',
  trend: 'Grafik batang 3D + baris insight',
  programs: 'Kartu program/kegiatan + lencana capaian',
  bullets: 'Daftar poin per kelompok (mis. Capaian & Hambatan)',
  steps: 'Langkah/tahap bernomor (mis. Rencana Perbaikan)',
  closing: 'Penutup: pesan akhir, butir tindak lanjut, kontak',
}

export function isSlideKind(v: unknown): v is SlideKind {
  return typeof v === 'string' && (SLIDE_KINDS as string[]).includes(v)
}

export interface DeckIdentity {
  org: string
  division: string
  period: string
  title: string
  subtitle: string
  date: string
}

export interface KpiItem {
  label: string
  value: number
  suffix: string // "", "%", ":1", "+", "x"
  decimals: number // 0 untuk bilangan bulat, 1-2 untuk desimal
  note: string
}

export interface CompositionSlice {
  label: string
  value: number
  color?: string
}

export interface FunnelStep {
  label: string
  value: number
}

export interface TrendPoint {
  label: string
  value: number
}

export interface ProgramItem {
  name: string
  detail: string
  badge: string
}

export interface BulletGroup {
  heading: string
  items: string[]
}

// ─── Bentuk slide per jenis ─────────────────────────────────────────────

interface SlideBase {
  /** id unik — target elemen tambahan (data-key) & pengalamatan stabil */
  id: string
  kind: SlideKind
  title: string
  subtitle: string
  /** catatan pembicara (naskah lisan) milik slide ini */
  note: string
}

export interface CoverSlide extends SlideBase {
  kind: 'cover'
}

export interface KpiSlide extends SlideBase {
  kind: 'kpi'
  kpis: KpiItem[]
}

export interface CompositionSlide extends SlideBase {
  kind: 'composition'
  centerLabel: string
  centerValue: string
  slices: CompositionSlice[]
}

export interface TableSlide extends SlideBase {
  kind: 'table'
  columns: string[]
  rows: string[][]
  funnelTitle: string
  funnel: FunnelStep[]
}

export interface TrendSlide extends SlideBase {
  kind: 'trend'
  points: TrendPoint[]
  insight: string
}

export interface ProgramsSlide extends SlideBase {
  kind: 'programs'
  items: ProgramItem[]
}

export interface BulletsSlide extends SlideBase {
  kind: 'bullets'
  groups: BulletGroup[]
}

export interface StepsSlide extends SlideBase {
  kind: 'steps'
  items: ProgramItem[]
}

export interface ClosingSlide extends SlideBase {
  kind: 'closing'
  message: string
  bullets: string[]
  contact: string
}

export type DeckSlide =
  | CoverSlide
  | KpiSlide
  | CompositionSlide
  | TableSlide
  | TrendSlide
  | ProgramsSlide
  | BulletsSlide
  | StepsSlide
  | ClosingSlide

export interface Deck {
  identity: DeckIdentity
  slides: DeckSlide[]
}

/** Batas jumlah slide yang didukung editor & ekspor */
export const MIN_SLIDES = 3
export const MAX_SLIDES = 24

/** id stabil untuk slide hasil generator: 'kpi-1', 'trend-2', dst. */
export function genSlideId(kind: SlideKind, existing: Set<string>): string {
  let n = 1
  let id: string = kind
  while (existing.has(id)) {
    id = `${kind}-${++n}`
  }
  existing.add(id)
  return id
}

// Palet desain resmi deck (teal / oranye / ink)
export const PALETTE = {
  teal: '#0E8F8A',
  tealDark: '#0A6B67',
  tealSoft: '#DFF3F1',
  orange: '#FF7A2E',
  orangeSoft: '#FFE8DA',
  ink: '#132B30',
  inkSoft: '#22434A',
  paper: '#F7FAF9',
  white: '#FFFFFF',
} as const

export const SLICE_COLORS = [
  '#0E8F8A',
  '#FF7A2E',
  '#132B30',
  '#3FB8AF',
  '#FFB25E',
  '#5A7D7C',
]

// Jalur edit (dot-path) untuk mode klik-teks di kanvas, mis. "identity.title"
export type EditPath = string
