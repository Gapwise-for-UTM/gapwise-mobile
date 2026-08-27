import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Network from "expo-network";
import { Card } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import { readCampusCache, writeCampusCache } from "@/src/features/campus/cache";
import {
  fetchCampusRoute,
  fetchCampusSnapshot,
} from "@/src/features/campus/client";
import {
  accessibilityLabel,
  filterBuildings,
  filterPlaces,
  routeDurationLabel,
  routeVerificationLabel,
  snapshotFreshnessLabel,
} from "@/src/features/campus/model";
import type {
  Building,
  CampusSnapshot,
  RouteResult,
} from "@/src/features/campus/types";
import { useGapwiseTheme } from "@/src/theme";

type LoadState = "loading" | "ready" | "offline" | "error";

function buildingSummary(building: Building) {
  if (building.routingCoverage === "identity-only") {
    return "Building identity is known; mapped routing is not currently available.";
  }
  if (building.verifiedEntranceCount === 0) {
    return `${building.entranceCount} mapped entrance${building.entranceCount === 1 ? "" : "s"}; none are verified yet.`;
  }
  return `${building.verifiedEntranceCount} verified entrance${building.verifiedEntranceCount === 1 ? "" : "s"} in canonical campus data.`;
}

export default function CampusScreen() {
  const theme = useGapwiseTheme();
  const [snapshot, setSnapshot] = useState<CampusSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState<string>("MN");
  const [to, setTo] = useState<string>("IB");
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);

  const loadCampus = useCallback(async () => {
    setLoadState("loading");
    setMessage(null);

    const cached = await readCampusCache().catch(() => null);
    if (cached) setSnapshot(cached);

    const network = await Network.getNetworkStateAsync().catch(() => null);
    if (network && network.isConnected === false) {
      setLoadState(cached ? "offline" : "error");
      setMessage(
        cached
          ? "Offline — showing the last canonical campus snapshot saved on this device."
          : "Campus data has not been cached on this device yet. Reconnect once to load it.",
      );
      return;
    }

    try {
      const fresh = await fetchCampusSnapshot();
      setSnapshot(fresh);
      setLoadState("ready");
      await writeCampusCache(fresh).catch(() => {
        setMessage(
          "Campus data is current, but this device could not refresh the offline cache.",
        );
      });
    } catch {
      if (cached) {
        setLoadState("offline");
        setMessage(
          "The campus service is unavailable. Gapwise is keeping the last cached source-backed snapshot visible.",
        );
      } else {
        setLoadState("error");
        setMessage(
          "Campus intelligence could not load. No campus claims are being invented while the source is unavailable.",
        );
      }
    }
  }, []);

  useEffect(() => {
    void loadCampus();
  }, [loadCampus]);

  const buildings = useMemo(
    () => filterBuildings(snapshot?.buildings ?? [], query).slice(0, 12),
    [query, snapshot],
  );
  const places = useMemo(
    () => filterPlaces(snapshot?.places ?? [], query).slice(0, 8),
    [query, snapshot],
  );

  const requestRoute = useCallback(async () => {
    setRouting(true);
    setRoute(null);
    setMessage(null);
    const network = await Network.getNetworkStateAsync().catch(() => null);
    if (network && network.isConnected === false) {
      setRouting(false);
      setMessage(
        "Route calculation needs the canonical Gapwise routing service. Cached building and place details remain available offline.",
      );
      return;
    }
    try {
      setRoute(await fetchCampusRoute(from, to));
    } catch {
      setMessage(
        "A source-backed route could not be calculated. Gapwise will not substitute an unverified path.",
      );
    } finally {
      setRouting(false);
    }
  }, [from, to]);

  return (
    <Screen title="Campus" eyebrow="UTM INTELLIGENCE">
      <Card label="SOURCE OF TRUTH" title="Canonical Gapwise campus data">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Buildings, places, routing confidence, entrances, and accessibility
          uncertainty come from the public Gapwise v1 contract. Unknown remains
          unknown.
        </Text>
        {snapshot ? (
          <Text style={[styles.meta, { color: theme.blue }]}>
            {snapshotFreshnessLabel(snapshot)}
          </Text>
        ) : null}
        {message ? (
          <Text
            accessibilityRole="alert"
            style={[styles.notice, { color: theme.text }]}
          >
            {message}
          </Text>
        ) : null}
        {loadState === "loading" ? (
          <ActivityIndicator accessibilityLabel="Loading campus data" />
        ) : null}
        {loadState === "error" ? (
          <PrimaryButton
            label="Retry campus data"
            onPress={() => void loadCampus()}
          />
        ) : null}
      </Card>

      <Card label="EXPLORE" title="Buildings and places">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search building, place, or amenity"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Search campus buildings and places"
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        />
        <Text style={[styles.selectorHint, { color: theme.textMuted }]}>
          Selecting route {selecting === "from" ? "origin" : "destination"}.
          Next tap will set {selecting === "from" ? "From" : "To"}.
        </Text>
        <View style={styles.chips}>
          {buildings.map((building) => (
            <Pressable
              key={building.code}
              accessibilityRole="button"
              accessibilityLabel={`${building.code}, ${building.name}. Set as route ${selecting === "from" ? "origin" : "destination"}. ${accessibilityLabel(building.accessibility)}`}
              onPress={() => {
                if (selecting === "from") {
                  setFrom(building.code);
                  setSelecting("to");
                } else {
                  setTo(building.code);
                  setSelecting("from");
                }
                setRoute(null);
              }}
              style={[
                styles.buildingChip,
                {
                  borderColor:
                    building.code === from || building.code === to
                      ? theme.blue
                      : theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Text style={[styles.code, { color: theme.blue }]}>
                {building.code}
              </Text>
              <Text style={[styles.name, { color: theme.text }]}>
                {building.name}
              </Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>
                {building.code === from ? "From · " : ""}
                {building.code === to ? "To · " : ""}
                {buildingSummary(building)}
              </Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>
                {accessibilityLabel(building.accessibility)}
              </Text>
            </Pressable>
          ))}
        </View>
        {snapshot && buildings.length === 0 && places.length === 0 ? (
          <Text style={[styles.body, { color: theme.textMuted }]}>
            No canonical campus result matches that search.
          </Text>
        ) : null}
        {places.map((place) => (
          <View
            key={place.id}
            style={[styles.placeRow, { borderTopColor: theme.border }]}
          >
            <Text style={[styles.name, { color: theme.text }]}>
              {place.name}
            </Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>
              {place.kind} · {place.buildingCode}
              {place.floorOrRoom ? ` · ${place.floorOrRoom}` : ""}
            </Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>
              {place.summary}
            </Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>
              Availability: {place.availability.state} · evidence{" "}
              {place.availability.freshness}
            </Text>
          </View>
        ))}
      </Card>

      <Card label="ROUTE" title={`${from} → ${to}`}>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Building taps alternate between route origin and destination. Route
          results are textual first so the same uncertainty is available to
          screen-reader users without relying on a map.
        </Text>
        <View style={styles.routeActions}>
          <PrimaryButton
            label={routing ? "Calculating…" : "Calculate canonical route"}
            onPress={() => void requestRoute()}
            disabled={routing || from === to}
          />
        </View>
        {route ? (
          <View accessibilityLiveRegion="polite" style={styles.routeResult}>
            <Text style={[styles.routeTitle, { color: theme.text }]}>
              {route.from.name} → {route.to.name}
            </Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              {routeDurationLabel(route.estimatedSeconds)} · {route.status}
            </Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              {routeVerificationLabel(route)}. {route.accuracy}
            </Text>
            {route.totalDistanceMeters !== null ? (
              <Text style={[styles.body, { color: theme.textMuted }]}>
                {Math.round(route.totalDistanceMeters)} m total
              </Text>
            ) : null}
            {route.warnings.map((warning) => (
              <Text
                key={warning}
                style={[styles.warning, { color: theme.text }]}
              >
                • {warning}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      <Card label="PRIVACY" title="No background location required">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Campus browsing and building-to-building routing do not send a
          timetable, account, friend graph, or precise live location to the
          public campus API. This phase does not request background location
          permission.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22 },
  meta: { marginTop: 10, fontSize: 12, fontWeight: "700" },
  notice: { marginTop: 10, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  selectorHint: { marginTop: 10, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 12,
  },
  chips: { gap: 10, marginTop: 12 },
  buildingChip: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    minHeight: 64,
  },
  code: { fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  name: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  small: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  placeRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 12,
  },
  routeActions: { marginTop: 12 },
  routeResult: { marginTop: 14, gap: 5 },
  routeTitle: { fontSize: 17, fontWeight: "800" },
  warning: { fontSize: 13, lineHeight: 18 },
});
