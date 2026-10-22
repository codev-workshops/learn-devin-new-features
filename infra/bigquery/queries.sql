-- Reference queries for analytics.orders_daily (the MCP shim answers the same questions
-- through bigquery_query_orders_daily with brand/sku/from/to filters).

-- 1. Which SKUs were oversold on which day? (on_hand_eod < 0)
SELECT order_date, brand, sku, orders, units, on_hand_eod
FROM `harbourline-prod.analytics.orders_daily`
WHERE on_hand_eod < 0
ORDER BY order_date, brand, sku;

-- 2. Lamp Week impact for LH-LAMP-03: units sold against the 3 units that existed on 2026-10-18.
SELECT SUM(units) AS units_sold, SUM(gross_revenue) AS revenue, MIN(on_hand_eod) AS worst_on_hand
FROM `harbourline-prod.analytics.orders_daily`
WHERE sku = 'LH-LAMP-03' AND order_date BETWEEN '2026-10-20' AND '2026-10-22';

-- 3. Duplicate webhook pressure per brand over the window.
SELECT brand, SUM(duplicate_webhooks) AS duplicates, SUM(orders) AS orders,
       ROUND(100 * SUM(duplicate_webhooks) / SUM(orders), 1) AS pct
FROM `harbourline-prod.analytics.orders_daily`
GROUP BY brand;
