/**
 * Days until an event, measured to the END of the event day.
 *
 * Critical: a gig happening TONIGHT has an eventDate of today at 00:00 UTC,
 * which naively reads as "in the past" — that suppressed the most urgent,
 * highest-leverage gigs of all. Always use this helper.
 */
export function daysUntil(eventDate: string, from: Date = new Date()): number {
  const end = new Date(`${eventDate.slice(0, 10)}T23:59:59Z`).getTime();
  return (end - from.getTime()) / 86_400_000;
}
