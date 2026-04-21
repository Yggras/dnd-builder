import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  panel: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    maxWidth: 480,
    padding: 24,
    width: '100%',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
});
