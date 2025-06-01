const Theme = {
  colors: {
    // Primary and secondary colors
    primary: "#3498db",
    secondary: "#2ecc71",
    accent: "#FF9500",

    // Background colors
    background: "#F9F9F9",
    backgroundDarker: "#EFEFEF",
    backgroundLighter: "#FFFFFF",
    cardBackground: "#FFFFFF",
    cardBackgroundAlt: "#F5F5F5",
    cardSelected: "#F0F7FF",

    // Gradient colors
    gradientStart: "#F9F9F9",
    gradientEnd: "#EFEFEF",

    // Text colors
    textPrimary: "#1A1A1A",
    textSecondary: "#6C6C6C",
    textMuted: "#999999",
    textHighlight: "#3498db",

    // UI element colors
    icon: "#666666",
    separator: "#E0E0E0",
    error: "#e74c3c",
    success: "#2ecc71",
    warning: "#f39c12",
    backButton: "#EEEEEE",
    iconBackButton: "#333333",

    // Button colors
    buttonPrimary: "#3498db",
    buttonTextPrimary: "#FFFFFF",

    // Border colors
    border: "#E0E0E0",
    borderSelected: "#3498db",

    // Progress bar
    progressBackground: "#E0E0E0",
    progressFill: "#3498db",

    // Neutral scale (grayscale)
    neutral100: "#FFFFFF",
    neutral200: "#F5F5F5",
    neutral300: "#EEEEEE",
    neutral400: "#E0E0E0",
    neutral500: "#CCCCCC",
    neutral600: "#999999",
    neutral700: "#666666",
    neutral800: "#333333",
    neutral900: "#1A1A1A",

    // Overlay/modal colors
    overlay: "rgba(0, 0, 0, 0.3)",
    modalBackground: "#FFFFFF",

    // Input colors
    inputBackground: "#F5F5F5",
    inputBorder: "#E0E0E0",
    inputPlaceholder: "#999999",

    // Action colors
    actionPrimary: "#3498db",
    actionSecondary: "#999999",
    actionDisabled: "#CCCCCC",

    // Notification colors
    notificationBackground: "#FFFFFF",
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  typography: {
    // Font sizes
    heading1: 28,
    heading2: 24,
    heading3: 20,
    subheading: 18,
    body: 16,
    small: 14,
    tiny: 12,

    // Font weights
    weightBold: "bold",
    weightSemiBold: "600",
    weightMedium: "500",
    weightNormal: "normal",

    // Line heights
    lineHeightTight: 1.2,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.8,
  },

  borderRadius: {
    xs: 3,
    small: 5,
    medium: 10,
    large: 15,
    xl: 16,
    circle: 20,
    pill: 40,
  },

  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    light: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    heavy: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // Common component sizing
  sizes: {
    buttonHeight: 48,
    inputHeight: 48,
    iconSmall: 16,
    iconMedium: 20,
    iconLarge: 24,
    avatarSmall: 32,
    avatarMedium: 48,
    avatarLarge: 64,
  },
};

export default Theme;
