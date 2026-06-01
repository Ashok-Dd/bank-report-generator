"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelector } from "./template-selector";
import { TemplatePreview } from "./template-preview";
import { JsonEditor } from "./json-editor";
import {
  GenerationPanel,
  type GenerationStatus,
} from "./generation-panel";
import { generatePDFAction } from "@/actions/generate-pdf";
import { Building2, FileText, Code2 } from "lucide-react";

export function Dashboard() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    "bank-intelligence-brief"
  );
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [genError, setGenError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [replacedCount, setReplacedCount] = useState<number | undefined>();
  const [missingPlaceholders, setMissingPlaceholders] = useState<string[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [institutionName, setInstitutionName] = useState<string | undefined>();

  const isJsonValid = (() => {
    if (!jsonValue.trim()) return false;
    try {
      JSON.parse(jsonValue);
      return true;
    } catch {
      return false;
    }
  })();

  const handleJsonChange = useCallback((value: string) => {
    setJsonValue(value);
    setJsonError(null);
    if (status !== "idle") setStatus("idle");
  }, [status]);

  const handleGenerate = async () => {
    if (!jsonValue.trim()) return;

    // Validate
    let parsed: any;
    try {
      parsed = JSON.parse(jsonValue);
    } catch (e) {
      setJsonError("Invalid JSON syntax");
      return;
    }

    setStatus("validating");
    setGenError(null);
    setWarnings([]);
    setMissingPlaceholders([]);
    setPdfBase64(undefined);

    // Extract institution name for filename
    try {
      const name = parsed?.institutionProfile?.institutionName;
      if (name) setInstitutionName(name);
    } catch {}

    setTimeout(() => setStatus("generating"), 300);

    const result = await generatePDFAction(jsonValue, selectedTemplateId);

    if (result.success && result.pdfBase64) {
      setStatus("success");
      setPdfBase64(result.pdfBase64);
      setReplacedCount(result.replacedCount);
      setMissingPlaceholders(result.missingPlaceholders ?? []);
      setWarnings(result.warnings ?? []);
    } else {
      setStatus("error");
      setGenError(result.error ?? "Generation failed");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setPdfBase64(undefined);
    setGenError(null);
    setWarnings([]);
    setMissingPlaceholders([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">CoComply</span>
              <span className="text-slate-300 mx-2 text-xs">·</span>
              <span className="text-sm text-slate-500">
                Bank Intelligence Brief Generator
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:block">Powered by pdf-lib · Next.js 15</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">

          {/* LEFT: Template selector + preview */}
          <aside className="space-y-6">
            <TemplateSelector
              selectedId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />
            <div className="h-px bg-slate-200" />
            <div className="h-[480px]">
              <TemplatePreview />
            </div>
          </aside>

          {/* CENTER: JSON Editor */}
          <main className="min-h-[700px]">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Data Input
                </h2>
                <span className="text-xs text-slate-400 ml-1">
                  JSON format · Structured per template schema
                </span>
              </div>

              <div className="flex-1 p-5 min-h-[600px]">
                <Tabs defaultValue="editor" className="h-full flex flex-col">
                  <TabsList className="w-fit mb-4">
                    <TabsTrigger value="editor" className="text-xs gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      JSON Editor
                    </TabsTrigger>
                    <TabsTrigger value="schema" className="text-xs gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Schema Reference
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="flex-1 flex flex-col mt-0">
                    <JsonEditor
                      value={jsonValue}
                      onChange={handleJsonChange}
                      error={jsonError}
                    />
                  </TabsContent>

                  <TabsContent value="schema" className="flex-1 mt-0">
                    <SchemaReference />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>

          {/* RIGHT: Generation panel */}
          <aside>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Generate PDF
                </h2>
              </div>

              <GenerationPanel
                status={status}
                error={genError}
                warnings={warnings}
                replacedCount={replacedCount}
                missingPlaceholders={missingPlaceholders}
                pdfBase64={pdfBase64}
                institutionName={institutionName}
                onGenerate={handleGenerate}
                onReset={handleReset}
                isJsonValid={isJsonValid}
                hasJson={!!jsonValue.trim()}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Inline schema reference ──────────────────────────────────────────────────
function SchemaReference() {
  const schema = [
    {
      key: "institutionProfile",
      type: "object",
      required: true,
      fields: [
        "institutionName (string) *",
        "headquarters (string) *",
        "ticker (string) *",
        "exchange (string)",
        "reportPeriod (string) *",
        "totalAssets (string) *",
        "totalEmployees (string)",
        "clientBase (string)",
        "geographicFootprint (string)",
        "keyStrategicInvestor (string)",
        "anniversaryMilestone (string)",
      ],
    },
    {
      key: "financialHighlights",
      type: "array of objects",
      required: true,
      fields: [
        "metric (string) *",
        "value (string) *",
        "period (string) *",
        "yoyChange (string)",
        "notes (string)",
        "reference (string)",
      ],
    },
    {
      key: "executiveLeadership",
      type: "object",
      required: true,
      fields: [
        "ceo (string) *",
        "cfo (string) *",
        "coo (string)",
        "cro (string)",
        "cto (string)",
        "cco (string)",
        "headOfRetailBanking (string)",
        "backgroundNotes (string[])",
      ],
    },
    {
      key: "boardChanges",
      type: "array",
      required: false,
      fields: ["directorName *", "event *", "effectiveDate *", "relevance"],
    },
    {
      key: "strategicPriorities",
      type: "array",
      required: false,
      fields: ["priority *", "details *", "timeline", "keyOutcome"],
    },
    {
      key: "technologyPosture",
      type: "object",
      required: false,
      fields: [
        "coreBankingPlatform { details, status }",
        "cloudStrategy { details, status }",
        "aiMlInitiatives { details, status }",
        "cybersecurityPosture { details, status }",
        "digitalMobileBanking { details, status }",
        "dataAnalytics { details, status }",
        "regtechSuptech { details, status }",
      ],
    },
    {
      key: "governance",
      type: "array",
      required: false,
      fields: ["area *", "details", "effective", "keyMechanism"],
    },
    {
      key: "riskEvents",
      type: "array",
      required: false,
      fields: ["incident *", "date *", "category", "impact"],
    },
    {
      key: "riskResponseActions",
      type: "string[]",
      required: false,
      fields: [],
    },
    {
      key: "esgCommitments",
      type: "array",
      required: false,
      fields: ["area *", "commitment", "progress", "period"],
    },
    {
      key: "engagementTargets",
      type: "array",
      required: false,
      fields: ["role *", "contact *", "engagementHook"],
    },
    {
      key: "keyEngagementThemes",
      type: "array",
      required: false,
      fields: ["executive", "theme"],
    },
    {
      key: "references",
      type: "string[]",
      required: false,
      fields: [],
    },
  ];

  return (
    <div className="space-y-2 overflow-auto h-[500px] pr-1">
      {schema.map((section) => (
        <div
          key={section.key}
          className="rounded-lg border border-slate-100 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
            <code className="text-xs font-mono font-semibold text-blue-700">
              {section.key}
            </code>
            <span className="text-[10px] text-slate-500">{section.type}</span>
            {section.required && (
              <span className="text-[10px] text-red-500 font-semibold ml-auto">
                required
              </span>
            )}
          </div>
          {section.fields.length > 0 && (
            <div className="px-3 py-2 flex flex-wrap gap-1">
              {section.fields.map((f, i) => (
                <span
                  key={i}
                  className="text-[10px] text-slate-600 bg-white border border-slate-100 rounded px-1.5 py-0.5"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
