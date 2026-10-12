'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  FileCode2,
  FileDown,
  FileUp,
  Loader2,
  MousePointerClick,
  Pencil,
  Presentation,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useStudio } from '@/lib/store'
import { buildDeckHtml } from '@/lib/deck-html'
import { downloadHtmlCustom, downloadHtmlDeck, downloadPptxDeck } from '@/lib/exporters'
import { SLIDE_LABEL } from '@/lib/types'

const MAX_CUSTOM_HTML_MB = 2

export function SlideCanvas() {
  const { toast } = useToast()
  const deck = useStudio((s) => s.deck)
  const style = useStudio((s) => s.style)
  const elements = useStudio((s) => s.elements)
  const customHtml = useStudio((s) => s.customHtml)
  const customName = useStudio((s) => s.customName)
  const branding = useStudio((s) => s.branding)
  const htmlView = useStudio((s) => s.htmlView)
  const index = useStudio((s) => s.currentIndex)
  const editMode = useStudio((s) => s.editMode)
  const notesOpen = useStudio((s) => s.notesOpen)
  const setIndex = useStudio((s) => s.setIndex)
  const setEditMode = useStudio((s) => s.setEditMode)
  const setNotesOpen = useStudio((s) => s.setNotesOpen)
  const setCustomHtml = useStudio((s) => s.setCustomHtml)
  const setHtmlView = useStudio((s) => s.setHtmlView)
  const editByPath = useStudio((s) => s.editByPath)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const lastCanvasEditRef = useRef(0)
  const indexRef = useRef(index)
  indexRef.current = index
  const [srcdoc, setSrcdoc] = useState(() => buildDeckHtml(deck, { studio: true, style, elements, branding }))
  const [pptxLoading, setPptxLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDraft, setEditorDraft] = useState('')

  // Rebuild (debounce) saat deck/style/elements/branding berubah — lewati sesaat setelah edit dari kanvas
  useEffect(() => {
    if (htmlView) return
    const t = setTimeout(() => {
      if (Date.now() - lastCanvasEditRef.current < 1500) return
      setSrcdoc(buildDeckHtml(deck, { studio: true, style, elements, branding }))
    }, 500)
    return () => clearTimeout(t)
  }, [deck, style, elements, branding, htmlView])

  // Kirim status studio & mode edit ke iframe saat load / toggle
  const postToFrame = useCallback(
    (msg: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*')
    },
    [],
  )

  useEffect(() => {
    if (htmlView) return
    postToFrame({ type: 'editSet', enabled: editMode })
  }, [editMode, postToFrame, htmlView, srcdoc])

  // Sinkronkan navigasi studio → deck di iframe
  useEffect(() => {
    if (htmlView) return
    postToFrame({ type: 'goto', index })
  }, [index, srcdoc, postToFrame, htmlView])

  // Sinkronkan panel catatan di dalam deck
  useEffect(() => {
    if (htmlView) return
    postToFrame({ type: 'notesSet', open: notesOpen })
  }, [notesOpen, srcdoc, postToFrame, htmlView])

  const onFrameLoad = () => {
    if (htmlView) return
    postToFrame({ type: 'studioSet', studio: true })
    postToFrame({ type: 'editSet', enabled: editMode })
    postToFrame({ type: 'notesSet', open: notesOpen })
  }

  // Deck melaporkan dirinya siap → kirim posisi slide terkini
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; path?: string; value?: unknown }
      if (d?.type === 'deckReady') {
        if (htmlView) return
        postToFrame({ type: 'studioSet', studio: true })
        postToFrame({ type: 'editSet', enabled: editMode })
        postToFrame({ type: 'notesSet', open: notesOpen })
        postToFrame({ type: 'goto', index: indexRef.current })
      }
      if (d?.type === 'deckEdit' && typeof d.path === 'string') {
        lastCanvasEditRef.current = Date.now()
        editByPath(d.path, d.value)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [editByPath, editMode, notesOpen, postToFrame, htmlView])

  const slides = deck.slides
  const total = slides.length
  const current: (typeof slides)[number] | undefined = slides[index] ?? slides[0]
  const slideIdx = current ? Math.max(0, slides.indexOf(current)) : 0
  const kindLabel = current ? SLIDE_LABEL[current.kind] : 'Slide'
  const showCustom = htmlView && !!customHtml

  const importHtml = (file: File) => {
    if (!/\.html?$/i.test(file.name)) {
      toast({ title: 'Bukan file HTML', description: 'Unggah file berekstensi .html atau .htm.', variant: 'destructive' })
      return
    }
    if (file.size > MAX_CUSTOM_HTML_MB * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: `Maksimal ${MAX_CUSTOM_HTML_MB} MB untuk HTML custom.`,
        variant: 'destructive',
      })
      return
    }
    void file.text().then((text) => {
      setCustomHtml(text, file.name)
      setEditMode(false)
      toast({
        title: 'HTML custom dimuat ✅',
        description: `${file.name} kini tampil di kanvas — bisa diedit lewat Editor Kode lalu diekspor kembali.`,
      })
    })
  }

  const exportPptx = async () => {
    setPptxLoading(true)
    try {
      await downloadPptxDeck(deck, style, branding)
      toast({ title: 'PPTX terunduh ✅', description: `${total} slide + catatan pembicara siap dipresentasikan.` })
    } catch {
      toast({ title: 'Gagal membuat PPTX', description: 'Terjadi kesalahan saat menyusun file.', variant: 'destructive' })
    } finally {
      setPptxLoading(false)
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Slide sebelumnya"
            disabled={index === 0 || showCustom}
            onClick={() => setIndex(index - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-[7.5rem] text-center text-xs font-bold tabular-nums">
            {showCustom ? 'HTML Custom' : `${index + 1}/${total} · ${kindLabel}`}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Slide berikutnya"
            disabled={index >= total - 1 || showCustom}
            onClick={() => setIndex(index + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          aria-pressed={editMode}
          disabled={showCustom}
          onClick={() => setEditMode(!editMode)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit di Kanvas
        </Button>
        <Button
          variant={notesOpen ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          aria-pressed={notesOpen}
          disabled={showCustom}
          onClick={() => setNotesOpen(!notesOpen)}
        >
          <StickyNote className="h-3.5 w-3.5" aria-hidden />
          Catatan di Deck
        </Button>

        {editMode && !showCustom && (
          <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-700">
            <MousePointerClick className="h-3 w-3" aria-hidden />
            klik teks / tarik elemen
          </Badge>
        )}
        {showCustom && (
          <Badge variant="secondary" className="gap-1 bg-teal-600/10 text-teal-700">
            <FileCode2 className="h-3 w-3" aria-hidden />
            {customName || 'desain-custom.html'}
          </Badge>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* HTML custom */}
          <input
            ref={importRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            aria-label="Impor file HTML custom"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importHtml(f)
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={() => importRef.current?.click()}
            title="Unggah desain HTML milik Anda sendiri untuk diedit di aplikasi ini"
          >
            <FileUp className="h-3.5 w-3.5" aria-hidden />
            Impor HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            disabled={!customHtml}
            onClick={() => {
              setEditorDraft(customHtml)
              setEditorOpen(true)
            }}
            title="Edit kode HTML custom langsung di aplikasi"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            Editor Kode
          </Button>
          {customHtml && (
            <Button
              variant={showCustom ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              aria-pressed={showCustom}
              onClick={() => setHtmlView(!showCustom)}
              title="Berganti antara deck Studio dan HTML custom Anda"
            >
              <Presentation className="h-3.5 w-3.5" aria-hidden />
              {showCustom ? 'Lihat Deck' : 'Lihat HTML'}
            </Button>
          )}

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={() => {
              if (showCustom) {
                downloadHtmlCustom(customHtml, customName || 'desain-custom')
                toast({ title: 'HTML custom terunduh ✅', description: 'File desain Anda tersimpan.' })
              } else {
                downloadHtmlDeck(deck, style, elements, branding)
                toast({ title: 'HTML terunduh ✅', description: 'Buka file — tekan N untuk catatan, P mode presenter.' })
              }
            }}
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            Unduh .html
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={() => void exportPptx()}
            disabled={pptxLoading || showCustom}
            title={showCustom ? 'Ekspor PPTX hanya untuk deck Studio' : 'Ekspor deck ke PowerPoint'}
          >
            {pptxLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <FileDown className="h-3.5 w-3.5" aria-hidden />
            )}
            Unduh .pptx
          </Button>
        </div>
      </div>

      {/* Kanvas 16:9 */}
      <div className="relative w-full overflow-hidden rounded-xl border bg-ink shadow-lg" style={{ backgroundColor: '#132B30' }}>
        <div className="aspect-video w-full">
          <iframe
            ref={iframeRef}
            title={showCustom ? 'Pratinjau HTML custom' : `Pratinjau slide ${index + 1} — ${current?.title || kindLabel}`}
            srcDoc={showCustom ? customHtml : srcdoc}
            onLoad={onFrameLoad}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Bar catatan pembicara */}
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-xs font-bold">Catatan Pembicara — {kindLabel}</span>
          <Badge variant="secondary" className="text-[10px] font-semibold">
            naskah lisan · ikut terekspor ke PPTX &amp; HTML
          </Badge>
        </div>
        <Textarea
          value={current?.note ?? ''}
          onChange={(e) => editByPath(`slides.${slideIdx}.note`, e.target.value)}
          rows={3}
          placeholder="Naskah yang Anda ucapkan saat slide ini tampil — detail deskripsi, cerita, penekanan angka…"
          className="min-h-[84px] resize-y text-[13px] leading-6"
          aria-label={`Naskah lisan slide ${index + 1}`}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Di deck HTML: tekan <kbd className="rounded bg-muted px-1 font-mono text-[10px]">N</kbd> untuk panel catatan,{' '}
          <kbd className="rounded bg-muted px-1 font-mono text-[10px]">P</kbd> mode presenter,{' '}
          <kbd className="rounded bg-muted px-1 font-mono text-[10px]">←</kbd>{' '}
          <kbd className="rounded bg-muted px-1 font-mono text-[10px]">→</kbd> navigasi.
        </p>
      </div>

      {/* Dialog editor kode HTML custom */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editor Kode — HTML Custom</DialogTitle>
            <DialogDescription>
              Sunting langsung kode desain Anda. Klik Simpan untuk memperbarui pratinjau di kanvas.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editorDraft}
            onChange={(e) => setEditorDraft(e.target.value)}
            className="max-h-[55vh] min-h-[320px] resize-y font-mono text-[12px] leading-5"
            aria-label="Kode HTML custom"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setCustomHtml(editorDraft, customName || 'desain-custom.html')
                setEditorOpen(false)
                toast({ title: 'Kode disimpan', description: 'Pratinjau HTML custom diperbarui.' })
              }}
            >
              Simpan &amp; Tampilkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
