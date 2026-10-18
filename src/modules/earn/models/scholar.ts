import { model } from "@medusajs/framework/utils"

/** A scholar invited by Aalim Books. Becomes "active" once they create their portal account. */
const Scholar = model.define("scholar", {
  id: model.id({ prefix: "sch" }).primaryKey(),
  email: model.text().unique(),
  full_name: model.text().searchable(),
  phone: model.text().nullable(),
  country: model.text().nullable(),
  specialties: model.text().nullable(), // e.g. "Hadith translation, Arabic grammar"
  payout_method: model.text().nullable(), // bank / JazzCash / Easypaisa / Payoneer / Wise
  payout_details: model.text().nullable(), // account title & number, IBAN, wallet number…
  status: model.enum(["invited", "active", "suspended"]).default("invited"),
  customer_id: model.text().index().nullable(),
  admin_notes: model.text().nullable(),
})

export default Scholar
