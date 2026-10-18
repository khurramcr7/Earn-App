import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PARTNERS_HTML } from "./html"

// GET /partners — the investors', publishers' and authors' web page
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache")
  res.send(PARTNERS_HTML)
}
