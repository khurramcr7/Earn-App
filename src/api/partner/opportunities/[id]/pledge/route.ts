import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, num, str } from "../../../../../lib/earn"
import { bookStats, currentPartner, requireRole, round2 } from "../../../../../lib/funding"

// POST /partner/opportunities/:id/pledge { amount, note? } — commit money to a book that is raising funds.
// It counts as capital only after Aalim Books receives it and marks it received.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  requireRole(me, "investor")
  const svc = earn(req)
  const b = body(req)
  const book = await svc.retrieveBookProject(req.params.id)
  if (book.status !== "fundraising") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This book is not raising funds at the moment")
  if (b.accept_terms !== true) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please confirm you have read the terms")
  const amount = num(b.amount, "Amount", { required: true, min: 1 })!
  // Stop at the goal: pledges may not go beyond what the book still needs
  const stats = (await bookStats(svc, [book.id])).get(book.id)
  const remaining = round2(Number(book.funding_goal) - stats.raised - stats.pledged)
  if (amount > remaining) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
      remaining > 0 ? `This book only needs ${book.currency} ${remaining.toLocaleString("en-US")} more` : "This book is fully pledged")
  }
  const commitment = await svc.createCommitments({
    book_project_id: book.id, partner_id: me.id,
    amount, currency: book.currency,
    status: "pledged", note: str(b.note, "Note", { max: 1000 }),
  })
  res.status(201).json({ commitment })
}

// DELETE /partner/opportunities/:id/pledge?commitment_id=… — cancel my pledge before money is sent
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  const svc = earn(req)
  const c = await svc.retrieveCommitment(String(req.query.commitment_id || ""))
  if (c.partner_id !== me.id || c.book_project_id !== req.params.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Pledge not found")
  if (c.status !== "pledged") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Money already received — contact Aalim Books")
  res.json({ commitment: await svc.updateCommitments({ id: c.id, status: "cancelled" }) })
}
