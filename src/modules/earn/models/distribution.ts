import { model } from "@medusajs/framework/utils"

/** Money owed to / paid to an investor (profit share or refund) or an author (royalty). */
const Distribution = model.define("earn_distribution", {
  id: model.id({ prefix: "dst" }).primaryKey(),
  book_project_id: model.text().index(),
  sales_report_id: model.text().index().nullable(),
  partner_id: model.text().index(),
  kind: model.enum(["investor_profit", "author_royalty", "capital_refund"]),
  amount: model.bigNumber(),
  currency: model.text().default("PKR"),
  status: model.enum(["pending", "paid", "cancelled"]).default("pending"),
  method: model.text().nullable(),
  reference: model.text().nullable(),
  paid_at: model.dateTime().nullable(),
  note: model.text().nullable(),
})

export default Distribution
