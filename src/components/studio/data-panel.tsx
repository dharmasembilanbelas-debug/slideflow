'use client'

import type { ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useStudio } from '@/lib/store'
import type { DeckSlide } from '@/lib/types'
import { SLIDE_DESC, SLIDE_KINDS, SLIDE_LABEL } from '@/lib/types'
import { parseIdNumber } from '@/lib/deck-parser'

// ─── Primitif editor terikat store ──────────────────────────────────────────

function TextField({
  label,
  path,
  value,
  placeholder,
  className,
}: {
  label: string
  path: string
  value: string
  placeholder?: string
  className?: string
}) {
  const editByPath = useStudio((s) => s.editByPath)
  return (
    <div className={className}>
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => editByPath(path, e.target.value)}
        className="mt-1 h-8 text-[13px]"
      />
    </div>
  )
}

function NumberField({
  label,
  path,
  value,
  className,
}: {
  label: string
  path: string
  value: number
  className?: string
}) {
  const editByPath = useStudio((s) => s.editByPath)
  return (
    <div className={className}>
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Input
        value={String(value)}
        inputMode="decimal"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const n = parseIdNumber(e.target.value)
          editByPath(path, n ?? 0)
        }}
        className="mt-1 h-8 text-[13px]"
      />
    </div>
  )
}

function AreaField({
  label,
  path,
  value,
  rows = 2,
  className,
}: {
  label: string
  path: string
  value: string
  rows?: number
  className?: string
}) {
  const editByPath = useStudio((s) => s.editByPath)
  return (
    <div className={className}>
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        rows={rows}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => editByPath(path, e.target.value)}
        className="mt-1 resize-y text-[13px] leading-5"
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">{children}</p>
}

function RowDelete({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="mb-0.5 h-8 w-8 flex-none text-muted-foreground hover:text-destructive"
      aria-label={label}
      onClick={onClick}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
    </Button>
  )
}

// ─── Editor konten per jenis slide (jalur: slides.<idx>…) ───────────────────

