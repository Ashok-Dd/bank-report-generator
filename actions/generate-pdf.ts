"use server";

import { BankIntelligenceSchema } from "@/lib/schema";
import { processTemplatePDF, getTemplatePath } from "@/lib/pdf-service";

export interface GeneratePDFActionResult {
  success: boolean;
  pdfBase64?: string;
  error?: string;
  replacedCount?: number;
  missingPlaceholders?: string[];
  warnings?: string[];
}

export async function generatePDFAction(
  rawJson: string,
  templateId: string = "bank-intelligence-brief"
): Promise<GeneratePDFActionResult> {
  // 1. Parse JSON
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(rawJson);
  } catch (err) {
    return {
      success: false,
      error: "Invalid JSON: " + (err instanceof Error ? err.message : "Parse error"),
    };
  }

  // 2. Validate
  const validation = BankIntelligenceSchema.safeParse(parsedData);
  if (!validation.success) {
    const issues = validation.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")} — ${i.message}`)
      .join("\n");
    return { success: false, error: `Validation failed:\n${issues}` };
  }

  const data = validation.data;

  // 3. Get template path
  const filenameMap: Record<string, string> = {
    "bank-intelligence-brief": "bank-intelligence-template.pdf",
  };
  const filename = filenameMap[templateId] ?? "bank-intelligence-template.pdf";

  let templatePath: string;
  try {
    templatePath = await getTemplatePath(filename);
  } catch {
    return {
      success: false,
      error: "Template file not found. Ensure bank-intelligence-template.pdf exists in /templates.",
    };
  }

  // 4. Generate PDF via Python processor
  const result = await processTemplatePDF(templatePath, data);

  if (!result.success || !result.pdfBytes) {
    return { success: false, error: result.error ?? "PDF generation failed" };
  }

  // 5. Encode as base64
  const pdfBase64 = Buffer.from(result.pdfBytes).toString("base64");

  return {
    success: true,
    pdfBase64,
    replacedCount: result.replacedCount,
    missingPlaceholders: [],
    warnings: [],
  };
}
