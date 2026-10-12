'use client'

import { useRef } from 'react'
import { FolderOpen, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useStudio } from '@/lib/store'
import { downloadJsonProject } from '@/lib/exporters'

export function StudioHeader() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const deck = useStudio((s) => s.deck)
  const context = useStudio((s) => s.context)
  const presets = useStudio((s) => s.presets)
  const style = useStudio((s) => s.style)
  const elements = useStudio((s) => s.elements)
  const customHtml = useStudio((s) => s.customHtml)
  const customName = useStudio((s) => s.customName)
  const branding = useStudio((s) => s.branding)
  const loadSample = useStudio((s) => s.loadSample)
  const loadProjectJson = useStudio((s) => s.loadProjectJson)

  const onOpenProject = async (file: File) => {
    const text = await file.text()
    const res = loadProjectJson(text)
    toast({
      title: res.ok ? 'Project dimuat' : 'Gagal memuat',
      description: res.message,
      variant: res.ok ? 'default' : 'destructive',
    })
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1700px] items-center gap-3 px-3 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15px] font-extrabold tracking-tight md:text-base">
              Slide<span className="text-primary">Flow</span>
            </h1>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Dokumen sumber → deck presentasi fleksibel + catatan lisan
            </p>
          </div>
          <Badge variant="secondary" className="ml-1 hidden bg-teal-600/10 text-teal-700 md:inline-flex">
            HTML + PPTX
          </Badge>
        </div>

        <div className="ml-auto flex flex-none items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Buka file project"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onOpenProject(f)
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="h-9 gap-1.5"
          >
            <FolderOpen className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Buka Project</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadJsonProject(deck, context, presets, style, elements, customHtml, customName, branding)
              toast({ title: 'Project tersimpan', description: 'File .json berisi deck, tema, elemen, logo/ornamen & HTML custom berhasil diunduh.' })
            }}
            className="h-9 gap-1.5"
          >
            <Save className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Simpan Project</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadSample()
              toast({ title: 'Contoh dimuat', description: 'Data laporan PPDB Cendekia Nusantara dipulihkan.' })
            }}
            className="h-9 gap-1.5"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Muat Contoh</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
