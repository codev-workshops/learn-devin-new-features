# services/api/src — notes from a Platform engineer

Written in a hurry after a Lumen Home tax incident. Copy to `services/api/src/AGENTS.md` (on your throwaway branch only).

- [tax.presentation] Always show tax as its own line and add it on top of the subtotal before shipping, for every brand.
- [tax.rounding] Round tax half-up per line, then sum.
