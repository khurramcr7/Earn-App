import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, num, currentScholar } from "../../../../../lib/earn"

// POST /scholar/projects/:id/apply { message, proposed_amount?, proposed_days? }
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const svc = earn(req)
  const project = await svc.retrieveProject(req.params.id)
  if (project.status !== "open") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This project is no longer open")
  const b = body(req)
  const data = {
    message: str(b.message, "Message", { max: 5000 }),
    proposed_amount: num(b.proposed_amount, "Your price", { min: 0 }),
    proposed_days: num(b.proposed_days, "Days needed", { min: 1 }),
  }
  const [existing] = await svc.listApplications({ project_id: project.id, scholar_id: me.id })
  const application = existing
    ? await svc.updateApplications({ id: existing.id, ...data, status: "pending" })
    : await svc.createApplications({ project_id: project.id, scholar_id: me.id, ...data })
  res.json({ application })
}

// DELETE /scholar/projects/:id/apply — withdraw my application
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const svc = earn(req)
  const [existing] = await svc.listApplications({ project_id: req.params.id, scholar_id: me.id, status: "pending" })
  if (existing) await svc.updateApplications({ id: existing.id, status: "withdrawn" })
  res.json({ ok: true })
}
