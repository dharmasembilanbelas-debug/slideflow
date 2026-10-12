'use client'

import { useMemo, useState } from 'react'
import { Palette, Type, Layers, Sparkles, Pipette } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useStudio } from '@/lib/store'
import {
  TEMPLATES, FONT_THEMES, COLOR_THEMES, ANIM_PRESETS,
  DEFAULT_CUSTOM_COLOR, DEFAULT_CUSTOM_FONT, deriveColor, isHexColor,
} from '@/lib/themes'
import type { DeckStyle, CustomColorInput, CustomFontInput } from '@/lib/themes'
import { buildTemplatePreview } from '@/lib/template-preview'

// ─── Panel 2 · Gaya Desain: template, tema font, tema warna, animasi, latar ──

const ANIM_DEMO_CSS = `
@keyframes demoCinematic{0%{transform:translateX(0) skewX(0)}45%{transform:translateX(52px) skewX(-6deg)}50%{opacity:.4}100%{transform:translateX(0) skewX(0)}}
@keyframes demoEnergetic{0%{transform:translateX(0) scale(1)}40%{transform:translateX(52px) scale(1.25)}70%{transform:translateX(44px) scale(.9)}100%{transform:translateX(0) scale(1)}}
@keyframes demoSmooth{0%{transform:translateX(0);opacity:1}45%{transform:translateX(56px);opacity:.35}55%{opacity:.35}100%{transform:translateX(0);opacity:1}}
@keyframes demoMinimal{0%,100%{opacity:1}50%{opacity:.15}}
.demo-dot-cinematic{animation:demoCinematic 2.2s cubic-bezier(.65,0,.35,1) infinite}
.demo-dot-energetic{animation:demoEnergetic 1.8s cubic-bezier(.34,1.56,.64,1) infinite}
.demo-dot-smooth{animation:demoSmooth 2.4s cubic-bezier(.22,1,.36,1) infinite}
.demo-dot-minimal{animation:demoMinimal 1.8s ease-in-out infinite}
`

/** Preset warna latar slide terang — default putih sesuai permintaan */
const BG_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Putih', hex: '#FFFFFF' },
  { name: 'Salju', hex: '#F8FAFC' },
  { name: 'Krem', hex: '#FFFCF2' },
  { name: 'Abu Muda', hex: '#F2F4F6' },
]

