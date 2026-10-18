import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows"
import { earn, body, str } from "../../../lib/earn"

/**
 * POST /partner/register — finish sign-up for an INVITED investor / publisher / author.
 * Same flow as scholars: register email+password at /auth/customer/emailpass/register, send that token here.
 * A person who is already a scholar keeps their one account (same email, same password).
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = earn(req)
  const b = body(req)
  const authIdentityId = req.auth_context?.auth_identity_id
  if (!authIdentityId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Please sign up first")
  const authModule = req.scope.resolve(Modules.AUTH)
  const identity = await authModule.retrieveAuthIdentity(authIdentityId, { relations: ["provider_identities"] })
  const email = identity.provider_identities?.find((p) => p.provider === "emailpass")?.entity_id?.toLowerCase()
  if (!email) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Could not read the sign-up email")

  const [partner] = await svc.listPartners({ email })
  if (!partner) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This email has not been invited yet. Please ask Aalim Books to invite you.")
  if (partner.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This account is paused.")

  const [scholar] = await svc.listScholars({ email })
  let customerId = req.auth_context.actor_id || partner.customer_id || scholar?.customer_id || null
  if (!customerId) {
    const fullName = str(b.full_name, "Name", { max: 200 }) || partner.full_name
    const [first, ...rest] = fullName.split(/\s+/)
    const { result } = await createCustomerAccountWorkflow(req.scope).run({
      input: { authIdentityId, customerData: { email, first_name: first, last_name: rest.join(" ") || undefined, phone: str(b.phone, "Phone", { max: 50 }) || undefined } },
    })
    customerId = result.id
  }
  const updated = await svc.updatePartners({
    id: partner.id, status: "active", customer_id: customerId,
    full_name: str(b.full_name, "Name", { max: 200 }) || partner.full_name,
    phone: str(b.phone, "Phone", { max: 50 }) ?? partner.phone,
    country: str(b.country, "Country", { max: 100 }) ?? partner.country,
  })
  res.json({ partner: { id: updated.id, full_name: updated.full_name, email: updated.email }, needs_login: true })
}
