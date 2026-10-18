import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, url, currentScholar } from "../../../../../lib/earn"

// POST /scholar/projects/:id/submit { work_url, note? } — hand in work for review
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const svc = earn(req)
  const project = await svc.retrieveProject(req.params.id)
  if (project.assigned_scholar_id !== me.id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This project is not assigned to you")
  if (project.status !== "assigned") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      project.status === "in_review" ? "Your work is already waiting for review" : `This project is ${project.status}`
    )
  }
  const b = body(req)
  const submission = await svc.createSubmissions({
    project_id: project.id,
    scholar_id: me.id,
    work_url: url(b.work_url, "Link to your work"),
    note: str(b.note, "Note", { max: 5000 }),
  })
  await svc.updateProjects({ id: project.id, status: "in_review" })
  res.json({ submission })
}
