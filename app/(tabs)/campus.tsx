import { StyleSheet, Text } from "react-native";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { useGapwiseTheme } from "@/src/theme";

export default function CampusScreen() {
  const theme = useGapwiseTheme();
  return (
    <Screen title="Campus" eyebrow="UTM INTELLIGENCE">
      <Card label="ROUTING" title="Campus-aware, not generic maps">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          The native Campus surface will consume the same canonical buildings,
          entrances, route confidence, and accessibility uncertainty as Gapwise
          on the web.
        </Text>
      </Card>
      <Card label="LOCATION" title="Foreground when you choose">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Gapwise does not need background location tracking for its core
          student-day workflow. Native location access will remain explicit and
          bounded.
        </Text>
      </Card>
      <Card label="ACCESSIBILITY" title="Unknown stays unknown">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Step-free routing will fail closed when verified accessible evidence
          is missing instead of presenting an invented route as safe.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { fontSize: 15, lineHeight: 23 } });
