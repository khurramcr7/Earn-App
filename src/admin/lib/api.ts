/** Small fetch helper for the admin pages (uses the signed-in admin session). */
export async function api<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method || "GET",
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return data as T
}

export function money(amount: number | string | null | undefined, currency = "PKR") {
  const n = Number(amount || 0)
  return `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

export function totals(map: Record<string, number> | undefined) {
  const entries = Object.entries(map || {})
  return entries.length ? entries.map(([c, v]) => money(v, c)).join(" + ") : "—"
}

export const STATUS_COLOR: Record<string, "green" | "orange" | "blue" | "grey" | "red" | "purple"> = {
  draft: "grey", open: "blue", assigned: "purple", in_review: "orange", completed: "green", cancelled: "red",
  pending: "orange", accepted: "green", rejected: "red", withdrawn: "grey",
  submitted: "orange", approved: "green", changes_requested: "red",
  paid: "green", invited: "grey", active: "green", suspended: "red",
  proposed: "purple", fundraising: "orange", funded: "green", in_production: "blue", published: "green", closed: "grey",
  pledged: "orange", received: "green", refunded: "grey",
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", open: "Open", assigned: "In progress", in_review: "Waiting for your review",
  completed: "Completed", cancelled: "Cancelled", pending: "Pending", accepted: "Chosen", rejected: "Not chosen",
  withdrawn: "Withdrawn", submitted: "Waiting for review", approved: "Approved", changes_requested: "Changes requested",
  paid: "Paid", invited: "Invited (not signed up yet)", active: "Active", suspended: "Paused",
  proposed: "Proposed by publisher", fundraising: "Raising funds", funded: "Fully funded", in_production: "In production",
  published: "Published", closed: "Closed", pledged: "Pledged", received: "Received", refunded: "Refunded",
}

export const FUNDING_MODEL_LABEL: Record<string, string> = {
  profit_share: "Profit share (muḍārabah)", sponsorship: "Sponsorship (ṣadaqah / waqf)",
}

export const BOOK_STATUSES = [
  ["proposed", "Proposed by publisher"], ["draft", "Draft"], ["fundraising", "Raising funds"], ["funded", "Fully funded"],
  ["in_production", "In production"], ["published", "Published"], ["closed", "Closed"], ["cancelled", "Cancelled"],
] as const

export const CATEGORIES = [
  ["translation", "Translation"], ["review", "Translation review"], ["proofreading", "Proofreading"],
  ["typesetting", "Typesetting"], ["publishing", "Publishing"], ["printing", "Printing"], ["fatwa", "Fatwā review"], ["research", "Research"], ["teaching", "Teaching"], ["other", "Other"],
] as const
