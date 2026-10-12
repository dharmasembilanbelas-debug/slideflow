// ─── Util pemrosesan aset gambar/GIF/SVG/video (client-side) ────────────────
// Mengubah File upload menjadi data URL siap pakai:
//  · Gambar raster besar otomatis diperkecil (canvas) agar hemat localStorage
//  · GIF & SVG diteruskan apa adanya (animasi/vektor harus utuh)
//  · Video: disimpan apa adanya + diekstrak frame poster untuk PPTX/thumbnail
// Semua kegagalan dilempar sebagai Error berbahasa Indonesia yang ramah user.

export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
export const ORNAMENT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,.gif,.svg,.mp4,.webm'

const MAX_GIF_KB = 2560 // GIF beranimasi tidak bisa dikompres tanpa kehilangan animasi
const MAX_SVG_KB = 600
const MAX_VIDEO_KB = 4096
const MAX_RAW_IMAGE_KB = 8192
const MAX_RESULT_KB = 2800 // batas hasil akhir per aset

export interface ProcessedAsset {
  kind: 'image' | 'video'
  src: string
  poster: string
  w: number
  h: number
  kb: number
  /** nama hasil — sudah dibersihkan */
  name: string
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Gagal membaca file.'))
    r.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('File bukan gambar yang bisa dibaca.'))
    img.src = src
  })
}

function videoMeta(src: string): Promise<{ w: number; h: number; poster: string }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    let done = false
    const finish = (poster: string) => {
      if (done) return
      done = true
      const w = v.videoWidth || 1280
      const h = v.videoHeight || 720
      resolve({ w, h, poster })
    }
    const grab = () => {
      try {
        const c = document.createElement('canvas')
        c.width = Math.min(v.videoWidth || 640, 960)
        c.height = Math.round(c.width * ((v.videoHeight || 360) / (v.videoWidth || 640)))
        const ctx = c.getContext('2d')
        if (!ctx) return finish('')
        ctx.drawImage(v, 0, 0, c.width, c.height)
        finish(c.toDataURL('image/jpeg', 0.82))
      } catch {
        finish('')
      }
    }
    const timer = window.setTimeout(() => finish(''), 9000)
    v.onloadeddata = () => {
      try {
        const t = Math.min(0.2, (v.duration || 1) / 3)
        if (Number.isFinite(t) && t >= 0) v.currentTime = t
        else grab()
      } catch {
        grab()
      }
    }
    v.onseeked = () => {
      window.clearTimeout(timer)
      grab()
    }
    v.onerror = () => {
      window.clearTimeout(timer)
      if (!done) {
        done = true
        reject(new Error('Video tidak bisa dibaca browser (coba MP4 H.264 atau WebM).'))
      }
    }
    v.src = src
  })
}

/** Perkecil gambar raster memakai canvas — pertahankan transparansi (webp/png) */
async function downscale(src: string, maxWidth: number): Promise<string> {
  const img = await loadImage(src)
  const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth))
  const w = Math.max(1, Math.round((img.naturalWidth || maxWidth) * scale))
  const h = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return src
  ctx.drawImage(img, 0, 0, w, h)
  const webp = c.toDataURL('image/webp', 0.9)
  if (webp.startsWith('data:image/webp') && webp.length < src.length) return webp
  const png = c.toDataURL('image/png')
  return png.length < src.length ? png : src
}

const kbOf = (dataUrl: string) => Math.round((dataUrl.length * 0.75) / 1024)
const cleanName = (n: string) => n.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'aset'

/** Proses file upload → aset siap simpan. Melempar Error berpesan Indonesia. */
export async function processAssetFile(file: File, forLogo = false): Promise<ProcessedAsset> {
  const name = cleanName(file.name)
  const type = (file.type || '').toLowerCase()
  const isVideo = type === 'video/mp4' || type === 'video/webm' || /\.(mp4|webm)$/i.test(file.name)
  const isGif = type === 'image/gif' || /\.gif$/i.test(file.name)
  const isSvg = type === 'image/svg+xml' || /\.svg$/i.test(file.name)

  if (isVideo) {
    if (forLogo) throw new Error('Logo memakai gambar (PNG/JPG/WebP/SVG/GIF) — video hanya untuk ornamen.')
    if (file.size > MAX_VIDEO_KB * 1024) {
      throw new Error(`Video terlalu besar (${(file.size / 1048576).toFixed(1)} MB). Maksimal ${MAX_VIDEO_KB / 1024} MB.`)
    }
    const src = await readAsDataUrl(file)
    const meta = await videoMeta(src)
    return { kind: 'video', src, poster: meta.poster, w: meta.w, h: meta.h, kb: Math.round(file.size / 1024), name }
  }

  if (!type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) {
    throw new Error('Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, SVG (atau MP4/WebM untuk ornamen).')
  }
  const capKb = isGif ? MAX_GIF_KB : isSvg ? MAX_SVG_KB : MAX_RAW_IMAGE_KB
  if (file.size > capKb * 1024) {
    throw new Error(`File terlalu besar (${(file.size / 1024).toFixed(0)} KB). Maksimal ${capKb / 1024} MB untuk ${isGif ? 'GIF' : isSvg ? 'SVG' : 'gambar'}.`)
  }

  let src = await readAsDataUrl(file)
  let w = 0
  let h = 0

  if (isSvg) {
    const img = await loadImage(src).catch(() => null)
    w = img?.naturalWidth || 512
    h = img?.naturalHeight || 512
  } else if (isGif) {
    const img = await loadImage(src).catch(() => null)
    w = img?.naturalWidth || 480
    h = img?.naturalHeight || 480
  } else {
    // raster: perkecil — logo cukup 480px, ornamen hingga 1400px
    src = await downscale(src, forLogo ? 480 : 1400)
    const img = await loadImage(src)
    w = img.naturalWidth
    h = img.naturalHeight
  }

  const kb = kbOf(src)
  if (kb > MAX_RESULT_KB) {
    throw new Error(`Hasil kompresi masih terlalu besar (${kb} KB). Coba file yang lebih kecil.`)
  }
  return { kind: 'image', src, poster: '', w, h, kb, name }
}
