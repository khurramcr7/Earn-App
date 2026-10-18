import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, num, oneOf } from "../../../../lib/earn"
import { bookStats, BOOK_STATUSES, FUNDING_MODELS } from "../../../../lib/funding"

// GET /admin/earn/book-projects?status=fundraising
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const status = oneOf(req.query.status, BOOK_STATUSES, "status")
  const [books, partners] = await Promise.all([
    svc.listBookProjects(status ? { status } : {}, { order: { created_at: "DESC" }, take: 1000 }),
    svc.listPartners({}, { take: 2000, select: ["id", "full_name", "organization"] }),
  ])
  const name = new Map(partners.map((p) => [p.id, p.organization ? `${p.full_name} (${p.organization})` : p.full_name]))
  const stats = await bookStats(svc, books.map((b) => b.id))
  res.json({
    book_projects: books.map((b) => ({
      ...b, stats: stats.get(b.id),
      publisher_name: b.publisher_id ? name.get(b.publisher_id) ?? null : null,
      author_name: b.author_id ? name.get(b.author_id) ?? null : null,
    })),
  })
}

export async function validateBookFields(svc: any, b: any, update: Record<string, unknown>) {
  if ("title" in b) update.title = str(b.title, "Title", { required: true, max: 300 })
  if ("title_ar" in b) update.title_ar = str(b.title_ar, "Arabic title", { max: 300 })
  if ("description" in b) update.description = str(b.description, "Description", { required: true, max: 20000 })
  if ("source_reference" in b) update.source_reference = str(b.source_reference, "Source", { max: 2000 })
  if ("funding_model" in b) update.funding_model = oneOf(b.funding_model, FUNDING_MODELS, "funding_model")
  if ("funding_goal" in b) update.funding_goal = num(b.funding_goal, "Funding goal", { required: true, min: 0 })
  if ("currency" in b) update.currency = (str(b.currency, "Currency", { max: 3 }) || "PKR").toUpperCase()
  for (const [k, label] of [["investor_profit_share_pct", "Investor profit share %"], ["author_royalty_pct", "Author royalty %"]] as const) {
    if (k in b) {
      const v = num(b[k], label, { min: 0 })
      if (v !== null && v > 100) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${label} cannot be more than 100`)
      update[k] = v
    }
  }
  if ("agreement_url" in b) update.agreement_url = str(b.agreement_url, "Agreement link", { max: 2000 })
  if ("status" in b) update.status = oneOf(b.status, BOOK_STATUSES, "status")
  if ("admin_notes" in b) update.admin_notes = str(b.admin_notes, "Notes", { max: 5000 })
  for (const [k, role] of [["publisher_id", "is_publisher"], ["author_id", "is_author"]] as const) {
    if (k in b) {
      const id = str(b[k], k)
      if (id) {
        const p = await svc.retrievePartner(id)
        if (!p[role]) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${p.full_name} does not have the ${role.slice(3)} role`)
      }
      update[k] = id
    }
  }
  if (update.status === "published") update.published_at = new Date()
  return update
}

// POST /admin/earn/book-projects — create a book project
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  for (const k of ["title", "description", "funding_goal"]) if (!(k in b)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${k} is required`)
  const data = await validateBookFields(svc, b, {})
  if (!data.status) data.status = "draft"
  const book = await svc.createBookProjects(data as any)
  res.status(201).json({ book_project: book })
}