function SlideContentEditor({ slide, idx }: { slide: DeckSlide; idx: number }) {
  const mutate = (fn: (d: DeckSlide) => void) => {
    useStudio.setState((s) => {
      const next = JSON.parse(JSON.stringify(s.deck)) as typeof s.deck
      fn(next.slides[idx])
      return { deck: next }
    })
  }
  const P = `slides.${idx}`
  const head = (
    <>
      <TextField label="Judul slide" path={`${P}.title`} value={slide.title} />
      {slide.kind !== 'cover' && slide.kind !== 'closing' && (
        <AreaField label="Subjudul" path={`${P}.subtitle`} value={slide.subtitle} rows={2} />
      )}
    </>
  )

  switch (slide.kind) {
    case 'cover':
      return (
        <div className="space-y-3">
          <SectionTitle>Sampul — memakai data Identitas</SectionTitle>
          <p className="text-[12px] leading-5 text-muted-foreground">
            Judul, subjudul, organisasi, dan periode sampul diambil dari tab <b>Identitas</b> agar konsisten di
            seluruh deck. Catatan pembicara slide ini bisa disunting di bawah.
          </p>
        </div>
      )
    case 'kpi':
      return (
        <div className="space-y-3">
          {head}
          <p className="text-[11px] font-semibold text-muted-foreground">
            Indikator KPI ({slide.kpis.length}) — pertama jadi kartu hero besar
          </p>
          {slide.kpis.map((k, i) => (
            <div key={i} className="rounded-lg border bg-card p-2.5">
              <div className="grid grid-cols-[1fr_84px_64px] gap-2">
                <TextField label="Label" path={`${P}.kpis.${i}.label`} value={k.label} />
                <NumberField label="Nilai" path={`${P}.kpis.${i}.value`} value={k.value} />
                <TextField label="Satuan" path={`${P}.kpis.${i}.suffix`} value={k.suffix} placeholder="%" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <TextField label="Catatan singkat" path={`${P}.kpis.${i}.note`} value={k.note} className="flex-1" />
                {slide.kpis.length > 2 && (
                  <RowDelete label={`Hapus KPI ${i + 1}`} onClick={() => mutate((s) => (s.kind === 'kpi' && s.kpis.splice(i, 1)))} />
                )}
              </div>
            </div>
          ))}
          {slide.kpis.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'kpi' && s.kpis.push({ label: 'Indikator baru', value: 0, suffix: '', decimals: 0, note: '' }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah KPI
            </Button>
          )}
        </div>
      )
    case 'composition':
      return (
        <div className="space-y-3">
          {head}
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Label pusat" path={`${P}.centerLabel`} value={slide.centerLabel} />
            <TextField label="Nilai pusat" path={`${P}.centerValue`} value={slide.centerValue} />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">Irisan ({slide.slices.length})</p>
          {slide.slices.map((s, i) => (
            <div key={i} className="flex items-end gap-2">
              <TextField label={`#${i + 1}`} path={`${P}.slices.${i}.label`} value={s.label} className="flex-1" />
              <NumberField label="Nilai" path={`${P}.slices.${i}.value`} value={s.value} className="w-24" />
              <RowDelete label={`Hapus irisan ${i + 1}`} onClick={() => mutate((sl) => (sl.kind === 'composition' && sl.slices.splice(i, 1)))} />
            </div>
          ))}
          {slide.slices.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'composition' && s.slices.push({ label: 'Kategori baru', value: 10 }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah irisan
            </Button>
          )}
        </div>
      )
    case 'table':
      return (
        <div className="space-y-3">
          {head}
          <p className="text-[11px] font-semibold text-muted-foreground">Kolom ({slide.columns.length})</p>
          {slide.columns.map((c, i) => (
            <TextField key={i} label={`Kolom ${i + 1}`} path={`${P}.columns.${i}`} value={c} />
          ))}
          <p className="text-[11px] font-semibold text-muted-foreground">Baris ({slide.rows.length})</p>
          {slide.rows.map((row, ri) => (
            <div key={ri} className="flex items-end gap-1.5 rounded-lg border bg-card p-2">
              {slide.columns.map((_, ci) => (
                <Input
                  key={ci}
                  value={row[ci] ?? ''}
                  onChange={(e) => mutate((s) => s.kind === 'table' && (s.rows[ri][ci] = e.target.value))}
                  className="h-8 flex-1 px-2 text-[12px]"
                  aria-label={`Baris ${ri + 1} kolom ${ci + 1}`}
                />
              ))}
              <RowDelete label={`Hapus baris ${ri + 1}`} onClick={() => mutate((s) => s.kind === 'table' && s.rows.splice(ri, 1))} />
            </div>
          ))}
          <div className="my-2 h-px bg-border" />
          <SectionTitle>Corong Konversi (opsional)</SectionTitle>
          <TextField label="Judul corong" path={`${P}.funnelTitle`} value={slide.funnelTitle} />
          {slide.funnel.map((f, i) => (
            <div key={i} className="flex items-end gap-2">
              <TextField label={`Tahap ${i + 1}`} path={`${P}.funnel.${i}.label`} value={f.label} className="flex-1" />
              <NumberField label="Nilai" path={`${P}.funnel.${i}.value`} value={f.value} className="w-24" />
              <RowDelete label={`Hapus tahap ${i + 1}`} onClick={() => mutate((s) => s.kind === 'table' && s.funnel.splice(i, 1))} />
            </div>
          ))}
          {slide.funnel.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'table' && s.funnel.push({ label: 'Tahap baru', value: 10 }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah tahap
            </Button>
          )}
        </div>
      )
    case 'trend':
      return (
        <div className="space-y-3">
          {head}
          <AreaField label="Insight" path={`${P}.insight`} value={slide.insight} rows={2} />
          <p className="text-[11px] font-semibold text-muted-foreground">Titik data ({slide.points.length})</p>
          {slide.points.map((p, i) => (
            <div key={i} className="flex items-end gap-2">
              <TextField label="Label" path={`${P}.points.${i}.label`} value={p.label} className="w-24" />
              <NumberField label="Nilai" path={`${P}.points.${i}.value`} value={p.value} className="flex-1" />
              {slide.points.length > 3 && (
                <RowDelete label={`Hapus titik ${i + 1}`} onClick={() => mutate((s) => s.kind === 'trend' && s.points.splice(i, 1))} />
              )}
            </div>
          ))}
          {slide.points.length < 12 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'trend' && s.points.push({ label: 'Baru', value: 10 }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah titik
            </Button>
          )}
        </div>
      )
    case 'programs':
      return (
        <div className="space-y-3">
          {head}
          {slide.items.map((p, i) => (
            <div key={i} className="relative rounded-lg border bg-card p-2.5">
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <TextField label={`Kartu ${i + 1}`} path={`${P}.items.${i}.name`} value={p.name} />
                <TextField label="Lencana" path={`${P}.items.${i}.badge`} value={p.badge} />
              </div>
              <AreaField label="Detail" path={`${P}.items.${i}.detail`} value={p.detail} rows={2} className="mt-2" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label={`Hapus kartu ${i + 1}`}
                onClick={() => mutate((s) => s.kind === 'programs' && s.items.splice(i, 1))}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          ))}
          {slide.items.length < 8 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'programs' && s.items.push({ name: 'Kartu baru', detail: '', badge: '' }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah kartu
            </Button>
          )}
        </div>
      )
    case 'bullets':
      return (
        <div className="space-y-3">
          {head}
          {slide.groups.map((g, gi) => (
            <div key={gi} className="rounded-lg border bg-card p-2.5">
              <div className="flex items-end gap-2">
                <TextField label={`Kelompok ${gi + 1}`} path={`${P}.groups.${gi}.heading`} value={g.heading} className="flex-1" />
                {slide.groups.length > 1 && (
                  <RowDelete label={`Hapus kelompok ${gi + 1}`} onClick={() => mutate((s) => s.kind === 'bullets' && s.groups.splice(gi, 1))} />
                )}
              </div>
              {g.items.map((it, ii) => (
                <div key={ii} className="mt-1.5 flex items-end gap-2">
                  <TextField label={`Butir ${ii + 1}`} path={`${P}.groups.${gi}.items.${ii}`} value={it} className="flex-1" />
                  <RowDelete label={`Hapus butir ${ii + 1}`} onClick={() => mutate((s) => s.kind === 'bullets' && s.groups[gi].items.splice(ii, 1))} />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 gap-1 text-[11px]"
                onClick={() => mutate((s) => s.kind === 'bullets' && s.groups[gi].items.push('Butir baru'))}
              >
                <Plus className="h-3 w-3" aria-hidden /> Butir
              </Button>
            </div>
          ))}
          {slide.groups.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'bullets' && s.groups.push({ heading: 'Kelompok baru', items: ['Butir pertama'] }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah kelompok
            </Button>
          )}
        </div>
      )
    case 'steps':
      return (
        <div className="space-y-3">
          {head}
          {slide.items.map((p, i) => (
            <div key={i} className="relative rounded-lg border bg-card p-2.5">
              <div className="grid grid-cols-[56px_1fr] gap-2">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">No.</Label>
                  <Input value={String(i + 1)} readOnly className="mt-1 h-8 bg-muted/50 text-center text-[13px] font-bold" aria-label={`Nomor langkah ${i + 1}`} />
                </div>
                <TextField label={`Langkah ${i + 1}`} path={`${P}.items.${i}.name`} value={p.name} />
              </div>
              <AreaField label="Detail" path={`${P}.items.${i}.detail`} value={p.detail} rows={2} className="mt-2" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label={`Hapus langkah ${i + 1}`}
                onClick={() => mutate((s) => s.kind === 'steps' && s.items.splice(i, 1))}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          ))}
          {slide.items.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => mutate((s) => s.kind === 'steps' && s.items.push({ name: 'Langkah baru', detail: '', badge: '' }))}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah langkah
            </Button>
          )}
        </div>
      )
    case 'closing':
      return (
        <div className="space-y-3">
          <SectionTitle>Penutup</SectionTitle>
          <TextField label="Judul" path={`${P}.title`} value={slide.title} />
          <AreaField label="Pesan utama" path={`${P}.message`} value={slide.message} rows={2} />
          {slide.bullets.map((b, i) => (
            <div key={i} className="flex items-end gap-2">
              <TextField label={`Butir ${i + 1}`} path={`${P}.bullets.${i}`} value={b} className="flex-1" />
              <RowDelete label={`Hapus butir ${i + 1}`} onClick={() => mutate((s) => s.kind === 'closing' && s.bullets.splice(i, 1))} />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => mutate((s) => s.kind === 'closing' && s.bullets.push('Butir baru'))}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Tambah butir
          </Button>
          <TextField label="Kontak" path={`${P}.contact`} value={slide.contact} />
        </div>
      )
  }
}

// ─── Panel utama ────────────────────────────────────────────────────────────

export function DataPanel() {
  const deck = useStudio((s) => s.deck)
  const index = useStudio((s) => s.currentIndex)
  const addSlide = useStudio((s) => s.addSlide)
  const duplicateSlide = useStudio((s) => s.duplicateSlide)
  const removeSlide = useStudio((s) => s.removeSlide)
  const moveSlide = useStudio((s) => s.moveSlide)
  const setIndex = useStudio((s) => s.setIndex)

  const slide: DeckSlide | undefined = deck.slides[index] ?? deck.slides[0]
  if (!slide) return null

  return (
    <Tabs defaultValue="slide" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto bg-muted/60 p-1">
        {[
          ['slide', `Slide Aktif (${index + 1}/${deck.slides.length})`],
          ['kelola', 'Kelola Slide'],
          ['identitas', 'Identitas'],
        ].map(([id, label]) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-7 whitespace-nowrap px-2.5 text-[11px] font-semibold data-[state=active]:bg-background"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-3 max-h-[520px] overflow-y-auto rounded-lg pr-1 studio-scroll">
        {/* Editor slide aktif */}
        <TabsContent value="slide" className="mt-0 space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>
              {SLIDE_LABEL[slide.kind]} — editor konten
            </SectionTitle>
            <span className="text-[10px] font-semibold text-muted-foreground">id: {slide.id}</span>
          </div>
          <SlideContentEditor slide={slide} idx={index} />
          <div className="my-2 h-px bg-border" />
          <AreaField
            label="Catatan pembicara (naskah lisan slide ini)"
            path={`slides.${index}.note`}
            value={slide.note}
            rows={4}
          />
        </TabsContent>

        {/* Kelola slide */}
        <TabsContent value="kelola" className="mt-0 space-y-3">
          <SectionTitle>Daftar Slide ({deck.slides.length})</SectionTitle>
          {deck.slides.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-lg border p-2 ${i === index ? 'border-primary bg-primary/5' : 'bg-card'}`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => setIndex(i)}
                aria-label={`Buka slide ${i + 1}`}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-muted text-[11px] font-extrabold tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold">{s.title || SLIDE_LABEL[s.kind]}</span>
                  <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {SLIDE_LABEL[s.kind]}
                  </span>
                </span>
              </button>
              <div className="flex flex-none items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Naikkan slide"
                  disabled={i <= 1 || i >= deck.slides.length - 1}
                  onClick={() => moveSlide(i, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Turunkan slide"
                  disabled={i < 1 || i >= deck.slides.length - 2}
                  onClick={() => moveSlide(i, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Duplikat slide"
                  disabled={deck.slides.length >= 24}
                  onClick={() => duplicateSlide(i)}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label="Hapus slide"
                  disabled={deck.slides.length <= 3 || i === 0 || i === deck.slides.length - 1}
                  onClick={() => removeSlide(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
          <div className="my-2 h-px bg-border" />
          <SectionTitle>Tambah Slide Baru (setelah slide aktif)</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5">
            {SLIDE_KINDS.filter((k) => k !== 'cover').map((k) => (
              <button
                key={k}
                type="button"
                title={SLIDE_DESC[k]}
                className="rounded-lg border bg-card p-2 text-left transition hover:border-primary hover:bg-primary/5"
                onClick={() => addSlide(k)}
              >
                <span className="block text-[12px] font-bold">{SLIDE_LABEL[k]}</span>
                <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{SLIDE_DESC[k]}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Sampul (slide 1) dan penutup (slide terakhir) dipertahankan otomatis. Jumlah slide bebas — maksimal 24.
          </p>
        </TabsContent>

        {/* Identitas */}
        <TabsContent value="identitas" className="mt-0 space-y-3">
          <SectionTitle>Sampul & kop slide</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Organisasi" path="identity.org" value={deck.identity.org} />
            <TextField label="Divisi" path="identity.division" value={deck.identity.division} />
            <TextField label="Periode" path="identity.period" value={deck.identity.period} />
            <TextField label="Tanggal" path="identity.date" value={deck.identity.date} />
          </div>
          <TextField label="Judul besar" path="identity.title" value={deck.identity.title} />
          <AreaField label="Subjudul" path="identity.subtitle" value={deck.identity.subtitle} rows={2} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
