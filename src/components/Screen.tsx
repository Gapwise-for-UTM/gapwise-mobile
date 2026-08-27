import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GapwiseMark } from "./GapwiseMark";
import { useGapwiseTheme } from "@/src/theme";

export function Screen({
  title,
  eyebrow,
  children,
  right,
}: PropsWithChildren<{ title: string; eyebrow?: string; right?: ReactNode }>) {
  const theme = useGapwiseTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <GapwiseMark size={42} />
            <View style={styles.headerCopy}>
              {eyebrow ? (
                <Text style={[styles.eyebrow, { color: theme.blue }]}>
                  {eyebrow}
                </Text>
              ) : null}
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: theme.text }]}
              >
                {title}
              </Text>
            </View>
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 44, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerCopy: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
});
