"""Harbourline fulfilment worker.

Consumes the transactional outbox and the PayGate webhook inbox, keeps inventory reservations,
sweeps abandoned carts and recomputes order totals with ``decimal.Decimal``.

Three defects are planted on purpose and documented in ``PLANTED.md``. Do not fix them on ``main``.
"""

__version__ = "0.1.0"
