"use client";

import { FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_TEMPLATES } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Templates
        </span>
      </div>

      {AVAILABLE_TEMPLATES.map((template) => {
        const isSelected = template.id === selectedId;
        return (
          <Card
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={cn(
              "cursor-pointer transition-all duration-200 border-2",
              isSelected
                ? "border-blue-500 bg-blue-50/50 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-blue-600" : "bg-slate-200"
                      )}
                    >
                      <FileText
                        className={cn(
                          "w-3.5 h-3.5",
                          isSelected ? "text-white" : "text-slate-500"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold truncate",
                        isSelected ? "text-blue-700" : "text-slate-800"
                      )}
                    >
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 ml-9">
                    {template.description}
                  </p>
                  <div className="mt-2 ml-9 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {template.filename}
                    </Badge>
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">
                      {template.placeholders.length}+ fields
                    </Badge>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Coming soon templates */}
      {[
        { name: "Risk Assessment Report", desc: "Deep-dive risk analysis framework" },
        { name: "Executive Intelligence", desc: "Leadership and succession analysis" },
      ].map((t) => (
        <Card
          key={t.name}
          className="cursor-not-allowed opacity-50 border-slate-200 border-dashed"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-400">{t.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                Soon
              </Badge>
            </div>
            <p className="text-xs text-slate-400 ml-9">{t.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
