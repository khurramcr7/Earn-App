import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, oneOf } from "../../../../lib/earn"

// GET /admin/earn/distributions?status=pending — royalties and profit shares to pay
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const status = oneOf(req.query.status, ["pending", "paid", "cancelled"] as const, "status")
  const [dists, partners, books] = await Promise.all([
    svc.listDistributions(status ? { status } : {}, { order: { created_at: "DESC" }, take: 5000 }),
    svc.listPartners({}, { take: 2000 }),
    svc.listBookProjects({}, { take: 2000, select: ["id", "title"] }),
  ])
  const p = new Map(partners.map((x) => [x.id, x]))
  const t = new Map(books.map((x) => [x.id, x.title]))
  res.json({
    distributions: dists.map((d) => {
      const x = p.get(d.partner_id)
      return { ...d, book_title: t.get(d.book_project_id) ?? null,
        partner: x ? { id: x.id, full_name: x.full_name, payout_method: x.payout_method, payout_details: x.payout_details } : null }
    }),
  })
}
