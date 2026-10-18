import { Badge, Button, Checkbox, Container, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, money, CATEGORIES, FUNDING_MODEL_LABEL, STATUS_COLOR, STATUS_LABEL } from "../../../lib/api"
import { BookFields, cleanBook } from "../../../lib/book-fields"

const NEXT: Record<string, [string, string][]> = {
  proposed: [["draft", "Accept proposal (set terms next)"], ["cancelled", "Decline"]],
  draft: [["fundraising", "Open to investors"]],
  fundraising: [["funded", "Mark fully funded"], ["in_production", "Start production"]],
  funded: [["in_production", "Start production"]],
  in_production: [["published", "Mark published"]],
  published: [["closed", "Close the book"]],
}
const CAT = Object.fromEntries(CATEGORIES)
const KIND: Record<string, string> = { investor_profit: "Profit share", author_royalty: "Royalty", capital_refund: "Capital returned" }
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—")
const sel = "bg-ui-bg-field shadow-borders-base txt-compact-small h-8 w-full rounded-md px-2"

const Section = ({ title, hint, children, action }: any) => (
  <Container className="p-0">
    <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
      <div><Heading level="h2">{title}</Heading>{hint && <Text size="small" className="text-ui-fg-subtle">{hint}</Text>}</div>
      {action}
    </div>
    {children}
  </Container>
)

