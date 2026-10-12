import type {
  BulletGroup,
  CompositionSlice,
  Deck,
  DeckIdentity,
  DeckSlide,
  FunnelStep,
  KpiItem,
  ProgramItem,
  SlideKind,
  TrendPoint,
} from './types'
import { MAX_SLIDES, SLIDE_KINDS, SLIDE_LABEL, genSlideId, isSlideKind } from './types'

// ─── Normalizer: memvalidasi & memperbaiki deck mentah (hasil LLM / import /
// state lama) ke bentuk DECK FLEKSIBEL: identity + slides[]. Deck format lama
// (7 bagian tetap + notes record) dikonversi otomatis ke daftar slide. ────────

const LEGACY_ORDER: SlideKind[] = ['cover', 'kpi', 'composition', 'table', 'trend', 'programs', 'closing']

function str(v: unknown, fallback: string, max = 200): string {
  if (typeof v !== 'string') return fallback
  const s = v.trim()
  return s ? s.slice(0, max) : fallback
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const s = v.trim().replace(/%$/, '')
    const n = Number(s.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function arr<T>(v: unknown, max: number): unknown[] {
  return Array.isArray(v) ? v.slice(0, max) : []
}

/** id slide format lama → dipakai apa adanya agar elemen lama tetap menempel */
const LEGACY_IDS: Partial<Record<SlideKind, string>> = {
  cover: 'cover',
  kpi: 'kpi',
  composition: 'composition',
  table: 'tableFunnel',
  trend: 'trend',
  programs: 'programs',
  closing: 'closing',
}

function cloneIdentity(i: unknown, fallback: DeckIdentity): DeckIdentity {
  const o = (i && typeof i === 'object' ? i : {}) as Record<string, unknown>
  return {
    org: str(o.org, fallback.org, 60),
    division: str(o.division, fallback.division, 60),
    period: str(o.period, fallback.period, 40),
    title: str(o.title, fallback.title, 60).toUpperCase(),
    subtitle: str(o.subtitle, fallback.subtitle, 120),
    date: str(o.date, fallback.date, 40),
  }
}

// ─── Normalisasi satu slide per jenis ───────────────────────────────────────

function normKpis(v: unknown): KpiItem[] {
  const raw = arr(v, 6)
  const out = raw.map((item, idx): KpiItem => {
    const k = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const suffixRaw = str(k.suffix, '', 4)
    return {
      label: str(k.label, `Indikator ${idx + 1}`, 28),
      value: num(k.value, 0),
      suffix: ['%', ':1', 'x', '+'].includes(suffixRaw) ? suffixRaw : '',
      decimals: Math.min(Math.max(Math.round(num(k.decimals, 0)), 0), 2),
      note: str(k.note, 'Sumber: dokumen sumber', 90),
    }
  })
  return out.length ? out : defaultKpis()
}

function defaultKpis(): KpiItem[] {
  return [
    { label: 'Indikator 1', value: 0, suffix: '', decimals: 0, note: 'Sumber: dokumen sumber' },
    { label: 'Indikator 2', value: 0, suffix: '', decimals: 0, note: 'Sumber: dokumen sumber' },
  ]
}

function normSlices(v: unknown): CompositionSlice[] {
  const raw = arr(v, 6)
  const out = raw
    .map((item, idx): CompositionSlice => {
      const s = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return { label: str(s.label, `Kategori ${idx + 1}`, 22), value: Math.abs(num(s.value, 0)) }
    })
    .filter((s) => s.value > 0)
  return out.length >= 2 ? out : [{ label: 'Kategori A', value: 60 }, { label: 'Kategori B', value: 40 }]
}

function normFunnel(v: unknown): FunnelStep[] {
  const raw = arr(v, 4)
  const out = raw
    .map((item, idx): FunnelStep => {
      const f = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return { label: str(f.label, `Tahap ${idx + 1}`, 22), value: Math.abs(num(f.value, 0)) }
    })
    .filter((f) => f.value > 0)
  if (out.length >= 2) {
    // corong harus menurun
    for (let i = 1; i < out.length; i++) {
      if (out[i].value > out[i - 1].value) out[i].value = out[i - 1].value
    }
  }
  return out
}

function normPoints(v: unknown): TrendPoint[] {
  const raw = arr(v, 12)
  const out = raw.map((item, idx): TrendPoint => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return { label: str(p.label, `#${idx + 1}`, 6), value: Math.abs(num(p.value, 0)) }
  })
  return out.length >= 3 ? out : defaultPoints()
}

function defaultPoints(): TrendPoint[] {
  return [
    { label: 'P1', value: 40 },
    { label: 'P2', value: 70 },
    { label: 'P3', value: 55 },
  ]
}

function normProgramItems(v: unknown, max: number, prefix: string): ProgramItem[] {
  const raw = arr(v, max)
  return raw.map((item, idx): ProgramItem => {
    const it = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      name: str(it.name, `${prefix} ${idx + 1}`, 34),
      detail: str(it.detail, '', 110),
      badge: str(it.badge, '', 18),
    }
  })
}

