from decimal import Decimal

from payroll_worker.export import ApprovedHours, compute_pay_lines, render_csv, totals


def row(user_id, week, hours, rate=4500):
    return ApprovedHours(
        user_id, f"u{user_id}@acme.test", f"User {user_id}", rate, week, Decimal(hours)
    )


def test_overtime_is_per_week_not_per_period():
    lines = compute_pay_lines([row(1, "2026-W37", "38"), row(1, "2026-W38", "42")])
    assert lines[0].regular_hours == Decimal("78")
    assert lines[0].overtime_hours == Decimal("2")
    assert lines[0].amount_cents == 78 * 4500 + int(2 * 4500 * 1.5)


def test_lines_sorted_and_totals():
    lines = compute_pay_lines([row(2, "2026-W37", "10", 1000), row(1, "2026-W37", "5", 1000)])
    assert [line.user_id for line in lines] == [1, 2]
    assert totals(lines) == (Decimal("15"), 15000)


def test_half_cent_rounds_up():
    lines = compute_pay_lines([row(1, "2026-W37", "0.25", 4502)])
    assert lines[0].amount_cents == 1126  # 1125.5 rounds half up


def test_csv_shape():
    csv_text = render_csv(compute_pay_lines([row(1, "2026-W37", "8")]))
    assert csv_text.splitlines() == [
        "user_id,email,name,regular_hours,overtime_hours,amount_cents",
        "1,u1@acme.test,User 1,8.00,0.00,36000",
    ]


def test_empty_period():
    assert render_csv([]).count("\n") == 1
    assert totals([]) == (Decimal("0"), 0)
