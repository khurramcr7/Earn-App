import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { earn } from "../../../lib/earn"
import { bookStats, currentPartner, publicBook, round2 } from "../../../lib/funding"

const sum = (l: any[]) => round2(l.reduce((a, x) => a + Number(x.amount), 0))
const dist = (d: any, title: Map<string, string>) => ({
  id: d.id, kind: d.kind, amount: d.amount, currency: d.currency, status: d.status, paid_at: d.paid_at,
  reference: d.reference, note: d.note, created_at: d.created_at, book_title: title.get(d.book_project_id) ?? null,
})

/**
 * GET /partner/dashboard — everything for my roles in one call.
 * Investors never see other investors' names; publishers and authors see totals only.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const me = await currentPartner(req)
  const svc = earn(req)
  const out: Record<string, any> = {}
  const [allBooks, myCommitments, myDists] = await Promise.all([
    svc.listBookProjects({}, { take: 2000, order: { created_at: "DESC" } }),
    svc.listCommitments({ partner_id: me.id }, { take: 5000, order: { created_at: "DESC" } }),
    svc.listDistributions({ partner_id: me.id }, { take: 5000, order: { created_at: "DESC" } }),
  ])
  const title = new Map(allBooks.map((b) => [b.id, b.title]))

  if (me.is_investor) {
    const open = allBooks.filter((b) => b.status === "fundraising")
    const mineIds = [...new Set(myCommitments.filter((c) => c.status !== "cancelled").map((c) => c.book_project_id))]
    const stats = await bookStats(svc, [...new Set([...open.map((b) => b.id), ...mineIds])])
    const received = myCommitments.filter((c) => c.status === "received")
    out.investor = {
      totals: {
        capital_received: sum(received),
        pledged: sum(myCommitments.filter((c) => c.status === "pledged")),
        returns_paid: sum(myDists.filter((d) => d.kind === "investor_profit" && d.status === "paid")),
        returns_owed: sum(myDists.filter((d) => d.kind === "investor_profit" && d.status === "pending")),
        books_backed: mineIds.length,
      },
      opportunities: open.map((b) => ({ ...publicBook(b), stats: stats.get(b.id),
        my_pledges: myCommitments.filter((c) => c.book_project_id === b.id && c.status === "pledged").map((c) => ({ id: c.id, amount: c.amount, created_at: c.created_at })) })),
      portfolio: mineIds.map((id) => {
        const b = allBooks.find((x) => x.id === id)!
        const s = stats.get(id)
        const mineRecv = sum(received.filter((c) => c.book_project_id === id))
        return { ...publicBook(b), stats: s,
          my_capital: mineRecv, my_share_of_capital: s && s.raised ? mineRecv / s.raised : 0,
          my_commitments: myCommitments.filter((c) => c.book_project_id === id).map((c) => ({ id: c.id, amount: c.amount, currency: c.currency, status: c.status, received_at: c.received_at, reference: c.reference, created_at: c.created_at })),
          my_returns: sum(myDists.filter((d) => d.book_project_id === id && d.kind === "investor_profit" && d.status === "paid")) }
      }),
      returns: myDists.filter((d) => d.kind === "investor_profit" || d.kind === "capital_refund").map((d) => dist(d, title)),
    }
  }

  if (me.is_publisher) {
    const mine = allBooks.filter((b) => b.publisher_id === me.id || b.proposed_by_partner_id === me.id)
    const stats = await bookStats(svc, mine.map((b) => b.id))
    const sales = mine.length ? await svc.listSalesReports({ book_project_id: mine.map((b) => b.id) }, { take: 5000, order: { period_end: "DESC" } }) : []
    out.publisher = {
      books: mine.map((b) => ({ ...publicBook(b), stats: stats.get(b.id),
        sales_reports: sales.filter((s) => s.book_project_id === b.id).map((s) => ({ id: s.id, period_start: s.period_start, period_end: s.period_end,
          units_sold: s.units_sold, revenue: s.revenue, costs: s.costs, net_profit: s.net_profit, status: s.status, admin_feedback: s.admin_feedback, created_at: s.created_at })) })),
    }
  }

  if (me.is_author) {
    const mine = allBooks.filter((b) => b.author_id === me.id)
    const stats = await bookStats(svc, mine.map((b) => b.id))
    const royalties = myDists.filter((d) => d.kind === "author_royalty")
    // translation / scholarly work done through the Scholar Earn portal with the same account or email
    const [scholar] = (me.customer_id ? await svc.listScholars({ customer_id: me.customer_id }) : []).concat(await svc.listScholars({ email: me.email }))
    let scholarWork: Record<string, unknown> | null = null
    if (scholar) {
      const [tasks, payouts] = await Promise.all([
        svc.listProjects({ assigned_scholar_id: scholar.id }, { take: 5000, order: { updated_at: "DESC" } }),
        svc.listPayouts({ scholar_id: scholar.id }, { take: 5000 }),
      ])
      scholarWork = {
        tasks: tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, word_count: t.word_count, status: t.status, book_title: t.book_project_id ? title.get(t.book_project_id) ?? null : null, updated_at: t.updated_at })),
        completed: tasks.filter((t) => t.status === "completed").length,
        words_translated: round2(tasks.filter((t) => t.status === "completed" && t.category === "translation").reduce((a, t) => a + (t.word_count || 0), 0)),
        earned_paid: sum(payouts.filter((p) => p.status === "paid")),
        earned_owed: sum(payouts.filter((p) => p.status === "pending")),
      }
    }
    out.author = {
      totals: { royalties_paid: sum(royalties.filter((d) => d.status === "paid")), royalties_owed: sum(royalties.filter((d) => d.status === "pending")) },
      books: mine.map((b) => {
        const s = stats.get(b.id)
        return { ...publicBook(b), stats: s && { stages: s.stages, tasks_total: s.tasks_total, tasks_completed: s.tasks_completed, units_sold: s.units_sold, revenue: s.revenue } }
      }),
      royalties: royalties.map((d) => dist(d, title)),
      scholar_work: scholarWork,
    }
  }
  res.json(out)
}
