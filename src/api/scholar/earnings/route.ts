import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn, currentScholar } from "../../../lib/earn"

// GET /scholar/earnings — what I have been paid and what is still owed
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentScholar(req)
  const svc = earn(req)
  const payouts = await svc.listPayouts({ scholar_id: me.id }, { order: { created_at: "DESC" }, take: 2000 })
  const projectIds = [...new Set(payouts.map((p) => p.project_id).filter(Boolean))] as string[]
  const projects = projectIds.length ? await svc.listProjects({ id: projectIds }, { select: ["id", "title"] }) : []
  const title = new Map(projects.map((p) => [p.id, p.title]))
  const total = (status: string) =>
    payouts.filter((p) => p.status === status).reduce((acc: Record<string, number>, p) => {
      acc[p.currency] = (acc[p.currency] || 0) + Number(p.amount)
      return acc
    }, {})
  res.json({
    paid: total("paid"),
    owed: total("pending"),
    payouts: payouts.map((p) => ({
      id: p.id, amount: p.amount, currency: p.currency, status: p.status, method: p.method,
      reference: p.reference, paid_at: p.paid_at, note: p.note, created_at: p.created_at,
      project_title: p.project_id ? title.get(p.project_id) ?? null : null,
    })),
  })
}
