import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepBasicsProps {
  payload: BuilderDraftPayload;
  updateCharacterName: (name: string) => void;
  updateNotes: (notes: string) => void;
}

export function BuilderStepBasics({ payload, updateCharacterName, updateNotes }: BuilderStepBasicsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Draft basics</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Character name</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={updateCharacterName}
          placeholder="Character name"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.input}
          value={payload.characteristicsStep.name}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          multiline
          onChangeText={updateNotes}
          placeholder="Optional reminders, ideas, or follow-up notes."
          placeholderTextColor={theme.colors.textFaint}
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={payload.notesStep.notes ?? ''}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 132,
  },
});
