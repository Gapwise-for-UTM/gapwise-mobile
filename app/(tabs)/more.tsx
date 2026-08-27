import { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Card } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/features/auth/store";
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
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const startSignIn = async () => {
    setBusy(true);
    try {
      await auth.requestMagicLink(email);
    } catch {
      // Auth store exposes the student-readable failure without clearing local state.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="More" eyebrow="SETTINGS & TRUST">
      <Card label="ACCOUNT" title={auth.state.status === "authenticated" ? "Signed in" : "Guest-first by default"}>
        {auth.state.status === "authenticated" ? (
          <>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              {auth.state.session.user.email ?? "Gapwise account"}. Session tokens stay in platform secure storage. Signing out does not erase this device’s local timetable.
            </Text>
            <PrimaryButton
              label="Sign out"
              onPress={() => void auth.signOut()}
            />
          </>
        ) : (
          <>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              Sign-in is optional. Your timetable stays local while authentication starts, fails, or is interrupted; empty cloud state must not replace recoverable local data.
            </Text>
            {auth.configured ? (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel="Email address for Gapwise sign-in"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
                <PrimaryButton
                  label={busy ? "Sending…" : "Email me a sign-in link"}
                  onPress={() => void startSignIn()}
                  disabled={busy || email.trim().length === 0}
                />
              </>
            ) : (
              <Text style={[styles.notice, { color: theme.textMuted }]}>
                Account sign-in is disabled in this build until public Supabase client configuration is supplied. No secret or privileged key is required or accepted.
              </Text>
            )}
          </>
        )}
        {auth.state.message ? (
          <Text accessibilityRole="alert" style={[styles.notice, { color: theme.text }]}>
            {auth.state.message}
          </Text>
        ) : null}
      </Card>

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
  notice: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginVertical: 12,
  },
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
