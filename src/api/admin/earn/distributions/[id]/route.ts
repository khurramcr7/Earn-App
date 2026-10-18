import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, oneOf } from "../../../../../lib/earn"

// POST /admin/earn/distributions/:id { status: "paid"|"cancelled", method?, reference? }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const d = await svc.retrieveDistribution(req.params.id)
  if (d.status !== "pending") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `This payment is already ${d.status}`)
  const status = oneOf(b.status, ["paid", "cancelled"] as const, "status")
  if (!status) throw new MedusaError(MedusaError.Types.INVALID_DATA, "status is required")
  const distribution = await svc.updateDistributions({
    id: d.id, status,
    method: str(b.method, "Method", { max: 100 }), reference: str(b.reference, "Transaction ID", { max: 300 }),
    paid_at: status === "paid" ? new Date() : null,
  })
  res.json({ distribution })
}
