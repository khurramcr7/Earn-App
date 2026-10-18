# Aalim Books — Scholar Earn

Aalim Books posts paid projects (translation, review, proofreading, typesetting, research, teaching).
Invited scholars apply, are chosen, hand in their work and get paid once it is approved.

Built on **Medusa 2.21** with one custom module (`src/modules/earn`).

## Who uses what

| Who | Where | What they do |
| --- | --- | --- |
| Aalim Books (admin) | `/app` → **Scholar Projects**, **Scholars**, **Scholar Payments** | Post projects, invite scholars, choose who does a project, approve work or ask for changes, mark payments as paid |
| Scholars | `/portal` | Create an account (invited emails only), browse open projects, apply, hand in work as a link, see payments, set how they want to be paid |

## How a project moves

1. **Open** — you post it; every active scholar sees it.
2. Scholars **apply** (optionally with their own price and days needed).
3. You **choose a scholar** → project is **In progress**; other applicants are marked "not chosen".
4. The scholar **hands in** a link → **Waiting for your review**.
5. You **ask for changes** (back to step 4) or **approve**.
6. Approving creates a **payment owed** (the scholar's agreed price, else the project budget — you can override the amount).
7. You send the money (bank, JazzCash, Easypaisa, Payoneer, Wise) and **mark it paid** with the transaction ID. The scholar sees it immediately.

## Run locally

```bash
cp .env.template .env        # set DATABASE_URL to a local Postgres
npm install
npx medusa db:migrate
npx medusa user -e you@example.com -p a-strong-password
npm run dev                  # admin: http://localhost:9000/app, portal: http://localhost:9000/portal
```

## Code map

- `src/modules/earn/models` — Scholar, Project, Application, Submission, Payout
- `src/api/admin/earn/*` — admin API (signed-in admin users only)
- `src/api/scholar/*` — scholar API (signed-in scholars only; `src/api/middlewares.ts`)
- `src/admin/routes/*` — the three admin dashboard pages
- `src/portal/portal.html` — the scholar portal; `npm run build` turns it into `src/api/portal/html.ts`
  (after editing the HTML locally, run `node scripts-build-portal.mjs`)

## Not included yet

- Email notifications (new project, you were chosen, payment sent) — needs an email provider in Medusa.
- Self-service password reset — for now, reset a scholar's password from the admin.
- File uploads — work is handed in as a Drive/Dropbox/OneDrive link.
