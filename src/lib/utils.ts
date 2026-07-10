// Shared helpers

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/č|ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "lokal";
}

export function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Monday of the week containing `date`, as YYYY-MM-DD (local time). */
export function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** ISO weekday (1 = Monday … 7 = Sunday) for a YYYY-MM-DD string. */
export function isoWeekday(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatMoney(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatHours(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
