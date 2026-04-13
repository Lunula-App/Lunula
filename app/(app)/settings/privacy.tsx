import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme, Surface, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRINCIPLES = [
  {
    icon: 'database-off-outline',
    title: 'Everything stays on your device',
    body: 'Bloom has no backend, no accounts, and no outbound connections. Your cycle data never leaves your device unless you choose to export it.',
  },
  {
    icon: 'lock-outline',
    title: 'Backups are encrypted',
    body: 'Any backup you create is encrypted before it is written to storage. Your passphrase never leaves your device, so without it the backup is unreadable to anyone, including us.',
  },
  {
    icon: 'eye-off-outline',
    title: 'No tracking, no data sharing',
    body: 'Bloom contains no analytics SDKs, no advertising identifiers, and no crash reporters that phone home. Your data is never sold or shared with third parties, for any reason.',
  },
  {
    icon: 'cellphone-lock',
    title: 'You are in control',
    body: 'Export, delete, or reset your data at any time. There are no retention policies because there is nothing held anywhere but on your device.',
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Privacy
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Opening statement */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={40}
            color={theme.colors.primary}
            style={{ marginBottom: 12 }}
          />
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            Your health data is yours alone
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 24, textAlign: 'center' }}>
            Bloom is built so that data collection is architecturally impossible, not just against our policy.
          </Text>
        </Surface>

        {/* Principles */}
        {PRINCIPLES.map((p) => (
          <Surface
            key={p.title}
            style={[styles.principleCard, { backgroundColor: theme.colors.surface }]}
            elevation={1}
          >
            <MaterialCommunityIcons name={p.icon as any} size={24} color={theme.colors.primary} />
            <View style={styles.principleText}>
              <Text variant="titleSmall" style={{ color: theme.colors.onBackground, fontWeight: '700', marginBottom: 4 }}>
                {p.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                {p.body}
              </Text>
            </View>
          </Surface>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  principleCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  principleText: { flex: 1 },
});
