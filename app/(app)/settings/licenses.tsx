import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BLOOM_LICENSE = {
  spdx: 'GPL-3.0-or-later',
  label: 'GNU General Public License v3.0',
  summary:
    'Lunula is free software. You are free to use, study, modify, and distribute it under the terms of the GNU GPL v3. Any derivative work must also be released under the same licence. The complete source code is publicly available.',
};

interface Dependency {
  name: string;
  author: string;
  license: string;
  note?: string;
}

const DEPENDENCIES: Dependency[] = [
  { name: 'React & React Native', author: 'Meta Platforms, Inc.', license: 'MIT' },
  { name: 'Expo SDK & platform packages', author: 'Expo, Inc.', license: 'MIT' },
  { name: 'Expo Router', author: 'Expo, Inc.', license: 'MIT' },
  { name: 'React Native Paper', author: 'Callstack', license: 'MIT' },
  { name: 'React Native Safe Area Context', author: 'Th3rdwave', license: 'MIT' },
  { name: 'Zustand', author: 'pmndrs', license: 'MIT' },
  { name: 'date-fns', author: 'Sasha Koss & Lesha Koss', license: 'MIT' },
  {
    name: 'SQLite',
    author: 'D. Richard Hipp',
    license: 'Public Domain',
    note: 'Accessed via expo-sqlite',
  },
  {
    name: 'Material Community Icons',
    author: 'Templarian & contributors',
    license: 'MIT',
    note: 'Accessed via @expo/vector-icons',
  },
  {
    name: 'Material Design Icons (Google)',
    author: 'Google LLC',
    license: 'Apache 2.0',
    note: 'Subset used via @expo/vector-icons',
  },
];

const LICENSE_COLORS: Record<string, string> = {
  'MIT': '#4CAF50',
  'Apache 2.0': '#2196F3',
  'Public Domain': '#9C27B0',
  'GPL-3.0-or-later': '#FF9800',
};

export default function LicensesScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Open Source
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Lunula's own licence */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="scale-balance"
            size={36}
            color={theme.colors.primary}
            style={{ marginBottom: 10 }}
          />
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
            Lunula
          </Text>
          <View style={[styles.badge, { backgroundColor: LICENSE_COLORS['GPL-3.0-or-later'] + '33' }]}>
            <Text variant="labelSmall" style={{ color: LICENSE_COLORS['GPL-3.0-or-later'], fontWeight: '700' }}>
              {BLOOM_LICENSE.label}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 20, textAlign: 'center', marginTop: 10 }}>
            {BLOOM_LICENSE.summary}
          </Text>
        </Surface>

        {/* Third-party dependencies */}
        <Text variant="labelLarge" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          THIRD-PARTY SOFTWARE
        </Text>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          {DEPENDENCIES.map((dep, index) => (
            <View key={dep.name}>
              {index > 0 && <Divider />}
              <View style={styles.depRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {dep.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
                    {dep.author}
                  </Text>
                  {dep.note && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 1 }}>
                      {dep.note}
                    </Text>
                  )}
                </View>
                <View style={[styles.badge, { backgroundColor: (LICENSE_COLORS[dep.license] ?? '#607D8B') + '22' }]}>
                  <Text variant="labelSmall" style={{ color: LICENSE_COLORS[dep.license] ?? '#607D8B', fontWeight: '700' }}>
                    {dep.license}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Surface>

        {/* Licence summary */}
        <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          {[
            { color: LICENSE_COLORS['MIT'], label: 'MIT', desc: 'Permissive — use, modify, and distribute freely with attribution.' },
            { color: LICENSE_COLORS['Apache 2.0'], label: 'Apache 2.0', desc: 'Permissive — includes an explicit patent grant. Compatible with GPLv3.' },
            { color: LICENSE_COLORS['Public Domain'], label: 'Public Domain', desc: 'No restrictions — the author has waived all copyright interest.' },
            { color: LICENSE_COLORS['GPL-3.0-or-later'], label: 'GPLv3', desc: 'Copyleft — derivative works must also be open source under the same terms.' },
          ].map(({ color, label, desc }) => (
            <View key={label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                  {label}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18 }}>
                  {desc}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 14 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 2 },
  card: { borderRadius: 16, overflow: 'hidden' },
  depRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  summaryCard: { borderRadius: 16, padding: 16, gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
});
