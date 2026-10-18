import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows"
import { earn, body, str } from "../../../lib/earn"

/**
 * POST /scholar/register — finish sign-up for an INVITED email.
 * The caller first registers email+password at /auth/customer/emailpass/register
 * and sends that token here. Only emails Aalim Books invited are accepted.
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

  const [scholar] = await svc.listScholars({ email })
  if (!scholar) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This email has not been invited yet. Please ask Aalim Books to invite you."
    )
  }
  if (scholar.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This scholar account is paused.")

  let customerId = req.auth_context.actor_id || scholar.customer_id
  if (!customerId) {
    const fullName = str(b.full_name, "Name", { max: 200 }) || scholar.full_name
    const [first, ...rest] = fullName.split(/\s+/)
    const { result } = await createCustomerAccountWorkflow(req.scope).run({
      input: {
        authIdentityId,
        customerData: { email, first_name: first, last_name: rest.join(" ") || undefined, phone: str(b.phone, "Phone", { max: 50 }) || undefined },
      },
    })
    customerId = result.id
  }

  const updated = await svc.updateScholars({
    id: scholar.id,
    status: "active",
    customer_id: customerId,
    full_name: str(b.full_name, "Name", { max: 200 }) || scholar.full_name,
    phone: str(b.phone, "Phone", { max: 50 }) ?? scholar.phone,
    country: str(b.country, "Country", { max: 100 }) ?? scholar.country,
    specialties: str(b.specialties, "Specialties", { max: 1000 }) ?? scholar.specialties,
  })
  res.json({ scholar: { id: updated.id, full_name: updated.full_name, email: updated.email }, needs_login: true })
}
