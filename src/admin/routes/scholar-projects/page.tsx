import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BookOpen } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api, money, totals, CATEGORIES, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"

type Summary = {
  open_projects: number; active_projects: number; completed_projects: number; active_scholars: number
  invited_scholars: number; pending_applications: number; waiting_reviews: number
  owed: Record<string, number>; paid: Record<string, number>
}

const FILTERS = [["", "All"], ["open", "Open"], ["assigned", "In progress"], ["in_review", "To review"], ["completed", "Completed"], ["draft", "Drafts"]] as const

const emptyForm = { title: "", description: "", category: "translation", source_reference: "", word_count: "", budget: "", currency: "PKR", deadline: "", book_project_id: "" }

const ProjectsPage = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [filter, setFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [books, setBooks] = useState<any[]>([])
  const [params, setParams] = useSearchParams()

  // Opened from a book page ("Post work for this book"): open the form with that book chosen
  useEffect(() => {
    api("/admin/earn/book-projects").then((r) => setBooks(r.book_projects.filter((b: any) => b.status !== "cancelled"))).catch(() => {})
    const book = params.get("book")
    if (book) {
      setForm((f) => ({ ...f, book_project_id: book }))
      setOpen(true)
      setParams({}, { replace: true })
    }
  }, [])

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        api(`/admin/earn/projects${filter ? `?status=${filter}` : ""}`),
        api<Summary>("/admin/earn/summary"),
      ])
      setProjects(p.projects)
      setSummary(s)
    } catch (e: any) {
      toast.error(e.message)
    }
  }
  useEffect(() => { load() }, [filter])

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const create = async (status: "draft" | "open") => {
    setSaving(true)
    try {
      await api("/admin/earn/projects", { method: "POST", body: { ...form, status } })
      toast.success(status === "draft" ? "Draft saved" : "Project posted — scholars can see it now")
      setForm({ ...emptyForm })
      setOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Scholar projects</Heading>
            <Text size="small" className="text-ui-fg-subtle">Post work for your scholars, choose who does it, review it and pay.</Text>
          </div>
          <Button onClick={() => setOpen(true)}>Post a project</Button>
        </div>
        {summary && (
          <div className="grid grid-cols-2 gap-px border-t bg-ui-border-base md:grid-cols-4">
            {[
              ["Applications to look at", summary.pending_applications],
              ["Work waiting for review", summary.waiting_reviews],
              ["Owed to scholars", totals(summary.owed)],
              ["Paid so far", totals(summary.paid)],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-ui-bg-base px-6 py-3">
                <Text size="small" className="text-ui-fg-subtle">{label}</Text>
                <Text weight="plus" size="large">{value}</Text>
              </div>
            ))}
          </div>
        )}
      </Container>

      <Container className="p-0">
        <div className="flex flex-wrap gap-2 px-6 py-3">
          {FILTERS.map(([value, label]) => (
            <Button key={value} size="small" variant={filter === value ? "primary" : "secondary"} onClick={() => setFilter(value)}>
              {label}
            </Button>
          ))}
        </div>
        {projects.length === 0 ? (
          <div className="px-6 pb-8 pt-2">
            <Text className="text-ui-fg-subtle">No projects here yet. Post one and your invited scholars will see it in their portal.</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Project</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Scholar</Table.HeaderCell>
                <Table.HeaderCell>Budget</Table.HeaderCell>
                <Table.HeaderCell>Deadline</Table.HeaderCell>
                <Table.HeaderCell>Needs you</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {projects.map((p) => (
                <Table.Row key={p.id} className="cursor-pointer">
                  <Table.Cell className="max-w-[360px] truncate">
                    <Link to={`/scholar-projects/${p.id}`} className="text-ui-fg-interactive hover:underline">{p.title}</Link>
                  </Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge></Table.Cell>
                  <Table.Cell>{p.assigned_scholar_name || "—"}</Table.Cell>
                  <Table.Cell>{money(p.budget, p.currency)}</Table.Cell>
                  <Table.Cell>{p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}</Table.Cell>
                  <Table.Cell>
                    {[
                      p.applications_count ? `${p.applications_count} application${p.applications_count > 1 ? "s" : ""}` : "",
                      p.submissions_waiting ? "work to review" : "",
                    ].filter(Boolean).join(", ") || "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header><Drawer.Title>Post a project</Drawer.Title></Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
            <div><Label>Title</Label><Input value={form.title} onChange={set("title")} placeholder="e.g. Translate Kitāb al-Ṭahārah from Mukhtaṣar al-Qudūrī" /></div>
            <div><Label>What needs to be done</Label><Textarea rows={7} value={form.description} onChange={set("description")} placeholder="Scope, style rules, what to hand in, how it will be checked…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type of work</Label>
                <select className="bg-ui-bg-field shadow-borders-base txt-compact-small h-8 w-full rounded-md px-2" value={form.category} onChange={set("category")}>
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><Label>Word count (optional)</Label><Input type="number" min={0} value={form.word_count} onChange={set("word_count")} /></div>
            </div>
            <div>
              <Label>Part of a book project (optional)</Label>
              <select className="bg-ui-bg-field shadow-borders-base txt-compact-small h-8 w-full rounded-md px-2" value={form.book_project_id} onChange={set("book_project_id")}>
                <option value="">— Not linked to a book —</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <Text size="xsmall" className="text-ui-fg-subtle">Linked work shows as a stage on the book's investor, publisher and author dashboards. Its cost counts as spending on the book.</Text>
            </div>
            <div><Label>Source text (book, pages or link)</Label><Input value={form.source_reference} onChange={set("source_reference")} placeholder="e.g. Dar al-Kutub al-ʿIlmiyyah ed., vol. 1, pp. 1–20" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Payment for the whole project</Label><Input type="number" min={0} value={form.budget} onChange={set("budget")} /></div>
              <div><Label>Currency</Label><Input value={form.currency} maxLength={3} onChange={set("currency")} /></div>
            </div>
            <div><Label>Deadline (optional)</Label><Input type="date" value={form.deadline} onChange={set("deadline")} /></div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" disabled={saving} onClick={() => create("draft")}>Save as draft</Button>
            <Button isLoading={saving} onClick={() => create("open")}>Post project</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Scholar Projects", icon: BookOpen })
export default ProjectsPage