export function DesignPanel() {
  const style = useStudio((s) => s.style)
  const setStyle = useStudio((s) => s.setStyle)

  const previews = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of TEMPLATES) {
      map.set(t.id, buildTemplatePreview({ ...style, template: t.id }))
    }
    return map
  }, [style])

  const customPalette = useMemo(() => deriveColor(style.customColor), [style.customColor])

  const setCustomColor = (patch: Partial<CustomColorInput>) =>
    setStyle({ color: 'custom', customColor: { ...style.customColor, ...patch } })

  const setCustomFont = (patch: Partial<CustomFontInput>) =>
    setStyle({ font: 'custom', customFont: { ...style.customFont, ...patch } })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">2 · Gaya Desain &amp; Animasi</CardTitle>
          <Palette className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <CardDescription className="text-xs">
          Kombinasikan template, tema font, tema warna (atau kustom), latar belakang, dan gaya animasi —
          langsung tampil di kanvas &amp; ikut terekspor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <style dangerouslySetInnerHTML={{ __html: ANIM_DEMO_CSS }} />

        {/* Template gaya desain */}
        <section aria-label="Pilihan template gaya desain">
          <SectionLabel
            icon={<Layers className="h-3.5 w-3.5" />}
            title="Template Gaya Desain"
            badge={`${TEMPLATES.length} pilihan`}
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {TEMPLATES.map((t) => {
              const active = style.template === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  title={t.tagline}
                  onClick={() => setStyle({ template: t.id })}
                  className={`group overflow-hidden rounded-lg border text-left transition-all ${
                    active
                      ? 'border-primary ring-2 ring-primary/40 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <div className="aspect-video w-full bg-ink">
                    <iframe
                      title={`Pratinjau template ${t.name}`}
                      srcDoc={previews.get(t.id)}
                      sandbox="allow-scripts"
                      loading="lazy"
                      className="h-full w-full border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 border-t bg-card px-2 py-1.5">
                    <span className="truncate text-[11px] font-bold">{t.name}</span>
                    {active && <CheckDot />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Tema font + kustom */}
        <section aria-label="Pilihan tema font">
          <SectionLabel icon={<Type className="h-3.5 w-3.5" />} title="Tema Font" badge="judul + isi + kustom" />
          <div className="flex flex-wrap gap-1.5">
            {FONT_THEMES.map((f) => {
              const active = style.font === f.id
              const [headName, bodyName] = f.name.split(' · ')
              return (
                <button
                  key={f.id}
                  type="button"
                  title={f.tagline}
                  aria-pressed={active}
                  onClick={() => setStyle({ font: f.id })}
                  className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="text-[15px] font-extrabold leading-none"
                      style={{ fontFamily: f.head }}
                    >
                      Aa
                    </span>
                    <span className="text-[11px] font-semibold leading-tight">
                      {headName}
                      <span className="block text-[9.5px] font-medium text-muted-foreground">{bodyName}</span>
                    </span>
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              aria-pressed={style.font === 'custom'}
              title="Gunakan font pilihan sendiri"
              onClick={() => setStyle({ font: 'custom' })}
              className={`rounded-lg border border-dashed px-2.5 py-1.5 text-left transition-colors ${
                style.font === 'custom'
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Pipette className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="text-[11px] font-bold leading-tight">
                  Kustom
                  <span className="block text-[9.5px] font-medium text-muted-foreground">font sendiri</span>
                </span>
              </span>
            </button>
          </div>

          {style.font === 'custom' && (
            <div className="mt-2.5 rounded-lg border bg-muted/40 p-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-bold text-muted-foreground">
                    FONT JUDUL (Google Fonts)
                  </span>
                  <Input
                    value={style.customFont.head}
                    onChange={(e) => setCustomFont({ head: e.target.value })}
                    placeholder="mis. Poppins"
                    maxLength={40}
                    className="h-8 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-bold text-muted-foreground">
                    FONT ISI (Google Fonts)
                  </span>
                  <Input
                    value={style.customFont.body}
                    onChange={(e) => setCustomFont({ body: e.target.value })}
                    placeholder="mis. Nunito"
                    maxLength={40}
                    className="h-8 text-xs"
                  />
                </label>
              </div>
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                Tulis nama font yang tersedia di Google Fonts (contoh: Poppins, Nunito, Raleway, Merriweather).
                Nama tidak valid otomatis memakai bawaan.
              </p>
            </div>
          )}
        </section>

        {/* Tema warna + kustom */}
        <section aria-label="Pilihan tema warna">
          <SectionLabel
            icon={<Palette className="h-3.5 w-3.5" />}
            title="Tema Warna"
            badge={`${COLOR_THEMES.length} palet + kustom`}
          />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {COLOR_THEMES.map((c) => {
              const active = style.color === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.hint}
                  aria-pressed={active}
                  onClick={() => setStyle({ color: c.id })}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
                    active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="flex flex-none -space-x-1">
                    {[c.teal, c.org, c.ink, c.tealHi].map((hex, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-background"
                        style={{ backgroundColor: hex }}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="truncate text-[11px] font-semibold">{c.name}</span>
                </button>
              )
            })}
            <button
              type="button"
              aria-pressed={style.color === 'custom'}
              title="Susun palet warna sendiri"
              onClick={() => setStyle({ color: 'custom' })}
              className={`flex items-center gap-2 rounded-lg border border-dashed px-2 py-1.5 transition-colors ${
                style.color === 'custom'
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="flex flex-none -space-x-1">
                {['--primary', '--secondary', '--accent'].map((v, i) => (
                  <span
                    key={i}
                    className="h-4 w-4 rounded-full border border-background bg-muted"
                    style={{ background: `var(${v})` }}
                    aria-hidden
                  />
                ))}
              </span>
              <span className="text-[11px] font-bold">Kustom…</span>
            </button>
          </div>

          {style.color === 'custom' && (
            <div className="mt-2.5 rounded-lg border bg-muted/40 p-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <ColorField
                  label="Warna Utama"
                  value={style.customColor.primary}
                  onChange={(hex) => setCustomColor({ primary: hex })}
                />
                <ColorField
                  label="Warna Aksen"
                  value={style.customColor.accent}
                  onChange={(hex) => setCustomColor({ accent: hex })}
                />
                <ColorField
                  label="Warna Tinta (teks)"
                  value={style.customColor.ink}
                  onChange={(hex) => setCustomColor({ ink: hex })}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Irisan chart otomatis:
                </span>
                <span className="flex gap-1">
                  {customPalette.slices.map((hex, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-background"
                      style={{ backgroundColor: hex }}
                      title={hex}
                      aria-label={`Irisan ${i + 1}: ${hex}`}
                    />
                  ))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStyle({ color: 'custom', customColor: { ...DEFAULT_CUSTOM_COLOR } })}
                className="mt-2 text-[10px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Kembalikan ke bawaan
              </button>
            </div>
          )}
        </section>

        {/* Warna latar slide */}
        <section aria-label="Pilihan warna latar slide">
          <SectionLabel icon={<Pipette className="h-3.5 w-3.5" />} title="Warna Latar Slide" badge="default putih" />
          <div className="flex flex-wrap items-center gap-1.5">
            {BG_PRESETS.map((p) => {
              const active = style.bg.toUpperCase() === p.hex.toUpperCase()
              return (
                <button
                  key={p.hex}
                  type="button"
                  aria-pressed={active}
                  title={`Latar ${p.name} (${p.hex})`}
                  onClick={() => setStyle({ bg: p.hex })}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors ${
                    active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: p.hex }}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold">{p.name}</span>
                </button>
              )
            })}
            <ColorField
              label="Latar kustom"
              value={style.bg}
              onChange={(hex) => setStyle({ bg: hex })}
              compact
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Berlaku untuk SEMUA slide — sampul &amp; penutup kini ikut cerah mengikuti warna ini. Default putih;
            warna gelap kurang cocok untuk gaya cerah.
          </p>
        </section>

        {/* Gaya animasi */}
        <section aria-label="Pilihan gaya animasi">
          <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />} title="Gaya Animasi" badge="transisi slide" />
          <div className="grid grid-cols-2 gap-2">
            {ANIM_PRESETS.map((a) => {
              const active = style.anim === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  title={a.tagline}
                  aria-pressed={active}
                  onClick={() => setStyle({ anim: a.id })}
                  className={`rounded-lg border p-2 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="relative mb-1.5 h-4 overflow-hidden rounded bg-muted/70">
                    <span
                      className={`absolute top-1/2 left-1 h-2 w-2 -translate-y-1/2 rounded-full bg-primary demo-dot-${a.id}`}
                      aria-hidden
                    />
                    <span className="absolute top-1/2 right-1.5 h-2 w-6 -translate-y-1/2 rounded-sm bg-muted-foreground/25" aria-hidden />
                  </div>
                  <span className="text-[11px] font-bold">{a.name}</span>
                  <span className="block truncate text-[9.5px] leading-tight text-muted-foreground">{a.tagline}</span>
                </button>
              )
            })}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

/** Pemilih warna: swatch input + teks hex tervalidasi */
function ColorField({
  label,
  value,
  onChange,
  compact,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
  compact?: boolean
}) {
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  // pola "sesuaikan state saat render" (react.dev) — sinkron bila prop value berubah
  if (prevValue !== value) {
    setPrevValue(value)
    setText(value)
  }

  const commit = (t: string) => {
    const v = t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`
    if (isHexColor(v)) onChange(v.toLowerCase())
    else setText(value)
  }

  return (
    <label className="block">
      <span className={`mb-1 block font-bold text-muted-foreground ${compact ? 'text-[10px]' : 'text-[10.5px]'} uppercase tracking-wide`}>
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <input
          type="color"
          value={isHexColor(value) ? value : '#FFFFFF'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} — pemilih warna`}
          className="h-8 w-9 cursor-pointer flex-none rounded border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          }}
          aria-label={`${label} — kode hex`}
          className="h-8 w-full min-w-0 rounded border border-border bg-background px-2 font-mono text-[11px] uppercase"
          placeholder="#FFFFFF"
          maxLength={7}
        />
      </span>
    </label>
  )
}

function SectionLabel({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="text-primary" aria-hidden>
        {icon}
      </span>
      <h3 className="text-xs font-bold">{title}</h3>
      {badge && <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-semibold">{badge}</Badge>}
    </div>
  )
}

function CheckDot() {
  return (
    <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground" aria-hidden>
      ✓
    </span>
  )
}

export type { DeckStyle }
