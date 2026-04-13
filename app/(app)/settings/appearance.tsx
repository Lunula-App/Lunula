import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, List, Divider, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { ACCENTS, AccentKey } from '../../../src/theme/accents';

const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];

export default function AppearanceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettingsStore();

  const darkMode = settings?.darkMode ?? 'system';
  const currentAccent = (settings?.accentColor ?? 'teal') as AccentKey;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Appearance
        </Text>
      </View>

      <View style={styles.content}>
        {/* Theme */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Theme</List.Subheader>
          <Divider />
          <View style={styles.segmentedRow}>
            <SegmentedButtons
              value={darkMode}
              onValueChange={(val) => update({ darkMode: val as 'light' | 'dark' | 'system' })}
              buttons={[
                { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
                { value: 'system', label: 'System', icon: 'cellphone' },
                { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
              ]}
            />
          </View>
        </Surface>

        {/* Accent colour */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Accent Colour</List.Subheader>
          <Divider />
          <View style={styles.swatchGrid}>
            {ACCENT_KEYS.map((key) => {
              const accent = ACCENTS[key];
              const selected = currentAccent === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => update({ accentColor: key })}
                  style={styles.swatchItem}
                  accessibilityLabel={accent.label}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: accent.swatch },
                      selected && styles.swatchSelected,
                    ]}
                  >
                    {selected && (
                      <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: selected ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      marginTop: 6,
                      fontWeight: selected ? '700' : '400',
                    }}
                  >
                    {accent.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Surface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, gap: 14 },
  card: { borderRadius: 16, overflow: 'hidden' },
  segmentedRow: { padding: 16 },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  swatchItem: {
    alignItems: 'center',
    width: 56,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
