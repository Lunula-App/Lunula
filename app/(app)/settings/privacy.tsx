import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme, Surface, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRINCIPLES = [
  {
    icon: 'database-off-outline',
    title: 'No servers, no accounts',
    body: 'Bloom has no backend. There is no account to create, no server to send your data to, and no company database storing your health information. Everything lives on your device.',
  },
  {
    icon: 'lock-outline',
    title: 'Encrypted at rest',
    body: 'Any backup you create is encrypted with AES-256-GCM before it is written to storage. Only someone with your passphrase can read it — including us, which means we cannot.',
  },
  {
    icon: 'eye-off-outline',
    title: 'No tracking or analytics',
    body: 'Bloom contains no analytics SDKs, no crash reporters that phone home, and no advertising identifiers. We do not know how you use the app, and we do not want to.',
  },
  {
    icon: 'account-off-outline',
    title: 'No data sold, ever',
    body: 'Menstrual health data is among the most sensitive personal information that exists. It will never be sold, shared with third parties, or used for any purpose beyond running the app on your device.',
  },
  {
    icon: 'cellphone-lock',
    title: 'You are in control',
    body: 'Your data belongs to you. You can export it, delete it, or reset the app entirely at any time. There are no retention policies because there is no data held anywhere but in your hands.',
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
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', marginBottom: 8 }}>
            Your health data is yours alone
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 24 }}>
            We built Bloom at a time when health apps routinely harvest intimate personal data — selling it to insurers, advertisers, and data brokers — often buried in terms of service nobody reads.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 24, marginTop: 10 }}>
            Bloom is different by design, not by policy. The architecture makes data collection impossible: there are no servers, no accounts, and no outbound connections. Your cycle data never leaves your device unless you choose to export it.
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

        {/* Footer note */}
        <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
          Bloom is open to independent security review. If you have questions about how the app handles data, the source is available for inspection.
        </Text>
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
    textAlign: 'center',
  },
  principleCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  principleText: { flex: 1 },
  footer: { textAlign: 'center', lineHeight: 20, paddingHorizontal: 8, paddingTop: 4 },
});
