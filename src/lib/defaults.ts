import type { Deck, DeckSlide } from './types'
import { genSlideId } from './types'

// ─── Data contoh bawaan: Laporan PPDB Cendekia Nusantara ────────────────────
// Diadaptasi dari konteks chat bersambung (laporan PPDB TA 2024/2025).
// Deck contoh memakai 7 slide (jumlah boleh berbeda — model ini fleksibel).

function mkSlides(defs: Array<Partial<DeckSlide> & { kind: DeckSlide['kind'] }>): DeckSlide[] {
  const used = new Set<string>()
  return defs.map((d) => ({ id: genSlideId(d.kind, used), ...d }) as DeckSlide)
}

export const DEFAULT_DECK: Deck = {
  identity: {
    org: 'Cendekia Nusantara',
    division: 'Divisi Admisi',
    period: 'TA 2024/2025',
    title: 'LAPORAN PPDB',
    subtitle: 'Penerimaan Peserta Didik Baru — Kinerja Admisi Tahun Ajaran 2024/2025',
    date: 'Juli 2025',
  },
  slides: mkSlides([
    {
      kind: 'cover',
      title: 'LAPORAN PPDB',
      subtitle: '',
      note: 'Selamat pagi Bapak/Ibu. Lima menit ke depan saya akan memandu Anda menelusuri bagaimana tim Admisi menutup tahun ajaran ini di atas target — dan apa yang kita siapkan untuk level berikutnya. Angka di layar hanya kerangkanya; cerita sebenarnya ada pada alur di balik angka itu.',
    },
    {
      kind: 'kpi',
      title: 'Empat Angka Kunci',
      subtitle: 'Ringkasan capaian utama — detail deskripsi disampaikan lisan oleh pemateri',
      note: 'Empat angka ini yang paling penting. Enam ratus dua belas murid baru berarti seluruh kuota penuh — bahkan melampaui target sebelas persen. Dari hampir tiga ribu keluarga pendaftar, hanya sekitar satu dari lima yang kami terima; itulah mengapa mutu proses seleksi menjadi krusial. Dan angka sembilan-puluh-empat-koma-empat persen di sisi kanan adalah bukti layanan daftar ulang kami bekerja — hampir tidak ada keluarga yang berpindah setelah diterima.',
      kpis: [
        {
          label: 'Murid Baru',
          value: 612,
          suffix: '',
          decimals: 0,
          note: '111% dari target 550 — kuota penuh sejak gelombang kedua',
        },
        {
          label: 'Total Pendaftar',
          value: 2847,
          suffix: '',
          decimals: 0,
          note: 'Rasio seleksi 4,7:1 — kompetisi tertinggi 3 tahun terakhir',
        },
        {
          label: 'Jalur Penerimaan',
          value: 5,
          suffix: '',
          decimals: 0,
          note: 'Zonasi · Prestasi · Reguler · Afirmasi · Mutasi',
        },
        {
          label: 'Konversi Daftar Ulang',
          value: 94.4,
          suffix: '%',
          decimals: 1,
          note: 'Gelombang 3 Juli — retensi keluarga baru sangat tinggi',
        },
      ],
    },
    {
      kind: 'composition',
      title: 'Komposisi Per Kategori',
      subtitle: 'Sebaran 612 murid baru menurut jalur masuk',
      note: 'Komposisi jalur ini menunjukkan strategi kami. Zonasi tetap menjadi pintu masuk terbesar, tetapi perhatikan jalur Prestasi dan Afirmasi — dua jalur yang sengaja kami perkuat untuk menjaga mutu sekaligus keberagaman. Jalur Mutasi kecil; memang demikian karakter historisnya, dan itu wajar.',
      centerLabel: 'Murid Baru',
      centerValue: '612',
      slices: [
        { label: 'Zonasi', value: 251 },
        { label: 'Prestasi', value: 165 },
        { label: 'Reguler', value: 110 },
        { label: 'Afirmasi', value: 74 },
        { label: 'Mutasi', value: 12 },
      ],
    },
    {
      kind: 'table',
      title: 'Gelombang & Corong Konversi',
      subtitle: 'Perjalanan pendaftar dari mendaftar sampai daftar ulang',
      note: 'Inilah corong lengkap kita. Perhatikan lompatan antar gelombang: gelombang kedua adalah mesin utama — volume terbesar dengan konversi paling sehat. Yang ingin saya tekankan, penurunan dari lulus seleksi ke daftar ulang kini hanya sekitar seperempat dibanding tahun lalu; itu hasil disiplin tindak lanjut 48 jam kepada setiap keluarga baru.',
      columns: ['Gelombang', 'Periode', 'Pendaftar', 'Lulus Seleksi', 'Daftar Ulang'],
      rows: [
        ['GW1', 'Feb–Apr', '1.120', '402', '258'],
        ['GW2', 'Mei–Jun', '1.288', '451', '287'],
        ['GW3', 'Jul', '439', '71', '67'],
      ],
      funnelTitle: 'Corong Konversi',
      funnel: [
        { label: 'Pendaftar', value: 2847 },
        { label: 'Lulus Seleksi', value: 924 },
        { label: 'Daftar Ulang', value: 612 },
      ],
    },
    {
      kind: 'trend',
      title: 'Tren Pendaftar Bulanan',
      subtitle: 'Volume pendaftaran per bulan, Feb–Jul 2025 — tahan & geser untuk memutar grafik',
      note: 'Bulan Juni menjadi puncak — bukan kebetulan, melainkan efek Open House ketiga dan pengumuman hasil seleksi gelombang dua yang bertepatan. Penurunan di Juli wajar karena stok pendaftar telah terserap. Pelajaran bagi tahun depan: kampanye harus menyala lebih awal di Februari–Maret, bukan menunggu gelombang kedua.',
      points: [
        { label: 'Feb', value: 120 },
        { label: 'Mar', value: 340 },
        { label: 'Apr', value: 490 },
        { label: 'Mei', value: 670 },
        { label: 'Jun', value: 780 },
        { label: 'Jul', value: 447 },
      ],
      insight:
        'Puncak Juni (780) didorong Open House ke-3 dan pengumuman hasil GW2 — kampanye 2026 harus menyala lebih awal di Feb–Mar.',
    },
    {
      kind: 'programs',
      title: 'Program Kerja Andalan',
      subtitle: 'Empat mesin pertumbuhan di balik capaian PPDB 2024/2025',
      note: 'Empat program inilah yang membuat angka-angka tadi terjadi. PPDB Online memangkas waktu proses hingga dua pertiga. Open House kami rancang sebagai pengalaman langsung, bukan sekadar seminar. Kemitraan SMP membangun saluran pendaftar yang sehat dan berkelanjutan. Dan beasiswa prestasi memastikan profil mutu terjaga di setiap angkatan.',
      items: [
        {
          name: 'PPDB Online',
          detail: 'Alur daring terintegrasi verifikasi dokumen & pembayaran — waktu proses turun 68%',
          badge: 'Proses −68%',
        },
        {
          name: 'Open House',
          detail: '24 acara sepanjang musim PPDB, dihadiri 3.100 keluarga; konversi kunjungan ke pendaftar 38%',
          badge: '24 acara',
        },
        {
          name: 'Kemitraan SMP',
          detail: '38 SMP mitra feeder menyumbang 37% dari seluruh pendaftar',
          badge: '38 SMP',
        },
        {
          name: 'Beasiswa Prestasi',
          detail: '40 penerima beasiswa hafizh/atlet/olimpiade memperkuat profil mutu',
          badge: '40 penerima',
        },
      ],
    },
    {
      kind: 'closing',
      title: 'Arah PPDB 2025/2026',
      subtitle: '',
      note: 'Ke depan, target kami tujuh ratus murid baru — naik empat belas persen — dengan beasiswa yang lebih besar dan jaringan mitra yang diperluas. Dukungan yang saya mohon dari forum ini: perluasan anggaran pemasaran digital dan tambahan dua staf admisi khusus gelombang pertama. Terima kasih.',
      message: 'Menjadikan PPDB mesin pertumbuhan mutu — bukan sekadar penerimaan murid baru.',
      bullets: ['Target 700 murid baru (+14%)', '60 beasiswa prestasi & afirmasi', '50 SMP mitra aktif'],
      contact: 'Divisi Admisi · admisi@cendekianusantara.sch.id',
    },
  ]),
}

