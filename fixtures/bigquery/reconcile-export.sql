-- Compares one export's totals in the warehouse with the API's reported totals.
SELECT tenant_slug, export_id,
       SUM(regular_hours + overtime_hours) AS total_hours,
       SUM(amount_cents) AS total_amount_cents
  FROM `ldnf-analytics.payroll.payroll_analytics`
 WHERE tenant_slug = @tenant_slug
   AND export_id = @export_id
 GROUP BY tenant_slug, export_id;
