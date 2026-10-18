import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, body, str, num, oneOf, date, PROJECT_CATEGORIES, PROJECT_STATUSES } from "../../../../lib/earn"

// GET /admin/earn/projects?status=open — every project with application & submission counts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const status = oneOf(req.query.status, PROJECT_STATUSES, "status")
  const projects = await svc.listProjects(status ? { status } : {}, { order: { created_at: "DESC" }, take: 500 })
  const ids = projects.map((p) => p.id)
  const [apps, subs, scholars] = await Promise.all([
    ids.length ? svc.listApplications({ project_id: ids }, { take: 10000 }) : Promise.resolve([] as Awaited<ReturnType<typeof svc.listApplications>>),
    ids.length ? svc.listSubmissions({ project_id: ids }, { take: 10000 }) : Promise.resolve([] as Awaited<ReturnType<typeof svc.listSubmissions>>),
    svc.listScholars({}, { take: 1000 }),
  ])
  const nameOf = new Map(scholars.map((s) => [s.id, s.full_name]))
  res.json({
    projects: projects.map((p) => ({
      ...p,
      assigned_scholar_name: p.assigned_scholar_id ? nameOf.get(p.assigned_scholar_id) ?? null : null,
      applications_count: apps.filter((a) => a.project_id === p.id && a.status === "pending").length,
      submissions_waiting: subs.filter((s) => s.project_id === p.id && s.status === "submitted").length,
    })),
  })
}

// POST /admin/earn/projects — post a new project
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = body(req)
  const project = await earn(req).createProjects({
    title: str(b.title, "Title", { required: true, max: 300 })!,
    description: str(b.description, "Description", { required: true, max: 20000 })!,
    category: oneOf(b.category, PROJECT_CATEGORIES, "category") ?? "translation",
    source_reference: str(b.source_reference, "Source", { max: 2000 }),
    word_count: num(b.word_count, "Word count", { min: 0 }),
    budget: num(b.budget, "Budget", { required: true, min: 0 })!,
    currency: (str(b.currency, "Currency", { max: 3 }) || "PKR").toUpperCase(),
    deadline: date(b.deadline, "Deadline"),
    status: oneOf(b.status, ["draft", "open"] as const, "status") ?? "open",
    book_project_id: str(b.book_project_id, "Book project", { max: 100 }),
  })
  res.status(201).json({ project })
}
