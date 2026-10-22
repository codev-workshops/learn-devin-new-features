import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { formatMoney, type OrderPage } from "@/api";
import { useAsync, useKade } from "@/state/store";
import { Card, ErrorBanner, Loading, Muted, Pill, Screen, Title } from "@/ui/primitives";
import { palette, statusColor, statusLabel } from "@/ui/theme";

export function OrdersScreen() {
  const { api, session, ordersVersion } = useKade();
  const orders = useAsync<OrderPage>(
    () => (session ? api.listOrders(session, { limit: 50 }) : null),
    [session?.brand, ordersVersion],
  );
  if (!session) return null;
  if (orders.loading) return <Loading label="Loading orders…" />;
  if (orders.error) return <ErrorBanner message={orders.error} onDismiss={orders.reload} />;

  return (
    <Screen testID="orders">
      <Title>Your orders</Title>
      <Muted>{session.user}</Muted>
      <FlatList
        data={orders.data?.items ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ gap: 10 }}
        ListEmptyComponent={<Muted>No orders yet.</Muted>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/shop/order/${item.id}`)}
            testID={`order-${item.number}`}
          >
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.number}>{item.number}</Text>
                <Pill
                  label={statusLabel(item.status)}
                  color={statusColor[item.status] ?? palette.muted}
                />
              </View>
              <Muted>
                {new Date(item.placedAt).toLocaleDateString()} · {item.lines.length} line
                {item.lines.length === 1 ? "" : "s"}
              </Muted>
              <Text style={styles.total}>{formatMoney(item.totals.total)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export default OrdersScreen;

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { color: palette.text, fontSize: 16, fontWeight: "700" },
  total: { color: palette.text, fontSize: 18, fontWeight: "700" },
});
