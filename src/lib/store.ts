'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Deck, DeckSlide, SlideKind } from '@/lib/types'
import { MAX_SLIDES, MIN_SLIDES } from '@/lib/types'
import { DEFAULT_DECK, DEFAULT_DOCUMENT } from '@/lib/defaults'
import { setByPath, normalizeDeck } from '@/lib/deck-normalizer'
import type { DeckStyle } from '@/lib/themes'
import { DEFAULT_STYLE, sanitizeStyle } from '@/lib/themes'
import type { DeckElement, ElementKind } from '@/lib/elements'
import type { Branding, LogoConfig, OrnamentAsset, OrnamentPlacement } from '@/lib/branding'
import { DEFAULT_BRANDING, sanitizeBranding, newBrandId } from '@/lib/branding'

interface StudioState {
  deck: Deck
  docText: string
  fileName: string
  fileWarning: string
  context: string
  presets: string[]
  usedAI: boolean | null
  generating: boolean
  currentIndex: number
  editMode: boolean
  notesOpen: boolean

  // Tahap pematangan: tema, elemen, HTML custom
  style: DeckStyle
  elements: DeckElement[]
  customHtml: string
  customName: string
  /** true → kanvas menampilkan HTML custom user (bukan deck) */
  htmlView: boolean

  /** Logo & ornamen latar kustom milik user (Task 17) */
  branding: Branding

  setDocText: (t: string) => void
  setFileName: (n: string) => void
  setFileWarning: (w: string) => void
  clearDocument: () => void
  setContext: (c: string) => void
  togglePreset: (p: string) => void
  setGenerating: (g: boolean) => void
  applyDeck: (deck: Deck, usedAI: boolean) => void
  editByPath: (path: string, value: unknown) => void
  setIndex: (i: number) => void
  setEditMode: (on: boolean) => void
  setNotesOpen: (on: boolean) => void
  loadSample: () => void
  loadProjectJson: (raw: string) => { ok: boolean; message: string }

  // Kelola slide fleksibel
  addSlide: (kind: SlideKind, afterIndex?: number) => void
  duplicateSlide: (index: number) => void
  removeSlide: (index: number) => void
  moveSlide: (index: number, dir: -1 | 1) => void

  setStyle: (patch: Partial<DeckStyle>) => void
  addElement: (el: DeckElement) => void
  removeElement: (id: string) => void
  setCustomHtml: (html: string, name?: string) => void
  setHtmlView: (v: boolean) => void

  // Branding: logo & ornamen
  setLogo: (logo: LogoConfig | null) => void
  patchLogo: (patch: Partial<LogoConfig>) => void
  addOrnamentAsset: (asset: OrnamentAsset, target: 'all' | 'cover' | string) => { ok: boolean; message: string }
  removeOrnamentAsset: (id: string) => void
  addOrnamentPlacement: (assetId: string, target: 'all' | 'cover' | string) => void
  patchOrnament: (id: string, patch: Partial<OrnamentPlacement>) => void
  removeOrnament: (id: string) => void
}

function cloneDeck(d: Deck): Deck {
  return JSON.parse(JSON.stringify(d)) as Deck
}

const ELEMENT_KINDS: ElementKind[] = [
  'kpi-chip', 'quote', 'callout', 'progress', 'bullets', 'badge', 'divider', 'stat-strip', 'custom',
]

/** Bersihkan elemen hasil localStorage / project JSON agar selalu valid.
 *  `slide` kini id slide bebas — elemen pada slide yang sudah tidak ada
 *  hanya tidak dirender (tanpa merusak state). */
function sanitizeElements(raw: unknown): DeckElement[] {
  if (!Array.isArray(raw)) return []
  const out: DeckElement[] = []
  for (const item of raw) {
    const e = (item ?? {}) as Record<string, unknown>
    const id = typeof e.id === 'string' ? e.id.slice(0, 40) : ''
    const slide = typeof e.slide === 'string' && e.slide.trim() ? e.slide.slice(0, 40) : null
    const kind = typeof e.kind === 'string' && ELEMENT_KINDS.includes(e.kind as ElementKind) ? (e.kind as ElementKind) : null
    if (!id || !slide || !kind) continue
    out.push({
      id,
      slide: slide as DeckElement['slide'],
      kind,
      x: Math.max(-10, Math.min(108, Number(e.x) || 0)),
      y: Math.max(-5, Math.min(96, Number(e.y) || 0)),
      w: Math.max(4, Math.min(100, Number(e.w) || 30)),
      html: typeof e.html === 'string' ? e.html.slice(0, 60000) : '',
    })
  }
  return out
}

