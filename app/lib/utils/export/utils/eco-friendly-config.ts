/**
 * Eco-friendly configuration for export files
 * Optimized for minimal ink usage and duplex printing compatibility
 */

// Eco-friendly color palette - optimized for minimal ink usage
export const ECO_COLORS = {
  primary: [51, 51, 51],      // Dark gray instead of black
  secondary: [102, 102, 102], // Medium gray
  accent: [34, 139, 34],      // Forest green (minimal ink)
  success: [0, 128, 0],       // Dark green
  warning: [255, 140, 0],     // Orange (minimal ink)
  info: [0, 100, 200],        // Blue (minimal ink)
  light: [240, 240, 240],     // Very light gray
  border: [200, 200, 200]     // Light border
}

// Eco-friendly hex colors for DOC files
export const ECO_COLORS_HEX = {
  primary: '333333',    // Dark gray instead of black
  secondary: '666666',  // Medium gray
  accent: '228B22',     // Forest green
  success: '008000',    // Dark green
  warning: 'FF8C00',    // Orange
  info: '0064C8',       // Blue
  light: 'F0F0F0',      // Very light gray
  border: 'C8C8C8'      // Light border
}

// Eco-friendly typography settings
export const TYPOGRAPHY = {
  title: { size: 16, weight: 'bold' },
  subtitle: { size: 12, weight: 'bold' },
  body: { size: 10, weight: 'normal' },
  small: { size: 9, weight: 'normal' },
  lineHeight: 1.4
}

// Eco-friendly typography for DOC files
export const TYPOGRAPHY_DOC = {
  title: { size: 32, weight: 'bold' },
  subtitle: { size: 24, weight: 'bold' },
  body: { size: 20, weight: 'normal' },
  small: { size: 18, weight: 'normal' },
  lineHeight: 1.4
}

// Helper function to get eco-friendly colors for feedback types
export function getEcoFeedbackColor(type: string): [number, number, number] {
  switch (type.toLowerCase()) {
    case 'strength': {
      return [ECO_COLORS.success[0], ECO_COLORS.success[1], ECO_COLORS.success[2]]
    }
    case 'suggestion': {
      return [ECO_COLORS.warning[0], ECO_COLORS.warning[1], ECO_COLORS.warning[2]]
    }
    case 'comment': {
      return [ECO_COLORS.info[0], ECO_COLORS.info[1], ECO_COLORS.info[2]]
    }
    default: {
      return [ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2]]
    }
  }
}

// Helper function to get eco-friendly hex colors for feedback types
export function getEcoFeedbackColorHex(type: string): string {
  switch (type.toLowerCase()) {
    case 'strength': {
      return ECO_COLORS_HEX.success
    }
    case 'suggestion': {
      return ECO_COLORS_HEX.warning
    }
    case 'comment': {
      return ECO_COLORS_HEX.info
    }
    default: {
      return ECO_COLORS_HEX.primary
    }
  }
}

// Eco-friendly document properties
export function getEcoDocumentProperties(title: string, subject: string) {
  return {
    title,
    subject,
    author: 'Eddo Learning Platform',
    creator: 'Eddo Learning Platform',
    keywords: 'feedback, assessment, learning, eco-friendly, duplex'
  }
}

// Eco-friendly print settings recommendations
export const PRINT_RECOMMENDATIONS = {
  duplex: 'Print on both sides (duplex)',
  grayscale: 'Use grayscale printing when possible',
  draft: 'Use draft quality for internal use',
  margins: 'Use narrow margins to save paper',
  font: 'Use eco-friendly fonts (minimal ink)',
  spacing: 'Optimized line spacing for readability'
}
