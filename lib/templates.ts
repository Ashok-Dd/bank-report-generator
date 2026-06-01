import type { TemplateInfo } from "@/types";

export const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    id: "bank-intelligence-brief",
    name: "Bank Intelligence Brief",
    description:
      "Comprehensive 10-section intelligence report covering institution profile, financials, leadership, governance, technology posture, risk events, ESG, and engagement strategy.",
    filename: "bank-intelligence-template.pdf",
    placeholders: [
      "[Institution Name]",
      "[City, Country]",
      "[Ticker]",
      "[Period]",
      "[USD bn]",
      "[CEO Name]",
      "[CFO Name]",
      "[Risk Event 1]",
      "[Reference 1]",
      // ... (representative subset shown)
    ],
  },
];

export function getTemplateById(id: string): TemplateInfo | undefined {
  return AVAILABLE_TEMPLATES.find((t) => t.id === id);
}
