import { Input, Label, Textarea } from "@medusajs/ui"
import { FUNDING_MODEL_LABEL } from "./api"

const sel = "bg-ui-bg-field shadow-borders-base txt-compact-small h-8 w-full rounded-md px-2"

export const BookFields = ({ form, set, partners }: { form: any; set: (k: string) => (e: any) => void; partners: any[] }) => (
  <>
    <div><Label>Title (English)</Label><Input value={form.title} onChange={set("title")} /></div>
    <div><Label>Title (Arabic, optional)</Label><Input dir="rtl" lang="ar" value={form.title_ar || ""} onChange={set("title_ar")} /></div>
    <div><Label>About the book (investors see this)</Label><Textarea rows={5} value={form.description} onChange={set("description")} /></div>
    <div><Label>Source text</Label><Input value={form.source_reference || ""} onChange={set("source_reference")} placeholder="Edition, Shamela ID, link" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><Label>Funding model</Label>
        <select className={sel} value={form.funding_model} onChange={set("funding_model")}>
          {Object.entries(FUNDING_MODEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-2">
        <div><Label>Funding goal</Label><Input type="number" min={0} value={form.funding_goal} onChange={set("funding_goal")} /></div>
        <div><Label>Currency</Label><Input maxLength={3} value={form.currency} onChange={set("currency")} /></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div><Label>Investors' share of net profit (%)</Label><Input type="number" min={0} max={100} disabled={form.funding_model !== "profit_share"} value={form.investor_profit_share_pct ?? ""} onChange={set("investor_profit_share_pct")} /></div>
      <div><Label>Author royalty (% of revenue)</Label><Input type="number" min={0} max={100} value={form.author_royalty_pct ?? ""} onChange={set("author_royalty_pct")} /></div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div><Label>Publisher</Label>
        <select className={sel} value={form.publisher_id || ""} onChange={set("publisher_id")}>
          <option value="">Aalim Books</option>
          {partners.filter((p) => p.is_publisher).map((p) => <option key={p.id} value={p.id}>{p.full_name}{p.organization ? ` · ${p.organization}` : ""}</option>)}
        </select>
      </div>
      <div><Label>Living author (royalties)</Label>
        <select className={sel} value={form.author_id || ""} onChange={set("author_id")}>
          <option value="">None (classical work)</option>
          {partners.filter((p) => p.is_author).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>
    </div>
    <div><Label>Signed agreement / terms link</Label><Input value={form.agreement_url || ""} onChange={set("agreement_url")} placeholder="https://… (investors must be able to read it before pledging)" /></div>
  </>
)

export const cleanBook = (form: any) => {
  const out: Record<string, unknown> = { ...form }
  for (const k of ["investor_profit_share_pct", "author_royalty_pct", "publisher_id", "author_id", "title_ar", "source_reference", "agreement_url"]) if (out[k] === "") out[k] = null
  return out
}

