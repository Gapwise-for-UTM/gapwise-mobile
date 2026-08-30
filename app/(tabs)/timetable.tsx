import { useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Card } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import {
  formatDuration,
  formatTime,
  locationLabel,
  timetableShareText,
  WEEKDAYS,
  type Term,
} from "@/src/features/timetable/model";
import { useTimetable } from "@/src/features/timetable/store";
import { useGapwiseTheme } from "@/src/theme";

const TERMS: Term[] = ["Fall", "Winter", "Summer"];

export default function TimetableScreen() {
  const theme = useGapwiseTheme();
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const {
    meetings,
    gaps,
    activeTerm,
    setActiveTerm,
    loadSample,
    clear,
    hydrated,
    persistenceError,
  } = useTimetable();
  const termMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.term === activeTerm),
    [activeTerm, meetings],
  );
  const meetingsByDay = useMemo(
    () =>
      new Map(
        WEEKDAYS.map((day) => [
          day,
          termMeetings
            .filter((meeting) => meeting.weekday === day)
            .sort((a, b) => a.startTime - b.startTime),
        ]),
      ),
    [termMeetings],
  );
  const gapsByDay = useMemo(
    () =>
      new Map(
        WEEKDAYS.map((day) => [
          day,
          gaps.filter((gap) => gap.term === activeTerm && gap.weekday === day),
        ]),
      ),
    [activeTerm, gaps],
  );

  const shareTimetable = async () => {
    if (termMeetings.length === 0 || sharing) return;
    setSharing(true);
    setShareError(null);
    try {
      await Share.share({
        title: `Gapwise · ${activeTerm} timetable`,
        message: timetableShareText(meetings, activeTerm),
      });
    } catch {
      setShareError(
        "Gapwise could not open the share sheet. Your timetable stayed on this device.",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen title="Timetable" eyebrow="LOCAL STUDENT DAY">
      <Card label="PRIVACY" title="Saved on this device">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Gapwise restores this versioned timetable locally before rendering
          your day. No account or cloud upload is required.
        </Text>
        <View style={styles.termRow}>
          {TERMS.map((term) => (
            <Pressable
              key={term}
              accessibilityRole="button"
              accessibilityLabel={`Show ${term} timetable`}
              accessibilityState={{ selected: activeTerm === term }}
              onPress={() => setActiveTerm(term)}
              style={[
                styles.term,
                {
                  borderColor: activeTerm === term ? theme.blue : theme.border,
                  backgroundColor:
                    activeTerm === term ? theme.surfaceRaised : theme.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.termText,
                  { color: activeTerm === term ? theme.blue : theme.textMuted },
                ]}
              >
                {term}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {!hydrated ? (
        <Text
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={[styles.body, { color: theme.textMuted }]}
        >
          Restoring timetable…
        </Text>
      ) : null}
      {hydrated && termMeetings.length === 0 ? (
        <Card title="Start with a safe preview">
          <Text style={[styles.body, { color: theme.textMuted }]}>
            The sample is generated locally and can be removed at any time.
            Import from Gapwise/ACORN will use this same canonical meeting model
            rather than creating a second schedule format.
          </Text>
          <PrimaryButton label="Load sample timetable" onPress={loadSample} />
        </Card>
      ) : null}

      {WEEKDAYS.map((day) => {
        const dayMeetings = meetingsByDay.get(day) ?? [];
        if (dayMeetings.length === 0) return null;
        const dayGaps = gapsByDay.get(day) ?? [];
        return (
          <View key={day} style={styles.day}>
            <Text
              accessibilityRole="header"
              style={[styles.dayTitle, { color: theme.text }]}
            >
              {day}
            </Text>
            {dayMeetings.map((meeting) => (
              <View
                key={meeting.id}
                accessible
                accessibilityLabel={`${meeting.courseCode} ${meeting.activityType}, ${formatTime(
                  meeting.startTime,
                )} to ${formatTime(meeting.endTime)}, ${locationLabel(meeting)}`}
                style={[
                  styles.row,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                  style={[styles.dot, { backgroundColor: theme.blue }]}
                />
                <View style={styles.copy}>
                  <Text style={[styles.time, { color: theme.textMuted }]}>
                    {formatTime(meeting.startTime)}–
                    {formatTime(meeting.endTime)}
                  </Text>
                  <Text style={[styles.course, { color: theme.text }]}>
                    {meeting.courseCode}
                  </Text>
                  <Text style={[styles.place, { color: theme.textMuted }]}>
                    {locationLabel(meeting)}
                  </Text>
                </View>
              </View>
            ))}
            {dayGaps.map((gap) => (
              <View
                key={gap.id}
                accessible
                accessibilityLabel={`Gap, ${formatDuration(
                  gap.durationMinutes,
                )}, ${formatTime(gap.startTime)} to ${formatTime(gap.endTime)}`}
                style={[styles.gapRow, { borderColor: theme.border }]}
              >
                <Text style={[styles.gapLabel, { color: theme.success }]}>
                  GAP · {formatDuration(gap.durationMinutes)}
                </Text>
                <Text style={[styles.place, { color: theme.textMuted }]}>
                  {formatTime(gap.startTime)}–{formatTime(gap.endTime)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}

      {termMeetings.length > 0 ? (
        <Card label="SHARE" title={`Share ${activeTerm} timetable`}>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Opens the system share sheet only when you ask. The export contains
            visible course, time, activity, and location fields only—never your
            account, session, cloud metadata, or internal record IDs.
          </Text>
          <PrimaryButton
            label={sharing ? "Opening share sheet…" : "Share timetable"}
            onPress={() => void shareTimetable()}
            disabled={sharing}
          />
          {shareError ? (
            <Text
              accessibilityRole="alert"
              style={[styles.warning, { color: theme.warning }]}
            >
              {shareError}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {meetings.length > 0 ? (
        <PrimaryButton label="Clear local timetable" onPress={clear} />
      ) : null}
      {persistenceError ? (
        <Text
          accessibilityRole="alert"
          style={[styles.warning, { color: theme.warning }]}
        >
          {persistenceError}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 23 },
  termRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  term: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  termText: { fontSize: 14, fontWeight: "800" },
  day: { gap: 9 },
  dayTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  row: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: { width: 8, height: 42, borderRadius: 999 },
  copy: { flex: 1, gap: 2 },
  time: { fontSize: 12, fontWeight: "700" },
  course: { fontSize: 18, fontWeight: "800" },
  place: { fontSize: 13, lineHeight: 18 },
  gapRow: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    gap: 2,
  },
  gapLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  warning: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
