import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme, typography } from '@/shared/ui/theme';

type SheetAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

interface BuilderChoiceSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  primaryAction?: SheetAction;
  secondaryAction?: SheetAction;
  helperText?: string | null;
  closeDisabled?: boolean;
}

export function BuilderChoiceSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  primaryAction,
  secondaryAction,
  helperText,
  closeDisabled = false,
}: BuilderChoiceSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={closeDisabled ? undefined : onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          disabled={closeDisabled}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={closeDisabled}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed, closeDisabled && styles.disabledAction]}
            >
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator>
            {children}
          </ScrollView>

          {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

          {(primaryAction || secondaryAction) ? (
            <View style={styles.footer}>
              {secondaryAction ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={secondaryAction.disabled}
                  onPress={secondaryAction.onPress}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed, secondaryAction.disabled && styles.disabledAction]}
                >
                  <Text style={styles.secondaryButtonLabel}>{secondaryAction.label}</Text>
                </Pressable>
              ) : <View style={styles.footerSpacer} />}

              {primaryAction ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={primaryAction.disabled}
                  onPress={primaryAction.onPress}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    primaryAction.destructive && styles.destructiveButton,
                    pressed && styles.primaryButtonPressed,
                    primaryAction.disabled && styles.disabledAction,
                  ]}
                >
                  <Text style={[styles.primaryButtonLabel, primaryAction.destructive && styles.destructiveButtonLabel]}>
                    {primaryAction.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxHeight: '88%',
    minHeight: '72%',
    paddingBottom: theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  closeButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  closeButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  body: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  helperText: {
    color: theme.colors.accentLegacySoft,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: theme.colors.borderSubtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  footerSpacer: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  secondaryButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  primaryButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  destructiveButton: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  destructiveButtonLabel: {
    color: theme.colors.danger,
  },
  disabledAction: {
    opacity: 0.5,
  },
});
