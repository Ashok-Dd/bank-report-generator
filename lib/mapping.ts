import type { BankIntelligenceData, PlaceholderMapping } from "@/types";

export function buildPlaceholderMapping(data: BankIntelligenceData): PlaceholderMapping {
  const mapping: PlaceholderMapping = {};
  const { institutionProfile: ip } = data;

  // ── Section 1: Institution Profile ─────────────────────────────────────────
  mapping["[Institution Name]"] = ip.institutionName || "";
  mapping["[Name]"] = ip.institutionName || "";
  mapping["[City, Country]"] = ip.headquarters || "";
  mapping["[Ticker]"] = ip.ticker
    ? ip.exchange
      ? `${ip.ticker} / ${ip.exchange}`
      : ip.ticker
    : "";
  mapping["[Period]"] = ip.reportPeriod || "";
  mapping["[USD bn]"] = ip.totalAssets || "";
  mapping["[Number]"] = ip.totalEmployees || "";
  mapping["[Description]"] = ip.clientBase || "";
  mapping["[Regions]"] = ip.geographicFootprint || "";
  mapping["[Investor]"] = ip.keyStrategicInvestor || "";
  mapping["[Milestone]"] = ip.anniversaryMilestone || "";

  // ── Section 2: Financial Highlights ────────────────────────────────────────
  const fh = data.financialHighlights || [];
  const fhMap: { [key: string]: string } = {
    "Net Revenue": "netRevenue",
    "Net Income": "netIncome",
    "Return on Equity": "roe",
    "CET1 Ratio": "cet1",
    "Cost-to-Income Ratio": "costIncome",
    "Non-Performing Loans": "npl",
  };

  // Map by metric name for known rows
  for (const [metricName] of Object.entries(fhMap)) {
    const found = fh.find(
      (h) => h.metric.toLowerCase() === metricName.toLowerCase()
    );
    if (found) {
      mapping[`[${metricName} Value]`] = found.value || "";
      mapping[`[${metricName} Period]`] = found.period || "";
      mapping[`[${metricName} YoY]`] = found.yoyChange || "";
    }
  }

  // Also map generic [Value], [YoY] for first item (template default placeholders)
  fh.forEach((h, i) => {
    const n = i + 1;
    mapping[`[FH${n} Metric]`] = h.metric || "";
    mapping[`[FH${n} Value]`] = h.value || "";
    mapping[`[FH${n} Period]`] = h.period || "";
    mapping[`[FH${n} YoY]`] = h.yoyChange || "";
    mapping[`[FH${n} Notes]`] = h.notes || "";
    mapping[`[FH${n} Ref]`] = h.reference || "";
  });

  // ── Section 3: Executive Leadership ────────────────────────────────────────
  const el = data.executiveLeadership;
  mapping["[CEO Name]"] = el.ceo || "";
  mapping["[CFO Name]"] = el.cfo || "";
  mapping["[COO Name]"] = el.coo || "";
  mapping["[CRO Name]"] = el.cro || "";
  mapping["[CTO Name]"] = el.cto || "";
  mapping["[CCO Name]"] = el.cco || "";
  mapping["[Head of Retail Banking Name]"] = el.headOfRetailBanking || "";

  (el.backgroundNotes || []).forEach((note, i) => {
    mapping[`[Executive background note ${i + 1}]`] = note || "";
  });

  // ── Section 4: Board of Directors Changes ──────────────────────────────────
  const bc = data.boardChanges || [];
  bc.forEach((b, i) => {
    const n = i + 1;
    mapping[`[Director Name ${n}]`] = b.directorName || "";
    mapping[`[Director Event ${n}]`] = b.event || "";
    mapping[`[Director Date ${n}]`] = b.effectiveDate || "";
    mapping[`[Director Relevance ${n}]`] = b.relevance || "";
    mapping[`[Director Ref ${n}]`] = b.reference || "";
  });

  // ── Section 5: Strategic Priorities ────────────────────────────────────────
  const sp = data.strategicPriorities || [];
  sp.forEach((p, i) => {
    const n = i + 1;
    mapping[`[Priority ${n}]`] = p.priority || "";
    mapping[`[Priority ${n} Details]`] = p.details || "";
    mapping[`[Priority ${n} Timeline]`] = p.timeline || "";
    mapping[`[Priority ${n} Outcome]`] = p.keyOutcome || "";
    mapping[`[Priority ${n} Ref]`] = p.reference || "";
  });

  // ── Section 6: Technology & AI Posture ─────────────────────────────────────
  const tp = data.technologyPosture;
  if (tp) {
    const techRows: [keyof typeof tp, string][] = [
      ["coreBankingPlatform", "Core Banking Platform"],
      ["cloudStrategy", "Cloud Strategy"],
      ["aiMlInitiatives", "AI / ML Initiatives"],
      ["cybersecurityPosture", "Cybersecurity Posture"],
      ["digitalMobileBanking", "Digital / Mobile Banking"],
      ["dataAnalytics", "Data & Analytics"],
      ["regtechSuptech", "RegTech / SupTech Adoption"],
    ];
    techRows.forEach(([key, label]) => {
      const dim = tp[key];
      if (dim) {
        mapping[`[${label} Details]`] = dim.details || "";
        mapping[`[${label} Status]`] = dim.status || "";
        mapping[`[${label} Ref]`] = dim.reference || "";
      }
    });
  }

  // ── Section 7: Governance & Compliance ─────────────────────────────────────
  const gov = data.governance || [];
  gov.forEach((g, i) => {
    const n = i + 1;
    mapping[`[Gov${n} Area]`] = g.area || "";
    mapping[`[Gov${n} Details]`] = g.details || "";
    mapping[`[Gov${n} Effective]`] = g.effective || "";
    mapping[`[Gov${n} Mechanism]`] = g.keyMechanism || "";
    mapping[`[Gov${n} Ref]`] = g.reference || "";
  });

  // ── Section 8: Risk Events ──────────────────────────────────────────────────
  const re = data.riskEvents || [];
  re.forEach((r, i) => {
    const n = i + 1;
    mapping[`[Risk Event ${n}]`] = r.incident || "";
    mapping[`[Risk Date ${n}]`] = r.date || "";
    mapping[`[Risk Category ${n}]`] = r.category || "";
    mapping[`[Risk Impact ${n}]`] = r.impact || "";
    mapping[`[Risk Ref ${n}]`] = r.reference || "";
  });

  const ra = data.riskResponseActions || [];
  ra.forEach((action, i) => {
    mapping[`[Response action ${i + 1}]`] = action || "";
  });

  // ── Section 9: ESG & Community ─────────────────────────────────────────────
  const esg = data.esgCommitments || [];
  esg.forEach((e, i) => {
    const n = i + 1;
    mapping[`[ESG${n} Area]`] = e.area || "";
    mapping[`[ESG${n} Commitment]`] = e.commitment || "";
    mapping[`[ESG${n} Progress]`] = e.progress || "";
    mapping[`[ESG${n} Period]`] = e.period || "";
    mapping[`[ESG${n} Ref]`] = e.reference || "";
  });

  // ── Section 10: Engagement Intelligence ────────────────────────────────────
  const et = data.engagementTargets || [];
  et.forEach((t, i) => {
    const n = i + 1;
    mapping[`[Role ${n}]`] = t.role || "";
    mapping[`[Contact ${n}]`] = t.contact || "";
    mapping[`[Engagement hook ${n}]`] = t.engagementHook || "";
  });

  const ket = data.keyEngagementThemes || [];
  ket.forEach((theme, i) => {
    const n = i + 1;
    mapping[`[Engagement Executive ${n}]`] = theme.executive || "";
    mapping[`[Engagement Theme ${n}]`] = theme.theme || "";
  });

  // ── References ──────────────────────────────────────────────────────────────
  const refs = data.references || [];
  refs.forEach((ref, i) => {
    mapping[`[Reference ${i + 1}]`] = ref || "";
    mapping[`[Ref ${i + 1}]`] = ref || "";
  });

  return mapping;
}

/**
 * Scan text for unreplaced template placeholders (still in [Bracket] format)
 */
export function findUnreplacedPlaceholders(text: string): string[] {
  const regex = /\[[^\]]+\]/g;
  const found = text.match(regex) || [];
  return [...new Set(found)];
}
