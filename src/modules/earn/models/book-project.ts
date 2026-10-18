import { model } from "@medusajs/framework/utils"

/**
 * A whole book taken from manuscript to print: translation, proofreading, typesetting,
 * publishing, printing, fatwā review… Each piece of work is a scholar Project linked by book_project_id.
 *
 * Funding models (chosen per book):
 *  - profit_share: muḍārabah — investors provide capital; an agreed share of net profit is paid to them
 *    pro rata to the capital they actually sent; losses fall on capital, not on the managing partner.
 *  - sponsorship: charity / waqf — no financial return; investors follow the impact.
 */
const BookProject = model.define("earn_book_project", {
  id: model.id({ prefix: "bkp" }).primaryKey(),
  title: model.text().searchable(),
  title_ar: model.text().nullable(),
  description: model.text(),
  source_reference: model.text().nullable(),
  publisher_id: model.text().index().nullable(),
  author_id: model.text().index().nullable(), // living writer receiving royalties
  funding_model: model.enum(["profit_share", "sponsorship"]).default("profit_share"),
  funding_goal: model.bigNumber(),
  currency: model.text().default("PKR"),
  investor_profit_share_pct: model.float().nullable(), // % of net profit (after royalty) paid to investors
  author_royalty_pct: model.float().nullable(),        // % of revenue paid to the author
  agreement_url: model.text().nullable(),
  status: model
    .enum(["proposed", "draft", "fundraising", "funded", "in_production", "published", "closed", "cancelled"])
    .default("draft"),
  proposed_by_partner_id: model.text().nullable(),
  published_at: model.dateTime().nullable(),
  admin_notes: model.text().nullable(),
})

export default BookProject
