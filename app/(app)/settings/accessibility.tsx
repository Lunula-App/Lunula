import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, List, Divider, Switch, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';

export default function AccessibilityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettingsStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Accessibility
        </Text>
      </View>

      <View style={styles.content}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Exercises</List.Subheader>
          <Divider />
          <List.Item
            title="Audio cues"
            description="Speak hold, relax, and rest prompts aloud during exercise sessions"
            left={(props) => <List.Icon {...props} icon="volume-high" />}
            right={() => (
              <Switch
                value={settings?.exerciseAudioCues ?? false}
                onValueChange={(v) => update({ exerciseAudioCues: v })}
              />
            )}
            onPress={() => update({ exerciseAudioCues: !(settings?.exerciseAudioCues ?? false) })}
          />
        </Surface>

        <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          When enabled, your device will read out each phase cue as you exercise — useful if you prefer not to watch the screen. You can also toggle this per session from within the exercise player.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, overflow: 'hidden' },
  hint: { lineHeight: 20, paddingHorizontal: 4 },
});
