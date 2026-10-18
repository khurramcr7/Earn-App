import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

/**
 * Scholars sign in with Medusa's built-in customer accounts (email + password).
 * /scholar/register accepts a fresh sign-up token that has no account yet.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/scholar/register",
      middlewares: [authenticate("customer", ["bearer"], { allowUnregistered: true })],
    },
    { matcher: "/scholar/me", middlewares: [authenticate("customer", ["bearer"])] },
    { matcher: "/scholar/projects*", middlewares: [authenticate("customer", ["bearer"])] },
    { matcher: "/scholar/earnings", middlewares: [authenticate("customer", ["bearer"])] },
  ],
})
