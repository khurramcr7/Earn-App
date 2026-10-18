import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, oneOf } from "../../../../../lib/earn"

// POST /admin/earn/payouts/:id { status: "paid", method, reference } — record that you paid
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const svc = earn(req)
  const current = await svc.retrievePayout(req.params.id)
  const status = oneOf(b.status, ["pending", "paid", "cancelled"] as const, "status")
  if (!status) throw new MedusaError(MedusaError.Types.INVALID_DATA, "status is required")
  const payout = await svc.updatePayouts({
    id: current.id,
    status,
    method: str(b.method, "Method", { max: 100 }) ?? current.method,
    reference: str(b.reference, "Reference", { max: 300 }) ?? current.reference,
    paid_at: status === "paid" ? new Date() : null,
  })
  res.json({ payout })
}
