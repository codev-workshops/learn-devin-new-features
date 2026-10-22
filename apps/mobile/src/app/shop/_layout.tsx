import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";

import { useKade } from "@/state/store";
import { brandAccent, palette } from "@/ui/theme";

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function ShopLayout() {
  const { session, brand, cart } = useKade();
  if (!session) return <Redirect href="/" />;
  const accent = brandAccent[session.brand];
  const count = cart?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.text,
        headerTitle: brand?.name ?? session.brand,
        tabBarStyle: { backgroundColor: palette.card, borderTopColor: palette.border },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: palette.muted,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Catalog", tabBarIcon: ({ color }) => <Icon glyph="▤" color={color} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color }) => <Icon glyph="◫" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: "Orders", tabBarIcon: ({ color }) => <Icon glyph="◷" color={color} /> }}
      />
      <Tabs.Screen name="product/[sku]" options={{ href: null, title: "Product" }} />
      <Tabs.Screen name="order/[orderId]" options={{ href: null, title: "Order" }} />
    </Tabs>
  );
}
