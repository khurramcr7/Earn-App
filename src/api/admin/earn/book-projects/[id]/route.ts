import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body } from "../../../../../lib/earn"
import { bookStats } from "../../../../../lib/funding"
import { validateBookFields } from "../route"

// GET /admin/earn/book-projects/:id — the book with its money, work, sales and payments
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const book = await svc.retrieveBookProject(req.params.id)
  const [commitments, tasks, sales, dists, partners, scholars] = await Promise.all([
    svc.listCommitments({ book_project_id: book.id }, { order: { created_at: "DESC" }, take: 5000 }),
    svc.listProjects({ book_project_id: book.id }, { order: { created_at: "ASC" }, take: 5000 }),
    svc.listSalesReports({ book_project_id: book.id }, { order: { period_end: "DESC" }, take: 5000 }),
    svc.listDistributions({ book_project_id: book.id }, { order: { created_at: "DESC" }, take: 5000 }),
    svc.listPartners({}, { take: 2000 }),
    svc.listScholars({}, { take: 2000, select: ["id", "full_name"] }),
  ])
  const p = new Map(partners.map((x) => [x.id, x]))
  const who = (id: string | null) => {
    const x = id ? p.get(id) : null
    return x ? { id: x.id, full_name: x.full_name, organization: x.organization, payout_method: x.payout_method, payout_details: x.payout_details } : null
  }
  const sch = new Map(scholars.map((s) => [s.id, s.full_name]))
  const stats = (await bookStats(svc, [book.id])).get(book.id)
  res.json({
    book_project: { ...book, publisher: who(book.publisher_id), author: who(book.author_id) },
    stats,
    commitments: commitments.map((c) => ({ ...c, investor: who(c.partner_id) })),
    tasks: tasks.map((t) => ({ ...t, assigned_scholar_name: t.assigned_scholar_id ? sch.get(t.assigned_scholar_id) ?? null : null })),
    sales_reports: sales.map((s) => ({ ...s, submitted_by: who(s.submitted_by_partner_id) })),
    distributions: dists.map((d) => ({ ...d, partner: who(d.partner_id) })),
  })
}

// POST /admin/earn/book-projects/:id — edit terms, people or status
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const update = await validateBookFields(svc, body(req), { id: req.params.id })
  const book = await svc.updateBookProjects(update as any)
  res.json({ book_project: book })
}
