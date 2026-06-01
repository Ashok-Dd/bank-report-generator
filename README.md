# Bank Intelligence Brief Generator

Production-grade Next.js 15 application that generates Bank Intelligence Brief PDFs from structured JSON data. Designed for [CoComply](https://cocomply.com).

## How It Works

The system takes your `bank-intelligence-template.pdf` and replaces all `[Placeholder]` tokens with values from your JSON data — preserving the **exact original layout, styling, tables, and branding** of the template.

Unlike HTML-to-PDF approaches, this directly patches the template's compressed PDF content streams at the byte level, meaning fonts, colours, table cells, and footers are untouched.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives |
| Forms | React Hook Form + Zod |
| PDF Engine | Python 3 (zlib stream patching) |
| Validation | Zod v4 |

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

**Requirements:** Node.js 18+, Python 3.8+

## Project Structure

```
├── app/
│   ├── page.tsx                    # Dashboard entry point
│   ├── layout.tsx
│   └── api/generate-pdf/route.ts   # REST API endpoint
├── actions/
│   └── generate-pdf.ts             # Next.js Server Action
├── components/
│   ├── ui/                         # Reusable UI primitives
│   └── dashboard/
│       ├── dashboard.tsx           # Main 3-column layout
│       ├── template-selector.tsx   # Template card picker
│       ├── template-preview.tsx    # Expandable section viewer
│       ├── json-editor.tsx         # Code editor with line numbers
│       └── generation-panel.tsx    # Generate + download panel
├── lib/
│   ├── pdf_processor.py            # Core PDF patching engine (Python)
│   ├── pdf-service.ts              # Node.js → Python bridge
│   ├── mapping.ts                  # JSON → placeholder mapping
│   ├── schema.ts                   # Zod validation schema
│   ├── templates.ts                # Template registry
│   └── example-data.json           # Full example (Associated Bank)
├── types/index.ts                  # TypeScript interfaces
└── templates/
    └── bank-intelligence-template.pdf   # The CoComply template
```

## REST API

```http
POST /api/generate-pdf
Content-Type: application/json

{
  "templateId": "bank-intelligence-brief",
  "data": { ...BankIntelligenceData }
}
```

Returns the generated PDF as `application/pdf` binary.

## JSON Schema

See `lib/example-data.json` for a complete example with Associated Bank data.

### Required Fields

```json
{
  "institutionProfile": {
    "institutionName": "string *",
    "headquarters": "string *",
    "ticker": "string *",
    "reportPeriod": "string *",
    "totalAssets": "string *"
  },
  "financialHighlights": [
    { "metric": "string *", "value": "string *", "period": "string *" }
  ],
  "executiveLeadership": {
    "ceo": "string *",
    "cfo": "string *"
  }
}
```

All other sections (boardChanges, strategicPriorities, technologyPosture, governance, riskEvents, esgCommitments, engagementTargets, references) are optional.

## Template Placeholders → JSON Mapping

| Template Placeholder | JSON Path |
|---------------------|-----------|
| `[Name]` (first occurrence) | `institutionProfile.institutionName` |
| `[City,Country]` | `institutionProfile.headquarters` |
| `[Ticker]` | `institutionProfile.ticker` + `exchange` |
| `[Value]` (row 1–6) | `financialHighlights[0..5].value` |
| `[Name]` (rows 2–8) | `executiveLeadership.ceo` … `headOfRetailBanking` |
| `[DirectorName]` (rows 1–5) | `boardChanges[0..4].directorName` |
| `[Priority1..5]` | `strategicPriorities[0..4].priority` |
| `[Details]` (tech rows) | `technologyPosture.*.details` |
| `[1]` … `[16]` | `references[0..15]` |

## Adding New Templates

1. Place your PDF in `/templates/your-template.pdf`
2. Add an entry to `lib/templates.ts`
3. Add a `build_sequences()` entry in `lib/pdf_processor.py` with your stream indices and placeholder mapping
4. Add a filename mapping in `actions/generate-pdf.ts` and `app/api/generate-pdf/route.ts`

## How the PDF Engine Works

Standard JavaScript PDF libraries (`pdf-lib`, etc.) cannot reliably replace text in compressed PDF streams because they don't decode the content operators. This engine:

1. **Parses** the raw PDF to locate all `stream … endstream` blocks
2. **Decompresses** FlateDecode (zlib) streams
3. **Normalises** TJ array operators: strips kerning numbers (e.g. `[([Cit)20(y])]TJ` → logical text `[City]`)
4. **Replaces** each logical placeholder with the mapped value using `(value)Tj`
5. **Recompresses** the modified stream with zlib
6. **Patches** the `/Length` dictionary entry in the PDF object
7. **Writes** the result without altering any other structure

This preserves: fonts, colours, tables, borders, images, headers, footers, and all metadata.
