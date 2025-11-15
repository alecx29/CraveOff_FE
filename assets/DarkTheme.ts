const Theme = {
  colors: {
    // Primary Brand Colors (Indigo)
    primary: "#6366f1",
    primaryLight: "#818cf8",
    primaryDark: "#4f46e5",

    // Accent Colors
    accentOrange: "#f97316",
    accentBlue: "#60a5fa",
    accentPurple: "#c084fc",

    // Emergency / CraveOff Mode
    emergencyLight: "#f87171",
    emergency: "#ef4444",
    emergencyDark: "#dc2626",

    // Backgrounds
    background: "#000000",
    backgroundDeep: "#030712",
    cardBackground: "#111827",
    cardInteractive: "#1f2937",
    borderLight: "#374151",

    // Borders
    border: "#374151",
    borderSelected: "#6366f1",

    // Gradient colors
    gradientStart: "#030712",
    gradientEnd: "#111827",

    // Text Colors
    textPrimary: "#ffffff",
    textSecondary: "#d1d5db",
    textMuted: "#9ca3af",
    textPlaceholder: "#6b7280",

    // Shadows / Highlights
    glowIndigo: "rgba(99, 102, 241, 0.2)",
    glowRed: "rgba(239, 68, 68, 0.2)",

    // Overlay / Modal
    overlay: "rgba(0, 0, 0, 0.7)",
    modalBackground: "rgba(17, 24, 39, 0.95)",

    // Input Styling
    inputBackground: "#1f2937",
    inputBorder: "#374151",
    inputPlaceholder: "#6b7280",

    // Button Styles
    buttonPrimary: "#6366f1",
    buttonPrimaryHover: "#4f46e5",
    buttonEmergency: "#ef4444",
    buttonEmergencyHover: "#dc2626",

    // Progress / Stats
    progressFill: "#60a5fa",
    flame: "#f97316",
    success: "#4ade80",

    // Notification background
    notificationBackground: "#111827",
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
    heading1: 28,
    heading2: 24,
    heading3: 20,
    subheading: 18,
    body: 16,
    small: 14,
    tiny: 12,

    weightBold: "bold",
    weightSemiBold: "600",
    weightMedium: "500",
    weightNormal: "normal",

    lineHeightTight: 1.2,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.8,
  },

  borderRadius: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 24,
    circle: 32,
    pill: 48,
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
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    heavy: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    indigoGlow: {
      shadowColor: "#6366f1",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 10,
    },
    redGlow: {
      shadowColor: "#ef4444",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 10,
    },
  },

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
