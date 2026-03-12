/**
 * Dark Mode Styles
 * 
 * Shared utility classes and constants for dark mode styling
 * in the document creation flow.
 */

/**
 * Text color utilities for dark mode
 */
export const darkTextColors = {
  primary: 'text-white',
  secondary: 'text-gray-300',
  tertiary: 'text-gray-400',
  label: 'text-gray-200',
  muted: 'text-gray-500',
} as const;

/**
 * Background color utilities for dark mode
 */
export const darkBgColors = {
  card: 'bg-gray-900',
  input: 'bg-gray-900',
  secondary: 'bg-gray-800',
  error: 'bg-red-900/30',
  warning: 'bg-yellow-900/30',
  info: 'bg-blue-900/30',
} as const;

/**
 * Border color utilities for dark mode
 */
export const darkBorderColors = {
  default: 'border-gray-700',
  focus: 'border-blue-500',
  error: 'border-red-500',
  warning: 'border-yellow-700',
  info: 'border-blue-700',
} as const;

/**
 * Combined utility classes for common patterns
 */
export const darkModeClasses = {
  // Text
  title: 'text-white',
  subtitle: 'text-gray-300',
  label: 'text-gray-200',
  helpText: 'text-gray-400',
  errorText: 'text-red-400',
  warningText: 'text-yellow-300',
  infoText: 'text-blue-300',
  
  // Backgrounds
  card: 'bg-gray-900 border border-gray-700',
  input: 'bg-gray-900 text-white border-gray-700',
  errorPanel: 'bg-red-900/30 border border-red-700',
  warningPanel: 'bg-yellow-900/30 border border-yellow-700',
  infoPanel: 'bg-blue-900/30 border border-blue-700',
  
  // Interactive
  buttonSecondary: 'text-gray-300 hover:text-white border-gray-700 hover:border-blue-500',
  link: 'text-blue-400 hover:text-blue-300',
} as const;

/**
 * Get severity-specific styles for warning/error panels
 */
export function getSeverityClasses(severity: 'error' | 'warning' | 'info' | 'default') {
  switch (severity) {
    case 'error':
      return {
        bg: 'bg-red-900/30',
        border: 'border-red-700',
        text: 'text-red-300',
        icon: 'text-red-400',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-900/30',
        border: 'border-yellow-700',
        text: 'text-yellow-300',
        icon: 'text-yellow-400',
      };
    case 'info':
      return {
        bg: 'bg-blue-900/30',
        border: 'border-blue-700',
        text: 'text-blue-300',
        icon: 'text-blue-400',
      };
    default:
      return {
        bg: 'bg-gray-800',
        border: 'border-gray-700',
        text: 'text-gray-300',
        icon: 'text-gray-400',
      };
  }
}

