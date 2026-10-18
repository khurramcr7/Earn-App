import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, oneOf } from "../../../../../lib/earn"

// POST /admin/earn/scholars/:id — pause / re-activate a scholar or edit notes
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const update: Record<string, unknown> = { id: req.params.id }
  if ("status" in b) update.status = oneOf(b.status, ["active", "suspended"] as const, "status")
  if ("full_name" in b) update.full_name = str(b.full_name, "Name", { required: true, max: 200 })
  if ("specialties" in b) update.specialties = str(b.specialties, "Specialties", { max: 1000 })
  if ("admin_notes" in b) update.admin_notes = str(b.admin_notes, "Notes", { max: 5000 })
  const scholar = await earn(req).updateScholars(update as any)
  res.json({ scholar })
}

// DELETE /admin/earn/scholars/:id — withdraw an invitation (only before they sign up)
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const s = await svc.retrieveScholar(req.params.id)
  if (s.status !== "invited") {
    return res.status(400).json({ message: "This scholar has already signed up — pause them instead." })
  }
  await svc.deleteScholars(s.id)
  res.json({ id: s.id, deleted: true })
}
