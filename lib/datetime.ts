const DATE_TIME_WITHOUT_TZ_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/;

const parseDateValue = (value: string): Date | null => {
  const raw = value.trim();
  if (!raw) return null;

  // Treat database timestamps without TZ as UTC to avoid browser-dependent parsing.
  const normalized = DATE_TIME_WITHOUT_TZ_RE.test(raw)
    ? `${raw.replace(' ', 'T')}Z`
    : raw.replace(' ', 'T');

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const resolveTimezone = (timezone?: string | null): string | undefined => {
  if (!timezone) return undefined;
  const candidate = timezone.trim();
  if (!candidate) return undefined;

  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return undefined;
  }
};

export const formatDateTimeForUser = (
  value?: string | null,
  timezone?: string | null
): string => {
  if (!value) return 'не задано';

  const parsed = parseDateValue(value);
  if (!parsed) return value;

  const tz = resolveTimezone(timezone);

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(tz ? { timeZone: tz } : {}),
  });

  return formatter.format(parsed);
};
