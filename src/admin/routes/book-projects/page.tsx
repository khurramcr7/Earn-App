import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Book } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, money, FUNDING_MODEL_LABEL, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"
import { BookFields, cleanBook } from "../../lib/book-fields"

const FILTERS = [["", "All"], ["proposed", "Proposals"], ["fundraising", "Raising funds"], ["in_production", "In production"], ["published", "Published"]] as const
const emptyForm = { title: "", title_ar: "", description: "", source_reference: "", funding_model: "profit_share", funding_goal: "", currency: "PKR",
  investor_profit_share_pct: "", author_royalty_pct: "", publisher_id: "", author_id: "", agreement_url: "" }
const BookProjectsPage = () => {
  const [books, setBooks] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [filter, setFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const nav = useNavigate()

  const load = async () => {
    try {
      const [b, p] = await Promise.all([api(`/admin/earn/book-projects${filter ? `?status=${filter}` : ""}`), api("/admin/earn/partners")])
      setBooks(b.book_projects); setPartners(p.partners)
    } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [filter])
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const create = async () => {
    setSaving(true)
    try {
      const r = await api("/admin/earn/book-projects", { method: "POST", body: { ...cleanBook(form), status: "draft" } })
      toast.success("Book project created as a draft — open it to start fundraising")
      setOpen(false); setForm({ ...emptyForm })
      nav(`/book-projects/${r.book_project.id}`)
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Book projects</Heading>
            <Text size="small" className="text-ui-fg-subtle">Whole books from manuscript to print. Investors fund them, scholars do the work, publishers report sales, profits and royalties are shared.</Text>
          </div>
          <Button onClick={() => setOpen(true)}>New book project</Button>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pb-3">
          {FILTERS.map(([v, l]) => <Button key={v} size="small" variant={filter === v ? "primary" : "secondary"} onClick={() => setFilter(v)}>{l}</Button>)}
        </div>
        {books.length === 0 ? (
          <Text className="px-6 pb-6 text-ui-fg-subtle">No book projects here yet.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Book</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Funding</Table.HeaderCell>
                <Table.HeaderCell>Work done</Table.HeaderCell>
                <Table.HeaderCell>Needs you</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {books.map((b) => (
                <Table.Row key={b.id}>
                  <Table.Cell className="max-w-[320px]">
                    <Link to={`/book-projects/${b.id}`} className="text-ui-fg-interactive hover:underline">{b.title}</Link>
                    <div className="txt-compact-xsmall text-ui-fg-subtle">{FUNDING_MODEL_LABEL[b.funding_model]}{b.publisher_name ? ` · ${b.publisher_name}` : ""}</div>
                  </Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status] || b.status}</Badge></Table.Cell>
                  <Table.Cell>
                    {money(b.stats?.raised, b.currency)} <span className="text-ui-fg-subtle">of {money(b.funding_goal, b.currency)}</span>
                    {b.stats?.pledged > 0 && <div className="txt-compact-xsmall text-ui-fg-subtle">+ {money(b.stats.pledged, b.currency)} pledged</div>}
                  </Table.Cell>
                  <Table.Cell>{b.stats?.tasks_total ? `${b.stats.tasks_completed} of ${b.stats.tasks_total}` : "—"}</Table.Cell>
                  <Table.Cell>
                    {[b.status === "proposed" ? "review proposal" : "", b.stats?.pledged > 0 ? "pledges to confirm" : "", b.stats?.sales_waiting ? "sales to approve" : ""].filter(Boolean).join(", ") || "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header><Drawer.Title>New book project</Drawer.Title></Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
            <BookFields form={form} set={set} partners={partners} />
          </Drawer.Body>
          <Drawer.Footer><Button isLoading={saving} onClick={create}>Create</Button></Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Book Projects", icon: Book })
export default BookProjectsPage