function normGroups(v: unknown): BulletGroup[] {
  const raw = arr(v, 3)
  const out = raw
    .map((item, idx): BulletGroup => {
      const g = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const items = arr(g.items, 8).map((b) => str(b, '', 110)).filter(Boolean)
      return {
        heading: str(g.heading, `Kelompok ${idx + 1}`, 34),
        items: items.length ? items : ['—'],
      }
    })
  return out.length ? out : [{ heading: 'Poin Utama', items: ['—'] }]
}

function normRows(v: unknown, cols: string[]): string[][] {
  const rows = arr(v, 8)
  if (!rows.length) return [['—', '—']]
  return rows.map((row) => {
    const cells = arr(row, cols.length)
    return cols.map((_, ci) => str(cells[ci], '—', 30))
  })
}

/** Normalisasi satu objek slide mentah (hasil AI/import) → DeckSlide valid */
function normalizeSlide(raw: unknown, idx: number, used: Set<string>, identity: DeckIdentity): DeckSlide | null {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const kindRaw = o.kind ?? o.type
  if (!isSlideKind(kindRaw)) return null
  const kind = kindRaw
  const prov = str(o.id, '', 40)
  const id = prov && !used.has(prov) ? prov : genSlideId(kind, used)
  used.add(id)
  const base = {
    id,
    kind,
    title: str(o.title, SLIDE_LABEL[kind], 90),
    subtitle: str(o.subtitle, '', 140),
    note: str(o.note, '', 1600),
  }
  switch (kind) {
    case 'cover':
      return { ...base, kind, title: str(o.title, identity.title, 90).toUpperCase() }
    case 'kpi':
      return { ...base, kind, kpis: normKpis(o.kpis) }
    case 'composition': {
      const slices = normSlices(o.slices)
      const centerValue = str(o.centerValue, '', 12) || slices.reduce((a, b) => a + b.value, 0).toLocaleString('id-ID')
      return { ...base, kind, centerLabel: str(o.centerLabel, 'Total', 24), centerValue, slices }
    }
    case 'table': {
      const cols = arr(o.columns, 6).map((c) => str(c, 'Kolom', 22))
      const columns = cols.length >= 2 ? cols : ['Kolom 1', 'Kolom 2']
      return {
        ...base,
        kind,
        columns,
        rows: normRows(o.rows, columns),
        funnelTitle: str(o.funnelTitle, 'Corong Konversi', 40),
        funnel: normFunnel(o.funnel),
      }
    }
    case 'trend':
      return { ...base, kind, points: normPoints(o.points), insight: str(o.insight, 'Insight akan dilengkapi dari dokumen sumber.', 160) }
    case 'programs':
      return { ...base, kind, items: normProgramItems(o.items, 8, 'Program') }
    case 'bullets':
      return { ...base, kind, groups: normGroups(o.groups) }
    case 'steps':
      return { ...base, kind, items: normProgramItems(o.items, 6, 'Langkah') }
    case 'closing':
      return {
        ...base,
        kind,
        message: str(o.message, 'Terima kasih — diskusi dan arahan lebih lanjut kami nantikan.', 140),
        bullets: arr(o.bullets, 4).map((b) => str(b, '', 48)).filter(Boolean),
        contact: str(o.contact, '', 60),
      }
  }
}

