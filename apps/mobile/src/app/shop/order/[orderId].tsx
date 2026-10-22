import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { formatMoney, type Order, type OrderEvent } from "@/api";
import { useAsync, useHarbourline } from "@/state/store";
import { Button, Card, ErrorBanner, Loading, Muted, Pill, Screen, Title } from "@/ui/primitives";
import { palette, statusColor, statusLabel } from "@/ui/theme";

export function EventTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <Card testID="order-timeline">
      <Muted>Timeline</Muted>
      {events.map((e) => (
        <View key={e.id} style={styles.event}>
          <View
            style={[
              styles.dot,
              { backgroundColor: e.to ? (statusColor[e.to] ?? palette.muted) : palette.border },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>
              {e.type === "status_changed" && e.to ? statusLabel(e.to) : e.type.replace(/_/g, " ")}
            </Text>
            <Muted>
              {new Date(e.at).toLocaleString()} · {e.source}
              {e.detail ? ` · ${e.detail}` : ""}
            </Muted>
          </View>
        </View>
      ))}
    </Card>
  );
}

export function OrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { api, session, notifyOrdersChanged } = useHarbourline();
  const order = useAsync<Order>(
    () => (session && orderId ? api.getOrder(session, orderId) : null),
    [session?.brand, orderId],
  );
  const events = useAsync<OrderEvent[]>(
    () => (session && orderId ? api.listOrderEvents(session, orderId) : null),
    [session?.brand, orderId, order.data?.status],
  );
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  if (!session) return null;
  if (order.loading) return <Loading />;
  if (order.error || !order.data)
    return <ErrorBanner message={order.error ?? "not found"} onDismiss={() => router.back()} />;
  const o = order.data;
  const cancellable = o.status === "pending_payment" || o.status === "paid";

  const cancel = () =>
    api
      .cancelOrder(session, o.id)
      .then(() => {
        order.reload();
        events.reload();
        notifyOrdersChanged();
      })
      .catch((e: Error) => setCancelError(e.message));

  return (
    <Screen testID="order-detail">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <Title>{o.number}</Title>
          <Pill label={statusLabel(o.status)} color={statusColor[o.status] ?? palette.muted} />
        </View>
        <Muted>Placed {new Date(o.placedAt).toLocaleString()}</Muted>
        {cancelError ? (
          <ErrorBanner message={cancelError} onDismiss={() => setCancelError(null)} />
        ) : null}
        <Card>
          {o.lines.map((l) => (
            <View key={l.sku} style={styles.rowBetween}>
              <Text style={styles.line} numberOfLines={1}>
                {l.quantity}× {l.name}
              </Text>
              <Text style={styles.line}>{formatMoney(l.lineTotal)}</Text>
            </View>
          ))}
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Muted>Total {o.totals.taxIncluded ? "(incl. VAT)" : "(incl. tax)"}</Muted>
            <Text style={styles.total}>{formatMoney(o.totals.total)}</Text>
          </View>
        </Card>
        {events.data ? <EventTimeline events={events.data} /> : <Loading label="Loading events…" />}
        {cancellable ? (
          <Button label="Cancel order" tone="danger" onPress={cancel} testID="cancel-order" />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default OrderScreen;

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  line: { color: palette.text, fontSize: 15, flexShrink: 1 },
  total: { color: palette.text, fontSize: 20, fontWeight: "800" },
  event: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  eventTitle: { color: palette.text, fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
});
