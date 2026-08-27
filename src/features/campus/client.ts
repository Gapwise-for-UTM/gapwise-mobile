import { gapwiseFetch } from "@/src/lib/api";
import type {
  Building,
  CampusCollection,
  CampusPlace,
  CampusSnapshot,
  RouteResult,
} from "./types";

export async function fetchCampusSnapshot(): Promise<CampusSnapshot> {
  const [buildings, places] = await Promise.all([
    gapwiseFetch<CampusCollection<Building>>("buildings?limit=100"),
    gapwiseFetch<CampusCollection<CampusPlace>>("places?limit=100"),
  ]);

  const dataVersion = buildings.meta.dataVersion;
  return {
    dataVersion,
    fetchedAt: new Date().toISOString(),
    buildings: buildings.data,
    places: places.data,
  };
}

export async function fetchCampusRoute(
  from: string,
  to: string,
  mode: "fastest" | "prefer-indoor" | "step-free" = "fastest",
): Promise<RouteResult> {
  const response = await gapwiseFetch<{ data: RouteResult }>("routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, preferences: { mode } }),
  });
  return response.data;
}
