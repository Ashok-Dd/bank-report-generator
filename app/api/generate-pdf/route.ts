import { NextRequest, NextResponse } from "next/server";
import { BankIntelligenceSchema } from "@/lib/schema";
import { processTemplatePDF, getTemplatePath } from "@/lib/pdf-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data: rawData, templateId = "bank-intelligence-brief" } = body;

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "Missing 'data' field in request body" },
        { status: 400 }
      );
    }

    const validation = BankIntelligenceSchema.safeParse(rawData);
    if (!validation.success) {
      const issues = validation.error.issues.slice(0, 5).map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { success: false, error: "Validation failed", issues },
        { status: 422 }
      );
    }

    const filenameMap: Record<string, string> = {
      "bank-intelligence-brief": "bank-intelligence-template.pdf",
    };
    const filename = filenameMap[templateId] ?? "bank-intelligence-template.pdf";

    let templatePath: string;
    try {
      templatePath = await getTemplatePath(filename);
    } catch {
      return NextResponse.json(
        { success: false, error: "Template file not found" },
        { status: 404 }
      );
    }

    const result = await processTemplatePDF(templatePath, validation.data);
    if (!result.success || !result.pdfBytes) {
      return NextResponse.json(
        { success: false, error: result.error ?? "PDF generation failed" },
        { status: 500 }
      );
    }

    const institutionName =
      (rawData as any)?.institutionProfile?.institutionName ?? "report";
    const safeFilename = institutionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new NextResponse(Buffer.from(result.pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}-intelligence-brief.pdf"`,
        "Content-Length": String(result.pdfBytes.length),
        "X-Replaced-Count": String(result.replacedCount ?? 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    description: "Bank Intelligence Brief PDF Generation API",
    usage: "POST { data: BankIntelligenceData, templateId?: string }",
    templates: ["bank-intelligence-brief"],
  });
}
