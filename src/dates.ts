/** Local-time ISO date (YYYY-MM-DD) for a Date. */
export function toISODate(date: Date): string {
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

export function today(): string {
	return toISODate(new Date());
}

/** ISO date `days` from today; negative values look backwards. */
export function fromToday(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return toISODate(date);
}

/**
 * Human-readable form of an ISO date relative to today — "Today",
 * "Tomorrow", "Yesterday", or the date itself.
 */
export function formatDue(iso: string): string {
	if (iso === today()) return "Today";
	if (iso === fromToday(1)) return "Tomorrow";
	if (iso === fromToday(-1)) return "Yesterday";
	return iso;
}
