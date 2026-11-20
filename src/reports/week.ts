const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave ISO de la semana local, p. ej. `2026-W46`. */
export function getWeekKey(date: Date): string {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7,
  );

  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Acepta el formato nuevo (`2026-W46`) y el antiguo (`Mon Nov 09 2026`)
 * para no perder el flag de instalaciones que actualizan.
 */
export function parseWeekKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (/^\d{4}-W\d{2}$/.test(value)) return value;

  const legacy = new Date(value);
  if (!Number.isNaN(legacy.getTime())) return getWeekKey(legacy);
  return null;
}

/** Hay que enviar si nunca se envió o si el flag es de una semana anterior. */
export function isDueForWeeklyReport(
  flag: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const flagWeek = parseWeekKey(flag);
  if (!flagWeek) return true;
  return flagWeek < getWeekKey(now);
}

/** Etiqueta legible del rango lunes..domingo de la semana indicada. */
export function getWeekRangeLabel(now: Date = new Date()): string {
  const dayNumber = now.getDay() || 7;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayNumber + 1,
  );
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  return `${getWeekKey(now)} · ${format.format(monday)} – ${format.format(sunday)}`;
}
