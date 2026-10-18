import { model } from "@medusajs/framework/utils"

/** A scholar asking to take on a project. */
const Application = model.define("earn_application", {
  id: model.id({ prefix: "app" }).primaryKey(),
  project_id: model.text().index(),
  scholar_id: model.text().index(),
  message: model.text().nullable(),
  proposed_amount: model.float().nullable(),
  proposed_days: model.number().nullable(),
  status: model.enum(["pending", "accepted", "rejected", "withdrawn"]).default("pending"),
})

export default Application
