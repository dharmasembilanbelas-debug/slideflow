import type { Deck, SlideKind } from './types'
import type { DeckStyle } from './themes'
import { resolveStyle, pptxPalette, pptxFontFaces } from './themes'
import type { DeckElement } from './elements'
import type { Branding } from './branding'
import { buildDeckHtml } from './deck-html'

// ─── Util unduh: HTML deck (bertema), HTML custom, PPTX (chart asli + notes), JSON project ──

function fmtId(n: number, decimals = 0): string {
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'deck-laporan'
  )
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadHtmlDeck(
  deck: Deck,
  style?: Partial<DeckStyle> | null,
  elements: DeckElement[] = [],
  branding?: Branding | null,
) {
  const html = buildDeckHtml(deck, { studio: false, style, elements, branding })
  saveBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${slug(deck.identity.title)}.html`)
}

/** Unduh HTML custom yang user import/edit di aplikasi */
export function downloadHtmlCustom(html: string, name: string) {
  const base = slug(name.replace(/\.html?$/i, '')) || 'desain-custom'
  saveBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${base}.html`)
}

export function downloadJsonProject(
  deck: Deck,
  context: string,
  presets: string[],
  style?: DeckStyle,
  elements: DeckElement[] = [],
  customHtml = '',
  customName = '',
  branding?: Branding | null,
) {
  const payload = {
    app: 'slideflow',
    version: 3,
    savedAt: new Date().toISOString(),
    context,
    presets,
    style,
    elements,
    customHtml,
    customName,
    branding: branding ?? { logo: null, assets: [], ornaments: [] },
    deck,
  }
  saveBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    `${slug(deck.identity.title)}.project.json`,
  )
}

