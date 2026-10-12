'use client'

import { useEffect } from 'react'
import { StudioHeader } from '@/components/studio/header'
import { SourcePanel } from '@/components/studio/source-panel'
import { DesignPanel } from '@/components/studio/design-panel'
import { ElementsPanel } from '@/components/studio/elements-panel'
import { BrandingPanel } from '@/components/studio/branding-panel'
import { DataPanel } from '@/components/studio/data-panel'
import { SlideCanvas } from '@/components/studio/slide-canvas'
import { useStudio } from '@/lib/store'

export default function Home() {
  useEffect(() => {
    // Hidrasi state tersimpan (autosave) setelah mount agar SSR aman
    void useStudio.persist.rehydrate()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <StudioHeader />

      <main className="mx-auto w-full max-w-[1700px] flex-1 px-3 py-4 md:px-6">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="order-2 min-w-0 space-y-4 lg:order-1">
            <SourcePanel />
            <DesignPanel />
            <ElementsPanel />
            <BrandingPanel />
            <DataPanel />
          </div>
          <div className="order-1 min-w-0 lg:order-2">
            <SlideCanvas />
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t bg-background/85 backdrop-blur">
        <div
          className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground md:px-6"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <span className="font-medium">
            SlideFlow — Generator Presentasi HTML + PPTX · jumlah slide fleksibel (3–24) · logo &amp; ornamen kustom · 12 template · 6 tema font + kustom · 7 tema warna + kustom · 4 gaya animasi
          </span>
          <span>
            Slide 1280×800 (16:9) · slide garis besar, detail deskripsi disampaikan lisan via catatan pembicara
          </span>
        </div>
      </footer>
    </div>
  )
}
