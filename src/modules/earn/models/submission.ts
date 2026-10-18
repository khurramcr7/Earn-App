import { model } from "@medusajs/framework/utils"

/** Finished (or partial) work handed in for review. Files are shared as links (Drive, Dropbox…). */
const Submission = model.define("earn_submission", {
  id: model.id({ prefix: "sub" }).primaryKey(),
  project_id: model.text().index(),
  scholar_id: model.text().index(),
  note: model.text().nullable(),
  work_url: model.text(),
  status: model.enum(["submitted", "approved", "changes_requested"]).default("submitted"),
  feedback: model.text().nullable(),
})

export default Submission
