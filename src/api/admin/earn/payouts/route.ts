import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, num, oneOf } from "../../../../lib/earn"

// GET /admin/earn/payouts?status=pending
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const status = oneOf(req.query.status, ["pending", "paid", "cancelled"] as const, "status")
  const [payouts, scholars] = await Promise.all([
    svc.listPayouts(status ? { status } : {}, { order: { created_at: "DESC" }, take: 2000 }),
    svc.listScholars({}, { take: 1000 }),
  ])
  const byId = new Map(scholars.map((s) => [s.id, s]))
  res.json({
    payouts: payouts.map((p) => {
      const s = byId.get(p.scholar_id)
      return {
        ...p,
        scholar: s ? { id: s.id, full_name: s.full_name, payout_method: s.payout_method, payout_details: s.payout_details } : null,
      }
    }),
  })
}

// POST /admin/earn/payouts { scholar_id, amount, currency?, note? } — bonus or manual payment
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const svc = earn(req)
  const scholar = await svc.retrieveScholar(str(b.scholar_id, "scholar_id", { required: true })!)
  const payout = await svc.createPayouts({
    scholar_id: scholar.id,
    amount: num(b.amount, "Amount", { required: true, min: 0 })!,
    currency: (str(b.currency, "Currency", { max: 3 }) || "PKR").toUpperCase(),
    note: str(b.note, "Note", { max: 1000 }),
    status: "pending",
  })
  res.status(201).json({ payout })
}
