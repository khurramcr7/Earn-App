import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, num, date } from "../../../../../../lib/earn"

// POST /admin/earn/book-projects/:id/commitments { partner_id, amount, status?: "pledged"|"received", reference?, received_at? }
// Record money an investor sent outside the portal (e.g. a bank transfer agreed by phone).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const book = await svc.retrieveBookProject(req.params.id)
  const investor = await svc.retrievePartner(str(b.partner_id, "Investor", { required: true })!)
  if (!investor.is_investor) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${investor.full_name} does not have the investor role`)
  const status = b.status === "received" ? "received" : "pledged"
  const commitment = await svc.createCommitments({
    book_project_id: book.id, partner_id: investor.id,
    amount: num(b.amount, "Amount", { required: true, min: 1 })!, currency: book.currency, status,
    reference: str(b.reference, "Reference", { max: 300 }),
    received_at: status === "received" ? date(b.received_at, "Received on") || new Date() : null,
    note: str(b.note, "Note", { max: 1000 }),
  })
  res.status(201).json({ commitment })
}
