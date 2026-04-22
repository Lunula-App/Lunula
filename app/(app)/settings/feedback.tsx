import { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, useTheme, Surface, Button, SegmentedButtons, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Dynamic import — expo-mail-composer requires a native build
let MailComposer: typeof import('expo-mail-composer') | null = null;
try {
  MailComposer = require('expo-mail-composer');
} catch {
  // Native module not available in this build
}

type FeedbackType = 'bug' | 'suggestion' | 'general';

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'general', label: 'General' },
];

const FEEDBACK_EMAIL = 'feedback@bloom-app.com';

export default function FeedbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>('general');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const osLabel = `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`;

  async function handleSend() {
    if (!body.trim()) return;

    setSending(true);
    try {
      if (!MailComposer) { setUnavailable(true); return; }
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        setUnavailable(true);
        return;
      }

      const subjectMap: Record<FeedbackType, string> = {
        bug: 'Bloom – Bug Report',
        suggestion: 'Bloom – Suggestion',
        general: 'Bloom – Feedback',
      };

      const deviceInfo = [
        `App version: ${appVersion}`,
        `Platform: ${osLabel}`,
        `Feedback type: ${type}`,
      ].join('\n');

      await MailComposer.composeAsync({
        recipients: [FEEDBACK_EMAIL],
        subject: subjectMap[type],
        body: `${body.trim()}\n\n---\n${deviceInfo}`,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Send Feedback
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={36}
            color={theme.colors.primary}
            style={{ marginBottom: 10 }}
          />
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
            Help us improve Bloom
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 20, textAlign: 'center' }}>
            Your message opens in your email client. No data is collected or transmitted without you explicitly sending it.
          </Text>
        </Surface>

        {/* Type selector */}
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          TYPE
        </Text>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as FeedbackType)}
          buttons={FEEDBACK_TYPES}
        />

        {/* Message */}
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          MESSAGE
        </Text>
        <TextInput
          mode="outlined"
          placeholder={
            type === 'bug'
              ? 'Describe what happened and how to reproduce it…'
              : type === 'suggestion'
              ? 'Describe the feature or improvement you have in mind…'
              : "What's on your mind?"
          }
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={7}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
        />

        {/* What's included note */}
        <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700', marginBottom: 6 }}>
            AUTOMATICALLY INCLUDED
          </Text>
          {[
            { icon: 'cellphone', text: `Platform: ${osLabel}` },
            { icon: 'tag-outline', text: `App version: ${appVersion}` },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.infoRow}>
              <MaterialCommunityIcons name={icon as any} size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {text}
              </Text>
            </View>
          ))}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 }}>
            No health data, cycle information, or personal details are ever included.
          </Text>
        </Surface>

        {/* Unavailable warning */}
        {unavailable && (
          <Surface style={[styles.warnCard, { backgroundColor: theme.colors.errorContainer }]} elevation={0}>
            <MaterialCommunityIcons name="email-off-outline" size={18} color={theme.colors.error} />
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, flex: 1, lineHeight: 20 }}>
              No email app is configured on this device. You can reach us directly at{' '}
              <Text style={{ fontWeight: '700' }}>{FEEDBACK_EMAIL}</Text>
            </Text>
          </Surface>
        )}

        <Button
          mode="contained"
          icon="send-outline"
          onPress={handleSend}
          disabled={!body.trim() || sending}
          loading={sending}
          style={styles.sendButton}
        >
          Open in Email
        </Button>
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
  label: { fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 2 },
  textInput: { backgroundColor: 'transparent' },
  textInputContent: { paddingTop: 12, minHeight: 140 },
  infoCard: { borderRadius: 14, padding: 14, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warnCard: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sendButton: { borderRadius: 12 },
});
