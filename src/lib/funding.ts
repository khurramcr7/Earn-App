import { MedusaError } from "@medusajs/framework/utils"
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { earn } from "./earn"
import type EarnModuleService from "../modules/earn/service"

export const BOOK_STATUSES = ["proposed", "draft", "fundraising", "funded", "in_production", "published", "closed", "cancelled"] as const
export const FUNDING_MODELS = ["profit_share", "sponsorship"] as const

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * How one approved sales period is shared out.
 *  1. Author royalty = revenue × royalty %            (only if the book has an author and a royalty %)
 *  2. Net profit     = revenue − costs − royalty
 *  3. Profit-share books, net profit > 0:
 *       investor pool = net profit × investor share %
 *       each investor gets pool × (their capital received ÷ all capital received)
 *     The rest of the profit stays with Aalim Books as managing partner (muḍārib).
 *  4. Net profit ≤ 0: nothing is paid to investors for this period; the loss is recorded (it falls on capital).
 *  5. Sponsorship books: no investor payments.
 * Amounts are rounded to 2 decimals; any rounding remainder goes to the largest investor so the pool adds up exactly.
 */
export function calculateSplit(input: {
  revenue: number
  costs: number
  royalty_pct: number | null
  has_author: boolean
  funding_model: "profit_share" | "sponsorship"
  investor_share_pct: number | null
  capital: { partner_id: string; amount: number }[]
}) {
  const royalty = input.has_author && input.royalty_pct ? round2((input.revenue * input.royalty_pct) / 100) : 0
  const net = round2(input.revenue - input.costs - royalty)
  const byInvestor = new Map<string, number>()
  for (const c of input.capital) byInvestor.set(c.partner_id, (byInvestor.get(c.partner_id) || 0) + c.amount)
  const totalCapital = round2([...byInvestor.values()].reduce((a, b) => a + b, 0))
  const pool =
    input.funding_model === "profit_share" && net > 0 && input.investor_share_pct && totalCapital > 0
      ? round2((net * input.investor_share_pct) / 100)
      : 0
  let investors = [...byInvestor.entries()].map(([partner_id, capital]) => ({
    partner_id,
    capital: round2(capital),
    share_of_capital: totalCapital ? capital / totalCapital : 0,
    amount: totalCapital ? round2((pool * capital) / totalCapital) : 0,
  }))
  const diff = round2(pool - investors.reduce((a, i) => a + i.amount, 0))
  if (diff !== 0 && investors.length) {
    const top = investors.reduce((a, b) => (b.capital > a.capital ? b : a))
    top.amount = round2(top.amount + diff)
  }
  investors = investors.filter((i) => i.amount > 0 || pool === 0)
  return {
    revenue: round2(input.revenue),
    costs: round2(input.costs),
    author_royalty: royalty,
    net_profit: net,
    investor_pool: pool,
    managing_partner_share: net > 0 ? round2(net - pool) : 0,
    loss: net < 0 ? round2(-net) : 0,
    total_capital: totalCapital,
    investors,
  }
}

const sumBy = <T>(list: T[], f: (x: T) => number) => round2(list.reduce((a, x) => a + (Number(f(x)) || 0), 0))

