// Turns the portal pages into TypeScript modules so the backend can serve them.
// Run after editing a portal page:  node scripts-build-portal.mjs
import { readFileSync, writeFileSync } from "node:fs"
for (const [src, out, name] of [
  ["src/portal/portal.html", "src/api/portal/html.ts", "PORTAL_HTML"],
  ["src/portal/partners.html", "src/api/partners/html.ts", "PARTNERS_HTML"],
]) {
  const html = readFileSync(src, "utf8")
  writeFileSync(out,
    `// Generated from ${src} by scripts-build-portal.mjs — edit the .html file, not this one.\n` +
    `export const ${name} = ` + JSON.stringify(html) + "\n")
  console.log(out, "written", html.length, "chars")
}
