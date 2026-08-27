import { useColorScheme } from "react-native";

export const brand = {
  blue: "#4EA7FE",
  bluePressed: "#348DE8",
  blueSoft: "#163C66",
  success: "#63C174",
  warning: "#F2B84B",
  danger: "#F06A6A",
} as const;

export const darkTheme = {
  mode: "dark" as const,
  background: "#070A0F",
  surface: "#0E141D",
  surfaceRaised: "#141C27",
  border: "#223044",
  text: "#F7F9FC",
  textMuted: "#98A8BC",
  textSubtle: "#6F8095",
  tabBar: "#0A0F16",
  ...brand,
};

export const lightTheme = {
  mode: "light" as const,
  background: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceRaised: "#EDF3FA",
  border: "#D8E2EE",
  text: "#0B1420",
  textMuted: "#52657A",
  textSubtle: "#74869A",
  tabBar: "#FFFFFF",
  ...brand,
};

export type GapwiseTheme = typeof darkTheme | typeof lightTheme;

export function useGapwiseTheme(): GapwiseTheme {
  return useColorScheme() === "light" ? lightTheme : darkTheme;
}
