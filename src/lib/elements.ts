// ─── Library Elemen Tambahan ─────────────────────────────────────────────────
// Elemen = blok HTML bebas yang diletakkan user di atas slide mana pun.
// Elemen premade memakai CSS variables tema (var(--teal), var(--radiusS)…)
// dan class utilitas .el-card/.el-acc yang didefinisikan di deck HTML,
// sehingga otomatis mengikuti tema warna/font/template yang dipilih.
// User juga bisa membuat elemen HTML kustom sendiri.

export type ElementKind =
  | 'kpi-chip'
  | 'quote'
  | 'callout'
  | 'progress'
  | 'bullets'
  | 'badge'
  | 'divider'
  | 'stat-strip'
  | 'custom'

export interface DeckElement {
  id: string
  /** id slide tujuan (deck fleksibel — slide direferensikan lewat id) */
  slide: string
  kind: ElementKind
  /** posisi dalam % terhadap panggung 1280×800 */
  x: number
  y: number
  /** lebar dalam % */
  w: number
  /** konten HTML elemen (editable user) */
  html: string
}

export interface ElementDef {
  kind: ElementKind
  label: string
  desc: string
  icon: string // nama icon lucide (untuk UI)
  build: () => string
}

const KPI_CHIP = `<div class="el-card el-acc" style="display:flex;align-items:center;gap:18px;padding:18px 26px">
  <div style="font-family:var(--fHead);font-weight:900;font-size:46px;line-height:1;color:var(--ink)">87<span style="color:var(--org);font-size:26px">%</span></div>
  <div>
    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--inkS)">Label Indikator</div>
    <div style="font-size:13px;color:var(--gray);margin-top:3px;font-weight:500">Keterangan singkat capaian</div>
  </div>
</div>`

const QUOTE = `<div style="position:relative;background:var(--tealA06);border-radius:var(--radiusS);padding:22px 28px 20px 58px">
  <div style="position:absolute;left:16px;top:6px;font-family:var(--fHead);font-size:52px;line-height:1;color:var(--teal)">“</div>
  <p style="font-family:var(--fHead);font-size:19px;line-height:1.5;color:var(--ink);font-weight:700">Belajar bukan menunggu momentum yang tepat — tetapi menciptakannya.</p>
  <p style="font-size:13px;color:var(--gray);margin-top:8px;font-weight:600">— Nama Tokoh, Jabatan</p>
</div>`

const CALLOUT = `<div style="background:var(--orgS);border-radius:var(--radiusS);border-left:6px solid var(--org);padding:16px 22px">
  <div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--orgDeep)">Perhatian</div>
  <p style="font-size:14.5px;line-height:1.55;color:var(--ink);font-weight:600;margin-top:4px">Tulis catatan penting atau sorotan angka di sini agar tidak terlewat oleh audiens.</p>
</div>`

const PROGRESS = `<div style="display:flex;flex-direction:column;gap:12px;min-width:280px">
  ${['Literasi 82%', 'Numerasi 74%', 'Kehadiran 96%']
    .map(
      (t, i) => `<div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--inkS);margin-bottom:4px"><span>${t}</span></div>
    <div style="height:10px;background:var(--tealA10);border-radius:999px;overflow:hidden"><div style="width:${[82, 74, 96][i]}%;height:100%;border-radius:999px;background:var(--funnel${i + 1})"></div></div>
  </div>`,
    )
    .join('\n  ')}
</div>`

const BULLETS = `<ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin:0;padding:0">
  ${['Poin pertama yang menonjol', 'Poin kedua — singkat & tajam', 'Poin ketiga penutup argumen']
    .map(
      (t) => `<li style="display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:600;color:var(--ink)">
    <span style="width:22px;height:22px;flex:none;border-radius:50%;background:var(--teal);color:var(--white);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900">✓</span>${t}</li>`,
    )
    .join('\n  ')}
</ul>`

const BADGE = `<div style="transform:rotate(6deg);width:110px;height:110px;border-radius:50%;background:var(--org);color:var(--white);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:var(--shadow);text-align:center">
  <div style="font-family:var(--fHead);font-weight:900;font-size:26px;line-height:1">BARU!</div>
  <div style="font-size:10.5px;font-weight:700;letter-spacing:.14em;margin-top:4px">CAPAIAN 2025</div>
</div>`

const DIVIDER = `<div style="display:flex;align-items:center;gap:10px;width:100%">
  <div style="height:5px;flex:1;border-radius:3px;background:linear-gradient(90deg,var(--teal),var(--org))"></div>
  <div style="width:10px;height:10px;border-radius:50%;background:var(--org)"></div>
</div>`

const STAT_STRIP = `<div style="display:flex;gap:14px">
  ${[
    ['1.240', 'Siswa'],
    ['38', 'Kelas'],
    ['96%', 'Hadir'],
  ]
    .map(
      ([v, l]) => `<div class="el-card" style="padding:14px 22px;text-align:center;min-width:104px">
    <div style="font-family:var(--fHead);font-weight:900;font-size:28px;color:var(--teal)">${v}</div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gray);margin-top:2px">${l}</div>
  </div>`,
    )
    .join('\n  ')}
</div>`

export const ELEMENT_LIBRARY: ElementDef[] = [
  { kind: 'kpi-chip', label: 'Kartu KPI', desc: 'Angka besar + label', icon: 'Gauge', build: () => KPI_CHIP },
  { kind: 'quote', label: 'Kutipan', desc: 'Quote menonjol', icon: 'Quote', build: () => QUOTE },
  { kind: 'callout', label: 'Sorotan', desc: 'Kotak perhatian', icon: 'AlertCircle', build: () => CALLOUT },
  { kind: 'progress', label: 'Progres', desc: '3 batang capaian', icon: 'ListChecks', build: () => PROGRESS },
  { kind: 'bullets', label: 'Butir Ceklis', desc: 'Daftar poin', icon: 'CheckSquare', build: () => BULLETS },
  { kind: 'badge', label: 'Stempel', desc: 'Lencana bundar miring', icon: 'BadgeCheck', build: () => BADGE },
  { kind: 'divider', label: 'Pembatas', desc: 'Garis gradasi aksen', icon: 'Minus', build: () => DIVIDER },
  { kind: 'stat-strip', label: 'Strip Statistik', desc: '3 mini angka', icon: 'BarChart3', build: () => STAT_STRIP },
]

export function elementDef(kind: ElementKind): ElementDef | undefined {
  return ELEMENT_LIBRARY.find((e) => e.kind === kind)
}

export function newElementId(): string {
  return 'el' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** Posisi default yang wajar agar tidak menumpuk elemen lain di slide yang sama */
export function defaultPos(existingOnSlide: number): { x: number; y: number; w: number } {
  const slots = [
    { x: 6, y: 62, w: 34 },
    { x: 58, y: 60, w: 32 },
    { x: 6, y: 78, w: 30 },
    { x: 64, y: 78, w: 28 },
    { x: 36, y: 44, w: 30 },
  ]
  return slots[existingOnSlide % slots.length]
}

export function createElement(
  kind: ElementKind,
  slide: string,
  existingOnSlide = 0,
  html?: string,
): DeckElement {
  const def = elementDef(kind)
  const pos = defaultPos(existingOnSlide)
  return {
    id: newElementId(),
    slide,
    kind,
    x: pos.x,
    y: pos.y,
    w: pos.w,
    html: html ?? def?.build() ?? '<div class="el-card" style="padding:16px">Elemen kustom</div>',
  }
}
