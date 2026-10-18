import { Badge, Button, Container, Heading, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, money, CATEGORIES, STATUS_COLOR, STATUS_LABEL } from "../../../lib/api"

const ProjectDetailPage = () => {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [busy, setBusy] = useState("")
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [amount, setAmount] = useState<Record<string, string>>({})

  const load = async () => {
    try { setData(await api(`/admin/earn/projects/${id}`)) } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [id])

  const run = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key)
    try { await fn(); toast.success(ok); await load() } catch (e: any) { toast.error(e.message) } finally { setBusy("") }
  }

  if (!data) return <Container><Text>Loading…</Text></Container>
  const { project: p, applications, submissions, payouts } = data
  const category = CATEGORIES.find(([v]) => v === p.category)?.[1] || p.category

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-y-3 px-6 py-4">
        <Link to="/scholar-projects" className="txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base">← All projects</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <Heading>{p.title}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {category}{p.word_count ? `, about ${Number(p.word_count).toLocaleString()} words` : ""}
              {p.deadline ? `, due ${new Date(p.deadline).toLocaleDateString()}` : ""}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge>
            <Text weight="plus">{money(p.budget, p.currency)}</Text>
          </div>
        </div>
        <Text className="whitespace-pre-wrap">{p.description}</Text>
        {p.source_reference && <Text size="small"><span className="text-ui-fg-subtle">Source text: </span>{p.source_reference}</Text>}
        {p.assigned_scholar && (
          <Text size="small"><span className="text-ui-fg-subtle">Being done by: </span>{p.assigned_scholar.full_name} ({p.assigned_scholar.email})</Text>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {p.status === "draft" && (
            <Button size="small" isLoading={busy === "open"} onClick={() => run("open", () => api(`/admin/earn/projects/${p.id}`, { method: "POST", body: { status: "open" } }), "Project posted")}>Post it now</Button>
          )}
          {!["completed", "cancelled"].includes(p.status) && (
            <Button size="small" variant="secondary" isLoading={busy === "cancel"}
              onClick={() => confirm("Cancel this project? Scholars will no longer see it as open.") &&
                run("cancel", () => api(`/admin/earn/projects/${p.id}`, { method: "POST", body: { status: "cancelled" } }), "Project cancelled")}>
              Cancel project
            </Button>
          )}
          {p.status === "cancelled" && (
            <Button size="small" variant="secondary" onClick={() => run("reopen", () => api(`/admin/earn/projects/${p.id}`, { method: "POST", body: { status: "open" } }), "Project reopened")}>Reopen</Button>
          )}
        </div>
      </Container>

      <Container className="flex flex-col gap-y-3 px-6 py-4">
        <Heading level="h2">Work handed in</Heading>
        {submissions.length === 0 && <Text size="small" className="text-ui-fg-subtle">Nothing handed in yet.</Text>}
        {submissions.map((s: any) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text weight="plus">{s.scholar?.full_name} · {new Date(s.created_at).toLocaleString()}</Text>
              <Badge size="2xsmall" color={STATUS_COLOR[s.status]}>{STATUS_LABEL[s.status]}</Badge>
            </div>
            <a href={s.work_url} target="_blank" rel="noreferrer" className="txt-compact-small break-all text-ui-fg-interactive hover:underline">{s.work_url}</a>
            {s.note && <Text size="small" className="whitespace-pre-wrap">{s.note}</Text>}
            {s.feedback && <Text size="small" className="text-ui-fg-subtle">Your feedback: {s.feedback}</Text>}
            {s.status === "submitted" && (
              <div className="flex flex-col gap-2 border-t pt-2">
                <div><Label size="small">Feedback for the scholar</Label>
                  <Textarea rows={3} value={feedback[s.id] || ""} onChange={(e) => setFeedback((f) => ({ ...f, [s.id]: e.target.value }))} placeholder="Required if you ask for changes" /></div>
                <div className="max-w-xs"><Label size="small">Amount to pay (leave empty to use the agreed price)</Label>
                  <Input type="number" min={0} value={amount[s.id] || ""} onChange={(e) => setAmount((a) => ({ ...a, [s.id]: e.target.value }))} /></div>
                <div className="flex gap-2">
                  <Button size="small" isLoading={busy === `ap-${s.id}`}
                    onClick={() => run(`ap-${s.id}`, () => api(`/admin/earn/submissions/${s.id}/review`, { method: "POST", body: { action: "approve", feedback: feedback[s.id], amount: amount[s.id] || undefined } }), "Approved — payment added to Payments")}>
                    Approve and owe payment
                  </Button>
                  <Button size="small" variant="secondary" isLoading={busy === `ch-${s.id}`}
                    onClick={() => run(`ch-${s.id}`, () => api(`/admin/earn/submissions/${s.id}/review`, { method: "POST", body: { action: "changes", feedback: feedback[s.id] } }), "Sent back for changes")}>
                    Ask for changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </Container>

      <Container className="flex flex-col gap-y-3 px-6 py-4">
        <Heading level="h2">Scholars who applied</Heading>
        {applications.length === 0 && <Text size="small" className="text-ui-fg-subtle">No applications yet.</Text>}
        {applications.map((a: any) => (
          <div key={a.id} className="flex flex-col gap-1 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text weight="plus">{a.scholar?.full_name} <span className="font-normal text-ui-fg-subtle">({a.scholar?.email})</span></Text>
              <Badge size="2xsmall" color={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </div>
            {a.scholar?.specialties && <Text size="small" className="text-ui-fg-subtle">Specialties: {a.scholar.specialties}</Text>}
            <Text size="small">
              {a.proposed_amount != null ? `Asks ${money(a.proposed_amount, p.currency)}` : `Accepts ${money(p.budget, p.currency)}`}
              {a.proposed_days ? `, needs ${a.proposed_days} days` : ""}
            </Text>
            {a.message && <Text size="small" className="whitespace-pre-wrap">{a.message}</Text>}
            {a.status === "pending" && ["open", "assigned"].includes(p.status) && (
              <div><Button size="small" isLoading={busy === a.id}
                onClick={() => run(a.id, () => api(`/admin/earn/projects/${p.id}/assign`, { method: "POST", body: { scholar_id: a.scholar_id } }), `${a.scholar?.full_name} chosen for this project`)}>
                Choose this scholar
              </Button></div>
            )}
          </div>
        ))}
      </Container>

      {payouts.length > 0 && (
        <Container className="flex flex-col gap-y-2 px-6 py-4">
          <Heading level="h2">Payments for this project</Heading>
          {payouts.map((x: any) => (
            <Text key={x.id} size="small">
              {money(x.amount, x.currency)} — <Badge size="2xsmall" color={STATUS_COLOR[x.status]}>{STATUS_LABEL[x.status]}</Badge>
              {x.reference ? ` (ref ${x.reference})` : ""} · <Link to="/scholar-payments" className="text-ui-fg-interactive hover:underline">Go to Payments</Link>
            </Text>
          ))}
        </Container>
      )}
    </div>
  )
}

export default ProjectDetailPage
