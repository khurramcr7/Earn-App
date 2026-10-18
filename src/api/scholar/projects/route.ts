import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, currentScholar, publicProject } from "../../../lib/earn"

// GET /scholar/projects — open projects + my own projects, with my application/submission status
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const svc = earn(req)
  const [open, mine, myApps, mySubs] = await Promise.all([
    svc.listProjects({ status: "open" }, { order: { created_at: "DESC" }, take: 500 }),
    svc.listProjects({ assigned_scholar_id: me.id }, { order: { updated_at: "DESC" }, take: 500 }),
    svc.listApplications({ scholar_id: me.id }, { take: 2000 }),
    svc.listSubmissions({ scholar_id: me.id }, { order: { created_at: "DESC" }, take: 2000 }),
  ])
  const decorate = (p: any) => {
    const app = myApps.find((a) => a.project_id === p.id)
    const subs = mySubs.filter((s) => s.project_id === p.id)
    return {
      ...publicProject(p),
      assigned_to_me: p.assigned_scholar_id === me.id,
      my_application: app ? { status: app.status, proposed_amount: app.proposed_amount, message: app.message } : null,
      my_submissions: subs.map((s) => ({ id: s.id, status: s.status, work_url: s.work_url, note: s.note, feedback: s.feedback, created_at: s.created_at })),
    }
  }
  res.json({ open: open.map(decorate), mine: mine.map(decorate) })
}