// Teks dokumen sumber yang cocok dengan deck contoh (untuk tombol "Muat contoh")
export const DEFAULT_DOCUMENT = `# LAPORAN PPDB — PENERIMAAN PESERTA DIDIK BARU
Organisasi: Cendekia Nusantara
Divisi: Divisi Admisi
Periode: TA 2024/2025

## Ringkasan Kinerja
Murid Baru: 612 (111% dari target 550 — kuota penuh sejak gelombang kedua)
Total Pendaftar: 2.847 (rasio seleksi 4,7:1 — kompetisi tertinggi 3 tahun terakhir)
Jalur Penerimaan: 5 (Zonasi, Prestasi, Reguler, Afirmasi, Mutasi)
Konversi Daftar Ulang: 94,4% (gelombang 3 Juli — retensi keluarga baru sangat tinggi)

## Komposisi Jalur Penerimaan
Zonasi: 251
Prestasi: 165
Reguler: 110
Afirmasi: 74
Mutasi: 12

## Gelombang Seleksi
| Gelombang | Periode | Pendaftar | Lulus Seleksi | Daftar Ulang |
| --- | --- | --- | --- | --- |
| GW1 | Feb–Apr | 1.120 | 402 | 258 |
| GW2 | Mei–Jun | 1.288 | 451 | 287 |
| GW3 | Jul | 439 | 71 | 67 |

Corong: Pendaftar 2.847 → Lulus Seleksi 924 → Daftar Ulang 612

## Tren Pendaftar Bulanan
Feb: 120
Mar: 340
Apr: 490
Mei: 670
Jun: 780
Jul: 447
Insight: puncak Juni didorong Open House ke-3 dan pengumuman hasil GW2; kampanye 2026 harus menyala lebih awal di Feb–Mar.

## Program Kerja
- PPDB Online — waktu proses turun 68%, alur daring terintegrasi verifikasi & pembayaran [Proses −68%]
- Open House — 24 acara, 3.100 keluarga berkunjung, konversi kunjungan ke pendaftar 38% [24 acara]
- Kemitraan SMP — 38 SMP mitra menyumbang 37% pendaftar [38 SMP]
- Beasiswa Prestasi — 40 penerima hafizh/atlet/olimpiade memperkuat profil mutu [40 penerima]

## Penutup
Menjadikan PPDB mesin pertumbuhan mutu — bukan sekadar penerimaan murid baru.
- Target 700 murid baru (+14%)
- 60 beasiswa prestasi & afirmasi
- 50 SMP mitra aktif
Kontak: Divisi Admisi · admisi@cendekianusantara.sch.id
`
