import { model } from "@medusajs/framework/utils"

/** Money an investor commits to a book. Counts as capital only once Aalim Books marks it received. */
const Commitment = model.define("earn_commitment", {
  id: model.id({ prefix: "cmt" }).primaryKey(),
  book_project_id: model.text().index(),
  partner_id: model.text().index(),
  amount: model.bigNumber(),
  currency: model.text().default("PKR"),
  status: model.enum(["pledged", "received", "refunded", "cancelled"]).default("pledged"),
  reference: model.text().nullable(), // bank / transaction ID
  received_at: model.dateTime().nullable(),
  note: model.text().nullable(),
})

export default Commitment
