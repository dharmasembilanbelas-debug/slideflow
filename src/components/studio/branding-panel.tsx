'use client'

import { useRef, useState } from 'react'
import { Film, ImageIcon, Loader2, Shapes, Trash2, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useStudio } from '@/lib/store'
import { LOGO_ACCEPT, ORNAMENT_ACCEPT, processAssetFile } from '@/lib/asset-utils'
import { ORN_POS_GRID, ORN_POS_LABEL, newBrandId } from '@/lib/branding'
import type { LogoPos, OrnPos } from '@/lib/branding'
import { SLIDE_LABEL } from '@/lib/types'

// ─── Panel 4 · Logo & Ornamen Latar (Task 17) ───────────────────────────────
// Logo: satu gambar yang dicetak di pojok slide (sampul saja / semua slide).
// Ornamen: gambar/GIF/SVG/video milik user sebagai penghias latar, dengan
// penempatan bebas per slide, ukuran, opasitas, dan lapisan depan/belakang.

const LOGO_POS_LIST: LogoPos[] = ['tl', 'tr', 'bl', 'br']
const LOGO_POS_LABEL: Record<LogoPos, string> = {
  tl: 'Kiri Atas',
  tr: 'Kanan Atas',
  bl: 'Kiri Bawah',
  br: 'Kanan Bawah',
}

