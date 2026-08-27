import assert from "node:assert/strict";
import test from "node:test";

import {
  accessibilityLabel,
  filterBuildings,
  filterPlaces,
  joinSecureStoreChunks,
  routeDurationLabel,
  snapshotFreshnessLabel,
  splitForSecureStore,
} from "../src/features/campus/model.ts";
import type { Building, CampusPlace } from "../src/features/campus/types.ts";

const buildings: Building[] = [
  {
    code: "MN",
    name: "Maanjiwe nendamowinan",
    category: "academic",
    aliases: ["Maanjiwe nendamowinan Building"],
    routingCoverage: "mapped",
    entranceCount: 1,
    verifiedEntranceCount: 1,
    accessibility: "unknown",
    indoorRoomNodeCount: 0,
    provenance: [],
  },
  {
    code: "DV",
    name: "William G. Davis Building",
    category: "academic",
    aliases: ["Davis"],
    routingCoverage: "mapped",
    entranceCount: 4,
    verifiedEntranceCount: 4,
    accessibility: "accessible",
    indoorRoomNodeCount: 0,
    provenance: [],
  },
];

const places: CampusPlace[] = [
  {
    id: "library",
    name: "Hazel McCallion Academic Learning Centre",
    kind: "library",
    buildingCode: "HM",
    summary: "Library and study space",
    amenities: ["study", "computers"],
    availability: {
      state: "unknown",
      freshness: "unknown",
      evaluatedAt: "2026-08-27T00:00:00Z",
      nextTransition: null,
    },
  },
];

test("building search matches canonical code, name, and aliases", () => {
  assert.deepEqual(
    filterBuildings(buildings, "mn").map((item) => item.code),
    ["MN"],
  );
  assert.deepEqual(
    filterBuildings(buildings, "davis").map((item) => item.code),
    ["DV"],
  );
});

test("place search includes kind, building, and amenities without inventing data", () => {
  assert.equal(filterPlaces(places, "computers")[0]?.id, "library");
  assert.equal(filterPlaces(places, "HM")[0]?.id, "library");
  assert.equal(filterPlaces(places, "dining").length, 0);
});

test("accessibility labels preserve unknown state", () => {
  assert.equal(accessibilityLabel("unknown"), "Accessibility unknown");
  assert.equal(accessibilityLabel("accessible"), "Source marks accessible");
});

test("route duration rounds up conservatively", () => {
  assert.equal(routeDurationLabel(1), "1 min estimated walk");
  assert.equal(routeDurationLabel(121), "3 min estimated walk");
  assert.equal(routeDurationLabel(null), "Travel time unavailable");
});

test("campus cache chunks round-trip exactly", () => {
  const raw = JSON.stringify({
    dataVersion: "2026-08-10",
    value: "x".repeat(7000),
  });
  const chunks = splitForSecureStore(raw, 1800);
  assert.ok(chunks.length > 1);
  assert.equal(joinSecureStoreChunks(chunks), raw);
});

test("freshness label includes canonical data version and cache age", () => {
  const label = snapshotFreshnessLabel(
    { dataVersion: "2026-08-10", fetchedAt: "2026-08-27T08:00:00Z" },
    new Date("2026-08-27T10:30:00Z"),
  );
  assert.equal(label, "Campus data 2026-08-10 · cached 2h ago");
});
