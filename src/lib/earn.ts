import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { EARN_MODULE } from "../modules/earn"
import type EarnModuleService from "../modules/earn/service"

export const earn = (req: MedusaRequest): EarnModuleService => req.scope.resolve(EARN_MODULE)

export const PROJECT_CATEGORIES = ["translation", "review", "proofreading", "typesetting", "research", "teaching", "other"] as const
export const PROJECT_STATUSES = ["draft", "open", "assigned", "in_review", "completed", "cancelled"] as const

export function body<T = Record<string, unknown>>(req: MedusaRequest): T {
  return ((req.body as T) || ({} as T))
}

export function str(v: unknown, field: string, opts: { required?: boolean; max?: number } = {}): string | null {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    if (opts.required) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} is required`)
    return null
  }
  if (typeof v !== "string") throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be text`)
  const s = v.trim()
  if (opts.max && s.length > opts.max) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} is too long (max ${opts.max})`)
  return s
}

export function num(v: unknown, field: string, opts: { required?: boolean; min?: number } = {}): number | null {
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} is required`)
    return null
  }
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be a number`)
  if (opts.min !== undefined && n < opts.min) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be at least ${opts.min}`)
  return n
}

export function oneOf<T extends readonly string[]>(v: unknown, list: T, field: string): T[number] | null {
  if (v === undefined || v === null || v === "") return null
  if (typeof v !== "string" || !list.includes(v)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be one of: ${list.join(", ")}`)
  }
  return v as T[number]
}

export function url(v: unknown, field: string): string {
  const s = str(v, field, { required: true, max: 2000 })!
  try {
    const u = new URL(s)
    if (!["http:", "https:"].includes(u.protocol)) throw new Error()
  } catch {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be a web link starting with https://`)
  }
  return s
}

export function date(v: unknown, field: string): Date | null {
  if (v === undefined || v === null || v === "") return null
  const d = new Date(String(v))
  if (isNaN(d.getTime())) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} must be a date`)
  return d
}

/** The active scholar behind a logged-in portal session. */
export async function currentScholar(req: AuthenticatedMedusaRequest) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Please sign in")
  const [scholar] = await earn(req).listScholars({ customer_id: customerId })
  if (!scholar) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This account is not linked to a scholar invitation")
  if (scholar.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your scholar account is paused. Please contact Aalim Books.")
  return scholar
}

/** Fields a scholar may see about a project (no internal notes). */
export function publicProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    source_reference: p.source_reference,
    word_count: p.word_count,
    budget: p.budget,
    currency: p.currency,
    deadline: p.deadline,
    status: p.status,
    created_at: p.created_at,
  }
}
