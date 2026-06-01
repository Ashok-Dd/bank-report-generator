"use client";

import React, { useRef, useCallback, useState } from "react";
import {
  FileJson,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import exampleData from "@/lib/example-data.json";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function JsonEditor({ value, onChange, error }: JsonEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateJson = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setIsValid(null);
        return;
      }
      try {
        JSON.parse(text);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    validateJson(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        // Format it nicely
        const parsed = JSON.parse(text);
        const formatted = JSON.stringify(parsed, null, 2);
        onChange(formatted);
        setIsValid(true);
      } catch {
        onChange(text);
        setIsValid(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const loadExample = () => {
    const formatted = JSON.stringify(exampleData, null, 2);
    onChange(formatted);
    setIsValid(true);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setIsValid(true);
    } catch {
      // Already invalid
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = value.split("\n").length;
  const charCount = value.length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">JSON Input</span>
          {isValid === true && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid JSON
            </span>
          )}
          {isValid === false && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              Invalid JSON
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadExample}
            className="h-7 text-xs gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Load Example
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={formatJson}
            disabled={!value.trim()}
            className="h-7 text-xs"
          >
            Format
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!value.trim()}
            className="h-7 text-xs gap-1"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs gap-1"
          >
            <Upload className="w-3 h-3" />
            Upload JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Editor area */}
      <div
        className={cn(
          "relative flex-1 rounded-lg border-2 overflow-hidden transition-colors",
          isValid === false || error
            ? "border-red-300"
            : isValid === true
            ? "border-emerald-300"
            : "border-slate-200",
          "focus-within:border-blue-400"
        )}
      >
        {/* Line numbers + editor */}
        <div className="flex h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 w-10 bg-slate-50 border-r border-slate-100 overflow-hidden select-none">
            <ScrollArea className="h-full">
              <div className="py-3 pr-2 text-right">
                {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-slate-400 leading-[1.6rem] font-mono"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Textarea */}
          <textarea
            value={value}
            onChange={handleChange}
            spellCheck={false}
            placeholder={`Paste your JSON data here or click "Load Example" to get started...\n\n{\n  "institutionProfile": {\n    "institutionName": "Bank Name",\n    ...\n  }\n}`}
            className={cn(
              "flex-1 h-full p-3 font-mono text-[13px] leading-[1.6rem] resize-none",
              "bg-white text-slate-800 placeholder:text-slate-300",
              "focus:outline-none",
              "overflow-auto"
            )}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-slate-400">
          {lineCount.toLocaleString()} lines · {charCount.toLocaleString()} chars
        </span>
        {error && (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
