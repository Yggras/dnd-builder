import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SurfaceCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

export function SurfaceCard({ title, description, onPress }: SurfaceCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  cardPressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});
