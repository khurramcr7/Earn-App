import { model } from "@medusajs/framework/utils"

/** Money owed to / paid to a scholar. Created automatically when work is approved. */
const Payout = model.define("earn_payout", {
  id: model.id({ prefix: "pay" }).primaryKey(),
  scholar_id: model.text().index(),
  project_id: model.text().index().nullable(),
  amount: model.float(),
  currency: model.text().default("PKR"),
  status: model.enum(["pending", "paid", "cancelled"]).default("pending"),
  method: model.text().nullable(),
  reference: model.text().nullable(), // transfer / transaction ID
  paid_at: model.dateTime().nullable(),
  note: model.text().nullable(),
})

export default Payout
