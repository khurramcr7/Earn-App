import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, num, oneOf, date, PROJECT_CATEGORIES, PROJECT_STATUSES } from "../../../../../lib/earn"

// GET /admin/earn/projects/:id — project with applications, submissions and payouts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const project = await svc.retrieveProject(req.params.id)
  const [applications, submissions, payouts, scholars] = await Promise.all([
    svc.listApplications({ project_id: project.id }, { order: { created_at: "DESC" } }),
    svc.listSubmissions({ project_id: project.id }, { order: { created_at: "DESC" } }),
    svc.listPayouts({ project_id: project.id }, { order: { created_at: "DESC" } }),
    svc.listScholars({}, { take: 1000 }),
  ])
  const byId = new Map(scholars.map((s) => [s.id, s]))
  const who = (id: string) => {
    const s = byId.get(id)
    return s ? { id: s.id, full_name: s.full_name, email: s.email, specialties: s.specialties } : null
  }
  res.json({
    project: { ...project, assigned_scholar: project.assigned_scholar_id ? who(project.assigned_scholar_id) : null },
    applications: applications.map((a) => ({ ...a, scholar: who(a.scholar_id) })),
    submissions: submissions.map((s) => ({ ...s, scholar: who(s.scholar_id) })),
    payouts,
  })
}

// POST /admin/earn/projects/:id — edit a project (any field), e.g. reopen or cancel
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const update: Record<string, unknown> = { id: req.params.id }
  if ("title" in b) update.title = str(b.title, "Title", { required: true, max: 300 })
  if ("description" in b) update.description = str(b.description, "Description", { required: true, max: 20000 })
  if ("category" in b) update.category = oneOf(b.category, PROJECT_CATEGORIES, "category")
  if ("source_reference" in b) update.source_reference = str(b.source_reference, "Source", { max: 2000 })
  if ("word_count" in b) update.word_count = num(b.word_count, "Word count", { min: 0 })
  if ("budget" in b) update.budget = num(b.budget, "Budget", { required: true, min: 0 })
  if ("currency" in b) update.currency = (str(b.currency, "Currency", { max: 3 }) || "PKR").toUpperCase()
  if ("deadline" in b) update.deadline = date(b.deadline, "Deadline")
  if ("status" in b) update.status = oneOf(b.status, PROJECT_STATUSES, "status")
  if ("book_project_id" in b) update.book_project_id = str(b.book_project_id, "Book project", { max: 100 })
  if (update.status === "open") update.assigned_scholar_id = null
  const project = await earn(req).updateProjects(update as any)
  res.json({ project })
}

// DELETE /admin/earn/projects/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await earn(req).deleteProjects(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
