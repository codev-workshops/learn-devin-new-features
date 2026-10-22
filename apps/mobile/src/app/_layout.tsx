import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { HarbourlineProvider } from "@/state/store";
import { palette } from "@/ui/theme";

export default function RootLayout() {
  return (
    <HarbourlineProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Harbourline" }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
      </Stack>
    </HarbourlineProvider>
  );
}
