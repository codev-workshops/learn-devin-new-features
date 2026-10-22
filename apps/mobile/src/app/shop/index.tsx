import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatMoney, type Collection, type Product } from "@/api";
import { useAsync, useHarbourline } from "@/state/store";
import { Button, Card, ErrorBanner, Loading, Muted, Pill, Screen } from "@/ui/primitives";
import { brandAccent, palette } from "@/ui/theme";

const availabilityColor: Record<Product["availability"], string> = {
  in_stock: palette.success,
  low_stock: "#f5b84a",
  out_of_stock: palette.danger,
  preorder: "#7cc4ff",
};

export function ProductRow({
  product,
  onAdd,
  accent,
}: {
  product: Product;
  onAdd: () => void;
  accent: string;
}) {
  const canAdd = product.availability !== "out_of_stock";
  return (
    <Pressable
      onPress={() => router.push(`/shop/product/${product.sku}`)}
      testID={`product-${product.sku}`}
    >
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Pill
            label={product.availability.replace("_", " ")}
            color={availabilityColor[product.availability]}
          />
        </View>
        <Muted>{product.sku}</Muted>
        <View style={styles.rowBetween}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            {product.compareAtPrice ? (
              <Text style={styles.compare}>{formatMoney(product.compareAtPrice)}</Text>
            ) : null}
          </View>
          <Button
            label="Add"
            onPress={onAdd}
            disabled={!canAdd}
            accent={accent}
            testID={`add-${product.sku}`}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export function CatalogScreen() {
  const { api, session, addToCart, error, dismissError, clearBrand } = useHarbourline();
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => setSlug(null), [session?.brand]);
  const collections = useAsync<Collection[]>(
    () => (session ? api.listCollections(session) : null),
    [session?.brand],
  );
  const active = slug ?? collections.data?.[0]?.slug ?? null;
  const page = useAsync(
    () => (session && active ? api.getCollection(session, active) : null),
    [session?.brand, active],
  );

  if (!session) return null;
  const accent = brandAccent[session.brand];
  if (collections.loading) return <Loading label="Loading collections…" />;

  return (
    <Screen testID="catalog">
      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {(collections.data ?? []).map((c) => (
          <Pressable
            key={c.slug}
            onPress={() => setSlug(c.slug)}
            testID={`collection-${c.slug}`}
            style={[
              styles.chip,
              c.slug === active && { backgroundColor: accent, borderColor: accent },
            ]}
          >
            <Text style={[styles.chipText, c.slug === active && { color: palette.bg }]}>
              {c.name} · {c.productCount}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {page.data?.promotion ? <Muted>Promotion active: {page.data.promotion}</Muted> : null}
      {page.loading ? (
        <Loading />
      ) : page.error ? (
        <ErrorBanner message={page.error} onDismiss={page.reload} />
      ) : (
        <FlatList
          data={page.data?.products ?? []}
          keyExtractor={(p) => p.sku}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              accent={accent}
              onAdd={() =>
                item.variants.length > 1
                  ? router.push(`/shop/product/${item.sku}`)
                  : addToCart(item.sku).catch(() => undefined)
              }
            />
          )}
          ListEmptyComponent={<Muted>No products in this collection.</Muted>}
        />
      )}
      <Button
        label="Switch brand"
        tone="ghost"
        onPress={() => {
          clearBrand();
          router.replace("/");
        }}
        testID="switch-brand"
      />
    </Screen>
  );
}

export default CatalogScreen;

const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: palette.text, fontSize: 13 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { color: palette.text, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  price: { color: palette.text, fontSize: 18, fontWeight: "700" },
  compare: { color: palette.muted, textDecorationLine: "line-through" },
});
