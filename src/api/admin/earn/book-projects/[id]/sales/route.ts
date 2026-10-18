import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, num, date } from "../../../../../../lib/earn"
import { MedusaError } from "@medusajs/framework/utils"
import { approveSalesReport } from "../../../../../../lib/funding"

// POST /admin/earn/book-projects/:id/sales { period_start, period_end, units_sold, revenue, costs?, note?, approve? }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const book = await svc.retrieveBookProject(req.params.id)
  const start = date(b.period_start, "Period start"), end = date(b.period_end, "Period end")
  if (!start || !end || end < start) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Give a period start and an end after it")
  const report = await svc.createSalesReports({
    book_project_id: book.id, period_start: start, period_end: end,
    units_sold: num(b.units_sold, "Copies sold", { min: 0 }) ?? 0,
    revenue: num(b.revenue, "Revenue", { required: true, min: 0 })!,
    costs: num(b.costs, "Costs", { min: 0 }) ?? 0,
    currency: book.currency, note: str(b.note, "Note", { max: 2000 }), status: "submitted",
  })
  if (b.approve) {
    const r = await approveSalesReport(svc, report.id, null)
    return res.status(201).json({ sales_report: r.report, calculation: r.calculation })
  }
  res.status(201).json({ sales_report: report })
}
