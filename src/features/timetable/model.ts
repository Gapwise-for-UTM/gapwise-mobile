export type ActivityType = "LEC" | "TUT" | "PRA" | "OTHER";
export type Term = "Fall" | "Winter" | "Summer";
export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface Meeting {
  id: string;
  courseCode: string;
  activityType: ActivityType;
  sectionCode: string;
  courseName: string;
  startTime: number;
  endTime: number;
  weekday: Weekday;
  buildingCode: string | null;
  room: string | null;
  term: Term;
  locationUnknown: boolean;
}

export interface Gap {
  id: string;
  term: Term;
  weekday: Weekday;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  previous: Meeting;
  next: Meeting;
}

export const WEEKDAYS: readonly Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const JS_WEEKDAYS: readonly Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function weekdayForDate(date: Date): Weekday {
  return JS_WEEKDAYS[date.getDay()]!;
}

export function termForMonth(month: number): Term {
  if (month <= 4) return "Winter";
  if (month <= 8) return "Summer";
  return "Fall";
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export function locationLabel(meeting: Meeting): string {
  if (meeting.locationUnknown) return "Location TBA";
  if (meeting.buildingCode && meeting.room)
    return `${meeting.buildingCode} ${meeting.room}`;
  return meeting.buildingCode ?? meeting.room ?? "Location TBA";
}

export function gapsForMeetings(meetings: readonly Meeting[]): Gap[] {
  const groups = new Map<string, Meeting[]>();
  for (const meeting of meetings) {
    const key = `${meeting.term}:${meeting.weekday}`;
    const group = groups.get(key) ?? [];
    group.push(meeting);
    groups.set(key, group);
  }

  const gaps: Gap[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);
    for (let index = 0; index < group.length - 1; index += 1) {
      const previous = group[index]!;
      const next = group[index + 1]!;
      if (next.startTime <= previous.endTime) continue;
      gaps.push({
        id: `${previous.id}:${next.id}`,
        term: previous.term,
        weekday: previous.weekday,
        startTime: previous.endTime,
        endTime: next.startTime,
        durationMinutes: next.startTime - previous.endTime,
        previous,
        next,
      });
    }
  }
  return gaps.sort(
    (a, b) =>
      WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
      a.startTime - b.startTime,
  );
}

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
 * Build a compact deterministic representation for an explicit user share.
 * Only canonical meeting fields already visible in the timetable UI are used;
 * account/session/cloud metadata and internal meeting IDs never enter the text.
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

  let currentDay: Weekday | null = null;
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

export const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: "sample-csc110",
    courseCode: "CSC110Y5",
    activityType: "LEC",
    sectionCode: "LEC0101",
    courseName: "Foundations of Computer Science I",
    startTime: 10 * 60,
    endTime: 11 * 60,
    weekday: "Monday",
    buildingCode: "MN",
    room: "1210",
    term: "Fall",
    locationUnknown: false,
  },
  {
    id: "sample-mat157",
    courseCode: "MAT157Y5",
    activityType: "LEC",
    sectionCode: "LEC0101",
    courseName: "Analysis I",
    startTime: 11 * 60 + 10,
    endTime: 12 * 60,
    weekday: "Monday",
    buildingCode: "DH",
    room: "2020",
    term: "Fall",
    locationUnknown: false,
  },
  {
    id: "sample-mat223",
    courseCode: "MAT223H5",
    activityType: "LEC",
    sectionCode: "LEC0101",
    courseName: "Linear Algebra I",
    startTime: 14 * 60,
    endTime: 15 * 60,
    weekday: "Monday",
    buildingCode: "IB",
    room: "110",
    term: "Fall",
    locationUnknown: false,
  },
];
