import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import {
  formatDuration,
  formatTime,
  locationLabel,
  termForMonth,
  weekdayForDate,
} from "@/src/features/timetable/model";
import { useTimetable } from "@/src/features/timetable/store";
import { useGapwiseTheme } from "@/src/theme";

export default function TodayScreen() {
  const theme = useGapwiseTheme();
  const { meetings, gaps, hydrated, persistenceError, loadSample } =
    useTimetable();
  const now = new Date();
  const weekday = weekdayForDate(now);
  const term = termForMonth(now.getMonth() + 1);
  const dayMeetings = meetings
    .filter((meeting) => meeting.weekday === weekday && meeting.term === term)
    .sort((a, b) => a.startTime - b.startTime);
  const dayGaps = gaps.filter(
    (gap) => gap.weekday === weekday && gap.term === term,
  );

  return (
    <Screen title="Today" eyebrow="GAPWISE MOBILE">
      <View style={styles.hero}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>
          {weekday} · {term}
        </Text>
        <Text style={[styles.headline, { color: theme.text }]}>
          Your actual student day, including the space between classes.
        </Text>
      </View>

      {!hydrated ? (
        <Card title="Restoring this device…">
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Gapwise is loading your local timetable before showing Today.
          </Text>
        </Card>
      ) : dayMeetings.length === 0 ? (
        <Card
          label="LOCAL FIRST"
          title={
            meetings.length === 0
              ? "No timetable saved yet"
              : "Nothing scheduled today"
          }
        >
          <Text style={[styles.body, { color: theme.textMuted }]}>
            {meetings.length === 0
              ? "Core timetable state stays on this device. Load the built-in sample to test the full Today and gap workflow without an account."
              : "Your saved timetable has no meetings for this day and term."}
          </Text>
          {meetings.length === 0 ? (
            <PrimaryButton
              label="Load private sample timetable"
              onPress={loadSample}
            />
          ) : null}
        </Card>
      ) : (
        <>
          {dayMeetings.map((meeting) => (
            <Card
              key={meeting.id}
              label={`${meeting.activityType} · ${meeting.sectionCode}`}
              title={meeting.courseCode}
            >
              <Text style={[styles.body, { color: theme.textMuted }]}>
                {formatTime(meeting.startTime)}–{formatTime(meeting.endTime)} ·{" "}
                {locationLabel(meeting)}
              </Text>
            </Card>
          ))}
          {dayGaps.map((gap) => (
            <Card
              key={gap.id}
              label="GAP"
              title={`${formatDuration(gap.durationMinutes)} between classes`}
            >
              <Text style={[styles.body, { color: theme.textMuted }]}>
                {formatTime(gap.startTime)}–{formatTime(gap.endTime)} · after{" "}
                {gap.previous.courseCode}, before {gap.next.courseCode}
              </Text>
            </Card>
          ))}
        </>
      )}

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
  hero: { gap: 8, paddingVertical: 10 },
  kicker: { fontSize: 16, fontWeight: "600" },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  body: { fontSize: 15, lineHeight: 23 },
  warning: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
