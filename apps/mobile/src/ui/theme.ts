import type { BrandId } from "../api";

export const palette = {
  bg: "#0f1115",
  card: "#181b22",
  border: "#262a33",
  text: "#f4f5f7",
  muted: "#9aa3b2",
  danger: "#ff6b6b",
  success: "#4cd68a",
};

export const brandAccent: Record<BrandId, string> = {
  "lumen-home": "#f5b84a",
  "trailhead-supply": "#5fb27a",
};

export const statusColor: Record<string, string> = {
  pending_payment: "#f5b84a",
  paid: "#7cc4ff",
  confirmed: "#7cc4ff",
  packed: "#a08cff",
  shipped: "#a08cff",
  delivered: "#4cd68a",
  cancelled: "#ff6b6b",
  refunded: "#ff6b6b",
};

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