export function BrandingPanel() {
  const { toast } = useToast()
  const logo = useStudio((s) => s.branding.logo)
  const assets = useStudio((s) => s.branding.assets)
  const ornaments = useStudio((s) => s.branding.ornaments)
  const setLogo = useStudio((s) => s.setLogo)
  const patchLogo = useStudio((s) => s.patchLogo)
  const addOrnamentAsset = useStudio((s) => s.addOrnamentAsset)
  const removeOrnamentAsset = useStudio((s) => s.removeOrnamentAsset)
  const addOrnamentPlacement = useStudio((s) => s.addOrnamentPlacement)
  const patchOrnament = useStudio((s) => s.patchOrnament)
  const removeOrnament = useStudio((s) => s.removeOrnament)
  const slides = useStudio((s) => s.deck.slides)
  const index = useStudio((s) => s.currentIndex)

  const logoInput = useRef<HTMLInputElement>(null)
  const ornInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const assetById = (id: string) => assets.find((a) => a.id === id)

  const handleFile = async (file: File, target: 'logo' | 'orn') => {
    setBusy(true)
    try {
      const a = await processAssetFile(file, target === 'logo')
      if (target === 'logo') {
        setLogo({ src: a.src, name: a.name, apply: 'cover', pos: 'tr', size: 110, opacity: 1 })
        toast({
          title: 'Logo dipasang ✅',
          description: `${a.name} (${a.kb} KB) tampil di sampul — atur posisi & ukurannya di bawah.`,
        })
      } else {
        const res = addOrnamentAsset(
          { id: newBrandId('ast'), name: a.name, kind: a.kind, src: a.src, poster: a.poster, w: a.w, h: a.h, kb: a.kb },
          'all',
        )
        if (!res.ok) {
          toast({ title: 'Penyimpanan penuh', description: res.message, variant: 'destructive' })
        } else {
          toast({
            title: a.kind === 'video' ? 'Video ornamen ditambahkan ✅' : 'Ornamen ditambahkan ✅',
            description: `${a.name} (${a.kb} KB) kini menghiasi semua slide — atur penempatannya di daftar bawah.`,
          })
        }
      }
    } catch (e) {
      toast({
        title: 'Gagal memproses file',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan tak terduga.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const targetLabel = (t: string): string => {
    if (t === 'all') return 'Semua slide'
    if (t === 'cover') return 'Sampul saja'
    const i = slides.findIndex((s) => s.id === t)
    return i >= 0 ? `Slide ${i + 1} · ${SLIDE_LABEL[slides[i].kind]}` : 'Slide terhapus'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">4 · Logo &amp; Ornamen</CardTitle>
          <Shapes className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <CardDescription className="text-xs">
          Pasang logo instansi dan penghias latar (gambar, GIF beranimasi, SVG, bahkan video) — ikut terekspor ke .html &amp; .pptx.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── LOGO ── */}
        <section aria-label="Logo">
          <div className="mb-2 flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-xs font-bold">Logo</h3>
            {logo && <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-semibold">terpasang</Badge>}
          </div>

          <input
            ref={logoInput}
            type="file"
            accept={LOGO_ACCEPT}
            className="hidden"
            aria-label="Unggah file logo"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f, 'logo')
              e.target.value = ''
            }}
          />

          {!logo ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => logoInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> : <Upload className="h-4 w-4 text-primary" aria-hidden />}
              <span className="text-[11.5px] font-semibold text-primary">
                {busy ? 'Memproses…' : 'Unggah Logo (PNG · JPG · WebP · SVG · GIF)'}
              </span>
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-lg border bg-muted/40 p-2">
                { }
                <img src={logo.src} alt={`Logo ${logo.name}`} className="h-11 w-16 flex-none rounded border bg-white object-contain p-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold">{logo.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {logo.apply === 'all' ? 'Semua slide' : 'Sampul saja'} · {LOGO_POS_LABEL[logo.pos]} · {logo.size}px
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10.5px]" disabled={busy} onClick={() => logoInput.current?.click()}>
                  Ganti
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label="Hapus logo"
                  onClick={() => setLogo(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tampilkan di</Label>
                  <div className="flex gap-1">
                    {(['cover', 'all'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        aria-pressed={logo.apply === a}
                        onClick={() => patchLogo({ apply: a })}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-[10.5px] font-semibold transition-colors ${
                          logo.apply === a ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {a === 'cover' ? 'Sampul' : 'Semua Slide'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Posisi Pojok</Label>
                  <div className="grid grid-cols-2 gap-1">
                    {LOGO_POS_LIST.map((p) => (
                      <button
                        key={p}
                        type="button"
                        title={LOGO_POS_LABEL[p]}
                        aria-pressed={logo.pos === p}
                        onClick={() => patchLogo({ pos: p })}
                        className={`rounded-md border px-1 py-1 text-[9.5px] font-semibold transition-colors ${
                          logo.pos === p ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ukuran</Label>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{logo.size}px</span>
                </div>
                <Slider
                  value={[logo.size]}
                  min={40}
                  max={300}
                  step={5}
                  aria-label="Ukuran logo"
                  onValueChange={([v]) => patchLogo({ size: v })}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Opasitas</Label>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{Math.round(logo.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[Math.round(logo.opacity * 100)]}
                  min={20}
                  max={100}
                  step={5}
                  aria-label="Opasitas logo"
                  onValueChange={([v]) => patchLogo({ opacity: v / 100 })}
                />
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-border" aria-hidden />

        {/* ── ORNAMEN ── */}
        <section aria-label="Ornamen latar">
          <div className="mb-2 flex items-center gap-1.5">
            <Shapes className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-xs font-bold">Ornamen Latar</h3>
            {ornaments.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-semibold">
                {ornaments.length} penempatan
              </Badge>
            )}
          </div>

          <input
            ref={ornInput}
            type="file"
            accept={ORNAMENT_ACCEPT}
            className="hidden"
            aria-label="Unggah file ornamen"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f, 'orn')
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => ornInput.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> : <Upload className="h-4 w-4 text-primary" aria-hidden />}
            <span className="text-[11.5px] font-semibold text-primary">
              {busy ? 'Memproses…' : 'Unggah Gambar / GIF / SVG / Video (MP4, WebM)'}
            </span>
          </button>

          {/* Daftar aset */}
          {assets.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1.5">
                  {a.kind === 'video' && !a.poster ? (
                    <span className="flex h-10 w-16 flex-none items-center justify-center rounded border bg-muted" aria-hidden>
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </span>
                  ) : (
                     
                    <img
                      src={a.kind === 'video' ? a.poster : a.src}
                      alt={a.name}
                      className="h-10 w-16 flex-none rounded border bg-white object-contain p-0.5"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.w}×{a.h}px · {a.kb} KB
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex-none px-1.5 py-0 text-[9px] font-bold">
                    {a.kind === 'video' ? 'VIDEO' : /^data:image\/gif/i.test(a.src) ? 'GIF' : /^data:image\/svg/i.test(a.src) ? 'SVG' : 'IMG'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-none px-2 text-[10px] font-semibold"
                    onClick={() => addOrnamentPlacement(a.id, 'all')}
                    title="Pakai di semua slide"
                  >
                    + Semua
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-none px-2 text-[10px] font-semibold"
                    onClick={() => addOrnamentPlacement(a.id, slides[index]?.id ?? 'cover')}
                    title="Pakai di slide yang sedang dibuka"
                  >
                    + Slide {index + 1}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-none text-muted-foreground hover:text-destructive"
                    aria-label={`Hapus aset ${a.name}`}
                    onClick={() => {
                      removeOrnamentAsset(a.id)
                      toast({ title: 'Aset dihapus', description: 'Semua penempatannya ikut dihapus.' })
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Daftar penempatan */}
          {ornaments.length > 0 && (
            <div className="studio-scroll mt-2.5 max-h-96 space-y-2 overflow-y-auto pr-1">
              {ornaments.map((o, n) => {
                const a = assetById(o.assetId)
                const isFull = o.pos === 'full'
                return (
                  <div key={o.id} className="space-y-2 rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex-none px-1.5 py-0 text-[9px] font-bold">
                        #{n + 1}
                      </Badge>
                      <span className="truncate text-[11px] font-semibold">{a?.name ?? 'aset terhapus'}</span>
                      <span className="ml-auto flex-none text-[9.5px] font-semibold text-muted-foreground">
                        {a?.kind === 'video' ? '▶ video' : 'gambar'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-none text-muted-foreground hover:text-destructive"
                        aria-label="Hapus penempatan"
                        onClick={() => removeOrnament(o.id)}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">Target</Label>
                        <Select
                          value={['all', 'cover'].includes(o.target) ? o.target : `s:${o.target}`}
                          onValueChange={(v) => patchOrnament(o.id, { target: v.startsWith('s:') ? v.slice(2) : v })}
                        >
                          <SelectTrigger className="h-7 text-[10.5px]" aria-label="Target slide ornamen">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-[11px]">Semua slide</SelectItem>
                            <SelectItem value="cover" className="text-[11px]">Sampul saja</SelectItem>
                            {slides.map((s, i) => (
                              <SelectItem key={s.id} value={`s:${s.id}`} className="text-[11px]">
                                Slide {i + 1} · {SLIDE_LABEL[s.kind]}
                              </SelectItem>
                            ))}
                            {!['all', 'cover'].includes(o.target) && !slides.some((s) => s.id === o.target) && (
                              <SelectItem value={`s:${o.target}`} className="text-[11px]">Slide terhapus</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">Posisi</Label>
                        <div className="flex items-center gap-1.5">
                          <div className="grid flex-none grid-cols-3 gap-0.5 rounded-md border p-1" role="group" aria-label="Posisi ornamen">
                            {ORN_POS_GRID.map((p) => (
                              <button
                                key={p}
                                type="button"
                                title={ORN_POS_LABEL[p]}
                                aria-pressed={o.pos === p}
                                onClick={() => patchOrnament(o.id, { pos: p })}
                                className={`flex h-4.5 w-4.5 items-center justify-center rounded transition-colors ${
                                  o.pos === p ? 'bg-primary' : 'hover:bg-muted'
                                }`}
                              >
                                <span
                                  className={`h-1 w-1 rounded-full ${o.pos === p ? 'bg-primary-foreground' : 'bg-muted-foreground/50'}`}
                                  aria-hidden
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            aria-pressed={isFull}
                            onClick={() => patchOrnament(o.id, { pos: isFull ? 'br' : 'full', behind: true })}
                            className={`rounded-md border px-1.5 py-1 text-[9px] font-bold leading-tight transition-colors ${
                              isFull ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            Penuhi
                            <br />
                            Slide
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">Lebar</Label>
                          <span className="text-[9.5px] font-bold tabular-nums text-muted-foreground">{o.w}%</span>
                        </div>
                        <Slider
                          value={[o.w]}
                          min={6}
                          max={100}
                          step={2}
                          disabled={isFull}
                          aria-label="Lebar ornamen"
                          onValueChange={([v]) => patchOrnament(o.id, { w: v })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">Opasitas</Label>
                          <span className="text-[9.5px] font-bold tabular-nums text-muted-foreground">{Math.round(o.opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[Math.round(o.opacity * 100)]}
                          min={20}
                          max={100}
                          step={5}
                          aria-label="Opasitas ornamen"
                          onValueChange={([v]) => patchOrnament(o.id, { opacity: v / 100 })}
                        />
                      </div>
                    </div>

                    <div className={`flex items-center justify-between ${isFull ? 'opacity-50' : ''}`}>
                      <Label htmlFor={`behind-${o.id}`} className="text-[10px] font-semibold text-muted-foreground">
                        Di belakang konten slide
                      </Label>
                      <Switch
                        id={`behind-${o.id}`}
                        checked={o.behind}
                        disabled={isFull}
                        onCheckedChange={(v) => patchOrnament(o.id, { behind: v })}
                        aria-label="Di belakang konten slide"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            GIF &amp; video beranimasi bergerak penuh di kanvas dan ekspor .html. Di .pptx ornamen menjadi gambar
            statis (video memakai frame tangkapannya) — keterbatasan PowerPoint. Gambar besar otomatis dikompres;
            aset tersimpan di browser (autosave) &amp; file project .json.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
