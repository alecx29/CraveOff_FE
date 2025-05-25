const Theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: 'rgba(37, 41, 46, 1.00)',
    gradientStart: 'rgba(17, 20, 25, 1.00)',
    gradientEnd: 'rgba(37, 41, 46, 0.95)',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    error: '#e74c3c',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    heading: 24,
    subheading: 18,
    body: 16,
    small: 14,
    weightBold: 'bold',
    weightNormal: 'normal',
  },
  borderRadius: {
    small: 5,
    medium: 10,
    large: 20,
  },
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
  },
};

export default Theme;