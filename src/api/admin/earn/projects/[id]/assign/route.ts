import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str } from "../../../../../../lib/earn"

// POST /admin/earn/projects/:id/assign { scholar_id } — give the project to one scholar
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const scholarId = str(body(req).scholar_id, "scholar_id", { required: true })!
  const project = await svc.retrieveProject(req.params.id)
  if (["completed", "cancelled"].includes(project.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `This project is ${project.status}`)
  }
  const scholar = await svc.retrieveScholar(scholarId)
  if (scholar.status !== "active") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only active scholars (who have signed up) can be assigned")
  }
  const apps = await svc.listApplications({ project_id: project.id })
  const updates = apps
    .filter((a) => a.status === "pending" || a.status === "accepted")
    .map((a) => ({ id: a.id, status: a.scholar_id === scholarId ? "accepted" : "rejected" }))
  if (updates.length) await svc.updateApplications(updates as any)
  const updated = await svc.updateProjects({ id: project.id, status: "assigned", assigned_scholar_id: scholarId })
  res.json({ project: updated })
}
