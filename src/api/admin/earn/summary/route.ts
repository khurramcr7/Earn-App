import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn } from "../../../../lib/earn"

// GET /admin/earn/summary — numbers for the dashboard header
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const [projects, scholars, payouts, apps, subs] = await Promise.all([
    svc.listProjects({}, { take: 10000, select: ["id", "status"] }),
    svc.listScholars({}, { take: 10000, select: ["id", "status"] }),
    svc.listPayouts({}, { take: 10000 }),
    svc.listApplications({ status: "pending" }, { take: 10000, select: ["id"] }),
    svc.listSubmissions({ status: "submitted" }, { take: 10000, select: ["id"] }),
  ])
  const sumBy = (status: string) =>
    payouts.filter((p) => p.status === status).reduce((acc: Record<string, number>, p) => {
      acc[p.currency] = (acc[p.currency] || 0) + Number(p.amount)
      return acc
    }, {})
  res.json({
    open_projects: projects.filter((p) => p.status === "open").length,
    active_projects: projects.filter((p) => ["assigned", "in_review"].includes(p.status)).length,
    completed_projects: projects.filter((p) => p.status === "completed").length,
    active_scholars: scholars.filter((s) => s.status === "active").length,
    invited_scholars: scholars.filter((s) => s.status === "invited").length,
    pending_applications: apps.length,
    waiting_reviews: subs.length,
    owed: sumBy("pending"),
    paid: sumBy("paid"),
  })
}
