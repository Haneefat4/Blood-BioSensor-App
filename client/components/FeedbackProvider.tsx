import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, MinTouchTarget, Spacing } from "@/constants/theme";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface Notice {
  message: string;
  tone?: "info" | "success" | "error";
}

interface FeedbackContextValue {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  notify: (notice: Notice | string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

interface PendingConfirm extends ConfirmRequest {
  confirmLabel: string;
  cancelLabel: string;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [toast, setToast] = useState<Required<Notice> | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback((value: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setPending(null);
    resolve?.(value);
  }, []);

  const confirm = useCallback((request: ConfirmRequest) => {
    if (resolver.current) {
      resolver.current(false);
      resolver.current = null;
    }
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPending({
        ...request,
        confirmLabel: request.confirmLabel ?? "Confirm",
        cancelLabel: request.cancelLabel ?? "Cancel",
      });
    });
  }, []);

  const notify = useCallback((notice: Notice | string) => {
    const next: Required<Notice> =
      typeof notice === "string"
        ? { message: notice, tone: "info" }
        : { message: notice.message, tone: notice.tone ?? "info" };
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  const toastColor =
    toast?.tone === "error"
      ? isDark
        ? "#F87171"
        : "#EF4444"
      : toast?.tone === "success"
        ? isDark
          ? "#34D399"
          : "#059669"
        : theme.primary;

  return (
    <FeedbackContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <Pressable
            onPress={() => setToast(null)}
            accessibilityRole="alert"
            accessibilityLiveRegion={
              toast.tone === "error" ? "assertive" : "polite"
            }
            accessibilityLabel={`${toast.message}. Dismiss message.`}
            style={[
              styles.toast,
              {
                top: insets.top + Spacing.sm,
                backgroundColor: toastColor,
              },
            ]}
          >
            <ThemedText style={styles.toastText}>{toast.message}</ThemedText>
          </Pressable>
        ) : null}
      </View>
      <Modal
        visible={pending != null}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => settle(false)}
          accessibilityLabel="Dismiss dialog"
        >
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
            }}
            accessibilityViewIsModal
            style={[styles.card, { backgroundColor: theme.backgroundRoot }]}
          >
            <ThemedText
              type="h3"
              accessibilityRole="header"
              style={styles.title}
            >
              {pending?.title}
            </ThemedText>
            <ThemedText
              style={[styles.message, { color: theme.textSecondary }]}
            >
              {pending?.message}
            </ThemedText>
            <View style={styles.actions}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  settle(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={pending?.cancelLabel ?? "Cancel"}
                style={({ pressed }) => [
                  styles.action,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <ThemedText style={styles.actionText}>
                  {pending?.cancelLabel}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  settle(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={pending?.confirmLabel ?? "Confirm"}
                style={({ pressed }) => [
                  styles.action,
                  {
                    backgroundColor: pending?.destructive
                      ? isDark
                        ? "#F87171"
                        : "#EF4444"
                      : theme.primary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.actionText, styles.confirmText]}>
                  {pending?.confirmLabel}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 50,
    minHeight: MinTouchTarget,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: "center",
    elevation: 8,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  action: {
    flex: 1,
    minHeight: MinTouchTarget,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmText: {
    color: "#FFFFFF",
  },
});
