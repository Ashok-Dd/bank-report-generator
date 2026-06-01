"use client";

import {
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GenerationStatus =
  | "idle"
  | "validating"
  | "generating"
  | "success"
  | "error";

interface GenerationPanelProps {
  status: GenerationStatus;
  error?: string | null;
  warnings?: string[];
  replacedCount?: number;
  missingPlaceholders?: string[];
  pdfBase64?: string;
  institutionName?: string;
  onGenerate: () => void;
  onReset: () => void;
  isJsonValid: boolean;
  hasJson: boolean;
}

export function GenerationPanel({
  status,
  error,
  warnings,
  replacedCount,
  missingPlaceholders,
  pdfBase64,
  institutionName,
  onGenerate,
  onReset,
  isJsonValid,
  hasJson,
}: GenerationPanelProps) {
  const isLoading = status === "validating" || status === "generating";

  const handleDownload = () => {
    if (!pdfBase64) return;
    const byteChars = atob(pdfBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (institutionName ?? "report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    a.download = `${safeName}-intelligence-brief.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Main action */}
      <div className="space-y-3">
        {status !== "success" && (
          <Button
            type="button"
            variant="primary"
            size="xl"
            className="w-full gap-2 font-semibold"
            onClick={onGenerate}
            disabled={!hasJson || !isJsonValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === "validating" ? "Validating..." : "Generating PDF..."}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Intelligence Brief
              </>
            )}
          </Button>
        )}

        {/* Success state */}
        {status === "success" && pdfBase64 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  PDF Generated Successfully
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {replacedCount} placeholder{replacedCount !== 1 ? "s" : ""}{" "}
                  replaced · Ready to download
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="success"
              size="xl"
              className="w-full gap-2 font-semibold"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5" />
              Download PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={onReset}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Again
            </Button>
          </div>
        )}
      </div>

      {/* Error */}
      {status === "error" && error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>
            <pre className="text-xs mt-1 whitespace-pre-wrap font-mono">
              {error}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && status === "success" && (
        <Alert variant="warning">
          <Info className="w-4 h-4" />
          <AlertTitle>Notes</AlertTitle>
          <AlertDescription>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs mt-1">
                {w}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Missing placeholders */}
      {missingPlaceholders && missingPlaceholders.length > 0 && status === "success" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              {missingPlaceholders.length} mapped fields not found in template
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {missingPlaceholders.slice(0, 8).map((ph, i) => (
              <code
                key={i}
                className="text-[10px] bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-mono"
              >
                {ph}
              </code>
            ))}
            {missingPlaceholders.length > 8 && (
              <span className="text-[10px] text-amber-600">
                +{missingPlaceholders.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Idle instructions */}
      {status === "idle" && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            How it works
          </p>
          {[
            {
              step: "1",
              title: "Load or paste JSON data",
              desc: 'Use the "Load Example" button or paste your own structured data',
            },
            {
              step: "2",
              title: "Select a template",
              desc: "Choose the Bank Intelligence Brief template from the sidebar",
            },
            {
              step: "3",
              title: "Generate",
              desc: "Click Generate — your JSON values replace all template placeholders",
            },
            {
              step: "4",
              title: "Download PDF",
              desc: "Get a pixel-perfect PDF preserving the original template layout",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation prompt */}
      {!isJsonValid && hasJson && status === "idle" && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Invalid JSON</AlertTitle>
          <AlertDescription className="text-xs">
            Fix the JSON syntax errors in the editor before generating.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
