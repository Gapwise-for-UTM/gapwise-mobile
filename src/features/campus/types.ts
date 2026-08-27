export type VerificationStatus = "verified" | "inferred" | "unknown";
export type FactStatus =
  | "verified"
  | "stale"
  | "inferred"
  | "user-reported"
  | "unavailable"
  | "unknown";

export type BuildingAccessibility =
  | "accessible"
  | "not_accessible"
  | "unknown";

export interface Provenance {
  source: string;
  sourceUrl: string;
  lastVerified: string;
  verificationStatus: VerificationStatus;
}

export interface Building {
  code: string;
  name: string;
  category: "academic" | "residence" | "facility";
  aliases: string[];
  routingCoverage: "mapped" | "identity-only";
  entranceCount: number;
  verifiedEntranceCount: number;
  accessibility: BuildingAccessibility;
  indoorRoomNodeCount: number;
  provenance: Provenance[];
}

export interface CampusPlace {
  id: string;
  name: string;
  kind:
    | "dining"
    | "study"
    | "library"
    | "service"
    | "recreation"
    | "amenity"
    | "facility";
  buildingCode: string;
  floorOrRoom?: string;
  summary: string;
  amenities: readonly string[];
  availability: {
    state: "open" | "closed" | "unknown";
    freshness: FactStatus;
    evaluatedAt: string;
    nextTransition: string | null;
  };
}

export interface RouteResult {
  dataVersion: string;
  from: Building;
  to: Building;
  status: "same-building" | "routed" | "approximate" | "unavailable";
  accuracy: string;
  totalDistanceMeters: number | null;
  indoorDistanceMeters: number | null;
  outdoorDistanceMeters: number | null;
  estimatedSeconds: number | null;
  floorChanges: number | null;
  warnings: string[];
  routeVerification: "verified" | "mixed" | "inferred" | "unavailable";
}

export interface ResponseMeta {
  apiVersion: "v1";
  dataVersion: string;
  generatedAt?: string;
  requestId: string;
}

export interface CampusCollection<T> {
  data: T[];
  meta: ResponseMeta & {
    pagination: {
      limit: number;
      offset: number;
      count: number;
      total: number;
      nextOffset: number | null;
    };
  };
}

export interface CampusSnapshot {
  dataVersion: string;
  fetchedAt: string;
  buildings: Building[];
  places: CampusPlace[];
}
