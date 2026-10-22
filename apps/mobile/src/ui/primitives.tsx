import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewProps } from "react-native";

import { palette } from "./theme";

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...rest}>
      {children}
    </View>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return (
    <Text style={styles.muted} testID={testID}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled,
  testID,
  accent,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  testID?: string;
  accent?: string;
}) {
  const bg =
    tone === "primary" ? (accent ?? "#7cc4ff") : tone === "danger" ? palette.danger : "transparent";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        tone === "ghost" && styles.ghost,
      ]}
    >
      <Text style={[styles.buttonText, tone === "ghost" && { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} testID="loading">
      <ActivityIndicator color={palette.muted} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <Pressable onPress={onDismiss} style={styles.error} testID="error-banner">
      <Text style={styles.errorText}>{message}</Text>
    </Pressable>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, padding: 16, gap: 12 },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  title: { color: palette.text, fontSize: 24, fontWeight: "700" },
  muted: { color: palette.muted, fontSize: 13 },
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: "center" },
  ghost: { borderColor: palette.border, borderWidth: 1 },
  buttonText: { color: "#0f1115", fontWeight: "700", fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  error: { backgroundColor: "#3a1d1d", borderRadius: 10, padding: 12 },
  errorText: { color: palette.danger },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
});
