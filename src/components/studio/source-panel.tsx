'use client'

import { useRef, useState } from 'react'
import { FileText, FileUp, Loader2, Trash2, UploadCloud, Wand2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useStudio } from '@/lib/store'
import {
  MAX_UPLOAD_SIZE_MB,
  SUPPORTED_FORMATS_LABEL,
  SUPPORTED_UPLOAD_ACCEPT,
} from '@/lib/upload-constants'

const PRESETS: Array<{ id: string; label: string; hint: string }> = [
  { id: 'outline', label: 'Garis besar saja', hint: 'Slide hanya kerangka: judul & angka kunci' },
  { id: 'verbal', label: 'Detail via lisan', hint: 'Detail deskripsi pindah ke catatan pembicara' },
  { id: 'professional', label: 'Profesional & hidup', hint: 'Naskah lisan mengalir, bukan membaca data' },
  { id: 'accurate', label: 'Angka akurat', hint: 'Anti-halusinasi — hanya angka dari dokumen' },
  { id: 'executive', label: 'Audiens pimpinan', hint: 'Fokus keputusan, capaian, risiko' },
  { id: 'story', label: 'Nada bercerita', hint: 'Alur storytelling dari awal ke visi' },
]

interface ParseResponse {
  ok: boolean
  text?: string
  kind?: string
  name?: string
  warning?: string
  message?: string
}

export function SourcePanel() {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const docText = useStudio((s) => s.docText)
  const fileName = useStudio((s) => s.fileName)
  const context = useStudio((s) => s.context)
  const presets = useStudio((s) => s.presets)
  const generating = useStudio((s) => s.generating)
  const usedAI = useStudio((s) => s.usedAI)

  const setDocText = useStudio((s) => s.setDocText)
  const setFileName = useStudio((s) => s.setFileName)
  const setFileWarning = useStudio((s) => s.setFileWarning)
  const clearDocument = useStudio((s) => s.clearDocument)
  const setContext = useStudio((s) => s.setContext)
  const togglePreset = useStudio((s) => s.togglePreset)
  const setGenerating = useStudio((s) => s.setGenerating)
  const applyDeck = useStudio((s) => s.applyDeck)

  const handleFile = async (file: File) => {
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: `Maksimal ${MAX_UPLOAD_SIZE_MB} MB. Pecah atau konversi file terlebih dahulu.`,
        variant: 'destructive',
      })
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse-file', { method: 'POST', body: fd })
      const data = (await res.json()) as ParseResponse
      if (!res.ok || !data.ok) {
        toast({
          title: 'Gagal membaca file',
          description: data.message || 'Format tidak didukung atau file rusak.',
          variant: 'destructive',
        })
        return
      }
      setDocText(data.text || '')
      setFileName(data.name || file.name)
      setFileWarning(data.warning || '')
      toast({
        title: 'Dokumen dimuat',
        description: `${data.name} (${data.kind}) — ${(data.text || '').length.toLocaleString('id-ID')} karakter siap dipakai.`,
      })
      if (data.warning) {
        toast({ title: 'Catatan', description: data.warning })
      }
    } catch {
      toast({
        title: 'Kesalahan jaringan',
        description: 'Tidak dapat menghubungi server parser file.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const generate = async () => {
    if (docText.trim().length < 40) {
      toast({
        title: 'Dokumen belum cukup',
        description: 'Muat file sumber atau tempel teks laporan (minimal ~40 karakter).',
        variant: 'destructive',
      })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: docText, context, presets }),
      })
      const data = (await res.json()) as {
        deck?: Parameters<typeof applyDeck>[0]
        usedAI?: boolean
        warning?: string
        error?: string
      }
      if (!res.ok || !data.deck) {
        toast({ title: 'Gagal membuat deck', description: data.error || 'Coba lagi.', variant: 'destructive' })
        return
      }
      applyDeck(data.deck, !!data.usedAI)
      if (data.usedAI) {
        toast({ title: 'Deck siap 🎬', description: '7 slide dibuat AI — cek catatan pembicara per slide.' })
      } else {
        toast({ title: 'Deck dibuat dengan parser aturan', description: data.warning, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Kesalahan jaringan', description: 'Gagal menghubungi /api/generate.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1a · Dokumen Sumber */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">
              1a · Dokumen Sumber
            </CardTitle>
            <Badge variant="secondary" className="bg-teal-600/10 text-teal-700">
              semua format
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Muat file (teks, PDF, Word, Excel, PowerPoint, ODT…) atau tempel teks laporan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_UPLOAD_ACCEPT}
            className="hidden"
            aria-label="Pilih file sumber"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Unggah file sumber — klik atau jatuhkan file di sini"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files?.[0]
              if (f) void handleFile(f)
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/40'
            }`}
          >
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
            ) : (
              <UploadCloud className="h-7 w-7 text-primary" aria-hidden />
            )}
            <p className="text-[13px] font-semibold">
              {uploading ? 'Membaca & mengekstrak teks…' : 'Klik untuk memuat file atau jatuhkan di sini'}
            </p>
            <p className="text-[11px] leading-4 text-muted-foreground">
              Maks {MAX_UPLOAD_SIZE_MB} MB · PDF, DOCX, XLSX, PPTX, CSV, MD, TXT, RTF, ODT, dst.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {SUPPORTED_FORMATS_LABEL.map((g) => (
                <span
                  key={g.group}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  title={g.group}
                >
                  {g.items.join(' · ')}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 flex-none" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium">
              {fileName || 'Belum ada file — silakan tempel teks di bawah'}
            </span>
            {docText.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDocument}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Bersihkan
              </Button>
            )}
          </div>

          <Textarea
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            placeholder="Tempel teks laporan di sini… (judul #, pasangan Label: angka, tabel, butir program)"
            className="max-h-64 min-h-36 resize-y overflow-y-auto font-mono text-xs leading-5"
            aria-label="Teks dokumen sumber"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {docText.length.toLocaleString('id-ID')} karakter
          </p>
        </CardContent>
      </Card>

      {/* 1b · Konteks & Instruksi AI */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">1b · Konteks & Instruksi AI</CardTitle>
            <Wand2 className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <CardDescription className="text-xs">
            Dimuat bersama dokumen saat generate — slide digaris besar, detail jadi naskah lisan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="mis. Kemas presentasi garis besarnya saja; data yang tersaji mewakili detail deskripsi; saat presentasi detail dipakai lisan agar hidup dan profesional — bukan sekadar membaca data…"
            className="min-h-20 resize-y text-xs leading-5"
            aria-label="Instruksi konteks tambahan untuk AI"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const active = presets.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.hint}
                  aria-pressed={active}
                  onClick={() => togglePreset(p.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-muted-foreground/30 bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {p.label}
                </button>
              )
            })}
          </div>
          <Separator />
          <Button
            onClick={() => void generate()}
            disabled={generating || docText.trim().length < 40}
            className="h-11 w-full gap-2 text-sm font-bold shadow-sm"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Merangkai 7 slide + naskah lisan…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" aria-hidden />
                Buat Deck Presentasi
              </>
            )}
          </Button>
          {usedAI !== null && (
            <p className="text-center text-[11px] text-muted-foreground">
              Sumber deck terakhir: {usedAI ? '🤖 AI (konteks diterapkan)' : '⚙️ Parser aturan (AI tidak tersedia)'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
