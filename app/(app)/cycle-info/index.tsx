import { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { ARTICLES } from '../../../src/content/articles';
import { Article } from '../../../src/models/article';
import { CyclePhase, PHASE_DESCRIPTIONS } from '../../../src/models/cycle';
import { PHASE_COLORS } from '../../../src/theme/colors';

export default function CycleInfoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettingsStore();

  const { phase, articles } = useMemo(() => {
    if (!settings) return { phase: 'follicular' as CyclePhase, articles: ARTICLES };
    const prediction = computePrediction(settings);
    const p = prediction.currentPhase;
    // Current phase articles first, then others
    const sorted = [
      ...ARTICLES.filter((a) => a.phase === p),
      ...ARTICLES.filter((a) => a.phase !== p),
    ];
    return { phase: p, articles: sorted };
  }, [settings]);

  const phaseColor = PHASE_COLORS[phase];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Learn
          </Text>
          <Chip
            style={[styles.phaseChip, { backgroundColor: phaseColor + '33' }]}
            textStyle={{ color: phaseColor }}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
          </Chip>
        </View>

        {/* Current phase banner */}
        <Surface style={[styles.banner, { backgroundColor: phaseColor + '22', borderColor: phaseColor + '55' }]} elevation={0}>
          <Text style={styles.bannerEmoji}>{PHASE_EMOJIS[phase]}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
              You're in your {phase} phase
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 }}>
              {PHASE_DESCRIPTIONS[phase]}
            </Text>
          </View>
        </Surface>

        {/* Articles */}
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            isCurrentPhase={article.phase === phase}
            onPress={() =>
              router.push({ pathname: '/(app)/cycle-info/article/[slug]', params: { slug: article.slug } })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ArticleCard({
  article,
  isCurrentPhase,
  onPress,
}: {
  article: Article;
  isCurrentPhase: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const phaseColor = PHASE_COLORS[article.phase];

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Surface
          style={[
            styles.card,
            {
              backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
              borderColor: isCurrentPhase ? phaseColor + '55' : theme.colors.surfaceVariant,
              borderWidth: isCurrentPhase ? 1.5 : 1,
            },
          ]}
          elevation={1}
        >
          <View style={styles.cardTop}>
            <Chip
              compact
              style={[styles.phaseTag, { backgroundColor: phaseColor + '22' }]}
              textStyle={{ color: phaseColor, fontSize: 11 }}
            >
              {article.phase.charAt(0).toUpperCase() + article.phase.slice(1)}
            </Chip>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {article.readTimeMinutes} min read
            </Text>
          </View>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
            {article.title}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18 }}
            numberOfLines={2}
          >
            {article.summary}
          </Text>
        </Surface>
      )}
    </Pressable>
  );
}

const PHASE_EMOJIS: Record<CyclePhase, string> = {
  menstrual: '🌑',
  follicular: '🌒',
  ovulatory: '🌕',
  luteal: '🌖',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { fontWeight: '700' },
  phaseChip: {},
  banner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1.5,
  },
  bannerEmoji: { fontSize: 36 },
  card: { borderRadius: 16, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phaseTag: {},
});
