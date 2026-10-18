import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, currentScholar } from "../../../lib/earn"

const view = (s: any) => ({
  id: s.id, email: s.email, full_name: s.full_name, phone: s.phone, country: s.country,
  specialties: s.specialties, payout_method: s.payout_method, payout_details: s.payout_details, status: s.status,
})

// GET /scholar/me — my profile
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.json({ scholar: view(await currentScholar(req)) })
}

// POST /scholar/me — update my profile & how I want to be paid
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const b = body(req)
  const update: Record<string, unknown> = { id: me.id }
  if ("full_name" in b) update.full_name = str(b.full_name, "Name", { required: true, max: 200 })
  for (const [k, label, max] of [
    ["phone", "Phone", 50], ["country", "Country", 100], ["specialties", "Specialties", 1000],
    ["payout_method", "Payment method", 100], ["payout_details", "Payment details", 1000],
  ] as const) {
    if (k in b) update[k] = str(b[k], label, { max })
  }
  const s = await earn(req).updateScholars(update as any)
  res.json({ scholar: view(s) })
}
