import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str } from "../../../../lib/earn"
import { round2 } from "../../../../lib/funding"

const roles = (b: any) => ({ is_investor: !!b.is_investor, is_publisher: !!b.is_publisher, is_author: !!b.is_author })

// GET /admin/earn/partners — investors, publishers and authors with their money totals
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const [partners, commitments, dists] = await Promise.all([
    svc.listPartners({}, { order: { created_at: "DESC" }, take: 2000 }),
    svc.listCommitments({}, { take: 20000 }),
    svc.listDistributions({}, { take: 20000 }),
  ])
  res.json({
    partners: partners.map((p) => ({
      ...p,
      capital_received: round2(commitments.filter((c) => c.partner_id === p.id && c.status === "received").reduce((a, c) => a + Number(c.amount), 0)),
      capital_pledged: round2(commitments.filter((c) => c.partner_id === p.id && c.status === "pledged").reduce((a, c) => a + Number(c.amount), 0)),
      owed: round2(dists.filter((d) => d.partner_id === p.id && d.status === "pending").reduce((a, d) => a + Number(d.amount), 0)),
      paid: round2(dists.filter((d) => d.partner_id === p.id && d.status === "paid").reduce((a, d) => a + Number(d.amount), 0)),
    })),
  })
}

// POST /admin/earn/partners { email, full_name, organization?, is_investor?, is_publisher?, is_author? } — invite
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const email = str(b.email, "Email", { required: true, max: 320 })!.toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email looks wrong")
  const r = roles(b)
  if (!r.is_investor && !r.is_publisher && !r.is_author) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose at least one role: investor, publisher or author")
  const svc = earn(req)
  const [existing] = await svc.listPartners({ email })
  if (existing) throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "This email is already invited — edit their roles instead")
  const partner = await svc.createPartners({
    email, ...r,
    full_name: str(b.full_name, "Name", { required: true, max: 200 })!,
    organization: str(b.organization, "Organization", { max: 300 }),
    admin_notes: str(b.admin_notes, "Notes", { max: 5000 }),
    status: "invited",
  })
  res.status(201).json({ partner })
}
