import { model } from "@medusajs/framework/utils"

/** Work posted by Aalim Books (translation, review, typesetting…). */
const Project = model.define("earn_project", {
  id: model.id({ prefix: "prj" }).primaryKey(),
  title: model.text().searchable(),
  description: model.text(),
  category: model
    .enum(["translation", "review", "proofreading", "typesetting", "publishing", "printing", "fatwa", "research", "teaching", "other"])
    .default("translation"),
  source_reference: model.text().nullable(), // book / pages / link to the Arabic text
  word_count: model.number().nullable(),
  budget: model.float(),
  currency: model.text().default("PKR"),
  deadline: model.dateTime().nullable(),
  status: model
    .enum(["draft", "open", "assigned", "in_review", "completed", "cancelled"])
    .default("open"),
  assigned_scholar_id: model.text().index().nullable(),
  book_project_id: model.text().index().nullable(), // the book this work belongs to (optional)
})

export default Project
