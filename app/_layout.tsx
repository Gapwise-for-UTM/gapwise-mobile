import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/src/features/auth/store";
import { TimetableProvider } from "@/src/features/timetable/store";
import { useGapwiseTheme } from "@/src/theme";

export default function RootLayout() {
  const theme = useGapwiseTheme();
  return (
    <TimetableProvider>
      <AuthProvider>
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.background },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="diagnostics"
            options={{ title: "Diagnostics", presentation: "modal" }}
          />
        </Stack>
      </AuthProvider>
    </TimetableProvider>
  );
}
