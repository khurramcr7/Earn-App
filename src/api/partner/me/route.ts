import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str } from "../../../lib/earn"
import { currentPartner } from "../../../lib/funding"

const view = (p: any) => ({
  id: p.id, email: p.email, full_name: p.full_name, organization: p.organization, phone: p.phone, country: p.country,
  is_investor: p.is_investor, is_publisher: p.is_publisher, is_author: p.is_author,
  payout_method: p.payout_method, payout_details: p.payout_details, status: p.status,
})

// GET /partner/me
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.json({ partner: view(await currentPartner(req)) })
}

// POST /partner/me — update profile and how I want to be paid
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  const b = body(req)
  const update: Record<string, unknown> = { id: me.id }
  if ("full_name" in b) update.full_name = str(b.full_name, "Name", { required: true, max: 200 })
  for (const [k, label, max] of [["organization", "Organization", 300], ["phone", "Phone", 50], ["country", "Country", 100],
    ["payout_method", "Payment method", 100], ["payout_details", "Payment details", 1000]] as const) {
    if (k in b) update[k] = str(b[k], label, { max })
  }
  res.json({ partner: view(await earn(req).updatePartners(update as any)) })
}
