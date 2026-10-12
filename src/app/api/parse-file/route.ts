/**
 * API route: POST /api/parse-file
 *
 * Menerima multipart/form-data dengan field `file`, mengubah isi file
 * menjadi teks biasa via parser universal (src/lib/file-parser.server.ts).
 *
 * Response selalu JSON:
 *   { ok, text, kind, name, size, warning?, message? }
 * - ok:false TETAP dikirim dengan status 200 supaya UI bisa menampilkan
 *   pesannya, KECUALI error tak terduga → 500.
 * - 400: request tidak valid / field `file` hilang.
 * - 413: file melebihi batas ukuran.
 */

import { NextResponse } from 'next/server'
import {
  MAX_UPLOAD_SIZE_BYTES,
  SUPPORTED_FORMATS_LABEL,
  SUPPORTED_UPLOAD_ACCEPT,
  parseFileToText,
} from '@/lib/file-parser.server'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_UPLOAD_SIZE_MB = Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))

interface ParseFileApiResponse {
  ok: boolean
  text?: string
  kind?: string
  name?: string
  size?: number
  warning?: string
  message?: string
}

export async function POST(request: Request): Promise<NextResponse<ParseFileApiResponse>> {
  try {
    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Request harus berupa multipart/form-data dengan field "file".',
        },
        { status: 400 },
      )
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Field "file" tidak ditemukan. Lampirkan file pada form-data dengan key "file".',
        },
        { status: 400 },
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: 'File kosong (0 byte). Periksa kembali file yang diunggah.',
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          message: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)} MB melebihi batas maksimal ${MAX_UPLOAD_SIZE_MB} MB. Kompres atau pecah file, lalu coba lagi.`,
        },
        { status: 413 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseFileToText(file.name, buffer, file.type || undefined)

    return NextResponse.json({
      ok: parsed.ok,
      text: parsed.text,
      kind: parsed.kind,
      name: parsed.name,
      size: parsed.size,
      ...(parsed.warning ? { warning: parsed.warning } : {}),
      // pesan siap-tampil untuk UI bila ekstraksi gagal
      ...(!parsed.ok && parsed.warning ? { message: parsed.warning } : {}),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Kesalahan tidak diketahui'
    return NextResponse.json(
      {
        ok: false,
        message: `Terjadi kesalahan tak terduga saat memproses file: ${detail}`,
      },
      { status: 500 },
    )
  }
}

/** GET: metadata format yang didukung (berguna untuk UI dropzone). */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    accept: SUPPORTED_UPLOAD_ACCEPT,
    formats: SUPPORTED_FORMATS_LABEL,
  })
}
