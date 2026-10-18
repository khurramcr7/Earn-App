import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PORTAL_HTML } from "./html"

// GET /portal — the scholars' web page (sign in, projects, hand in work, payments)
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache")
  res.send(PORTAL_HTML)
}
