import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';

interface FeaturePlaceholderProps {
  title: string;
  summary: string;
  bullets: string[];
}

export function FeaturePlaceholder({ title, summary, bullets }: FeaturePlaceholderProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
        <View style={styles.bullets}>
          {bullets.map((bullet) => (
            <Text key={bullet} style={styles.bullet}>
              - {bullet}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  panel: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
  },
  summary: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
  },
  bullets: {
    gap: 10,
  },
  bullet: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },
});