// ─── Konversi format lama (7 bagian tetap + notes) → slides[] ───────────────

export function legacyToSlides(raw: Record<string, unknown>, identity: DeckIdentity): DeckSlide[] {
  const used = new Set<string>()
  const slides: DeckSlide[] = []
  const legacyNotes = (raw.notes && typeof raw.notes === 'object' ? raw.notes : {}) as Record<string, unknown>
  const noteOf = (kind: string, fallback = ''): string => {
    const v = legacyNotes[kind]
    return typeof v === 'string' && v.trim() ? v.trim().slice(0, 1600) : fallback
  }

  const push = (s: DeckSlide | null) => {
    if (s) slides.push(s)
  }

  push(normalizeSlide({ kind: 'cover', id: LEGACY_IDS.cover, note: noteOf('cover') }, 0, used, identity))

  const kpisRaw = arr(raw.kpis, 6)
  if (kpisRaw.length >= 1) {
    push(normalizeSlide({ kind: 'kpi', id: LEGACY_IDS.kpi, kpis: kpisRaw, note: noteOf('kpi') }, 1, used, identity))
  }

  const comp = (raw.composition && typeof raw.composition === 'object' ? raw.composition : {}) as Record<string, unknown>
  push(
    normalizeSlide(
      {
        kind: 'composition',
        id: LEGACY_IDS.composition,
        title: str(comp.title, SLIDE_LABEL.composition, 90),
        subtitle: str(comp.subtitle, '', 140),
        centerLabel: str(comp.centerLabel, 'Total', 24),
        centerValue: str(comp.centerValue, '', 12),
        slices: comp.slices,
        note: noteOf('composition'),
      },
      2,
      used,
      identity,
    ),
  )

  const tf = (raw.tableFunnel && typeof raw.tableFunnel === 'object' ? raw.tableFunnel : {}) as Record<string, unknown>
  push(
    normalizeSlide(
      {
        kind: 'table',
        id: LEGACY_IDS.table,
        title: str(tf.title, SLIDE_LABEL.table, 90),
        subtitle: str(tf.subtitle, '', 140),
        columns: tf.columns,
        rows: tf.rows,
        funnelTitle: str(tf.funnelTitle, 'Corong Konversi', 40),
        funnel: tf.funnel,
        note: noteOf('tableFunnel'),
      },
      3,
      used,
      identity,
    ),
  )

  const tr = (raw.trend && typeof raw.trend === 'object' ? raw.trend : {}) as Record<string, unknown>
  push(
    normalizeSlide(
      {
        kind: 'trend',
        id: LEGACY_IDS.trend,
        title: str(tr.title, SLIDE_LABEL.trend, 90),
        subtitle: str(tr.subtitle, '', 140),
        points: tr.points,
        insight: str(tr.insight, '', 160),
        note: noteOf('trend'),
      },
      4,
      used,
      identity,
    ),
  )

  const pr = (raw.programs && typeof raw.programs === 'object' ? raw.programs : {}) as Record<string, unknown>
  push(
    normalizeSlide(
      {
        kind: 'programs',
        id: LEGACY_IDS.programs,
        title: str(pr.title, SLIDE_LABEL.programs, 90),
        subtitle: str(pr.subtitle, '', 140),
        items: pr.items,
        note: noteOf('programs'),
      },
      5,
      used,
      identity,
    ),
  )

  const cl = (raw.closing && typeof raw.closing === 'object' ? raw.closing : {}) as Record<string, unknown>
  push(
    normalizeSlide(
      {
        kind: 'closing',
        id: LEGACY_IDS.closing,
        title: str(cl.title, SLIDE_LABEL.closing, 40),
        message: cl.message,
        bullets: cl.bullets,
        contact: str(cl.contact, '', 60),
        note: noteOf('closing'),
      },
      6,
      used,
      identity,
    ),
  )

  return slides
}

