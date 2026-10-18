import { calculateSplit } from "../funding"

// Expected values were proven exact with AQL Sāriʿ al-Ḥisāb (`compute` / `verify_step`, seal FULLY_PROVEN, 18 Oct 2026).
describe("calculateSplit — profit share (muḍārabah) and royalty", () => {
  const base = { revenue: 500000, costs: 180000, royalty_pct: 10, has_author: true, funding_model: "profit_share" as const, investor_share_pct: 40 }

  it("pays royalty on revenue, then shares net profit pro rata to capital received", () => {
    const r = calculateSplit({ ...base, capital: [
      { partner_id: "A", amount: 300000 }, { partner_id: "B", amount: 150000 }, { partner_id: "C", amount: 50000 }] })
    expect(r.author_royalty).toBe(50000)
    expect(r.net_profit).toBe(270000)
    expect(r.investor_pool).toBe(108000)
    expect(r.managing_partner_share).toBe(162000)
    expect(Object.fromEntries(r.investors.map((i) => [i.partner_id, i.amount]))).toEqual({ A: 64800, B: 32400, C: 10800 })
  })

  it("adds up exactly when the pool does not divide evenly", () => {
    const r = calculateSplit({ ...base, revenue: 100000 / 0.4 + 0, costs: 0, royalty_pct: 0, investor_share_pct: 40,
      capital: [{ partner_id: "A", amount: 1 }, { partner_id: "B", amount: 1 }, { partner_id: "C", amount: 1 }] })
    expect(r.investor_pool).toBe(100000)
    expect(r.investors.reduce((a, i) => a + i.amount, 0)).toBeCloseTo(100000, 10)
    expect(r.investors.map((i) => i.amount).sort()).toEqual([33333.33, 33333.33, 33333.34])
  })

  it("adds several commitments from the same investor together", () => {
    const r = calculateSplit({ ...base, capital: [{ partner_id: "A", amount: 200000 }, { partner_id: "A", amount: 100000 }, { partner_id: "B", amount: 200000 }] })
    expect(r.investors.find((i) => i.partner_id === "A")!.capital).toBe(300000)
  })

  it("pays investors nothing in a loss period and records the loss", () => {
    const r = calculateSplit({ ...base, revenue: 100000, costs: 150000, capital: [{ partner_id: "A", amount: 1000 }] })
    expect(r.investor_pool).toBe(0)
    expect(r.loss).toBe(60000)                  // 100000 − 150000 − 10000 royalty
    expect(r.investors.every((i) => i.amount === 0)).toBe(true)
  })

  it("never pays investors on a sponsorship (waqf) book, but still pays the author", () => {
    const r = calculateSplit({ ...base, funding_model: "sponsorship", capital: [{ partner_id: "A", amount: 1000 }] })
    expect(r.investor_pool).toBe(0)
    expect(r.author_royalty).toBe(50000)
  })

  it("pays no royalty when the book has no author", () => {
    const r = calculateSplit({ ...base, has_author: false, capital: [] })
    expect(r.author_royalty).toBe(0)
    expect(r.investor_pool).toBe(0)             // no capital received → no pool
  })
})
