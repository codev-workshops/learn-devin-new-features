import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { formatMoney, type Cart, type CartLine } from "@/api";
import { useKade } from "@/state/store";
import { Button, Card, ErrorBanner, Muted, Screen, Title } from "@/ui/primitives";
import { brandAccent, palette } from "@/ui/theme";

export function TotalsView({ cart }: { cart: Cart }) {
  const t = cart.totals;
  const rows: [string, string][] = [
    ["Subtotal", formatMoney(t.subtotal)],
    [t.taxIncluded ? "incl. VAT" : "Tax", formatMoney(t.tax)],
    ["Shipping", t.shipping.amount === "0.00" ? "Free" : formatMoney(t.shipping)],
    ["Total", formatMoney(t.total)],
  ];
  return (
    <Card testID="cart-totals">
      {rows.map(([k, v]) => (
        <View key={k} style={styles.rowBetween}>
          <Muted>{k}</Muted>
          <Text style={[styles.value, k === "Total" && styles.total]}>{v}</Text>
        </View>
      ))}
    </Card>
  );
}

export function CartScreen() {
  const { session, cart, setLineQuantity, busy, error, dismissError } = useKade();
  if (!session) return null;
  const accent = brandAccent[session.brand];
  const lines = cart?.lines ?? [];

  const bump = (line: CartLine, delta: number) =>
    setLineQuantity(line.id, Math.max(0, line.quantity + delta)).catch(() => undefined);

  return (
    <Screen testID="cart">
      <Title>Cart</Title>
      {cart ? (
        <Muted>
          Cart {cart.id.slice(0, 8)} · {cart.status}
        </Muted>
      ) : null}
      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}
      <FlatList
        data={lines}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ gap: 10 }}
        ListEmptyComponent={
          <Card>
            <Text style={styles.name}>Your cart is empty</Text>
            <Muted>Add something from the catalog.</Muted>
            <Button label="Browse catalog" accent={accent} onPress={() => router.push("/shop")} />
          </Card>
        }
        renderItem={({ item }) => (
          <Card testID={`line-${item.sku}`}>
            <View style={styles.rowBetween}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.value}>{formatMoney(item.lineTotal)}</Text>
            </View>
            <Muted>
              {item.sku} · {formatMoney(item.unitPrice)} each
            </Muted>
            <View style={styles.qty}>
              <Button
                label="−"
                tone="ghost"
                onPress={() => bump(item, -1)}
                disabled={busy}
                testID={`dec-${item.sku}`}
              />
              <Text style={styles.qtyText} testID={`qty-${item.sku}`}>
                {item.quantity}
              </Text>
              <Button
                label="+"
                tone="ghost"
                onPress={() => bump(item, +1)}
                disabled={busy}
                testID={`inc-${item.sku}`}
              />
            </View>
          </Card>
        )}
        ListFooterComponent={cart && lines.length > 0 ? <TotalsView cart={cart} /> : null}
      />
    </Screen>
  );
}

export default CartScreen;

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: { color: palette.text, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  value: { color: palette.text, fontSize: 16, fontWeight: "600" },
  total: { fontSize: 20, fontWeight: "800" },
  qty: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  qtyText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
});
