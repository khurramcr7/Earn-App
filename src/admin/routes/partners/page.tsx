import { defineRouteConfig } from "@medusajs/admin-sdk"
import { UserGroup } from "@medusajs/icons"
import { Badge, Button, Checkbox, Container, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api, money, STATUS_COLOR, STATUS_LABEL } from "../../lib/api"

const ROLES = [["is_investor", "Investor"], ["is_publisher", "Publisher"], ["is_author", "Author"]] as const
const empty = { full_name: "", email: "", organization: "", is_investor: false, is_publisher: false, is_author: false }

const PartnersPage = () => {
  const [partners, setPartners] = useState<any[]>([])
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const portalUrl = `${window.location.origin}/partners`

  const load = async () => {
    try { setPartners((await api("/admin/earn/partners")).partners) } catch (e: any) { toast.error(e.message) }
  }
  useEffect(() => { load() }, [])

  const invite = async () => {
    setSaving(true)
    try {
      await api("/admin/earn/partners", { method: "POST", body: form })
      toast.success(`${form.full_name} invited`)
      setForm({ ...empty })
      load()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const update = async (p: any, body: Record<string, unknown>, msg: string) => {
    try { await api(`/admin/earn/partners/${p.id}`, { method: "POST", body }); toast.success(msg); load() } catch (e: any) { toast.error(e.message) }
  }

  const copyInvite = (p: any) => {
    const roles = ROLES.filter(([k]) => p[k]).map(([, l]) => l.toLowerCase()).join(" and ")
    const msg = `Assalamu alaikum ${p.full_name},\n\nAalim Books International invites you to join as ${roles}.\nCreate your account here with this email (${p.email}):\n${portalUrl}\n\nJazakAllah khair`
    navigator.clipboard.writeText(msg).then(() => toast.success("Invitation message copied — paste it into WhatsApp or email"))
  }

  const remove = async (p: any) => {
    if (!confirm(`Withdraw the invitation for ${p.full_name}?`)) return
    try { await api(`/admin/earn/partners/${p.id}`, { method: "DELETE" }); toast.success("Invitation withdrawn"); load() } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-y-3 px-6 py-4">
        <div>
          <Heading>Partners</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Investors, publishers and authors. Only people you invite can sign up, at <span className="text-ui-fg-base">{portalUrl}</span>. One person can hold several roles.
          </Text>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr] md:items-end">
          <div><Label size="small">Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label size="small">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label size="small">Organization (optional)</Label><Input value={form.organization} placeholder="Publishing house, company, foundation" onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {ROLES.map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 txt-compact-small">
              <Checkbox checked={(form as any)[k]} onCheckedChange={(v) => setForm({ ...form, [k]: !!v })} /> {l}
            </label>
          ))}
          <Button isLoading={saving} onClick={invite}>Invite partner</Button>
        </div>
      </Container>

      <Container className="p-0">
        {partners.length === 0 ? (
          <Text className="px-6 py-6 text-ui-fg-subtle">No partners yet. Invite your first investor, publisher or author above.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Partner</Table.HeaderCell>
                <Table.HeaderCell>Roles</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Capital received</Table.HeaderCell>
                <Table.HeaderCell>Owed / paid to them</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {partners.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <div className="flex flex-col py-1">
                      <span className="txt-compact-small-plus">{p.full_name}{p.organization ? ` · ${p.organization}` : ""}</span>
                      <span className="txt-compact-xsmall text-ui-fg-subtle">{p.email}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1 py-1">
                      {ROLES.map(([k, l]) => (
                        <label key={k} className="flex items-center gap-2 txt-compact-xsmall">
                          <Checkbox checked={!!p[k]} onCheckedChange={(v) => update(p, { [k]: !!v }, `${l} role ${v ? "added" : "removed"}`)} /> {l}
                        </label>
                      ))}
                    </div>
                  </Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge></Table.Cell>
                  <Table.Cell>
                    {p.is_investor ? (
                      <div className="flex flex-col">
                        <span>{money(p.capital_received)}</span>
                        {p.capital_pledged > 0 && <span className="txt-compact-xsmall text-ui-fg-subtle">+ {money(p.capital_pledged)} pledged</span>}
                      </div>
                    ) : "—"}
                  </Table.Cell>
                  <Table.Cell>{p.owed || p.paid ? `${money(p.owed)} / ${money(p.paid)}` : "—"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      {p.status === "invited" && <Button size="small" variant="secondary" onClick={() => copyInvite(p)}>Copy invitation</Button>}
                      {p.status === "invited" && <Button size="small" variant="transparent" onClick={() => remove(p)}>Withdraw</Button>}
                      {p.status === "active" && <Button size="small" variant="transparent" onClick={() => update(p, { status: "suspended" }, "Partner paused")}>Pause</Button>}
                      {p.status === "suspended" && <Button size="small" variant="secondary" onClick={() => update(p, { status: "active" }, "Partner re-activated")}>Re-activate</Button>}
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

export const config = defineRouteConfig({ label: "Partners", icon: UserGroup })
export default PartnersPage