// ─── Normalizer utama ───────────────────────────────────────────────────────

export function normalizeDeck(raw: unknown): Deck {
  const fallbackIdentity: DeckIdentity = {
    org: 'Organisasi Internal',
    division: 'Tim Pelaporan',
    period: 'Periode Kini',
    title: 'LAPORAN KINERJA',
    subtitle: 'Ringkasan laporan — disusun otomatis dari dokumen sumber',
    date: '',
  }
  if (!raw || typeof raw !== 'object') {
    return { identity: fallbackIdentity, slides: legacyToSlides({}, fallbackIdentity) }
  }
  const r = raw as Record<string, unknown>
  const identity = cloneIdentity(r.identity, fallbackIdentity)
  const used = new Set<string>()

  // Format baru: slides[]
  const rawSlides = Array.isArray(r.slides) ? r.slides : null
  let slides: DeckSlide[] = []
  if (rawSlides && rawSlides.length >= 1) {
    rawSlides.slice(0, MAX_SLIDES).forEach((item, idx) => {
      const s = normalizeSlide(item, idx, used, identity)
      if (s) slides.push(s)
    })
  } else {
    slides = legacyToSlides(r, identity)
    for (const s of slides) used.add(s.id)
  }

  if (!slides.length) {
    slides = legacyToSlides({}, identity)
    for (const s of slides) used.add(s.id)
  }

  // Sampul wajib jadi slide pertama
  if (slides[0]?.kind !== 'cover') {
    const coverUsed = new Set(used)
    const cover = normalizeSlide({ kind: 'cover', note: '' }, 0, coverUsed, identity)
    if (cover) slides.unshift(cover)
  }
  // Penutup wajib jadi slide terakhir
  if (slides[slides.length - 1]?.kind !== 'closing') {
    const closeUsed = new Set(used)
    const closing = normalizeSlide({ kind: 'closing', note: '' }, slides.length, closeUsed, identity)
    if (closing) slides.push(closing)
  }

  return { identity, slides: slides.slice(0, MAX_SLIDES) }
}

/** Jenis slide yang belum ada di deck — untuk saran "tambah slide" */
export function missingKinds(slides: DeckSlide[]): SlideKind[] {
  const present = new Set(slides.map((s) => s.kind))
  return SLIDE_KINDS.filter((k) => !present.has(k) && k !== 'cover')
}

// Pembaruan nilai berdasarkan dot-path, mis. "slides.2.kpis.0.note" / "identity.title"
export function setByPath(deck: Deck, path: string, value: unknown): Deck {
  const keys = path.split('.')
  const clone: Deck = JSON.parse(JSON.stringify(deck))
  let cur: Record<string, unknown> = clone as unknown as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) {
    const nxt = cur?.[keys[i]]
    if (nxt == null || typeof nxt !== 'object') return clone
    cur = nxt as Record<string, unknown>
  }
  const last = keys[keys.length - 1]
  if (cur && typeof cur === 'object' && last in cur) {
    const currentVal = cur[last]
    if (typeof currentVal === 'number') {
      cur[last] = num(value, currentVal)
    } else if (Array.isArray(currentVal)) {
      const idx = Number(last)
      if (Number.isInteger(idx)) currentVal[idx] = String(value ?? '')
    } else {
      cur[last] = String(value ?? '')
    }
  }
  return clone
}

export { LEGACY_ORDER }
