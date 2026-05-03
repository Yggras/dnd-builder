import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { BuilderWizardPhaseId } from '@/features/builder/hooks/useBuilderController';

interface BuilderWizardSlideProps {
  activePhaseId: BuilderWizardPhaseId;
  activePhaseIndex: number;
  children: React.ReactNode;
}

export function BuilderWizardSlide({ activePhaseId, activePhaseIndex, children }: BuilderWizardSlideProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(activePhaseIndex);

  useEffect(() => {
    // Determine direction
    const direction = activePhaseIndex > prevIndex.current ? 1 : -1;
    const isSame = activePhaseIndex === prevIndex.current;
    
    prevIndex.current = activePhaseIndex;

    if (!isSame) {
      // Reset starting position
      slideAnim.setValue(50 * direction);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Initial mount
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [activePhaseId, activePhaseIndex, slideAnim, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
