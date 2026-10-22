import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { formatMoney, type Product } from "@/api";
import { useAsync, useKade } from "@/state/store";
import { Button, Card, ErrorBanner, Loading, Muted, Pill, Screen, Title } from "@/ui/primitives";
import { brandAccent, palette } from "@/ui/theme";

export function ProductScreen() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { api, session, addToCart, busy, error, dismissError } = useKade();
  const product = useAsync<Product>(
    () => (session && sku ? api.getProduct(session, sku) : null),
    [session?.brand, sku],
  );
  const [variantSku, setVariantSku] = useState<string | null>(null);

  if (!session) return null;
  if (product.loading) return <Loading />;
  if (product.error || !product.data)
    return <ErrorBanner message={product.error ?? "not found"} onDismiss={() => router.back()} />;
  const p = product.data;
  const accent = brandAccent[session.brand];
  const chosen = p.variants.find((v) => v.sku === variantSku) ?? p.variants[0];
  const hasVariantDims = p.variants.some((v) => Object.keys(v.attributes).length > 0);

  return (
    <Screen testID="product-detail">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <Title>{p.name}</Title>
        <Muted>
          {p.sku} · {p.collection}
        </Muted>
        {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}
        <Card>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(p.price)}</Text>
            {p.compareAtPrice ? (
              <Text style={styles.compare}>{formatMoney(p.compareAtPrice)}</Text>
            ) : null}
          </View>
          <Pill label={p.availability.replace("_", " ")} color={accent} />
          {p.preorder ? <Muted>Pre-order: zero on hand, ships next season</Muted> : null}
          {p.bundle ? <Muted>Bundle of {p.bundle.join(", ")}</Muted> : null}
          {p.description ? <Text style={styles.body}>{p.description}</Text> : null}
        </Card>
        {hasVariantDims ? (
          <Card>
            <Muted>Variants</Muted>
            <View style={styles.variants}>
              {p.variants.map((v) => (
                <Button
                  key={v.sku}
                  label={`${Object.values(v.attributes).join(" / ")} (${v.onHand})`}
                  tone={v.sku === chosen.sku ? "primary" : "ghost"}
                  accent={accent}
                  onPress={() => setVariantSku(v.sku)}
                  testID={`variant-${v.sku}`}
                />
              ))}
            </View>
          </Card>
        ) : (
          <Muted>{chosen.onHand} on hand</Muted>
        )}
        <Button
          label={busy ? "Adding…" : "Add to cart"}
          accent={accent}
          disabled={busy || p.availability === "out_of_stock"}
          onPress={() =>
            addToCart(chosen.sku)
              .then(() => router.push("/shop/cart"))
              .catch(() => undefined)
          }
          testID="add-to-cart"
        />
      </ScrollView>
    </Screen>
  );
}

export default ProductScreen;

const styles = StyleSheet.create({
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  price: { color: palette.text, fontSize: 26, fontWeight: "800" },
  compare: { color: palette.muted, textDecorationLine: "line-through", fontSize: 16 },
  body: { color: palette.text, lineHeight: 20 },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
