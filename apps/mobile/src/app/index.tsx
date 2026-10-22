import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { Brand } from "@/api";
import { useKade } from "@/state/store";
import { Card, ErrorBanner, Loading, Muted, Screen, Title } from "@/ui/primitives";
import { brandAccent, palette } from "@/ui/theme";

export function BrandPicker() {
  const { brands, error, selectBrand, dismissError } = useKade();
  if (!brands.length && !error) return <Loading label="Loading brands…" />;

  const onPick = (b: Brand) => {
    selectBrand(b.id);
    router.push("/shop");
  };

  return (
    <Screen testID="brand-picker">
      <Title>Choose a storefront</Title>
      <Muted>Two brands, one contract. Pick one to browse its catalog.</Muted>
      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}
      <FlatList
        data={brands}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            testID={`brand-${item.id}`}
            accessibilityRole="button"
          >
            <Card style={{ borderLeftColor: brandAccent[item.id], borderLeftWidth: 4 }}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.row}>
                <Muted>{item.currency}</Muted>
                <Muted>
                  {item.pricing === "tax_inclusive" ? "VAT included" : "tax added at checkout"}
                </Muted>
                {item.taxRate !== undefined ? (
                  <Muted>{(item.taxRate * 100).toFixed(2)}%</Muted>
                ) : null}
              </View>
              {item.freeShippingOver ? (
                <Muted>
                  Free shipping over {item.freeShippingOver.currency} {item.freeShippingOver.amount}
                </Muted>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export default BrandPicker;

const styles = StyleSheet.create({
  name: { color: palette.text, fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12 },
});
