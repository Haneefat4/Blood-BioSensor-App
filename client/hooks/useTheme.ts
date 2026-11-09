import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePreferencesContextOptional } from "@/context/PreferencesContext";

export function useTheme() {
  const systemScheme = useColorScheme();
  const preferencesContext = usePreferencesContextOptional();
  const preference = preferencesContext?.preferences.darkMode ?? "system";
  const colorScheme =
    preference === "light" || preference === "dark"
      ? preference
      : systemScheme === "dark"
        ? "dark"
        : "light";

  return {
    theme: Colors[colorScheme],
    isDark: colorScheme === "dark",
    colorScheme,
  };
}
