import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDuration,
  formatTime,
  gapsForMeetings,
  locationLabel,
  termForMonth,
  weekdayForDate,
  type Meeting,
} from "../src/features/timetable/model.ts";

function meeting(overrides: Partial<Meeting>): Meeting {
  return {
    id: "meeting",
    courseCode: "CSC110Y5",
    activityType: "LEC",
    sectionCode: "LEC0101",
    courseName: "Foundations of Computer Science I",
    startTime: 600,
    endTime: 660,
    weekday: "Monday",
    buildingCode: "MN",
    room: "1210",
    term: "Fall",
    locationUnknown: false,
    ...overrides,
  };
}

test("academic term boundaries follow Gapwise month semantics", () => {
  assert.equal(termForMonth(0), "Winter");
  assert.equal(termForMonth(4), "Winter");
  assert.equal(termForMonth(5), "Summer");
  assert.equal(termForMonth(8), "Summer");
  assert.equal(termForMonth(9), "Fall");
  assert.equal(termForMonth(11), "Fall");
});

test("weekday mapping includes weekend classes", () => {
  assert.equal(weekdayForDate(new Date(2026, 7, 29)), "Saturday");
  assert.equal(weekdayForDate(new Date(2026, 7, 30)), "Sunday");
  assert.equal(weekdayForDate(new Date(2026, 7, 31)), "Monday");
});

test("time and duration labels remain student-readable", () => {
  assert.equal(formatTime(0), "12:00 AM");
  assert.equal(formatTime(12 * 60), "12:00 PM");
  assert.equal(formatTime(13 * 60 + 5), "1:05 PM");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(60), "1 hr");
  assert.equal(formatDuration(135), "2 hr 15 min");
});

test("location labels never invent a campus location", () => {
  assert.equal(locationLabel(meeting({})), "MN 1210");
  assert.equal(locationLabel(meeting({ room: null })), "MN");
  assert.equal(
    locationLabel(meeting({ buildingCode: null, room: null })),
    "Location TBA",
  );
  assert.equal(locationLabel(meeting({ locationUnknown: true })), "Location TBA");
});

test("gaps are computed only between non-overlapping meetings in the same term and day", () => {
  const first = meeting({ id: "first", startTime: 600, endTime: 660 });
  const overlap = meeting({ id: "overlap", startTime: 650, endTime: 700 });
  const second = meeting({ id: "second", startTime: 780, endTime: 840 });
  const winter = meeting({
    id: "winter",
    term: "Winter",
    startTime: 900,
    endTime: 960,
  });
  const tuesday = meeting({
    id: "tuesday",
    weekday: "Tuesday",
    startTime: 900,
    endTime: 960,
  });

  const gaps = gapsForMeetings([second, winter, overlap, tuesday, first]);

  assert.equal(gaps.length, 1);
  assert.equal(gaps[0]?.previous.id, "overlap");
  assert.equal(gaps[0]?.next.id, "second");
  assert.equal(gaps[0]?.startTime, 700);
  assert.equal(gaps[0]?.endTime, 780);
  assert.equal(gaps[0]?.durationMinutes, 80);
});

test("gap ordering is Monday-through-Sunday then chronological", () => {
  const meetings = [
    meeting({ id: "tue-a", weekday: "Tuesday", startTime: 600, endTime: 660 }),
    meeting({ id: "tue-b", weekday: "Tuesday", startTime: 720, endTime: 780 }),
    meeting({ id: "mon-a", startTime: 900, endTime: 960 }),
    meeting({ id: "mon-b", startTime: 1020, endTime: 1080 }),
  ];

  const gaps = gapsForMeetings(meetings);
  assert.deepEqual(
    gaps.map((gap) => gap.weekday),
    ["Monday", "Tuesday"],
  );
});
