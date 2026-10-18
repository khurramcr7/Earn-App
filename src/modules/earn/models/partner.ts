import { model } from "@medusajs/framework/utils"

/**
 * An investor, publisher or author invited by Aalim Books.
 * One person can hold several roles (e.g. an author who also invests).
 * Becomes "active" once they create their account on /partners.
 */
const Partner = model.define("earn_partner", {
  id: model.id({ prefix: "ptn" }).primaryKey(),
  email: model.text().unique(),
  full_name: model.text().searchable(),
  organization: model.text().nullable(), // publishing house, company, foundation…
  phone: model.text().nullable(),
  country: model.text().nullable(),
  is_investor: model.boolean().default(false),
  is_publisher: model.boolean().default(false),
  is_author: model.boolean().default(false),
  payout_method: model.text().nullable(),
  payout_details: model.text().nullable(),
  status: model.enum(["invited", "active", "suspended"]).default("invited"),
  customer_id: model.text().index().nullable(),
  admin_notes: model.text().nullable(),
})

export default Partner
