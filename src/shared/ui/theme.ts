export const theme = {
  colors: {
    background: '#050816',
    backgroundDeep: '#02030A',
    surface: '#0C1224',
    surfaceElevated: '#121A31',
    surfaceAccent: '#16112B',
    surfaceSuccess: '#0F1A1A',
    textPrimary: '#F8FAFC',
    textSecondary: '#D8E1F0',
    textMuted: '#8FA0BC',
    textFaint: '#667694',
    accentPrimary: '#8B5CF6',
    accentPrimarySoft: '#C4B5FD',
    accentPrimaryDeep: '#312E81',
    accentSuccess: '#22C55E',
    accentSuccessSoft: '#86EFAC',
    accentLegacy: '#B45309',
    accentLegacySoft: '#FCD34D',
    borderSubtle: '#1E293B',
    borderStrong: '#334155',
    borderAccent: '#5B3CC4',
    danger: '#FCA5A5',
    overlay: 'rgba(3, 7, 18, 0.72)',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
} as const;

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  titleLg: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  titleMd: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 21,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
} as const;
