import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api, totals, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"

const ScholarsPage = () => {
  const [scholars, setScholars] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: "", email: "", specialties: "" })
  const [saving, setSaving] = useState(false)
  const portalUrl = `${window.location.origin}/portal`

  const load = async () => {
    try { setScholars((await api("/admin/earn/scholars")).scholars) } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [])

  const invite = async () => {
    setSaving(true)
    try {
      await api("/admin/earn/scholars", { method: "POST", body: form })
      toast.success(`${form.full_name} invited`)
      setForm({ full_name: "", email: "", specialties: "" })
      load()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const copyInvite = (s: any) => {
    const msg = `Assalamu alaikum ${s.full_name},\n\nYou are invited to take paid projects with Aalim Books International.\nCreate your account here with this email (${s.email}):\n${portalUrl}\n\nJazakAllah khair`
    navigator.clipboard.writeText(msg).then(() => toast.success("Invitation message copied — paste it into WhatsApp or email"))
  }

  const setStatus = async (s: any, status: "active" | "suspended") => {
    try { await api(`/admin/earn/scholars/${s.id}`, { method: "POST", body: { status } }); toast.success(status === "active" ? "Scholar re-activated" : "Scholar paused"); load() }
    catch (e: any) { toast.error(e.message) }
  }

  const remove = async (s: any) => {
    if (!confirm(`Withdraw the invitation for ${s.full_name}?`)) return
    try { await api(`/admin/earn/scholars/${s.id}`, { method: "DELETE" }); toast.success("Invitation withdrawn"); load() }
    catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-y-3 px-6 py-4">
        <div>
          <Heading>Scholars</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Only people you invite can sign up. After inviting, send them the portal link: <span className="text-ui-fg-base">{portalUrl}</span>
          </Text>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
          <div><Label size="small">Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label size="small">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label size="small">Specialties (optional)</Label><Input value={form.specialties} placeholder="e.g. Ḥadīth, Ḥanafī fiqh, Arabic grammar" onChange={(e) => setForm({ ...form, specialties: e.target.value })} /></div>
          <Button isLoading={saving} onClick={invite}>Invite scholar</Button>
        </div>
      </Container>

      <Container className="p-0">
        {scholars.length === 0 ? (
          <Text className="px-6 py-6 text-ui-fg-subtle">No scholars yet. Invite your first one above.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Scholar</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>How they want to be paid</Table.HeaderCell>
                <Table.HeaderCell>Owed</Table.HeaderCell>
                <Table.HeaderCell>Paid</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {scholars.map((s) => (
                <Table.Row key={s.id}>
                  <Table.Cell>
                    <div className="flex flex-col py-1">
                      <span className="txt-compact-small-plus">{s.full_name}</span>
                      <span className="txt-compact-xsmall text-ui-fg-subtle">{s.email}{s.specialties ? ` — ${s.specialties}` : ""}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[s.status]}>{STATUS_LABEL[s.status]}</Badge></Table.Cell>
                  <Table.Cell className="max-w-[260px] truncate">{s.payout_method ? `${s.payout_method}: ${s.payout_details || ""}` : "Not given yet"}</Table.Cell>
                  <Table.Cell>{Object.keys(s.total_owed || {}).length ? totals(s.total_owed) : "—"}</Table.Cell>
                  <Table.Cell>{Object.keys(s.total_paid || {}).length ? totals(s.total_paid) : "—"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      {s.status === "invited" && <Button size="small" variant="secondary" onClick={() => copyInvite(s)}>Copy invitation</Button>}
                      {s.status === "invited" && <Button size="small" variant="transparent" onClick={() => remove(s)}>Withdraw</Button>}
                      {s.status === "active" && <Button size="small" variant="transparent" onClick={() => setStatus(s, "suspended")}>Pause</Button>}
                      {s.status === "suspended" && <Button size="small" variant="secondary" onClick={() => setStatus(s, "active")}>Re-activate</Button>}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Scholars", icon: Users })
export default ScholarsPage
