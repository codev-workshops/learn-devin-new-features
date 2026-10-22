import type { Money } from "@harbourline/contracts";
import type { ReactNode } from "react";
import { formatMoney } from "../lib/money";

export function Price({
  value,
  locale,
  className,
}: {
  value: Money;
  locale?: string;
  className?: string;
}) {
  return <span className={className}>{formatMoney(value, locale)}</span>;
}

export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function Loading({ what }: { what: string }) {
  return (
    <p role="status" className="muted">
      Loading {what}…
    </p>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export const statusTone = (s: string): "neutral" | "good" | "warn" | "bad" =>
  s === "confirmed" ||
  s === "paid" ||
  s === "shipped" ||
  s === "delivered" ||
  s === "fulfilled" ||
  s === "in_stock"
    ? "good"
    : s === "pending_payment" || s === "low_stock" || s === "preorder"
      ? "warn"
      : s === "cancelled" || s === "refunded" || s === "out_of_stock"
        ? "bad"
        : "neutral";

export const label = (s: string) => s.replace(/_/g, " ");