/** Everything needed to show one book's progress: money in, work done, money out, sales. */
export async function bookStats(svc: EarnModuleService, bookIds: string[]) {
  if (!bookIds.length) return new Map<string, any>()
  const [commitments, tasks, sales, dists] = await Promise.all([
    svc.listCommitments({ book_project_id: bookIds }, { take: 20000 }),
    svc.listProjects({ book_project_id: bookIds }, { take: 20000 }),
    svc.listSalesReports({ book_project_id: bookIds }, { take: 20000, order: { period_end: "DESC" } }),
    svc.listDistributions({ book_project_id: bookIds }, { take: 20000 }),
  ])
  const taskIds = tasks.map((t) => t.id)
  const payouts = taskIds.length ? await svc.listPayouts({ project_id: taskIds }, { take: 20000 }) : []
  const out = new Map<string, any>()
  for (const id of bookIds) {
    const c = commitments.filter((x) => x.book_project_id === id)
    const t = tasks.filter((x) => x.book_project_id === id)
    const tIds = new Set(t.map((x) => x.id))
    const p = payouts.filter((x) => x.project_id && tIds.has(x.project_id))
    const s = sales.filter((x) => x.book_project_id === id)
    const sa = s.filter((x) => x.status === "approved")
    const d = dists.filter((x) => x.book_project_id === id)
    const stages: Record<string, { total: number; completed: number; in_progress: number }> = {}
    for (const task of t) {
      if (task.status === "cancelled") continue
      const st = (stages[task.category] ||= { total: 0, completed: 0, in_progress: 0 })
      st.total++
      if (task.status === "completed") st.completed++
      else if (["assigned", "in_review"].includes(task.status)) st.in_progress++
    }
    out.set(id, {
      raised: sumBy(c.filter((x) => x.status === "received"), (x) => x.amount),
      pledged: sumBy(c.filter((x) => x.status === "pledged"), (x) => x.amount),
      investors: new Set(c.filter((x) => ["received", "pledged"].includes(x.status)).map((x) => x.partner_id)).size,
      spent_paid: sumBy(p.filter((x) => x.status === "paid"), (x) => x.amount),
      spent_owed: sumBy(p.filter((x) => x.status === "pending"), (x) => x.amount),
      tasks_total: t.filter((x) => x.status !== "cancelled").length,
      tasks_completed: t.filter((x) => x.status === "completed").length,
      words_translated: sumBy(t.filter((x) => x.status === "completed" && x.category === "translation"), (x) => x.word_count || 0),
      stages,
      units_sold: sumBy(sa, (x) => x.units_sold),
      revenue: sumBy(sa, (x) => x.revenue),
      costs: sumBy(sa, (x) => x.costs),
      net_profit: sumBy(sa, (x) => x.net_profit ?? 0),
      sales_waiting: s.filter((x) => x.status === "submitted").length,
      royalties_paid: sumBy(d.filter((x) => x.kind === "author_royalty" && x.status === "paid"), (x) => x.amount),
      royalties_owed: sumBy(d.filter((x) => x.kind === "author_royalty" && x.status === "pending"), (x) => x.amount),
      profit_paid: sumBy(d.filter((x) => x.kind === "investor_profit" && x.status === "paid"), (x) => x.amount),
      profit_owed: sumBy(d.filter((x) => x.kind === "investor_profit" && x.status === "pending"), (x) => x.amount),
    })
  }
  return out
}

/** Approve a sales report: work out the split and create the payments owed. */
export async function approveSalesReport(svc: EarnModuleService, reportId: string, feedback: string | null) {
  const report = await svc.retrieveSalesReport(reportId)
  if (report.status !== "submitted") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This sales report has already been decided")
  const book = await svc.retrieveBookProject(report.book_project_id)
  const capital = await svc.listCommitments({ book_project_id: book.id, status: "received" }, { take: 20000 })
  const calc = calculateSplit({
    revenue: Number(report.revenue),
    costs: Number(report.costs || 0),
    royalty_pct: book.author_royalty_pct,
    has_author: !!book.author_id,
    funding_model: book.funding_model as any,
    investor_share_pct: book.investor_profit_share_pct,
    capital: capital.map((c) => ({ partner_id: c.partner_id, amount: Number(c.amount) })),
  })
  const period = `${new Date(report.period_start).toISOString().slice(0, 10)} – ${new Date(report.period_end).toISOString().slice(0, 10)}`
  const toCreate: any[] = []
  if (calc.author_royalty > 0 && book.author_id) {
    toCreate.push({ book_project_id: book.id, sales_report_id: report.id, partner_id: book.author_id, kind: "author_royalty",
      amount: calc.author_royalty, currency: book.currency, status: "pending",
      note: `Royalty ${book.author_royalty_pct}% of revenue, ${period}` })
  }
  for (const inv of calc.investors) {
    if (inv.amount <= 0) continue
    toCreate.push({ book_project_id: book.id, sales_report_id: report.id, partner_id: inv.partner_id, kind: "investor_profit",
      amount: inv.amount, currency: book.currency, status: "pending",
      note: `Profit share ${book.investor_profit_share_pct}% of net profit × ${(inv.share_of_capital * 100).toFixed(2)}% of capital, ${period}` })
  }
  if (toCreate.length) await svc.createDistributions(toCreate)
  const updated = await svc.updateSalesReports({ id: report.id, status: "approved", admin_feedback: feedback, net_profit: calc.net_profit, calculation: calc as any })
  return { report: updated, calculation: calc, created: toCreate.length }
}

/** The active partner behind a logged-in /partners session. */
export async function currentPartner(req: AuthenticatedMedusaRequest) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Please sign in")
  const [partner] = await earn(req).listPartners({ customer_id: customerId })
  if (!partner) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This account is not linked to a partner invitation")
  if (partner.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your account is paused. Please contact Aalim Books.")
  return partner
}

export function requireRole(p: any, role: "investor" | "publisher" | "author") {
  if (!p[`is_${role}`]) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Your account does not have the ${role} role`)
}

/** Book fields any partner may see (no admin notes). */
export function publicBook(b: any) {
  return {
    id: b.id, title: b.title, title_ar: b.title_ar, description: b.description, source_reference: b.source_reference,
    funding_model: b.funding_model, funding_goal: b.funding_goal, currency: b.currency,
    investor_profit_share_pct: b.investor_profit_share_pct, author_royalty_pct: b.author_royalty_pct,
    agreement_url: b.agreement_url, status: b.status, published_at: b.published_at, created_at: b.created_at,
  }
}