export async function downloadPptxDeck(
  deck: Deck,
  style?: Partial<DeckStyle> | null,
  branding?: Branding | null,
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9' // 10 x 5.625 inci
  pptx.author = deck.identity.org || 'SlideFlow'
  pptx.title = deck.identity.title

  const r = resolveStyle(style)
  const PAL = pptxPalette(r)
  const FONT = pptxFontFaces(r)

  const TEAL = PAL.PRIMARY
  const TEALD = PAL.PRIMARY_D
  const ORG = PAL.ACCENT
  const INK = PAL.INK
  const INKS = PAL.INKS
  const GRAY = PAL.GRAY
  const MINT = PAL.MINT
  const SOFT = PAL.PRIMARY_S
  const ORGS = PAL.ACCENT_S
  const ORGDEEP = PAL.ACCENT_DEEP
  const PAPER = PAL.PAPER
  /** latar sampul & penutup mengikuti pilihan user (default putih) — gaya cerah */
  const BG = r.bg.toUpperCase()
  const TOTAL = deck.slides.length
  const pad2 = (n: number) => (n < 10 ? '0' : '') + n

  // ── Branding (logo & ornamen) — geometri panggung 1280×800 px → 10×5.625 in ──
  const STAGE_W = 10
  const STAGE_H = 5.625
  const K = STAGE_W / 1280 // inci per px
  const brand = branding ?? { logo: null, assets: [], ornaments: [] }
  const dimCache = new Map<string, { w: number; h: number }>()

  const measure = (src: string) =>
    new Promise<{ w: number; h: number }>((resolve) => {
      const hit = dimCache.get(src)
      if (hit) return resolve(hit)
      const img = new Image()
      img.onload = () => {
        const d = { w: img.naturalWidth || 800, h: img.naturalHeight || 450 }
        dimCache.set(src, d)
        resolve(d)
      }
      img.onerror = () => resolve({ w: 800, h: 450 })
      img.src = src
    })

  const pptxData = (src: string) => src.replace(/^data:/, '')

  /** Ornamen latar user — dipanggil SEBELUM konten agar berada di belakang */
  const addOrnamentLayer = async (s: PptxSlide, slideData: Deck['slides'][number]) => {
    for (const p of brand.ornaments) {
      const a = brand.assets.find((x) => x.id === p.assetId)
      if (!a) continue
      const applies =
        p.target === 'all' || (p.target === 'cover' ? slideData.kind === 'cover' : slideData.id === p.target)
      if (!applies) continue
      const src = a.kind === 'video' ? a.poster || '' : a.src
      if (!src) continue // video tanpa poster → lewati di PPTX
      const d = await measure(src)
      let wIn: number, hIn: number, x: number, y: number
      if (p.pos === 'full') {
        const scale = Math.max(STAGE_W / (d.w * K), STAGE_H / (d.h * K))
        wIn = d.w * K * scale
        hIn = d.h * K * scale
        x = (STAGE_W - wIn) / 2
        y = (STAGE_H - hIn) / 2
      } else {
        wIn = (p.w / 100) * STAGE_W
        hIn = wIn * (d.h / d.w)
        const H = p.pos.charAt(1)
        const V = p.pos.charAt(0)
        x = H === 'l' ? 0.3 : H === 'c' ? (STAGE_W - wIn) / 2 : STAGE_W - 0.3 - wIn
        y = V === 't' ? 0.3 : V === 'm' ? (STAGE_H - hIn) / 2 : STAGE_H - 0.3 - hIn
      }
      s.addImage({
        data: pptxData(src),
        x,
        y,
        w: wIn,
        h: hIn,
        transparency: Math.max(0, Math.min(100, Math.round((1 - p.opacity) * 100))),
      })
    }
  }

  /** Logo — dipanggil SETELAH konten agar tampil di atas */
  const addLogoLayer = async (s: PptxSlide, kind: SlideKind) => {
    const L = brand.logo
    if (!L || !L.src) return
    if (L.apply === 'cover' && kind !== 'cover') return
    const d = await measure(L.src)
    const wIn = (L.size || 110) * K
    const hIn = wIn * (d.h / d.w)
    const m = 26 * K
    let x = m
    let y = m
    if (L.pos === 'tr') x = STAGE_W - m - wIn
    else if (L.pos === 'bl') y = STAGE_H - m - hIn
    else if (L.pos === 'br') {
      x = STAGE_W - m - wIn
      y = STAGE_H - m - hIn
    }
    s.addImage({
      data: pptxData(L.src),
      x,
      y,
      w: wIn,
      h: hIn,
      transparency: Math.max(0, Math.min(100, Math.round((1 - L.opacity) * 100))),
    })
  }

  const addFooter = (slide: PptxSlide, num: number) => {
    slide.addText(`${deck.identity.org} · ${deck.identity.division} · ${deck.identity.period}`, {
      x: 0.5,
      y: 5.22,
      w: 6.5,
      h: 0.3,
      fontSize: 9,
      fontFace: FONT.body,
      color: GRAY,
    })
    slide.addText(`${pad2(num)} / ${pad2(TOTAL)}`, {
      x: 8.9,
      y: 5.22,
      w: 0.7,
      h: 0.3,
      fontSize: 9,
      fontFace: FONT.body,
      color: GRAY,
      align: 'right',
    })
  }

  /** Judul slide: kata terakhir diberi warna aksen */
  const titleBlock = (slide: PptxSlide, title: string, sub?: string) => {
    const words = String(title || 'Slide').trim().split(/\s+/)
    const last = words.length > 1 ? words.pop()! : ''
    slide.addText(
      [
        { text: words.length ? words.join(' ') + (last ? ' ' : '') : '', options: { color: INK } },
        { text: last, options: { color: ORG } },
      ],
      { x: 0.5, y: 0.32, w: 9.0, h: 0.55, fontSize: 24, bold: true, fontFace: FONT.head },
    )
    if (sub) {
      slide.addText(sub, {
        x: 0.5,
        y: 0.84,
        w: 9.0,
        h: 0.32,
        fontSize: 11,
        color: GRAY,
        fontFace: FONT.body,
      })
    }
    slide.addShape('rect', { x: 0.5, y: 1.14, w: 0.55, h: 0.045, fill: { color: ORG } })
  }

  for (let idx = 0; idx < deck.slides.length; idx++) {
    const slideData = deck.slides[idx]
    const num = idx + 1
    const s = pptx.addSlide()
    // ornamen latar user ditambahkan paling awal → berada di belakang konten
    await addOrnamentLayer(s, slideData)
    switch (slideData.kind) {
      // ── Sampul — latar CERAH mengikuti pilihan user ──
      case 'cover': {
        s.background = { color: BG }
        s.addShape('rect', { x: 0, y: 0, w: 0.14, h: 5.63, fill: { color: TEAL } })
        s.addShape('rect', { x: 9.86, y: 0, w: 0.14, h: 5.63, fill: { color: ORG } })
        s.addShape('rect', { x: 7.1, y: -0.8, w: 2.4, h: 7.2, fill: { color: TEAL, transparency: 72 }, rotate: 14 })
        s.addText(`${deck.identity.org}  ·  ${deck.identity.division}`, {
          x: 0.6, y: 0.5, w: 8.5, h: 0.35, fontSize: 12, bold: true, color: TEAL, charSpacing: 2, fontFace: FONT.body,
        })
        s.addText(deck.identity.title, {
          x: 0.6, y: 1.5, w: 8.6, h: 1.7, fontSize: 44, bold: true, color: INK, fontFace: FONT.head, charSpacing: 1,
        })
        s.addText(deck.identity.subtitle, {
          x: 0.6, y: 3.15, w: 7.6, h: 0.75, fontSize: 14, color: INKS, fontFace: FONT.body,
        })
        s.addShape('roundRect', { x: 0.6, y: 4.35, w: 2.3, h: 0.5, rectRadius: 0.25, fill: { color: TEAL } })
        s.addText(deck.identity.period, {
          x: 0.6, y: 4.35, w: 2.3, h: 0.5, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', fontFace: FONT.body,
        })
        s.addShape('roundRect', {
          x: 3.05, y: 4.35, w: 2.3, h: 0.5, rectRadius: 0.25, fill: { color: 'FFFFFF' }, line: { color: TEAL, width: 1 },
        })
        s.addText(deck.identity.date, {
          x: 3.05, y: 4.35, w: 2.3, h: 0.5, fontSize: 12, color: INKS, align: 'center', fontFace: FONT.body,
        })
        s.addNotes(slideData.note)
        break
      }

      // ── KPI ──
      case 'kpi': {
        s.background = { color: PAPER }
        titleBlock(s, slideData.title, slideData.subtitle || 'Ringkasan capaian utama — detail pada catatan pembicara')
        const kpis = slideData.kpis.length ? slideData.kpis : []
        const k0 = kpis[0]
        if (k0) {
          s.addShape('roundRect', { x: 0.5, y: 1.4, w: 4.15, h: 3.6, rectRadius: 0.12, fill: { color: TEAL } })
          s.addText(k0.label.toUpperCase(), {
            x: 0.8, y: 1.7, w: 3.6, h: 0.35, fontSize: 13, bold: true, color: MINT, charSpacing: 1.5, fontFace: FONT.body,
          })
          s.addText(
            [
              { text: fmtId(k0.value, k0.decimals), options: { fontSize: 54, bold: true, color: 'FFFFFF' } },
              { text: k0.suffix, options: { fontSize: 26, bold: true, color: ORG } },
            ],
            { x: 0.8, y: 2.2, w: 3.6, h: 1.3, fontFace: FONT.head },
          )
          s.addText(k0.note, {
            x: 0.8, y: 3.75, w: 3.5, h: 1.0, fontSize: 11, color: MINT, fontFace: FONT.body,
          })
        }
        kpis.slice(1, 4).forEach((k, i) => {
          const y = 1.4 + i * 1.26
          s.addShape('roundRect', { x: 4.95, y, w: 4.55, h: 1.12, rectRadius: 0.08, fill: { color: 'FFFFFF' }, shadow: { type: 'outer', blur: 8, offset: 2, angle: 90, color: INK, opacity: 0.14 } })
          s.addShape('rect', { x: 4.95, y, w: 0.09, h: 1.12, fill: { color: i % 2 === 0 ? TEAL : ORG } })
          s.addText(k.label.toUpperCase(), { x: 5.2, y: y + 0.1, w: 2.4, h: 0.3, fontSize: 9.5, bold: true, color: INKS, charSpacing: 1, fontFace: FONT.body })
          s.addText(
            [
              { text: fmtId(k.value, k.decimals), options: { fontSize: 22, bold: true, color: INK } },
              { text: k.suffix, options: { fontSize: 13, bold: true, color: ORG } },
            ],
            { x: 5.2, y: y + 0.38, w: 2.6, h: 0.6, fontFace: FONT.head },
          )
          s.addText(k.note, { x: 7.55, y: y + 0.12, w: 1.85, h: 0.9, fontSize: 8.5, color: GRAY, fontFace: FONT.body })
        })
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Komposisi (doughnut asli) ──
      case 'composition': {
        s.background = { color: 'FFFFFF' }
        titleBlock(s, slideData.title, slideData.subtitle)
        const labels = slideData.slices.map((x) => x.label)
        const values = slideData.slices.map((x) => x.value)
        s.addChart('doughnut', [{ name: slideData.title, labels, values }], {
          x: 0.35,
          y: 1.32,
          w: 4.7,
          h: 3.75,
          holeSize: 62,
          chartColors: r.color.slices.map((c) => c.replace('#', '').toUpperCase()),
          showLegend: true,
          legendPos: 'b',
          legendFontSize: 10,
          legendColor: INK,
          showPercent: true,
          dataLabelColor: 'FFFFFF',
          dataLabelFontSize: 9,
          showTitle: false,
        })
        s.addText(slideData.centerValue, {
          x: 5.35, y: 1.5, w: 4.1, h: 0.75, fontSize: 40, bold: true, color: INK, fontFace: FONT.head,
        })
        s.addText(slideData.centerLabel.toUpperCase(), {
          x: 5.35, y: 2.22, w: 4.1, h: 0.3, fontSize: 11, bold: true, color: GRAY, charSpacing: 2, fontFace: FONT.body,
        })
        const total = values.reduce((a, b) => a + b, 0) || 1
        const lines = slideData.slices.map((x) => ({
          text: `${x.label} — ${fmtId(x.value)} (${((x.value / total) * 100).toFixed(1).replace('.', ',')}%)`,
          options: { bullet: { code: '2022', indent: 12 }, color: INK, breakLine: true },
        }))
        s.addText(lines, { x: 5.35, y: 2.75, w: 4.2, h: 2.2, fontSize: 12.5, fontFace: FONT.body, lineSpacingMultiple: 1.35 })
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Tabel + Corong ──
      case 'table': {
        s.background = { color: PAPER }
        titleBlock(s, slideData.title, slideData.subtitle)
        const header = slideData.columns.map((c) => ({
          text: c,
          options: { fill: { color: TEAL }, color: 'FFFFFF', bold: true, fontSize: 10.5, valign: 'middle' as const },
        }))
        const body = slideData.rows.map((row, ri) =>
          slideData.columns.map((_, ci) => ({
            text: row[ci] ?? '—',
            options: {
              fill: { color: ri % 2 === 0 ? 'FFFFFF' : SOFT },
              color: INK,
              bold: ci === 0,
              fontSize: 10.5,
              align: ci === 0 ? ('left' as const) : ('right' as const),
              valign: 'middle' as const,
            },
          })),
        )
        const nCols = slideData.columns.length
        s.addTable([header, ...body], {
          x: 0.5,
          y: 1.4,
          w: 5.3,
          colW: Array(nCols).fill(5.3 / nCols),
          rowH: 0.42,
          border: { type: 'solid', color: SOFT, pt: 0.75 },
          fontFace: FONT.body,
          margin: 0.06,
        })
        if (slideData.funnel.length >= 2) {
          s.addText(slideData.funnelTitle, {
            x: 6.15, y: 1.4, w: 3.4, h: 0.4, fontSize: 15, bold: true, color: INK, fontFace: FONT.head,
          })
          const maxF = Math.max(...slideData.funnel.map((f) => f.value), 1)
          const fColors = [TEALD, TEAL, ORG]
          slideData.funnel.forEach((f, i) => {
            const y = 1.95 + i * 1.02
            s.addText(f.label, { x: 6.15, y, w: 2.4, h: 0.28, fontSize: 10.5, bold: true, color: INKS, fontFace: FONT.body })
            s.addText(fmtId(f.value), {
              x: 8.55, y, w: 1.0, h: 0.28, fontSize: 12, bold: true, color: INK, align: 'right', fontFace: FONT.head,
            })
            s.addShape('roundRect', {
              x: 6.15,
              y: y + 0.32,
              w: Math.max((f.value / maxF) * 3.4, 0.5),
              h: 0.42,
              rectRadius: 0.06,
              fill: { color: fColors[i % fColors.length] },
            })
          })
        }
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Tren (bar chart asli) ──
      case 'trend': {
        s.background = { color: PAPER }
        titleBlock(s, slideData.title, slideData.subtitle)
        s.addChart(
          'bar',
          [{ name: slideData.title, labels: slideData.points.map((p) => p.label), values: slideData.points.map((p) => p.value) }],
          {
            x: 0.45,
            y: 1.28,
            w: 9.1,
            h: 3.05,
            barDir: 'col',
            barGapWidthPct: 40,
            chartColors: [TEAL],
            showLegend: false,
            showValue: true,
            dataLabelColor: INK,
            dataLabelFontSize: 10,
            dataLabelPosition: 'outEnd',
            catAxisLabelColor: INKS,
            catAxisLabelFontSize: 10,
            valAxisHidden: true,
            valGridLine: { style: 'none' },
            showTitle: false,
          },
        )
        s.addShape('roundRect', { x: 0.5, y: 4.45, w: 9.0, h: 0.62, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: SOFT, width: 1 } })
        s.addShape('rect', { x: 0.5, y: 4.45, w: 0.08, h: 0.62, fill: { color: ORG } })
        s.addText(
          [
            { text: 'Insight: ', options: { bold: true, color: INK } },
            { text: slideData.insight, options: { color: GRAY } },
          ],
          { x: 0.72, y: 4.45, w: 8.7, h: 0.62, fontSize: 10.5, valign: 'middle', fontFace: FONT.body },
        )
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Program / Kartu ──
      case 'programs': {
        s.background = { color: 'FFFFFF' }
        titleBlock(s, slideData.title, slideData.subtitle)
        slideData.items.slice(0, 4).forEach((p, i) => {
          const col = i % 2
          const row = Math.floor(i / 2)
          const x = 0.5 + col * 4.62
          const y = 1.38 + row * 1.95
          s.addShape('roundRect', {
            x, y, w: 4.42, h: 1.78, rectRadius: 0.1, fill: { color: 'FFFFFF' },
            line: { color: SOFT, width: 1 },
            shadow: { type: 'outer', blur: 7, offset: 2, angle: 90, color: INK, opacity: 0.12 },
          })
          s.addShape('rect', { x, y: y + 1.73, w: 4.42, h: 0.05, fill: { color: i % 2 === 0 ? TEAL : ORG } })
          if (p.badge) {
            s.addShape('roundRect', { x: x + 3.0, y: y + 0.16, w: 1.28, h: 0.34, rectRadius: 0.17, fill: { color: ORGS } })
            s.addText(p.badge, { x: x + 3.0, y: y + 0.16, w: 1.28, h: 0.34, fontSize: 8.5, bold: true, color: ORGDEEP, align: 'center', fontFace: FONT.body })
          }
          s.addText(p.name, { x: x + 0.25, y: y + 0.2, w: 2.7, h: 0.4, fontSize: 14.5, bold: true, color: INK, fontFace: FONT.head })
          s.addText(p.detail, { x: x + 0.25, y: y + 0.68, w: 3.95, h: 1.0, fontSize: 10, color: GRAY, fontFace: FONT.body })
        })
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Poin per kategori (dua kolom teks) ──
      case 'bullets': {
        s.background = { color: PAPER }
        titleBlock(s, slideData.title, slideData.subtitle)
        slideData.groups.slice(0, 2).forEach((g, gi) => {
          const x = 0.5 + gi * 4.62
          const w = slideData.groups.length === 1 ? 9.0 : 4.42
          s.addShape('roundRect', {
            x, y: 1.38, w, h: 3.55, rectRadius: 0.1, fill: { color: 'FFFFFF' },
            line: { color: SOFT, width: 1 },
            shadow: { type: 'outer', blur: 7, offset: 2, angle: 90, color: INK, opacity: 0.12 },
          })
          s.addShape('rect', { x, y: 1.38, w: w, h: 0.06, fill: { color: gi % 2 === 0 ? TEAL : ORG } })
          s.addText(g.heading, { x: x + 0.28, y: 1.6, w: w - 0.56, h: 0.4, fontSize: 15, bold: true, color: INK, fontFace: FONT.head })
          const lines = g.items.slice(0, 7).map((it) => ({
            text: it,
            options: { bullet: { code: '2022', indent: 12 }, color: INKS, breakLine: true },
          }))
          s.addText(lines.length ? lines : [{ text: '—', options: { color: GRAY } }], {
            x: x + 0.28, y: 2.05, w: w - 0.56, h: 2.7, fontSize: 11.5, fontFace: FONT.body, lineSpacingMultiple: 1.35,
          })
        })
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Langkah bernomor ──
      case 'steps': {
        s.background = { color: 'FFFFFF' }
        titleBlock(s, slideData.title, slideData.subtitle)
        const items = slideData.items.slice(0, 4)
        const wCard = 9.0 / Math.max(items.length, 1) - 0.25
        items.forEach((p, i) => {
          const x = 0.5 + i * (wCard + 0.25)
          s.addShape('roundRect', {
            x, y: 1.5, w: wCard, h: 3.2, rectRadius: 0.1, fill: { color: 'FFFFFF' },
            line: { color: SOFT, width: 1 },
            shadow: { type: 'outer', blur: 7, offset: 2, angle: 90, color: INK, opacity: 0.12 },
          })
          s.addShape('rect', { x, y: 1.5, w: wCard, h: 0.06, fill: { color: ORG } })
          s.addText(pad2(i + 1), { x: x + 0.2, y: 1.68, w: 1.2, h: 0.7, fontSize: 34, bold: true, color: TEAL, fontFace: FONT.head })
          s.addText(p.name, { x: x + 0.2, y: 2.45, w: wCard - 0.4, h: 0.65, fontSize: 13, bold: true, color: INK, fontFace: FONT.head })
          s.addText(p.detail, { x: x + 0.2, y: 3.1, w: wCard - 0.4, h: 1.4, fontSize: 9.5, color: GRAY, fontFace: FONT.body })
        })
        addFooter(s, num)
        s.addNotes(slideData.note)
        break
      }

      // ── Penutup — latar CERAH mengikuti pilihan user ──
      case 'closing': {
        s.background = { color: BG }
        s.addShape('ellipse', { x: -1.2, y: 3.8, w: 3.6, h: 3.6, fill: { color: TEAL, transparency: 72 } })
        s.addText(slideData.title.toUpperCase(), {
          x: 0.6, y: 0.75, w: 8.8, h: 0.35, fontSize: 13, bold: true, color: TEAL, charSpacing: 3, fontFace: FONT.body,
        })
        s.addText(slideData.message, {
          x: 0.6, y: 1.35, w: 8.8, h: 1.5, fontSize: 27, bold: true, color: INK, fontFace: FONT.head,
        })
        slideData.bullets.slice(0, 3).forEach((b, i) => {
          const y = 3.1 + i * 0.52
          s.addShape('ellipse', { x: 0.65, y: y + 0.04, w: 0.32, h: 0.32, fill: { color: ORG } })
          s.addText(String(i + 1), { x: 0.65, y: y + 0.04, w: 0.32, h: 0.32, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: FONT.body })
          s.addText(b, { x: 1.12, y, w: 7.5, h: 0.42, fontSize: 13, bold: true, color: INKS, fontFace: FONT.body })
        })
        s.addText(slideData.contact, {
          x: 0.6, y: 4.95, w: 8.8, h: 0.35, fontSize: 11, color: INKS, fontFace: FONT.body,
        })
        s.addText(pad2(TOTAL), { x: 8.3, y: 4.4, w: 1.4, h: 1.0, fontSize: 44, bold: true, color: TEAL, align: 'right', fontFace: FONT.head })
        s.addNotes(slideData.note)
        break
      }
    }
    // logo user dicetak terakhir → tampil di atas konten
    await addLogoLayer(s, slideData.kind)
  }

  const data = await pptx.write({ outputType: 'blob' })
  saveBlob(data as Blob, `${slug(deck.identity.title)}.pptx`)
}

// Tipe minimal agar tidak bergantung pada tipe internal pptxgenjs
type PptxSlide = ReturnType<import('pptxgenjs').default['addSlide']>
