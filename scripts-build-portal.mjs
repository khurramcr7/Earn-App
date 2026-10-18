// Turns src/portal/portal.html into a TypeScript module so the backend can serve it.
// Run after editing the portal:  node scripts-build-portal.mjs
import { readFileSync, writeFileSync } from "node:fs"
const html = readFileSync("src/portal/portal.html", "utf8")
writeFileSync(
  "src/api/portal/html.ts",
  "// Generated from src/portal/portal.html by scripts-build-portal.mjs — edit the .html file, not this one.\n" +
    "export const PORTAL_HTML = " + JSON.stringify(html) + "\n"
)
console.log("portal html.ts written", html.length, "chars")
