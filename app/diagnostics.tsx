import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useNetworkState } from 'expo-network';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GAPWISE_API_BASE_URL } from '@/src/lib/api';
import { useGapwiseTheme } from '@/src/theme';

function Value({ label, value }: { label: string; value: string }) {
  const theme = useGapwiseTheme();
  return (
    <View style={[styles.value, { borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text selectable style={[styles.text, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const theme = useGapwiseTheme();
  const network = useNetworkState();
  const version = Constants.expoConfig?.version ?? 'unknown';
  const channel = process.env.EXPO_PUBLIC_GAPWISE_CHANNEL ?? 'development';
  const commit = process.env.EXPO_PUBLIC_GAPWISE_COMMIT_SHA ?? 'local/unknown';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Text style={[styles.note, { color: theme.textMuted }]}>Non-secret diagnostic information only. Tokens and credentials are never displayed here.</Text>
      <Value label="App version" value={version} />
      <Value label="Runtime" value={Constants.executionEnvironment} />
      <Value label="Device" value={`${Device.manufacturer ?? 'Unknown'} ${Device.modelName ?? ''}`.trim()} />
      <Value label="OS" value={`${Device.osName ?? 'Unknown'} ${Device.osVersion ?? ''}`.trim()} />
      <Value label="Network" value={network.isConnected == null ? 'unknown' : network.isConnected ? 'online' : 'offline'} />
      <Value label="Channel" value={channel} />
      <Value label="Commit" value={commit} />
      <Value label="API" value={GAPWISE_API_BASE_URL} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 4 },
  note: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  value: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  text: { fontSize: 15, lineHeight: 21 },
});
