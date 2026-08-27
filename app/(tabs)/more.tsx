import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { useGapwiseTheme } from "@/src/theme";

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useGapwiseTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.rowText, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const theme = useGapwiseTheme();
  return (
    <Screen title="More" eyebrow="SETTINGS & TRUST">
      <Card label="BUILD" title="Know exactly what you’re testing">
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Diagnostics expose non-secret build, channel, platform, API, and
          network information so phone-only bug reports can be tied to the exact
          revision.
        </Text>
        <Row
          label="Open diagnostics"
          onPress={() => router.push("/diagnostics")}
        />
      </Card>
      <View style={styles.links}>
        <Row
          label="Open Gapwise"
          onPress={() => void Linking.openURL("https://gapwise.ca")}
        />
        <Row
          label="Developer documentation"
          onPress={() => void Linking.openURL("https://docs.gapwise.ca")}
        />
        <Row
          label="Mobile repository"
          onPress={() =>
            void Linking.openURL(
              "https://github.com/andrewmuratov/gapwise-mobile",
            )
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 23 },
  links: { gap: 8 },
  row: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  rowText: { fontSize: 16, fontWeight: "600" },
  chevron: { fontSize: 28, lineHeight: 28 },
});
