import {
  formatTime,
  locationLabel,
  WEEKDAYS,
  type Meeting,
  type Term,
} from "./model";

function compareMeetings(a: Meeting, b: Meeting): number {
  return (
    WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
    a.startTime - b.startTime ||
    a.endTime - b.endTime ||
    a.courseCode.localeCompare(b.courseCode) ||
    a.sectionCode.localeCompare(b.sectionCode)
  );
}

/**
 * Build a compact, deterministic text representation for an explicit user share.
 *
 * This deliberately includes only canonical meeting fields already visible in
 * the timetable UI. It never includes account identifiers, auth/session data,
 * cloud metadata, internal IDs, or diagnostics.
 */
export function timetableShareText(
  meetings: readonly Meeting[],
  term: Term,
): string {
  const selected = meetings
    .filter((meeting) => meeting.term === term)
    .slice()
    .sort(compareMeetings);

  const lines = [`Gapwise · ${term} timetable`];
  if (selected.length === 0) {
    return `${lines[0]}\nNo meetings saved for this term.`;
  }

  let currentDay: Meeting["weekday"] | null = null;
  for (const meeting of selected) {
    if (meeting.weekday !== currentDay) {
      currentDay = meeting.weekday;
      lines.push("", currentDay);
    }
    lines.push(
      `${formatTime(meeting.startTime)}–${formatTime(meeting.endTime)} · ${meeting.courseCode} ${meeting.activityType} · ${locationLabel(meeting)}`,
    );
  }

  lines.push("", "Shared intentionally from Gapwise. No account data included.");
  return lines.join("\n");
}
