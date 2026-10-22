"""Pure payroll calculations. No database or filesystem access here."""

import csv
import io
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

OVERTIME_THRESHOLD_HOURS = Decimal("40")
OVERTIME_MULTIPLIER = Decimal("1.5")


@dataclass(frozen=True)
class ApprovedHours:
    user_id: int
    email: str
    name: str
    hourly_rate_cents: int
    iso_week: str
    hours: Decimal


@dataclass(frozen=True)
class PayLine:
    user_id: int
    email: str
    name: str
    regular_hours: Decimal
    overtime_hours: Decimal
    amount_cents: int


def compute_pay_lines(rows: list[ApprovedHours]) -> list[PayLine]:
    """Aggregates approved hours per user. Overtime is computed per ISO week above 40 hours."""
    by_user: dict[int, dict] = {}
    for row in rows:
        entry = by_user.setdefault(
            row.user_id,
            {"row": row, "regular": Decimal("0"), "overtime": Decimal("0")},
        )
        week_regular = min(row.hours, OVERTIME_THRESHOLD_HOURS)
        entry["regular"] += week_regular
        entry["overtime"] += row.hours - week_regular

    lines = []
    for user_id in sorted(by_user):
        entry = by_user[user_id]
        rate = Decimal(entry["row"].hourly_rate_cents)
        amount = entry["regular"] * rate + entry["overtime"] * rate * OVERTIME_MULTIPLIER
        lines.append(
            PayLine(
                user_id=user_id,
                email=entry["row"].email,
                name=entry["row"].name,
                regular_hours=entry["regular"],
                overtime_hours=entry["overtime"],
                amount_cents=int(amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP)),
            )
        )
    return lines


def render_csv(lines: list[PayLine]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(["user_id", "email", "name", "regular_hours", "overtime_hours", "amount_cents"])
    for line in lines:
        writer.writerow(
            [
                line.user_id,
                line.email,
                line.name,
                f"{line.regular_hours:.2f}",
                f"{line.overtime_hours:.2f}",
                line.amount_cents,
            ]
        )
    return buffer.getvalue()


def totals(lines: list[PayLine]) -> tuple[Decimal, int]:
    hours = sum((line.regular_hours + line.overtime_hours for line in lines), Decimal("0"))
    return hours, sum(line.amount_cents for line in lines)
