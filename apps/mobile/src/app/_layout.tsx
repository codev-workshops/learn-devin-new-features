import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { KadeProvider } from "@/state/store";
import { palette } from "@/ui/theme";

export default function RootLayout() {
  return (
    <KadeProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Kadé Commerce" }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
      </Stack>
    </KadeProvider>
  );
}