const BookProjectPage = () => {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [partners, setPartners] = useState<any[]>([])
  const [form, setForm] = useState<any>(null)
  const [ref, setRef] = useState<Record<string, string>>({})
  const [cmt, setCmt] = useState({ partner_id: "", amount: "", status: "received", reference: "" })
  const [sale, setSale] = useState({ period_start: "", period_end: "", units_sold: "", revenue: "", costs: "0", approve: true })
  const [busy, setBusy] = useState("")

  const load = async () => {
    try {
      const [d, p] = await Promise.all([api(`/admin/earn/book-projects/${id}`), api("/admin/earn/partners")])
      setData(d); setPartners(p.partners)
      const b = d.book_project
      setForm({ title: b.title, title_ar: b.title_ar || "", description: b.description, source_reference: b.source_reference || "", funding_model: b.funding_model,
        funding_goal: b.funding_goal, currency: b.currency, investor_profit_share_pct: b.investor_profit_share_pct ?? "", author_royalty_pct: b.author_royalty_pct ?? "",
        publisher_id: b.publisher_id || "", author_id: b.author_id || "", agreement_url: b.agreement_url || "" })
    } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [id])
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }))
  const run = async (key: string, fn: () => Promise<any>, msg: string) => {
    setBusy(key)
    try { await fn(); toast.success(msg); await load() } catch (e: any) { toast.error(e.message) } finally { setBusy("") }
  }
  if (!data || !form) return <Container><Text>Loading…</Text></Container>
  const b = data.book_project, s = data.stats || {}, cur = b.currency

  const changeStatus = (status: string) => {
    if (status === "fundraising" && b.funding_model === "profit_share" && (b.investor_profit_share_pct == null || !b.agreement_url)) {
      return toast.error("Before opening to investors, set the investors' profit share % and the agreement link, then save.")
    }
    run("status", () => api(`/admin/earn/book-projects/${b.id}`, { method: "POST", body: { status } }), `Status: ${STATUS_LABEL[status] || status}`)
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-3 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/book-projects" className="txt-compact-small text-ui-fg-subtle hover:underline">← Book projects</Link>
            <Heading>{b.title}</Heading>
            {b.title_ar && <Text dir="rtl" lang="ar" className="text-ui-fg-subtle">{b.title_ar}</Text>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge size="2xsmall" color={STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status] || b.status}</Badge>
              <Text size="small" className="text-ui-fg-subtle">{FUNDING_MODEL_LABEL[b.funding_model]} · publisher: {b.publisher?.full_name || "Aalim Books"}{b.author ? ` · author: ${b.author.full_name}` : ""}</Text>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(NEXT[b.status] || []).map(([st, label]) => (
              <Button key={st} size="small" variant={st === "cancelled" ? "danger" : "primary"} isLoading={busy === "status"} onClick={() => changeStatus(st)}>{label}</Button>
            ))}
            {!["cancelled", "closed", "proposed"].includes(b.status) && <Button size="small" variant="transparent" onClick={() => confirm("Cancel this book project?") && changeStatus("cancelled")}>Cancel book</Button>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-ui-border-base md:grid-cols-4">
          {[
            ["Capital received", `${money(s.raised, cur)} of ${money(b.funding_goal, cur)}`],
            ["Pledged, to confirm", money(s.pledged, cur)],
            ["Spent on scholars", `${money(s.spent_paid, cur)}${s.spent_owed ? ` (+${money(s.spent_owed, cur)} owed)` : ""}`],
            ["Work done", s.tasks_total ? `${s.tasks_completed} of ${s.tasks_total}` : "—"],
            ["Copies sold", Number(s.units_sold || 0).toLocaleString("en-US")],
            ["Revenue / net profit", `${money(s.revenue, cur)} / ${money(s.net_profit, cur)}`],
            ["Royalties owed / paid", `${money(s.royalties_owed, cur)} / ${money(s.royalties_paid, cur)}`],
            ["Profit owed / paid", `${money(s.profit_owed, cur)} / ${money(s.profit_paid, cur)}`],
          ].map(([l, v]) => (
            <div key={l} className="bg-ui-bg-base px-4 py-3"><Text size="small" className="text-ui-fg-subtle">{l}</Text><Text weight="plus">{v}</Text></div>
          ))}
        </div>
      </Container>

      <Section title="Work stages" hint="Scholar projects linked to this book. Investors, the publisher and the author see each stage's progress (not scholars' names or fees)."
        action={<Link to={`/scholar-projects?book=${b.id}`}><Button size="small" variant="secondary">Post work for this book</Button></Link>}>
        {data.tasks.length === 0 ? <Text className="px-6 pb-6 text-ui-fg-subtle">No work posted yet — e.g. translation, review, proofreading, typesetting, fatwā review, printing.</Text> : (
          <Table>
            <Table.Header><Table.Row><Table.HeaderCell>Work</Table.HeaderCell><Table.HeaderCell>Type</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Scholar</Table.HeaderCell><Table.HeaderCell>Budget</Table.HeaderCell></Table.Row></Table.Header>
            <Table.Body>{data.tasks.map((t: any) => (
              <Table.Row key={t.id}>
                <Table.Cell><Link to={`/scholar-projects/${t.id}`} className="text-ui-fg-interactive hover:underline">{t.title}</Link></Table.Cell>
                <Table.Cell>{CAT[t.category] || t.category}</Table.Cell>
                <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[t.status]}>{STATUS_LABEL[t.status]}</Badge></Table.Cell>
                <Table.Cell>{t.assigned_scholar_name || "—"}</Table.Cell>
                <Table.Cell>{money(t.budget, t.currency)}</Table.Cell>
              </Table.Row>))}
            </Table.Body>
          </Table>
        )}
      </Section>

      <Section title="Funding" hint="A pledge counts as capital only when you receive the money and mark it received with the transaction ID.">
        {data.commitments.length > 0 && (
          <Table>
            <Table.Header><Table.Row><Table.HeaderCell>Investor</Table.HeaderCell><Table.HeaderCell>Amount</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Date</Table.HeaderCell><Table.HeaderCell></Table.HeaderCell></Table.Row></Table.Header>
            <Table.Body>{data.commitments.map((c: any) => (
              <Table.Row key={c.id}>
                <Table.Cell>{c.investor?.full_name}{c.note && <div className="txt-compact-xsmall text-ui-fg-subtle">{c.note}</div>}</Table.Cell>
                <Table.Cell>{money(c.amount, c.currency)}</Table.Cell>
                <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[c.status]}>{STATUS_LABEL[c.status]}</Badge>{c.reference && <div className="txt-compact-xsmall text-ui-fg-subtle">Ref {c.reference}</div>}</Table.Cell>
                <Table.Cell>{day(c.received_at || c.created_at)}</Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-2">
                    {c.status === "pledged" && <>
                      <Input size="small" placeholder="Transaction ID" value={ref[c.id] || ""} onChange={(e) => setRef((r) => ({ ...r, [c.id]: e.target.value }))} />
                      <Button size="small" isLoading={busy === c.id} onClick={() => run(c.id, () => api(`/admin/earn/commitments/${c.id}`, { method: "POST", body: { status: "received", reference: ref[c.id] } }), "Marked received — it now counts as capital")}>Mark received</Button>
                      <Button size="small" variant="transparent" onClick={() => run(c.id, () => api(`/admin/earn/commitments/${c.id}`, { method: "POST", body: { status: "cancelled" } }), "Pledge cancelled")}>Cancel</Button>
                    </>}
                    {c.status === "received" && <Button size="small" variant="transparent" onClick={() => confirm("Mark this capital as refunded to the investor?") && run(c.id, () => api(`/admin/earn/commitments/${c.id}`, { method: "POST", body: { status: "refunded", reference: ref[c.id] } }), "Marked refunded")}>Mark refunded</Button>}
                  </div>
                </Table.Cell>
              </Table.Row>))}
            </Table.Body>
          </Table>
        )}
        <div className="grid gap-3 px-6 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
          <div><Label size="small">Record money from an investor</Label>
            <select className={sel} value={cmt.partner_id} onChange={(e) => setCmt({ ...cmt, partner_id: e.target.value })}>
              <option value="">Choose investor…</option>
              {partners.filter((p) => p.is_investor).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div><Label size="small">Amount ({cur})</Label><Input type="number" min={1} value={cmt.amount} onChange={(e) => setCmt({ ...cmt, amount: e.target.value })} /></div>
          <div><Label size="small">Status</Label><select className={sel} value={cmt.status} onChange={(e) => setCmt({ ...cmt, status: e.target.value })}><option value="received">Received</option><option value="pledged">Pledged</option></select></div>
          <div><Label size="small">Transaction ID</Label><Input value={cmt.reference} onChange={(e) => setCmt({ ...cmt, reference: e.target.value })} /></div>
          <Button isLoading={busy === "cmt"} onClick={() => run("cmt", async () => { await api(`/admin/earn/book-projects/${b.id}/commitments`, { method: "POST", body: cmt }); setCmt({ partner_id: "", amount: "", status: "received", reference: "" }) }, "Recorded")}>Add</Button>
        </div>
      </Section>

      <Section title="Sales" hint="Approving a sales period works out the author's royalty and the investors' profit shares and adds them to Partner Payments.">
        {data.sales_reports.length > 0 && (
          <Table>
            <Table.Header><Table.Row><Table.HeaderCell>Period</Table.HeaderCell><Table.HeaderCell>Copies</Table.HeaderCell><Table.HeaderCell>Revenue / costs</Table.HeaderCell><Table.HeaderCell>Split</Table.HeaderCell><Table.HeaderCell></Table.HeaderCell></Table.Row></Table.Header>
            <Table.Body>{data.sales_reports.map((r: any) => (
              <Table.Row key={r.id}>
                <Table.Cell>{day(r.period_start)} – {day(r.period_end)}<div className="txt-compact-xsmall text-ui-fg-subtle">{r.submitted_by ? `by ${r.submitted_by.full_name}` : "entered by Aalim Books"}{r.note ? ` · ${r.note}` : ""}</div></Table.Cell>
                <Table.Cell>{r.units_sold}</Table.Cell>
                <Table.Cell>{money(r.revenue, cur)}<div className="txt-compact-xsmall text-ui-fg-subtle">costs {money(r.costs, cur)}</div></Table.Cell>
                <Table.Cell className="txt-compact-xsmall">
                  {r.calculation ? <>
                    <div>Royalty {money(r.calculation.author_royalty, cur)} · net {money(r.calculation.net_profit, cur)}</div>
                    <div>Investors {money(r.calculation.investor_pool, cur)} · Aalim Books {money(r.calculation.managing_partner_share, cur)}{r.calculation.loss ? ` · loss ${money(r.calculation.loss, cur)}` : ""}</div>
                  </> : r.status === "rejected" ? <span className="text-ui-fg-error">Returned: {r.admin_feedback}</span> : "—"}
                </Table.Cell>
                <Table.Cell>
                  {r.status === "submitted" ? (
                    <div className="flex justify-end gap-2">
                      <Input size="small" placeholder="Note to publisher" value={ref[r.id] || ""} onChange={(e) => setRef((x) => ({ ...x, [r.id]: e.target.value }))} />
                      <Button size="small" isLoading={busy === r.id} onClick={() => run(r.id, () => api(`/admin/earn/sales-reports/${r.id}/review`, { method: "POST", body: { action: "approve", feedback: ref[r.id] } }), "Approved — royalties and profit shares created")}>Approve</Button>
                      <Button size="small" variant="secondary" onClick={() => run(r.id, () => api(`/admin/earn/sales-reports/${r.id}/review`, { method: "POST", body: { action: "reject", feedback: ref[r.id] } }), "Returned to publisher")}>Return</Button>
                    </div>
                  ) : <Badge size="2xsmall" color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status] || r.status}</Badge>}
                </Table.Cell>
              </Table.Row>))}
            </Table.Body>
          </Table>
        )}
        <div className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_1fr_0.7fr_1fr_1fr_auto] md:items-end">
          <div><Label size="small">From</Label><Input type="date" value={sale.period_start} onChange={(e) => setSale({ ...sale, period_start: e.target.value })} /></div>
          <div><Label size="small">To</Label><Input type="date" value={sale.period_end} onChange={(e) => setSale({ ...sale, period_end: e.target.value })} /></div>
          <div><Label size="small">Copies</Label><Input type="number" min={0} value={sale.units_sold} onChange={(e) => setSale({ ...sale, units_sold: e.target.value })} /></div>
          <div><Label size="small">Revenue ({cur})</Label><Input type="number" min={0} value={sale.revenue} onChange={(e) => setSale({ ...sale, revenue: e.target.value })} /></div>
          <div><Label size="small">Costs ({cur})</Label><Input type="number" min={0} value={sale.costs} onChange={(e) => setSale({ ...sale, costs: e.target.value })} /></div>
          <Button isLoading={busy === "sale"} onClick={() => run("sale", async () => { await api(`/admin/earn/book-projects/${b.id}/sales`, { method: "POST", body: sale }); setSale({ period_start: "", period_end: "", units_sold: "", revenue: "", costs: "0", approve: true }) }, sale.approve ? "Sales recorded and shared out" : "Sales recorded")}>Add sales</Button>
          <label className="flex items-center gap-2 txt-compact-small md:col-span-6"><Checkbox checked={sale.approve} onCheckedChange={(v) => setSale({ ...sale, approve: !!v })} /> Approve straight away (work out royalty and profit shares now)</label>
        </div>
      </Section>

      <Section title="Payments to partners" hint="Royalties and profit shares for this book. All partners' payments are also on the Partner Payments page.">
        {data.distributions.length === 0 ? <Text className="px-6 pb-6 text-ui-fg-subtle">None yet.</Text> : (
          <Table>
            <Table.Header><Table.Row><Table.HeaderCell>To</Table.HeaderCell><Table.HeaderCell>For</Table.HeaderCell><Table.HeaderCell>Amount</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell></Table.HeaderCell></Table.Row></Table.Header>
            <Table.Body>{data.distributions.map((d: any) => (
              <Table.Row key={d.id}>
                <Table.Cell>{d.partner?.full_name}<div className="txt-compact-xsmall text-ui-fg-subtle">{d.partner?.payout_method ? `${d.partner.payout_method}: ${d.partner.payout_details || ""}` : "No payment details yet"}</div></Table.Cell>
                <Table.Cell className="max-w-[260px]">{KIND[d.kind]}<div className="txt-compact-xsmall text-ui-fg-subtle">{d.note}</div></Table.Cell>
                <Table.Cell>{money(d.amount, d.currency)}</Table.Cell>
                <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[d.status]}>{STATUS_LABEL[d.status]}</Badge>{d.reference && <div className="txt-compact-xsmall text-ui-fg-subtle">Ref {d.reference}</div>}</Table.Cell>
                <Table.Cell>{d.status === "pending" && (
                  <div className="flex justify-end gap-2">
                    <Input size="small" placeholder="Transaction ID" value={ref[d.id] || ""} onChange={(e) => setRef((x) => ({ ...x, [d.id]: e.target.value }))} />
                    <Button size="small" isLoading={busy === d.id} onClick={() => run(d.id, () => api(`/admin/earn/distributions/${d.id}`, { method: "POST", body: { status: "paid", method: d.partner?.payout_method, reference: ref[d.id] } }), "Marked paid")}>Mark paid</Button>
                  </div>)}
                </Table.Cell>
              </Table.Row>))}
            </Table.Body>
          </Table>
        )}
      </Section>

      <Section title="Terms and details" hint="Investors see the description, funding model, shares and the agreement link before pledging.">
        <div className="grid gap-4 px-6 pb-6">
          <BookFields form={form} set={set} partners={partners} />
          <div><Button isLoading={busy === "save"} onClick={() => run("save", () => api(`/admin/earn/book-projects/${b.id}`, { method: "POST", body: cleanBook(form) }), "Saved")}>Save terms</Button></div>
        </div>
      </Section>
    </div>
  )
}

export default BookProjectPage
