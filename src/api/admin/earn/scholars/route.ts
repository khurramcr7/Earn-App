import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str } from "../../../../lib/earn"

const byCurrency = (list: { amount: unknown; currency: string }[]) =>
  list.reduce((acc: Record<string, number>, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + Number(p.amount)
    return acc
  }, {})

// GET /admin/earn/scholars — all scholars with what they have earned
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const [scholars, payouts] = await Promise.all([
    svc.listScholars({}, { order: { created_at: "DESC" }, take: 1000 }),
    svc.listPayouts({}, { take: 10000 }),
  ])
  res.json({
    scholars: scholars.map((s) => {
      const mine = payouts.filter((p) => p.scholar_id === s.id)
      return {
        ...s,
        total_paid: byCurrency(mine.filter((p) => p.status === "paid")),
        total_owed: byCurrency(mine.filter((p) => p.status === "pending")),
      }
    }),
  })
}

// POST /admin/earn/scholars { email, full_name, specialties? } — invite a scholar
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const email = str(b.email, "Email", { required: true, max: 320 })!.toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email looks wrong")
  const svc = earn(req)
  const [existing] = await svc.listScholars({ email })
  if (existing) throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "This email is already invited")
  const scholar = await svc.createScholars({
    email,
    full_name: str(b.full_name, "Name", { required: true, max: 200 })!,
    specialties: str(b.specialties, "Specialties", { max: 1000 }),
    admin_notes: str(b.admin_notes, "Notes", { max: 5000 }),
    status: "invited",
  })
  res.status(201).json({ scholar })
}
