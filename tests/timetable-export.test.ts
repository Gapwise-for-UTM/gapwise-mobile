import assert from "node:assert/strict";
import test from "node:test";
import {
  timetableShareText,
  type Meeting,
} from "../src/features/timetable/model.ts";

const meetings: Meeting[] = [
  {
    id: "private-internal-id-2",
    courseCode: "MAT223H5",
    activityType: "LEC",
    sectionCode: "LEC0101",
    courseName: "Linear Algebra I",
    startTime: 14 * 60,
    endTime: 15 * 60,
    weekday: "Tuesday",
    buildingCode: "IB",
    room: "110",
    term: "Fall",
    locationUnknown: false,
  },
  {
    id: "private-internal-id-1",
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
    id: "winter-id",
    courseCode: "CSC111H5",
    activityType: "TUT",
    sectionCode: "TUT0101",
    courseName: "Foundations of Computer Science II",
    startTime: 12 * 60,
    endTime: 13 * 60,
    weekday: "Monday",
    buildingCode: null,
    room: null,
    term: "Winter",
    locationUnknown: true,
  },
];

test("exports only the selected term in stable weekday/time order", () => {
  assert.equal(
    timetableShareText(meetings, "Fall"),
    [
      "Gapwise · Fall timetable",
      "",
      "Monday",
      "10:00 AM–11:00 AM · CSC110Y5 LEC · MN 1210",
      "",
      "Tuesday",
      "2:00 PM–3:00 PM · MAT223H5 LEC · IB 110",
      "",
      "Shared intentionally from Gapwise. No account data included.",
    ].join("\n"),
  );
});

test("does not expose internal meeting identifiers or unrelated term data", () => {
  const text = timetableShareText(meetings, "Fall");
  assert.equal(text.includes("private-internal-id"), false);
  assert.equal(text.includes("winter-id"), false);
  assert.equal(text.includes("CSC111H5"), false);
  assert.equal(text.includes("LEC0101"), false);
});

test("empty term export is explicit and compact", () => {
  assert.equal(
    timetableShareText([], "Summer"),
    "Gapwise · Summer timetable\nNo meetings saved for this term.",
  );
});
