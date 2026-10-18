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
    // Investors, publishers and authors use the same customer accounts on /partners
    {
      matcher: "/partner/register",
      middlewares: [authenticate("customer", ["bearer"], { allowUnregistered: true })],
    },
    { matcher: "/partner/me", middlewares: [authenticate("customer", ["bearer"])] },
    { matcher: "/partner/dashboard", middlewares: [authenticate("customer", ["bearer"])] },
    { matcher: "/partner/opportunities*", middlewares: [authenticate("customer", ["bearer"])] },
    { matcher: "/partner/book-projects*", middlewares: [authenticate("customer", ["bearer"])] },
  ],
})
