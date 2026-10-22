# Harbourline flash-sale kit (always on)

- During a flash-sale window (`HARBOURLINE_SALE_FREEZE=1`) nothing is pushed to `main`; releases go out before the window opens or after it closes.
- Use `/harbourline-flash-sale:flash-sale-release` before any sale release and `/harbourline-flash-sale:flash-sale-incident` when an order, stock or payment alert fires during a sale.
- Never paste a token into a chat, a skill or this plugin. Credentials live in the MCP connection, not in plugin files.
