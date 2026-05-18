const pad = (value: number): string => String(value).padStart(2, '0');

const formatDateParts = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function formatPrestashopDate(value: Date | string | null | undefined): string {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return formatDateParts(value);
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return '';
  }

  const dayMonthYear = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    return `${year}-${month}-${day} 00:00:00`;
  }

  const isoDateTime = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (isoDateTime) {
    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = isoDateTime;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateParts(parsed);
  }

  return trimmed;
}
