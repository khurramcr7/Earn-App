import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, num } from "../../../lib/earn"
import { currentPartner, requireRole } from "../../../lib/funding"

// POST /partner/book-projects — a publisher proposes a book; Aalim Books sets the terms and opens funding
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  requireRole(me, "publisher")
  const b = body(req)
  const book = await earn(req).createBookProjects({
    title: str(b.title, "Title", { required: true, max: 300 })!,
    title_ar: str(b.title_ar, "Arabic title", { max: 300 }),
    description: str(b.description, "Description", { required: true, max: 20000 })!,
    source_reference: str(b.source_reference, "Source", { max: 2000 }),
    funding_goal: num(b.funding_goal, "Budget needed", { required: true, min: 0 })!,
    currency: (str(b.currency, "Currency", { max: 3 }) || "PKR").toUpperCase(),
    funding_model: b.funding_model === "sponsorship" ? "sponsorship" : "profit_share",
    status: "proposed", publisher_id: me.id, proposed_by_partner_id: me.id,
  })
  res.status(201).json({ book_project: book })
}
