---
description: Payroll amount calculations
trigger: model_decision
---

When changing payroll totals, rates or overtime: amounts are integer cents, calculations use `Decimal` in the worker, overtime is per ISO week above 40 hours at 1.5x, and rounding is half-up to the cent. Update `services/payroll-worker/tests/test_export.py` with a worked example.
