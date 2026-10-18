import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, oneOf, date } from "../../../../../lib/earn"

// POST /admin/earn/commitments/:id { status: "received"|"refunded"|"cancelled", reference?, received_at? }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const c = await svc.retrieveCommitment(req.params.id)
  const status = oneOf(b.status, ["received", "refunded", "cancelled"] as const, "status")
  if (!status) throw new MedusaError(MedusaError.Types.INVALID_DATA, "status is required")
  const allowed: Record<string, string[]> = { pledged: ["received", "cancelled"], received: ["refunded"], refunded: [], cancelled: [] }
  if (!allowed[c.status].includes(status)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `A ${c.status} commitment cannot become ${status}`)
  const commitment = await svc.updateCommitments({
    id: c.id, status,
    reference: str(b.reference, "Reference", { max: 300 }) ?? c.reference,
    received_at: status === "received" ? date(b.received_at, "Received on") || new Date() : c.received_at,
    note: str(b.note, "Note", { max: 1000 }) ?? c.note,
  })
  res.json({ commitment })
}
