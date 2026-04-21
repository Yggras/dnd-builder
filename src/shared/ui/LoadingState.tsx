import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <ActivityIndicator color="#8B5CF6" size="large" />
        <Text style={styles.label}>{label}</Text>
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
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 15,
  },
});
