import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGapwiseTheme } from "@/src/theme";

export function Card({
  title,
  label,
  children,
}: PropsWithChildren<{ title?: string; label?: string }>) {
  const theme = useGapwiseTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {label ? (
        <Text style={[styles.label, { color: theme.blue }]}>{label}</Text>
      ) : null}
      {title ? (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  label: { fontSize: 11, letterSpacing: 1.5, fontWeight: "800" },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
