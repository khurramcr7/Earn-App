import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, num, date } from "../../../../../lib/earn"
import { currentPartner, requireRole } from "../../../../../lib/funding"

// POST /partner/book-projects/:id/sales — the book's publisher reports sales for a period (Aalim Books approves)
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  requireRole(me, "publisher")
  const svc = earn(req)
  const b = body(req)
  const book = await svc.retrieveBookProject(req.params.id)
  if (book.publisher_id !== me.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Book not found")
  if (!["published", "closed"].includes(book.status)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Sales can be reported once the book is published")
  const start = date(b.period_start, "Period start"), end = date(b.period_end, "Period end")
  if (!start || !end || end < start) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Give a period start and an end after it")
  const report = await svc.createSalesReports({
    book_project_id: book.id, period_start: start, period_end: end,
    units_sold: num(b.units_sold, "Copies sold", { min: 0 }) ?? 0,
    revenue: num(b.revenue, "Revenue", { required: true, min: 0 })!,
    costs: num(b.costs, "Costs", { min: 0 }) ?? 0,
    currency: book.currency, note: str(b.note, "Note", { max: 2000 }),
    status: "submitted", submitted_by_partner_id: me.id,
  })
  res.status(201).json({ sales_report: report })
}
