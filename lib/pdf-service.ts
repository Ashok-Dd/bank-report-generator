import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import type { GenerationResult } from "@/types";

const execAsync = promisify(exec);

/**
 * Processes a template PDF by running the Python pdf_processor.py script.
 * The Python script correctly handles FlateDecode-compressed streams with
 * kerned TJ arrays (as used by InDesign/Illustrator-generated PDFs).
 */
export async function processTemplatePDF(
  templatePath: string,
  data: object
): Promise<GenerationResult> {
  // Write data to a temp JSON file
  const tmpDir = os.tmpdir();
  const tmpJson = path.join(tmpDir, `bib-data-${Date.now()}.json`);
  const tmpOutput = path.join(tmpDir, `bib-output-${Date.now()}.pdf`);

  try {
    await fs.writeFile(tmpJson, JSON.stringify(data, null, 2), "utf-8");

    const scriptPath = path.join(process.cwd(), "lib", "pdf_processor.py");

    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${templatePath}" "${tmpJson}" "${tmpOutput}"`,
      { timeout: 30000 }
    );

    if (stderr && !stdout.includes('"success": true')) {
      return {
        success: false,
        error: `PDF processor error: ${stderr.slice(0, 500)}`,
      };
    }

    let result: { success: boolean; replacedCount?: number; error?: string };
    try {
      result = JSON.parse(stdout.trim());
    } catch {
      return {
        success: false,
        error: `PDF processor returned invalid output: ${stdout.slice(0, 200)}`,
      };
    }

    if (!result.success) {
      return { success: false, error: result.error ?? "Unknown PDF error" };
    }

    // Read the output PDF
    const pdfBuffer = await fs.readFile(tmpOutput);
    const pdfBytes = new Uint8Array(pdfBuffer);

    return {
      success: true,
      pdfBytes,
      replacedCount: result.replacedCount ?? 0,
      missingPlaceholders: [],
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `PDF generation failed: ${msg}` };
  } finally {
    // Cleanup temp files
    await fs.unlink(tmpJson).catch(() => {});
    await fs.unlink(tmpOutput).catch(() => {});
  }
}

/**
 * Returns the absolute path to a template file in /templates.
 */
export async function getTemplatePath(filename: string): Promise<string> {
  const templatePath = path.join(process.cwd(), "templates", filename);
  await fs.access(templatePath); // throws if missing
  return templatePath;
}
