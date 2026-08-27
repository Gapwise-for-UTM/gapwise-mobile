import type {
  Building,
  BuildingAccessibility,
  CampusPlace,
  CampusSnapshot,
  RouteResult,
} from "./types.ts";

export function normalizeCampusQuery(value: string): string {
  return value.trim().toLocaleLowerCase("en-CA");
}

export function filterBuildings(
  buildings: readonly Building[],
  query: string,
): Building[] {
  const normalized = normalizeCampusQuery(query);
  if (!normalized) return [...buildings];
  return buildings.filter((building) =>
    [building.code, building.name, ...building.aliases].some((value) =>
      value.toLocaleLowerCase("en-CA").includes(normalized),
    ),
  );
}

export function filterPlaces(
  places: readonly CampusPlace[],
  query: string,
): CampusPlace[] {
  const normalized = normalizeCampusQuery(query);
  if (!normalized) return [...places];
  return places.filter((place) =>
    [place.name, place.kind, place.buildingCode, ...place.amenities].some(
      (value) => value.toLocaleLowerCase("en-CA").includes(normalized),
    ),
  );
}

export function accessibilityLabel(value: BuildingAccessibility): string {
  if (value === "accessible") return "Source marks accessible";
  if (value === "not_accessible") return "Source marks not accessible";
  return "Accessibility unknown";
}

export function routeVerificationLabel(route: RouteResult): string {
  if (route.routeVerification === "verified") return "Verified route evidence";
  if (route.routeVerification === "mixed") return "Mixed route evidence";
  if (route.routeVerification === "inferred") return "Inferred route evidence";
  return "Route evidence unavailable";
}

export function routeDurationLabel(seconds: number | null): string {
  if (seconds === null) return "Travel time unavailable";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} min estimated walk`;
}

export function snapshotAgeHours(
  fetchedAt: string,
  now: Date = new Date(),
): number {
  const timestamp = Date.parse(fetchedAt);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - timestamp) / 3_600_000);
}

export function snapshotFreshnessLabel(
  snapshot: Pick<CampusSnapshot, "dataVersion" | "fetchedAt">,
  now: Date = new Date(),
): string {
  const hours = snapshotAgeHours(snapshot.fetchedAt, now);
  if (hours < 1)
    return `Campus data ${snapshot.dataVersion} · refreshed recently`;
  if (hours < 24)
    return `Campus data ${snapshot.dataVersion} · cached ${Math.floor(hours)}h ago`;
  return `Campus data ${snapshot.dataVersion} · cached ${Math.floor(hours / 24)}d ago`;
}

export function splitForSecureStore(value: string, chunkSize = 1800): string[] {
  if (chunkSize < 1) throw new Error("chunkSize must be positive");
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }
  return chunks.length > 0 ? chunks : [""];
}

export function joinSecureStoreChunks(chunks: readonly string[]): string {
  return chunks.join("");
}
