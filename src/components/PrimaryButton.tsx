import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useGapwiseTheme } from "@/src/theme";

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useGapwiseTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? theme.bluePressed : theme.blue,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  label: { color: "#04111F", fontSize: 16, fontWeight: "800" },
});
