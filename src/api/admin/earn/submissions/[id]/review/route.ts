import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { earn, body, str, num, oneOf } from "../../../../../../lib/earn"

/**
 * POST /admin/earn/submissions/:id/review
 *   { action: "approve", amount?, feedback? } → work approved, project completed, payment created (pending)
 *   { action: "changes", feedback }           → scholar asked to revise; project back to "assigned"
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const action = oneOf(b.action, ["approve", "changes"] as const, "action")
  if (!action) throw new MedusaError(MedusaError.Types.INVALID_DATA, "action is required")
  const feedback = str(b.feedback, "Feedback", { max: 10000 })
  const submission = await svc.retrieveSubmission(req.params.id)
  if (submission.status !== "submitted") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This submission has already been reviewed")
  }
  const project = await svc.retrieveProject(submission.project_id)

  if (action === "changes") {
    if (!feedback) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please write what needs to change")
    await svc.updateSubmissions({ id: submission.id, status: "changes_requested", feedback })
    await svc.updateProjects({ id: project.id, status: "assigned" })
    return res.json({ ok: true, status: "changes_requested" })
  }

  // Approve: amount = override, else the accepted application's price, else the project budget
  const [accepted] = await svc.listApplications({ project_id: project.id, scholar_id: submission.scholar_id, status: "accepted" })
  const amount = num(b.amount, "Amount", { min: 0 }) ?? accepted?.proposed_amount ?? project.budget
  await svc.updateSubmissions({ id: submission.id, status: "approved", feedback })
  await svc.updateProjects({ id: project.id, status: "completed" })
  const payout = await svc.createPayouts({
    scholar_id: submission.scholar_id,
    project_id: project.id,
    amount,
    currency: project.currency,
    status: "pending",
    note: `For: ${project.title}`,
  })
  res.json({ ok: true, status: "approved", payout })
}
