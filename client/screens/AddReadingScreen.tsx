import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export default function AddReadingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText>Placeholder</ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}
