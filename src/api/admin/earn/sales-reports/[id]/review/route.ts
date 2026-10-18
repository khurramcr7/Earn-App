import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str } from "../../../../../../lib/earn"
import { approveSalesReport } from "../../../../../../lib/funding"

/**
 * POST /admin/earn/sales-reports/:id/review
 *   { action: "approve", feedback? } → royalty + profit-share payments created (pending)
 *   { action: "reject", feedback }   → publisher sees why
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const feedback = str(b.feedback, "Feedback", { max: 5000 })
  if (b.action === "approve") return res.json(await approveSalesReport(svc, req.params.id, feedback))
  if (b.action === "reject") {
    if (!feedback) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Tell the publisher what is wrong")
    const r = await svc.retrieveSalesReport(req.params.id)
    if (r.status !== "submitted") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This sales report has already been decided")
    return res.json({ report: await svc.updateSalesReports({ id: r.id, status: "rejected", admin_feedback: feedback }) })
  }
  throw new MedusaError(MedusaError.Types.INVALID_DATA, "action must be approve or reject")
}
