import { model } from "@medusajs/framework/utils"

/** Sales for one period of one book. Approving it creates royalty and profit-share payments. */
const SalesReport = model.define("earn_sales_report", {
  id: model.id({ prefix: "sal" }).primaryKey(),
  book_project_id: model.text().index(),
  period_start: model.dateTime(),
  period_end: model.dateTime(),
  units_sold: model.number().default(0),
  revenue: model.bigNumber(),
  costs: model.bigNumber().default(0), // printing, shipping, store fees for this period
  currency: model.text().default("PKR"),
  status: model.enum(["submitted", "approved", "rejected"]).default("submitted"),
  submitted_by_partner_id: model.text().nullable(),
  note: model.text().nullable(),
  admin_feedback: model.text().nullable(),
  net_profit: model.bigNumber().nullable(),       // filled on approval
  calculation: model.json().nullable(),        // how the split was worked out, kept for audit
})

export default SalesReport
