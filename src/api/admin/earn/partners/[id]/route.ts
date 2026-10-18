import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, oneOf } from "../../../../../lib/earn"

// POST /admin/earn/partners/:id — change roles, status or notes
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const update: Record<string, unknown> = { id: req.params.id }
  for (const k of ["is_investor", "is_publisher", "is_author"] as const) if (k in b) update[k] = !!b[k]
  if ("status" in b) update.status = oneOf(b.status, ["active", "suspended"] as const, "status")
  if ("organization" in b) update.organization = str(b.organization, "Organization", { max: 300 })
  if ("admin_notes" in b) update.admin_notes = str(b.admin_notes, "Notes", { max: 5000 })
  const partner = await earn(req).updatePartners(update as any)
  res.json({ partner })
}

// DELETE /admin/earn/partners/:id — withdraw an invitation (only before they sign up)
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const p = await svc.retrievePartner(req.params.id)
  if (p.status !== "invited") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This partner already has an account — pause them instead")
  await svc.deletePartners(p.id)
  res.json({ id: p.id, deleted: true })
}
