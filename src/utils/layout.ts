import { WidthFraction } from '../types/canvas-types';
import { TERMINAL_WIDTHS } from '../lib/constants';

/**
 * Spatial Layout Helper Functions
 * Maps logical width fractions to current viewport-relative design tokens.
 */

/**
 * Returns the width in Volkswagen (vw) units for a given terminal width fraction.
 * Derived directly from the global design system tokens.
 */
export const getWidthVW = (fraction: WidthFraction | undefined): number => {
  if (!fraction) return TERMINAL_WIDTHS['1'];
  return TERMINAL_WIDTHS[fraction] ?? TERMINAL_WIDTHS['1'];
};

/**
 * Returns the CSS width string for a given terminal width fraction.
 */
export const getWidthVWString = (fraction: WidthFraction | undefined): string => {
  return `${getWidthVW(fraction)}vw`;
};