/** Deck yang disimpan format lama (7 bagian + notes) → konversi ke slides[] */
function ensureFlexibleDeck(deck: unknown): Deck {
  if (!deck || typeof deck !== 'object') return cloneDeck(DEFAULT_DECK)
  if (Array.isArray((deck as Deck).slides) && (deck as Deck).slides.length >= 1) {
    // Sudah format baru — pastikan normal (id unik, cover/closing ada)
    return normalizeDeck(deck)
  }
  return normalizeDeck(deck) // normalizeDeck mengonversi legacy → slides
}

// ─── Migrasi nama lama → SlideFlow ──────────────────────────────────────
// State tersimpan dengan key lama 'studio-laporan-v3' dipindah otomatis ke
// 'slideflow-v3' sekali saja sehingga data user tidak hilang setelah rebrand.
if (typeof window !== 'undefined') {
  try {
    const NEW_KEY = 'slideflow-v3'
    const OLD_KEY = 'studio-laporan-v3'
    if (!window.localStorage.getItem(NEW_KEY) && window.localStorage.getItem(OLD_KEY)) {
      window.localStorage.setItem(NEW_KEY, window.localStorage.getItem(OLD_KEY) ?? '')
    }
  } catch {
    /* localStorage tidak tersedia — abaikan */
  }
}

