import { ScrollView, View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ARTICLES } from '../../../../src/content/articles';
import { ArticleSection } from '../../../../src/models/article';
import { PHASE_COLORS } from '../../../../src/theme/colors';

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Article not found.</Text>
      </SafeAreaView>
    );
  }

  const phaseColor = PHASE_COLORS[article.phase];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Phase tag + read time */}
        <View style={styles.meta}>
          <View style={[styles.phaseTag, { backgroundColor: phaseColor + '33' }]}>
            <Text variant="labelSmall" style={{ color: phaseColor }}>
              {article.phase.toUpperCase()} PHASE
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {article.readTimeMinutes} min read
          </Text>
        </View>

        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          {article.title}
        </Text>
        <Text variant="bodyLarge" style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}>
          {article.summary}
        </Text>

        {article.content.map((section, i) => (
          <SectionRenderer key={i} section={section} phaseColor={phaseColor} />
        ))}

        {article.sources.length > 0 && (
          <View style={styles.sources}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 0.8 }}>
              SOURCES
            </Text>
            {article.sources.map((s) => (
              <TouchableOpacity key={s.url} onPress={() => Linking.openURL(s.url)} style={styles.sourceRow}>
                <Text variant="bodySmall" style={{ color: theme.colors.primary, textDecorationLine: 'underline', flex: 1 }}>
                  • {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionRenderer({
  section,
  phaseColor,
}: {
  section: ArticleSection;
  phaseColor: string;
}) {
  const theme = useTheme();

  switch (section.type) {
    case 'heading':
      return (
        <Text
          variant="titleMedium"
          style={[styles.heading, { color: theme.colors.onBackground }]}
        >
          {section.text}
        </Text>
      );
    case 'paragraph':
      return (
        <Text
          variant="bodyMedium"
          style={[styles.paragraph, { color: theme.colors.onSurface }]}
        >
          {section.text}
        </Text>
      );
    case 'bullet_list':
      return (
        <View style={styles.bulletList}>
          {(section.items ?? []).map((item, i) => (
            <View key={i} style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: phaseColor }]} />
              <Text variant="bodyMedium" style={[styles.bulletText, { color: theme.colors.onSurface }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'callout':
      return (
        <Surface
          style={[styles.callout, { backgroundColor: phaseColor + '22', borderColor: phaseColor }]}
          elevation={0}
        >
          <Text style={styles.calloutIcon}>💡</Text>
          <Text variant="bodyMedium" style={[styles.calloutText, { color: theme.colors.onSurface }]}>
            {section.text}
          </Text>
        </Surface>
      );
    case 'tip':
      return (
        <Surface
          style={[styles.callout, { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.secondary }]}
          elevation={0}
        >
          <Text style={styles.calloutIcon}>✅</Text>
          <Text variant="bodyMedium" style={[styles.calloutText, { color: theme.colors.onSurface }]}>
            {section.text}
          </Text>
        </Surface>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 8, paddingTop: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phaseTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  title: { fontWeight: '700', lineHeight: 34 },
  summary: { lineHeight: 26, fontStyle: 'italic' },
  heading: { fontWeight: '700', marginTop: 8 },
  paragraph: { lineHeight: 24 },
  bulletList: { gap: 10 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  bulletText: { flex: 1, lineHeight: 22 },
  callout: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  calloutIcon: { fontSize: 18 },
  calloutText: { flex: 1, lineHeight: 22 },
  sources: { gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  sourceRow: { paddingVertical: 2 },
});
