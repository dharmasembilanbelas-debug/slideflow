'use client'

import { useState } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  CheckSquare,
  Code2,
  Gauge,
  ListChecks,
  Minus,
  Pencil,
  Plus,
  Quote,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useStudio } from '@/lib/store'
import { ELEMENT_LIBRARY, createElement } from '@/lib/elements'
import type { DeckElement, ElementKind } from '@/lib/elements'
import { SLIDE_LABEL } from '@/lib/types'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Gauge, Quote, AlertCircle, ListChecks, CheckSquare, BadgeCheck, Minus, BarChart3, Code2,
}

// ─── Panel 3 · Elemen Tambahan: premade + HTML kustom, posisi & edit ─────────

export function ElementsPanel() {
  const { toast } = useToast()
  const elements = useStudio((s) => s.elements)
  const addElement = useStudio((s) => s.addElement)
  const removeElement = useStudio((s) => s.removeElement)
  const editByPath = useStudio((s) => s.editByPath)
  const index = useStudio((s) => s.currentIndex)
  const slide = useStudio((s) => s.deck.slides[s.currentIndex] ?? s.deck.slides[0])

  const [editing, setEditing] = useState<DeckElement | null>(null)
  const [draftHtml, setDraftHtml] = useState('')
  const [draftX, setDraftX] = useState(0)
  const [draftY, setDraftY] = useState(0)
  const [draftW, setDraftW] = useState(30)
  const [customOpen, setCustomOpen] = useState(false)
  const [customHtml, setCustomHtml] = useState(
    '<div class="el-card" style="padding:18px 24px">\n  <div style="font-family:var(--fHead);font-weight:900;font-size:20px;color:var(--teal)">Elemen Kustom</div>\n  <p style="font-size:13px;color:var(--gray);margin-top:4px">Tulis HTML + CSS inline bebas di sini.</p>\n</div>',
  )

  const key = slide.id
  const keyLabel = SLIDE_LABEL[slide.kind]

  const add = (kind: ElementKind, html?: string) => {
    const countOnSlide = elements.filter((e) => e.slide === key).length
    const el = createElement(kind, key, countOnSlide, html)
    addElement(el)
    toast({
      title: 'Elemen ditambahkan',
      description: `${kind === 'custom' ? 'HTML kustom' : kind} ada di slide ${index + 1} (${keyLabel}). Aktifkan Edit di Kanvas lalu tarik untuk memindahkan.`,
    })
  }

  const openEdit = (el: DeckElement) => {
    setEditing(el)
    setDraftHtml(el.html)
    setDraftX(el.x)
    setDraftY(el.y)
    setDraftW(el.w)
  }

  const saveEdit = () => {
    if (!editing) return
    editByPath(`elements.${editing.id}.html`, draftHtml)
    editByPath(`elements.${editing.id}.x`, draftX)
    editByPath(`elements.${editing.id}.y`, draftY)
    editByPath(`elements.${editing.id}.w`, draftW)
    setEditing(null)
    toast({ title: 'Elemen diperbarui' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">3 · Elemen Tambahan</CardTitle>
          <Badge variant="secondary" className="bg-teal-600/10 text-teal-700">
            {elements.length} aktif
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Tempel elemen siap pakai atau HTML kustom ke slide saat ini ({index + 1} · {keyLabel}). Ikut terekspor ke .html.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pustaka premade */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ELEMENT_LIBRARY.map((def) => {
            const Icon = ICONS[def.icon] ?? Plus
            return (
              <button
                key={def.kind}
                type="button"
                title={def.desc}
                onClick={() => add(def.kind)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-left transition-colors hover:border-primary/60 hover:bg-muted/50"
              >
                <Icon className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
                <span className="truncate text-[11px] font-semibold">{def.label}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/50 px-2 py-1.5 text-left transition-colors hover:bg-primary/10"
          >
            <Code2 className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
            <span className="truncate text-[11px] font-semibold text-primary">HTML Kustom…</span>
          </button>
        </div>

        {/* Daftar elemen aktif */}
        {elements.length > 0 && (
          <ScrollArea className="max-h-56 rounded-lg border">
            <ul className="divide-y">
              {elements.map((el) => {
                const Icon = ICONS[(ELEMENT_LIBRARY.find((d) => d.kind === el.kind)?.icon) ?? ''] ?? Code2
                const slideIdx = ['cover', 'kpi', 'composition', 'tableFunnel', 'trend', 'programs', 'closing'].indexOf(el.slide)
                return (
                  <li key={el.id} className="flex items-center gap-2 px-2.5 py-2">
                    <Icon className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold">
                        {el.kind === 'custom' ? 'HTML kustom' : ELEMENT_LIBRARY.find((d) => d.kind === el.kind)?.label ?? el.kind}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Slide {slideIdx + 1} · X {el.x.toFixed(0)}% · Y {el.y.toFixed(0)}% · Lebar {el.w.toFixed(0)}%
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit elemen" onClick={() => openEdit(el)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Hapus elemen"
                      onClick={() => removeElement(el.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}

        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          Aktifkan <b>Edit di Kanvas</b> lalu tarik elemen (bergaris putus oranye) untuk memposisikan. Elemen ikut terekspor ke .html; untuk .pptx gunakan panel data.
        </p>
      </CardContent>

      {/* Dialog edit elemen */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Elemen</DialogTitle>
            <DialogDescription>
              Ubah HTML/CSS dan posisi elemen. Variabel tema tersedia: var(--teal), var(--org), var(--ink), var(--paper), var(--fHead), var(--radiusS), var(--shadow)…
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="el-x" className="text-xs">X (%)</Label>
                <Input id="el-x" type="number" min={-10} max={108} value={draftX} onChange={(e) => setDraftX(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="el-y" className="text-xs">Y (%)</Label>
                <Input id="el-y" type="number" min={-5} max={96} value={draftY} onChange={(e) => setDraftY(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="el-w" className="text-xs">Lebar (%)</Label>
                <Input id="el-w" type="number" min={4} max={100} value={draftW} onChange={(e) => setDraftW(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="el-html" className="text-xs">HTML Elemen</Label>
              <Textarea
                id="el-html"
                value={draftHtml}
                onChange={(e) => setDraftHtml(e.target.value)}
                className="min-h-52 resize-y font-mono text-[11.5px] leading-5"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={saveEdit}>Simpan Elemen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog HTML kustom */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Elemen HTML Kustom</DialogTitle>
            <DialogDescription>
              Tulis HTML bebas dengan CSS inline. Bisa memakai variabel tema agar mengikuti gaya desain.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={customHtml}
            onChange={(e) => setCustomHtml(e.target.value)}
            className="min-h-52 resize-y font-mono text-[11.5px] leading-5"
            aria-label="HTML elemen kustom"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Batal</Button>
            <Button
              onClick={() => {
                add('custom', customHtml)
                setCustomOpen(false)
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Tambahkan ke Slide Ini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