/** Template slide baru per jenis — dipakai tombol "Tambah Slide" */
export function newSlideTemplate(kind: SlideKind): DeckSlide {
  const base = { id: '', title: '', subtitle: '', note: '' }
  switch (kind) {
    case 'cover':
      return { ...base, kind, title: 'JUDUL PRESENTASI' }
    case 'kpi':
      return {
        ...base,
        kind,
        title: 'Angka Kunci',
        subtitle: 'Ringkasan capaian utama',
        kpis: [
          { label: 'Indikator Utama', value: 100, suffix: '', decimals: 0, note: 'Keterangan singkat capaian' },
          { label: 'Indikator 2', value: 75, suffix: '%', decimals: 0, note: 'Keterangan singkat' },
          { label: 'Indikator 3', value: 50, suffix: '', decimals: 0, note: 'Keterangan singkat' },
          { label: 'Indikator 4', value: 25, suffix: '', decimals: 0, note: 'Keterangan singkat' },
        ],
      }
    case 'composition':
      return {
        ...base,
        kind,
        title: 'Komposisi Per Kategori',
        subtitle: 'Sebaran nilai menurut kategori',
        centerLabel: 'Total',
        centerValue: '100',
        slices: [
          { label: 'Kategori A', value: 50 },
          { label: 'Kategori B', value: 30 },
          { label: 'Kategori C', value: 20 },
        ],
      }
    case 'table':
      return {
        ...base,
        kind,
        title: 'Tabel Rinci',
        subtitle: 'Data per kategori — cerita lengkap disampaikan lisan',
        columns: ['Kolom 1', 'Kolom 2', 'Kolom 3'],
        rows: [
          ['Baris 1', '10', '20'],
          ['Baris 2', '15', '25'],
          ['Baris 3', '20', '30'],
        ],
        funnelTitle: 'Corong Konversi',
        funnel: [
          { label: 'Tahap 1', value: 100 },
          { label: 'Tahap 2', value: 60 },
          { label: 'Tahap 3', value: 30 },
        ],
      }
    case 'trend':
      return {
        ...base,
        kind,
        title: 'Tren Per Periode',
        subtitle: 'Perkembangan angka antar periode',
        points: [
          { label: 'P1', value: 40 },
          { label: 'P2', value: 70 },
          { label: 'P3', value: 55 },
          { label: 'P4', value: 90 },
        ],
        insight: 'Tulis insight singkat: apa arti bentuk grafik ini untuk periode berikutnya.',
      }
    case 'programs':
      return {
        ...base,
        kind,
        title: 'Program Andalan',
        subtitle: 'Judul di layar — cerita & indikator disampaikan lisan',
        items: [
          { name: 'Program 1', detail: 'Deskripsi singkat capaian program.', badge: 'Badge' },
          { name: 'Program 2', detail: 'Deskripsi singkat capaian program.', badge: '' },
          { name: 'Program 3', detail: 'Deskripsi singkat capaian program.', badge: '' },
          { name: 'Program 4', detail: 'Deskripsi singkat capaian program.', badge: '' },
        ],
      }
    case 'bullets':
      return {
        ...base,
        kind,
        title: 'Poin per Kategori',
        subtitle: 'Kelompok poin — detail disampaikan lisan',
        groups: [
          { heading: 'Kelompok A', items: ['Poin pertama', 'Poin kedua', 'Poin ketiga'] },
          { heading: 'Kelompok B', items: ['Poin pertama', 'Poin kedua'] },
        ],
      }
    case 'steps':
      return {
        ...base,
        kind,
        title: 'Langkah Perbaikan',
        subtitle: 'Urutan tindak lanjut yang dijalankan',
        items: [
          { name: 'Langkah pertama', detail: 'Aksi konkret yang dilakukan.', badge: '1' },
          { name: 'Langkah kedua', detail: 'Aksi konkret yang dilakukan.', badge: '' },
          { name: 'Langkah ketiga', detail: 'Aksi konkret yang dilakukan.', badge: '' },
        ],
      }
    case 'closing':
      return {
        ...base,
        kind,
        title: 'Terima Kasih',
        message: 'Pesan penutup — satu kalimat bermakna.',
        bullets: ['Tindak lanjut 1', 'Tindak lanjut 2'],
        contact: '',
      }
  }
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      deck: cloneDeck(DEFAULT_DECK),
      docText: '',
      fileName: '',
      fileWarning: '',
      context: '',
      presets: ['outline', 'verbal', 'professional'],
      usedAI: null,
      generating: false,
      currentIndex: 0,
      editMode: false,
      notesOpen: false,

      style: { ...DEFAULT_STYLE },
      elements: [],
      customHtml: '',
      customName: '',
      htmlView: false,
      branding: { ...DEFAULT_BRANDING, assets: [], ornaments: [] },

      setDocText: (t) => set({ docText: t }),
      setFileName: (n) => set({ fileName: n }),
      setFileWarning: (w) => set({ fileWarning: w }),
      clearDocument: () => set({ docText: '', fileName: '', fileWarning: '' }),
      setContext: (c) => set({ context: c }),
      togglePreset: (p) =>
        set((s) => ({
          presets: s.presets.includes(p) ? s.presets.filter((x) => x !== p) : [...s.presets, p],
        })),
      setGenerating: (g) => set({ generating: g }),
      applyDeck: (deck, usedAI) => set({ deck, usedAI, currentIndex: 0, htmlView: false }),

      editByPath: (path, value) => {
        if (path.startsWith('elements.')) {
          const [, id, prop] = path.split('.')
          if (!id || !prop) return
          set((s) => ({
            elements: s.elements.map((el) =>
              el.id === id
                ? {
                    ...el,
                    [prop]:
                      prop === 'html'
                        ? String(value ?? '')
                        : prop === 'w'
                          ? Math.max(4, Math.min(100, Number(value) || el.w))
                          : Math.max(-10, Math.min(108, Number(value) || 0)),
                  }
                : el,
            ),
          }))
          return
        }
        set((s) => ({ deck: setByPath(s.deck, path, value) }))
      },

      setIndex: (i) => set((s) => ({ currentIndex: Math.max(0, Math.min(s.deck.slides.length - 1, i)) })),
      setEditMode: (on) => set({ editMode: on }),
      setNotesOpen: (on) => set({ notesOpen: on }),

      addSlide: (kind, afterIndex) =>
        set((s) => {
          const at = afterIndex ?? s.currentIndex
          const t = newSlideTemplate(kind)
          const used = new Set(s.deck.slides.map((x) => x.id))
          const idBase = kind
          let id: string = idBase
          let n = 1
          while (used.has(id)) id = `${idBase}-${++n}`
          const slide = { ...t, id } as DeckSlide
          const slides = [...s.deck.slides]
          slides.splice(Math.min(at + 1, slides.length), 0, slide)
          return {
            deck: { ...s.deck, slides: slides.slice(0, MAX_SLIDES) },
            currentIndex: Math.min(at + 1, MAX_SLIDES - 1),
          }
        }),

      duplicateSlide: (index) =>
        set((s) => {
          const slides = [...s.deck.slides]
          if (index < 0 || index >= slides.length || slides.length >= MAX_SLIDES) return {}
          const src = JSON.parse(JSON.stringify(slides[index])) as DeckSlide
          const used = new Set(slides.map((x) => x.id))
          let id = `${src.id}-copy`
          let n = 1
          while (used.has(id)) id = `${src.id}-copy-${++n}`
          slides.splice(index + 1, 0, { ...src, id })
          return { deck: { ...s.deck, slides }, currentIndex: index + 1 }
        }),

      removeSlide: (index) =>
        set((s) => {
          const slides = s.deck.slides
          if (slides.length <= MIN_SLIDES || index < 0 || index >= slides.length) return {}
          // sampul (pertama) & penutup (terakhir) tidak boleh dihapus
          if (index === 0 || index === slides.length - 1) return {}
          const next = slides.filter((_, i) => i !== index)
          return {
            deck: { ...s.deck, slides: next },
            currentIndex: Math.max(0, Math.min(index, next.length - 1)),
          }
        }),

      moveSlide: (index, dir) =>
        set((s) => {
          const slides = [...s.deck.slides]
          const to = index + dir
          if (to < 1 || to >= slides.length - 1) return {} // sampul & penutup tetap di ujung
          if (index < 1 || index >= slides.length - 1) return {}
          const [item] = slides.splice(index, 1)
          slides.splice(to, 0, item)
          return { deck: { ...s.deck, slides }, currentIndex: to }
        }),

      loadSample: () =>
        set({
          deck: cloneDeck(DEFAULT_DECK),
          docText: DEFAULT_DOCUMENT,
          fileName: 'contoh-laporan-ppdb.md',
          fileWarning: '',
          usedAI: null,
          currentIndex: 0,
        }),

      loadProjectJson: (raw) => {
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          const deckRaw = parsed.deck ?? parsed
          if (!deckRaw || typeof deckRaw !== 'object') {
            return { ok: false, message: 'File project tidak berisi deck yang valid.' }
          }
          set({
            deck: ensureFlexibleDeck(deckRaw),
            usedAI: null,
            currentIndex: 0,
            context: typeof parsed.context === 'string' ? parsed.context : get().context,
            presets: Array.isArray(parsed.presets) ? (parsed.presets as string[]) : get().presets,
            style: parsed.style ? sanitizeStyle(parsed.style) : get().style,
            elements: 'elements' in parsed ? sanitizeElements(parsed.elements) : get().elements,
            customHtml: typeof parsed.customHtml === 'string' ? parsed.customHtml : get().customHtml,
            customName: typeof parsed.customName === 'string' ? parsed.customName : get().customName,
            branding: 'branding' in parsed ? sanitizeBranding(parsed.branding) : get().branding,
            htmlView: false,
          })
          return { ok: true, message: 'Project berhasil dimuat.' }
        } catch {
          return { ok: false, message: 'File bukan JSON project yang sah.' }
        }
      },

      setStyle: (patch) => set((s) => ({ style: sanitizeStyle({ ...s.style, ...patch }) })),
      addElement: (el) => set((s) => ({ elements: [...s.elements, el] })),
      removeElement: (id) => set((s) => ({ elements: s.elements.filter((e) => e.id !== id) })),
      setCustomHtml: (html, name) =>
        set((s) => ({ customHtml: html, customName: name ?? s.customName, htmlView: true })),
      setHtmlView: (v) => set({ htmlView: v }),

      // ── Branding: logo & ornamen ──
      setLogo: (logo) => set({ branding: { ...get().branding, logo } }),
      patchLogo: (patch) =>
        set((s) => {
          if (!s.branding.logo) return {}
          const next = { ...s.branding.logo, ...patch }
          next.size = Math.max(40, Math.min(300, Math.round(Number(next.size) || 110)))
          next.opacity = Math.max(0.2, Math.min(1, Number(next.opacity) || 1))
          return { branding: { ...s.branding, logo: next } }
        }),

      addOrnamentAsset: (asset, target) => {
        const s = get()
        // Penjaga kuota localStorage (~5 MB) — tolak sebelum persist gagal
        const probe: Branding = { ...s.branding, assets: [...s.branding.assets, asset] }
        const total =
          JSON.stringify({ d: s.deck, doc: s.docText, c: s.context, st: s.style, el: s.elements, ch: s.customHtml, b: probe }).length
        if (total > 4_300_000) {
          return {
            ok: false,
            message: 'Penyimpanan browser hampir penuh. Hapus aset/dokumen lain atau pakai file yang lebih kecil.',
          }
        }
        const placement: OrnamentPlacement = {
          id: newBrandId('orn'),
          assetId: asset.id,
          target,
          pos: 'br',
          w: asset.kind === 'video' ? 30 : 24,
          opacity: 1,
          behind: true,
        }
        set({ branding: { ...probe, ornaments: [...probe.ornaments, placement] } })
        return { ok: true, message: 'Ornamen ditambahkan.' }
      },

      removeOrnamentAsset: (id) =>
        set((s) => ({
          branding: {
            ...s.branding,
            assets: s.branding.assets.filter((a) => a.id !== id),
            ornaments: s.branding.ornaments.filter((o) => o.assetId !== id),
          },
        })),

      addOrnamentPlacement: (assetId, target) =>
        set((s) => {
          if (!s.branding.assets.some((a) => a.id === assetId)) return {}
          const src = s.branding.assets.find((a) => a.id === assetId)
          const placement: OrnamentPlacement = {
            id: newBrandId('orn'),
            assetId,
            target,
            pos: 'br',
            w: src?.kind === 'video' ? 30 : 24,
            opacity: 1,
            behind: true,
          }
          return { branding: { ...s.branding, ornaments: [...s.branding.ornaments, placement] } }
        }),

      patchOrnament: (id, patch) =>
        set((s) => ({
          branding: {
            ...s.branding,
            ornaments: s.branding.ornaments.map((o) =>
              o.id === id
                ? {
                    ...o,
                    ...patch,
                    w: Math.max(6, Math.min(100, Number(patch.w !== undefined ? patch.w : o.w))),
                    opacity: Math.max(0.2, Math.min(1, Number(patch.opacity !== undefined ? patch.opacity : o.opacity))),
                  }
                : o,
            ),
          },
        })),

      removeOrnament: (id) =>
        set((s) => ({
          branding: { ...s.branding, ornaments: s.branding.ornaments.filter((o) => o.id !== id) },
        })),
    }),
    {
      name: 'slideflow-v3',
      skipHydration: true,
      partialize: (s) => ({
        deck: s.deck,
        docText: s.docText,
        fileName: s.fileName,
        context: s.context,
        presets: s.presets,
        usedAI: s.usedAI,
        style: s.style,
        elements: s.elements,
        customHtml: s.customHtml,
        customName: s.customName,
        branding: s.branding,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudioState>
        return {
          ...current,
          ...p,
          deck: ensureFlexibleDeck(p.deck ?? current.deck),
          style: sanitizeStyle(p.style),
          elements: sanitizeElements(p.elements),
          customHtml: typeof p.customHtml === 'string' ? p.customHtml.slice(0, 2_000_000) : '',
          customName: typeof p.customName === 'string' ? p.customName : '',
          branding: sanitizeBranding(p.branding),
          htmlView: false,
          currentIndex: Math.min(
            p.currentIndex ?? 0,
            Math.max(0, ((p.deck && Array.isArray(p.deck.slides) && p.deck.slides.length) || 7) - 1),
          ),
        }
      },
    },
  ),
)
