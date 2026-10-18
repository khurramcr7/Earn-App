# Aalim Books — Scholar Earn

Aalim Books posts paid projects (translation, review, proofreading, typesetting, research, teaching).
Invited scholars apply, are chosen, hand in their work and get paid once it is approved.

Built on **Medusa 2.21** with one custom module (`src/modules/earn`).

**Partners:** investors fund whole books (translation, proofreading, typesetting, publishing, printing, fatwā review), publishers propose books and report sales, and authors follow their books and royalties. Each has their own dashboard at `/partners`.

## Who uses what

| Who | Where | What they do |
| --- | --- | --- |
| Aalim Books (admin) | `/app` → **Scholar Projects**, **Scholars**, **Scholar Payments** | Post projects, invite scholars, choose who does a project, approve work or ask for changes, mark payments as paid |
| Scholars | `/portal` | Create an account (invited emails only), browse open projects, apply, hand in work as a link, see payments, set how they want to be paid |
| Aalim Books (admin) | `/app` → **Partners**, **Book Projects**, **Partner Payments** | Invite investors / publishers / authors, set each book's terms, confirm money received, link scholar work to books, approve sales, pay royalties and profit shares |
| Investors | `/partners` | See books raising funds and their terms, pledge, follow their portfolio (work stages, words translated, copies sold) and their profit shares |
| Publishers | `/partners` | Propose books, follow funding and production, report sales per period |
| Authors | `/partners` | Follow their books, copies sold and royalties; if they are also a scholar, see their translation work (same account) |

## How a project moves

1. **Open** — you post it; every active scholar sees it.
2. Scholars **apply** (optionally with their own price and days needed).
3. You **choose a scholar** → project is **In progress**; other applicants are marked "not chosen".
4. The scholar **hands in** a link → **Waiting for your review**.
5. You **ask for changes** (back to step 4) or **approve**.
6. Approving creates a **payment owed** (the scholar's agreed price, else the project budget — you can override the amount).
7. You send the money (bank, JazzCash, Easypaisa, Payoneer, Wise) and **mark it paid** with the transaction ID. The scholar sees it immediately.

## How a book is funded and shared out

1. **Book project** — you create it (or accept a publisher's proposal) and set the terms:
   funding model, goal, investors' share of net profit, author royalty, and a link to the signed agreement.
2. **Raising funds** — investors see it on `/partners`, read the terms and pledge. Pledges stop at the goal.
3. **Money received** — you mark each pledge *received* with the transaction ID. Only received money counts as capital.
4. **Work** — post scholar projects linked to the book (translation, review, proofreading, typesetting, publishing,
   printing, fatwā review). Their progress shows as stages; their fees count as spending on the book.
5. **Sales** — the publisher reports sales per period (or you enter them). When you approve a period:
   - author royalty = revenue × royalty %
   - net profit = revenue − costs − royalty
   - **profit share (muḍārabah):** if net profit > 0, investors get net profit × their share %, split by the capital
     each sent; the rest stays with Aalim Books as managing partner. A loss period pays investors nothing and is recorded.
   - **sponsorship (ṣadaqah / waqf):** no investor payments; investors follow the impact.
6. **Pay** — royalties and profit shares appear under **Partner Payments**; mark them paid with the transaction ID.

Money is stored as exact decimals (`numeric`), not floating point. The split is unit-tested
(`pnpm test:unit`) against figures proven exact with AQL Sāriʿ al-Ḥisāb.

> Before taking money from investors, have the agreement checked by a lawyer (securities rules) and by a Shariah
> adviser (muḍārabah terms). The app records and calculates; it does not replace those agreements.

## Run locally

```bash
cp .env.template .env        # set DATABASE_URL to a local Postgres
corepack enable              # uses the pnpm version pinned in package.json
pnpm install
pnpm exec medusa db:migrate
pnpm exec medusa user -e you@example.com -p a-strong-password
pnpm dev                  # admin: http://localhost:9000/app, portal: http://localhost:9000/portal
```

## Code map

- `src/modules/earn/models` — Scholar, Project, Application, Submission, Payout, Partner, BookProject, Commitment, SalesReport, Distribution
- `src/lib/funding.ts` — book statistics, the profit-share / royalty split, sales approval
- `src/api/partner/*` — partner API (signed-in investors, publishers and authors)
- `src/portal/partners.html` — the partners' dashboards (built into `src/api/partners/html.ts`)
- `src/api/admin/earn/*` — admin API (signed-in admin users only)
- `src/api/scholar/*` — scholar API (signed-in scholars only; `src/api/middlewares.ts`)
- `src/admin/routes/*` — the three admin dashboard pages
- `src/portal/portal.html` — the scholar portal; `npm run build` turns it into `src/api/portal/html.ts`
  (after editing the HTML locally, run `node scripts-build-portal.mjs`)

## Not included yet

- Email notifications (new project, you were chosen, payment sent) — needs an email provider in Medusa.
- Self-service password reset — for now, reset a scholar's password from the admin.
- File uploads — work is handed in as a Drive/Dropbox/OneDrive link.
