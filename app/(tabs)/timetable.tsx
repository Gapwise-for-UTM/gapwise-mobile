import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { useGapwiseTheme } from '@/src/theme';

const preview = [
  { time: '10:00–11:00', course: 'CSC110', place: 'MN 1210', type: 'Class' },
  { time: '11:10–12:00', course: 'MAT157', place: 'DH 2020', type: 'Class' },
  { time: '12:00–2:00', course: 'Between classes', place: '2h available', type: 'Gap' },
  { time: '2:00–3:00', course: 'MAT223', place: 'IB 110', type: 'Class' },
];

export default function TimetableScreen() {
  const theme = useGapwiseTheme();
  return (
    <Screen title="Timetable" eyebrow="SYNTHETIC PREVIEW">
      <Card title="A native timetable built around the gaps">
        <Text style={[styles.body, { color: theme.textMuted }]}>This screen currently uses synthetic preview data so you can evaluate the mobile layout without uploading personal information. ACORN import and encrypted local persistence are the next implementation phase.</Text>
      </Card>
      <View style={styles.timeline}>
        {preview.map((item) => (
          <View key={`${item.time}-${item.course}`} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.dot, { backgroundColor: item.type === 'Gap' ? theme.success : theme.blue }]} />
            <View style={styles.copy}>
              <Text style={[styles.time, { color: theme.textMuted }]}>{item.time}</Text>
              <Text style={[styles.course, { color: theme.text }]}>{item.course}</Text>
              <Text style={[styles.place, { color: theme.textMuted }]}>{item.place}</Text>
            </View>
            <Text style={[styles.type, { color: item.type === 'Gap' ? theme.success : theme.blue }]}>{item.type}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 23 },
  timeline: { gap: 10 },
  row: { minHeight: 86, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 44, borderRadius: 999 },
  copy: { flex: 1, gap: 2 },
  time: { fontSize: 12, fontWeight: '700' },
  course: { fontSize: 18, fontWeight: '800' },
  place: { fontSize: 13 },
  type: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
