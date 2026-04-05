/**
 * Shared layout utilities for vertical and horizontal canvas positioning.
 */

export type WidthFraction = '1/3' | '1/2' | '2/3' | '1';

/**
 * Returns the width in Volkswagen (vw) units for a given terminal width fraction.
 */
export const getWidthVW = (fraction: WidthFraction | undefined): number => {
  switch (fraction) {
    case '1/3': return 30;
    case '1/2': return 48;
    case '2/3': return 66;
    case '1':   return 80;
    default:    return 80;
  }
};

/**
 * Returns the CSS width string for a given terminal width fraction.
 */
export const getWidthVWString = (fraction: WidthFraction | undefined): string => {
  return `${getWidthVW(fraction)}vw`;
};

export const GAPS_VW = 3; // Total horizontal spacing (margins) per terminal
