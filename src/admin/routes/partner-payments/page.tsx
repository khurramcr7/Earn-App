import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api, money, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"

const KIND: Record<string, string> = { investor_profit: "Profit share", author_royalty: "Author royalty", capital_refund: "Capital returned" }

const PartnerPaymentsPage = () => {
  const [list, setList] = useState<any[]>([])
  const [filter, setFilter] = useState<"pending" | "paid" | "">("pending")
  const [ref, setRef] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const load = async () => {
    try { setList((await api(`/admin/earn/distributions${filter ? `?status=${filter}` : ""}`)).distributions) } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [filter])
  const pay = async (d: any) => {
    setBusy(d.id)
    try { await api(`/admin/earn/distributions/${d.id}`, { method: "POST", body: { status: "paid", method: d.partner?.payout_method, reference: ref[d.id] } }); toast.success(`Marked paid — ${d.partner?.full_name} can see it now`); load() }
    catch (e: any) { toast.error(e.message) } finally { setBusy("") }
  }
  const owed = list.filter((d) => d.status === "pending").reduce((acc: Record<string, number>, d) => { acc[d.currency] = (acc[d.currency] || 0) + Number(d.amount); return acc }, {})
  return (
    <Container className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Partner payments</Heading>
          <Text size="small" className="text-ui-fg-subtle">Author royalties and investor profit shares, created when you approve a book's sales. Send the money, then mark it paid with the transaction ID.</Text>
        </div>
        <div className="flex gap-2">
          {([["pending", "To pay"], ["paid", "Paid"], ["", "All"]] as const).map(([v, l]) => <Button key={v} size="small" variant={filter === v ? "primary" : "secondary"} onClick={() => setFilter(v)}>{l}</Button>)}
        </div>
      </div>
      {filter === "pending" && list.length > 0 && <Text className="px-6 pb-3">Total to pay: <span className="txt-compact-medium-plus">{Object.entries(owed).map(([c, v]) => money(v as number, c)).join(" + ")}</span></Text>}
      {list.length === 0 ? <Text className="px-6 pb-6 text-ui-fg-subtle">{filter === "pending" ? "Nothing to pay right now." : "No payments yet."}</Text> : (
        <Table>
          <Table.Header><Table.Row><Table.HeaderCell>Partner</Table.HeaderCell><Table.HeaderCell>Book</Table.HeaderCell><Table.HeaderCell>For</Table.HeaderCell><Table.HeaderCell>Amount</Table.HeaderCell><Table.HeaderCell>Pay to</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Transaction ID</Table.HeaderCell></Table.Row></Table.Header>
          <Table.Body>{list.map((d) => (
            <Table.Row key={d.id}>
              <Table.Cell>{d.partner?.full_name}</Table.Cell>
              <Table.Cell><Link to={`/book-projects/${d.book_project_id}`} className="text-ui-fg-interactive hover:underline">{d.book_title}</Link></Table.Cell>
              <Table.Cell className="max-w-[220px]">{KIND[d.kind]}<div className="txt-compact-xsmall truncate text-ui-fg-subtle">{d.note}</div></Table.Cell>
              <Table.Cell>{money(d.amount, d.currency)}</Table.Cell>
              <Table.Cell className="max-w-[220px] truncate">{d.partner?.payout_method ? `${d.partner.payout_method}: ${d.partner.payout_details || ""}` : "No payment details yet"}</Table.Cell>
              <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[d.status]}>{STATUS_LABEL[d.status]}</Badge>{d.paid_at && <div className="txt-compact-xsmall text-ui-fg-subtle">{new Date(d.paid_at).toLocaleDateString()}</div>}</Table.Cell>
              <Table.Cell>{d.status === "pending" ? (
                <div className="flex gap-2">
                  <Input size="small" placeholder="Transaction ID" value={ref[d.id] || ""} onChange={(e) => setRef((r) => ({ ...r, [d.id]: e.target.value }))} />
                  <Button size="small" isLoading={busy === d.id} onClick={() => pay(d)}>Mark paid</Button>
                </div>) : (d.reference || "—")}
              </Table.Cell>
            </Table.Row>))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Partner Payments", icon: ReceiptPercent })
export default PartnerPaymentsPage
