import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Cash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api, money, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"

const PaymentsPage = () => {
  const [payouts, setPayouts] = useState<any[]>([])
  const [filter, setFilter] = useState<"pending" | "paid" | "">("pending")
  const [ref, setRef] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")

  const load = async () => {
    try { setPayouts((await api(`/admin/earn/payouts${filter ? `?status=${filter}` : ""}`)).payouts) } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [filter])

  const markPaid = async (p: any) => {
    setBusy(p.id)
    try {
      await api(`/admin/earn/payouts/${p.id}`, { method: "POST", body: { status: "paid", method: p.scholar?.payout_method, reference: ref[p.id] } })
      toast.success(`Marked as paid — ${p.scholar?.full_name} can see it now`)
      load()
    } catch (e: any) { toast.error(e.message) } finally { setBusy("") }
  }

  const owedTotal = payouts.filter((p) => p.status === "pending").reduce((a, p) => a + Number(p.amount), 0)

  return (
    <Container className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Scholar payments</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Send the money by bank, JazzCash, Easypaisa, Payoneer or Wise, then mark it paid here with the transaction ID.
          </Text>
        </div>
        <div className="flex gap-2">
          {([["pending", "To pay"], ["paid", "Paid"], ["", "All"]] as const).map(([v, l]) => (
            <Button key={v} size="small" variant={filter === v ? "primary" : "secondary"} onClick={() => setFilter(v)}>{l}</Button>
          ))}
        </div>
      </div>
      {filter === "pending" && payouts.length > 0 && (
        <Text className="px-6 pb-3">Total to pay: <span className="txt-compact-medium-plus">{money(owedTotal, payouts[0]?.currency)}</span></Text>
      )}
      {payouts.length === 0 ? (
        <Text className="px-6 pb-6 text-ui-fg-subtle">{filter === "pending" ? "Nothing to pay right now. Payments appear here when you approve work." : "No payments yet."}</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Scholar</Table.HeaderCell>
              <Table.HeaderCell>For</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Pay to</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Transaction ID</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payouts.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell>{p.scholar?.full_name}</Table.Cell>
                <Table.Cell className="max-w-[240px] truncate">{p.note || "—"}</Table.Cell>
                <Table.Cell>{money(p.amount, p.currency)}</Table.Cell>
                <Table.Cell className="max-w-[240px] truncate">{p.scholar?.payout_method ? `${p.scholar.payout_method}: ${p.scholar.payout_details || ""}` : "Scholar has not added payment details"}</Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  {p.paid_at && <div className="txt-compact-xsmall text-ui-fg-subtle">{new Date(p.paid_at).toLocaleDateString()}</div>}
                </Table.Cell>
                <Table.Cell>
                  {p.status === "pending" ? (
                    <div className="flex gap-2">
                      <Input size="small" placeholder="Transaction ID" value={ref[p.id] || ""} onChange={(e) => setRef((r) => ({ ...r, [p.id]: e.target.value }))} />
                      <Button size="small" isLoading={busy === p.id} onClick={() => markPaid(p)}>Mark paid</Button>
                    </div>
                  ) : (p.reference || "—")}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Scholar Payments", icon: Cash })
export default PaymentsPage
