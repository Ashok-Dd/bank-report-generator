"use client";

import { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Hash,
  Layout,
  Users,
  TrendingUp,
  Shield,
  Cpu,
  Leaf,
  Target,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Section {
  number: number;
  title: string;
  icon: React.ReactNode;
  placeholders: string[];
  pages?: string;
}

const TEMPLATE_SECTIONS: Section[] = [
  {
    number: 1,
    title: "Institution Profile",
    icon: <Layout className="w-3.5 h-3.5" />,
    pages: "p.1",
    placeholders: [
      "[Institution Name]",
      "[City, Country]",
      "[Ticker]",
      "[Period]",
      "[USD bn]",
      "[Number]",
      "[Description]",
      "[Regions]",
      "[Investor]",
      "[Milestone]",
    ],
  },
  {
    number: 2,
    title: "Financial Highlights",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    pages: "p.1",
    placeholders: [
      "[FH1 Value]",
      "[FH1 Period]",
      "[FH1 YoY]",
      "[FH2 Value]",
      "[FH2 Period]",
      "...up to 6 metrics",
    ],
  },
  {
    number: 3,
    title: "Executive Leadership Registry",
    icon: <Users className="w-3.5 h-3.5" />,
    pages: "p.1–2",
    placeholders: [
      "[CEO Name]",
      "[CFO Name]",
      "[COO Name]",
      "[CRO Name]",
      "[CTO Name]",
      "[CCO Name]",
      "[Executive background note 1–4]",
    ],
  },
  {
    number: 4,
    title: "Board of Directors Changes",
    icon: <Hash className="w-3.5 h-3.5" />,
    pages: "p.2",
    placeholders: [
      "[Director Name 1–5]",
      "[Director Event 1–5]",
      "[Director Date 1–5]",
      "[Director Relevance 1–5]",
    ],
  },
  {
    number: 5,
    title: "Strategic Priorities",
    icon: <Target className="w-3.5 h-3.5" />,
    pages: "p.2",
    placeholders: [
      "[Priority 1–5]",
      "[Priority N Details]",
      "[Priority N Timeline]",
      "[Priority N Outcome]",
    ],
  },
  {
    number: 6,
    title: "Technology and AI Posture",
    icon: <Cpu className="w-3.5 h-3.5" />,
    pages: "p.2",
    placeholders: [
      "[Core Banking Platform Details]",
      "[Cloud Strategy Details]",
      "[AI / ML Initiatives Details]",
      "[Cybersecurity Posture Details]",
    ],
  },
  {
    number: 7,
    title: "Governance and Compliance",
    icon: <Shield className="w-3.5 h-3.5" />,
    pages: "p.3",
    placeholders: [
      "[Gov1 Details]",
      "[Gov1 Effective]",
      "[Gov1 Mechanism]",
      "...6 governance areas",
    ],
  },
  {
    number: 8,
    title: "Risk Events and Incidents",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    pages: "p.3",
    placeholders: [
      "[Risk Event 1–5]",
      "[Risk Date 1–5]",
      "[Risk Category 1–5]",
      "[Response action 1–4]",
    ],
  },
  {
    number: 9,
    title: "ESG and Community Commitments",
    icon: <Leaf className="w-3.5 h-3.5" />,
    pages: "p.4",
    placeholders: [
      "[ESG1 Commitment]",
      "[ESG1 Progress]",
      "[ESG1 Period]",
      "...6 ESG areas",
    ],
  },
  {
    number: 10,
    title: "Engagement Intelligence",
    icon: <Target className="w-3.5 h-3.5" />,
    pages: "p.4",
    placeholders: [
      "[Role 1–5]",
      "[Contact 1–5]",
      "[Engagement hook 1–5]",
      "[Reference 1–20]",
    ],
  },
];

interface SectionRowProps {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}

function SectionRow({ section, isOpen, onToggle }: SectionRowProps) {
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 p-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          {section.number}
        </div>
        <span className="flex-1 text-sm font-medium text-slate-700 truncate">
          {section.title}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {section.pages && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {section.pages}
            </Badge>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 bg-slate-50 border-t border-slate-100">
          <div className="mt-2 flex flex-wrap gap-1">
            {section.placeholders.map((ph, i) => (
              <code
                key={i}
                className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 font-mono"
              >
                {ph}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TemplatePreview() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([1]));

  const toggleSection = (num: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const totalPlaceholders = TEMPLATE_SECTIONS.reduce(
    (sum, s) => sum + s.placeholders.length,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg mb-4">
        <div className="w-9 h-12 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Bank Intelligence Brief
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            bank-intelligence-template.pdf
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-500 border-0">
              5 pages
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500 border-0">
              10 sections
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-violet-500 border-0">
              50+ placeholders
            </Badge>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Template Structure
        </span>
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={() =>
            setOpenSections(
              openSections.size === TEMPLATE_SECTIONS.length
                ? new Set()
                : new Set(TEMPLATE_SECTIONS.map((s) => s.number))
            )
          }
        >
          {openSections.size === TEMPLATE_SECTIONS.length
            ? "Collapse all"
            : "Expand all"}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 pr-1">
          {TEMPLATE_SECTIONS.map((section) => (
            <SectionRow
              key={section.number}
              section={section}
              isOpen={openSections.has(section.number)}
              onToggle={() => toggleSection(section.number)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
