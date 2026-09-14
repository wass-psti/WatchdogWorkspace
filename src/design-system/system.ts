import { createSystem, defaultBaseConfig, defineConfig } from '@chakra-ui/react';
import {
  workManagementBreakpoints,
  workManagementFoundation,
  workManagementSemanticColors,
} from './foundation.ts';

const token = (value: string) => ({ value });

/**
 * Chakra is an implementation detail of the Work Management Design System.
 * Preflight is disabled because the existing application already owns its
 * reset/foundation CSS and legacy feature runtime during the Stage B migration.
 */
export const workManagementChakraConfig = defineConfig({
  preflight: false,
  cssVarsRoot: ':where(#app)',
  cssVarsPrefix: 'wm-react',
  theme: {
    breakpoints: workManagementBreakpoints,
    tokens: {
      fonts: {
        body: token(workManagementFoundation.fonts.body),
        mono: token(workManagementFoundation.fonts.mono),
      },
      fontSizes: Object.fromEntries(
        Object.entries(workManagementFoundation.fontSizes).map(([key, value]) => [key, token(value)]),
      ),
      fontWeights: Object.fromEntries(
        Object.entries(workManagementFoundation.fontWeights).map(([key, value]) => [key, token(value)]),
      ),
      lineHeights: Object.fromEntries(
        Object.entries(workManagementFoundation.lineHeights).map(([key, value]) => [key, token(value)]),
      ),
      letterSpacings: {
        label: token(workManagementFoundation.letterSpacings.label),
      },
      spacing: Object.fromEntries(
        Object.entries(workManagementFoundation.spacing).map(([key, value]) => [key, token(value)]),
      ),
      radii: Object.fromEntries(
        Object.entries(workManagementFoundation.radii).map(([key, value]) => [key, token(value)]),
      ),
      shadows: Object.fromEntries(
        Object.entries(workManagementFoundation.shadows).map(([key, value]) => [key, token(value)]),
      ),
      durations: Object.fromEntries(
        Object.entries(workManagementFoundation.durations).map(([key, value]) => [key, token(value)]),
      ),
      sizes: Object.fromEntries(
        Object.entries(workManagementFoundation.sizes).map(([key, value]) => [key, token(value)]),
      ),
    },
    semanticTokens: {
      colors: {
        wm: {
          canvas: token(workManagementSemanticColors.canvas),
          surface: {
            primary: token(workManagementSemanticColors.surfacePrimary),
            secondary: token(workManagementSemanticColors.surfaceSecondary),
            tertiary: token(workManagementSemanticColors.surfaceTertiary),
          },
          text: {
            primary: token(workManagementSemanticColors.textPrimary),
            secondary: token(workManagementSemanticColors.textSecondary),
            tertiary: token(workManagementSemanticColors.textTertiary),
            inverse: token(workManagementSemanticColors.textInverse),
          },
          border: {
            primary: token(workManagementSemanticColors.borderPrimary),
            subtle: token(workManagementSemanticColors.borderSubtle),
          },
          accent: {
            DEFAULT: token(workManagementSemanticColors.accent),
            hover: token(workManagementSemanticColors.accentHover),
          },
          status: {
            positive: token(workManagementSemanticColors.positive),
            negative: token(workManagementSemanticColors.negative),
            warning: token(workManagementSemanticColors.warning),
            info: token(workManagementSemanticColors.info),
          },
          focus: token(workManagementSemanticColors.focus),
          overlay: token(workManagementSemanticColors.overlay),
          input: {
            DEFAULT: token(workManagementSemanticColors.input),
            disabled: token(workManagementSemanticColors.inputDisabled),
          },
        },
      },
    },
  },
});

export const workManagementSystem = createSystem(defaultBaseConfig, workManagementChakraConfig);
