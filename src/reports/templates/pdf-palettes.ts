export interface PdfPalette {
  name: string;
  header: string;
  headerDark: string;
  accent: string;
  tableHead: string;
  soft: string;
  rowAlt: string;
  barTrack: string;
  ink: string;
  muted: string;
  line: string;
}

/**
 * Paletas listas para usar en el PDF. Se eligen con REPORT_PDF_PALETTE.
 * Todas mantienen el mismo contraste para que el reporte sea legible.
 */
export const PDF_PALETTES: Record<string, PdfPalette> = {
  azul: {
    name: 'Azul clásico',
    header: '#90adec',
    headerDark: '#6f8fd6',
    accent: '#1d4ed8',
    tableHead: '#1e3a5f',
    soft: '#f4f7fc',
    rowAlt: '#f8fafc',
    barTrack: '#e5edf9',
    ink: '#111827',
    muted: '#6b7280',
    line: '#dbe4f0',
  },
  oceano: {
    name: 'Océano',
    header: '#7fd1c1',
    headerDark: '#3fa796',
    accent: '#0f766e',
    tableHead: '#134e4a',
    soft: '#effcf9',
    rowAlt: '#f6fdfb',
    barTrack: '#d6f2ec',
    ink: '#0f172a',
    muted: '#5b7c78',
    line: '#cde9e3',
  },
  grafito: {
    name: 'Grafito',
    header: '#cbd5e1',
    headerDark: '#94a3b8',
    accent: '#b45309',
    tableHead: '#1f2937',
    soft: '#f3f4f6',
    rowAlt: '#f9fafb',
    barTrack: '#e5e7eb',
    ink: '#111827',
    muted: '#6b7280',
    line: '#d1d5db',
  },
};

export const DEFAULT_PDF_PALETTE = 'oceano';

/** Devuelve la paleta configurada, o la azul si el nombre no existe. */
export function getPdfPalette(name?: string): PdfPalette {
  const key = String(
    name || process.env.REPORT_PDF_PALETTE || DEFAULT_PDF_PALETTE,
  )
    .trim()
    .toLowerCase();

  return PDF_PALETTES[key] || PDF_PALETTES[DEFAULT_PDF_PALETTE];
}
