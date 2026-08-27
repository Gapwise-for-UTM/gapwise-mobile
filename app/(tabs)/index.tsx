import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/src/components/Card';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useGapwiseTheme } from '@/src/theme';

export default function TodayScreen() {
  const theme = useGapwiseTheme();
  return (
    <Screen title="Today" eyebrow="GAPWISE MOBILE">
      <View style={styles.hero}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>Your day, in your pocket.</Text>
        <Text style={[styles.headline, { color: theme.text }]}>Know what’s next — and whether you can actually get there.</Text>
      </View>

      <Card label="DEVELOPER PREVIEW" title="Native foundation is live">
        <Text style={[styles.body, { color: theme.textMuted }]}>This first build is the real Expo/React Native app shell for iPhone and Android. Navigation, branding, secure-storage boundaries, diagnostics, and both-platform CI are wired before personal timetable data is added.</Text>
        <PrimaryButton label="Preview timetable" onPress={() => router.push('/(tabs)/timetable')} />
      </Card>

      <View style={styles.grid}>
        <View style={styles.gridItem}><Card label="PRIVACY" title="Guest-first"><Text style={[styles.small, { color: theme.textMuted }]}>Core mobile use is designed not to require an account.</Text></Card></View>
        <View style={styles.gridItem}><Card label="TRUTH" title="One campus layer"><Text style={[styles.small, { color: theme.textMuted }]}>Mobile consumes canonical Gapwise routing and campus contracts.</Text></Card></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, paddingVertical: 10 },
  kicker: { fontSize: 16, fontWeight: '600' },
  headline: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1.1 },
  body: { fontSize: 15, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  gridItem: { flex: 1 },
});
