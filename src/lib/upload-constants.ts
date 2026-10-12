// Konstanta client-safe untuk UI upload (duplikat ringan dari
// file-parser.server.ts — JANGAN import modul server di client).

export const MAX_UPLOAD_SIZE_MB = 20

export const SUPPORTED_UPLOAD_ACCEPT =
  '.txt,.md,.markdown,.csv,.tsv,.json,.log,.xml,.yaml,.yml,.ini,.env,.tex,.srt,.vtt,.sql,.sh,.py,.js,.ts,.css,.html,.htm,.rtf,.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.ods,.ppt,.pptx,.odt,.msg,.eml,.ics,.vcf'

export interface SupportedFormatGroup {
  group: string
  items: string[]
}

export const SUPPORTED_FORMATS_LABEL: SupportedFormatGroup[] = [
  { group: 'Teks & Data', items: ['TXT', 'MD', 'CSV', 'TSV', 'JSON', 'LOG', 'XML', 'YAML'] },
  { group: 'Dokumen', items: ['PDF', 'DOC', 'DOCX', 'RTF', 'ODT', 'HTML'] },
  { group: 'Spreadsheet', items: ['XLSX', 'XLS', 'XLSM', 'ODS'] },
  { group: 'Presentasi', items: ['PPTX', 'PPT'] },
]
