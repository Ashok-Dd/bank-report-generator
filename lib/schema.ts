import { z } from "zod";

const FinancialHighlightSchema = z.object({
  metric: z.string().min(1, "Metric is required"),
  value: z.string().min(1, "Value is required"),
  period: z.string().min(1, "Period is required"),
  yoyChange: z.string().default("N/A"),
  notes: z.string().optional().default(""),
  reference: z.string().optional().default(""),
});

const ExecutiveLeadershipSchema = z.object({
  ceo: z.string().min(1, "CEO name is required"),
  cfo: z.string().min(1, "CFO name is required"),
  coo: z.string().default(""),
  cro: z.string().default(""),
  cto: z.string().default(""),
  cco: z.string().default(""),
  headOfRetailBanking: z.string().default(""),
  backgroundNotes: z.array(z.string()).default([]),
  execStatuses: z.array(z.string()).default([]),
  execMandates: z.array(z.string()).default([]),
  execReferences: z.array(z.string()).default([]),
});

const BoardChangeSchema = z.object({
  directorName: z.string().min(1, "Director name is required"),
  event: z.string().min(1, "Event is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  relevance: z.string().default(""),
  reference: z.string().optional().default(""),
});

const StrategicPrioritySchema = z.object({
  priority: z.string().min(1, "Priority is required"),
  details: z.string().min(1, "Details are required"),
  timeline: z.string().default(""),
  keyOutcome: z.string().default(""),
  reference: z.string().optional().default(""),
});

const TechDimensionSchema = z.object({
  details: z.string().default(""),
  status: z.string().default(""),
  reference: z.string().optional().default(""),
});

const emptyTechDim = () => ({ details: "", status: "", reference: "" });

const TechnologyPostureSchema = z.object({
  coreBankingPlatform: TechDimensionSchema.default(emptyTechDim),
  cloudStrategy: TechDimensionSchema.default(emptyTechDim),
  aiMlInitiatives: TechDimensionSchema.default(emptyTechDim),
  cybersecurityPosture: TechDimensionSchema.default(emptyTechDim),
  digitalMobileBanking: TechDimensionSchema.default(emptyTechDim),
  dataAnalytics: TechDimensionSchema.default(emptyTechDim),
  regtechSuptech: TechDimensionSchema.default(emptyTechDim),
});

const GovernanceAreaSchema = z.object({
  area: z.string().min(1, "Area is required"),
  details: z.string().default(""),
  effective: z.string().default(""),
  keyMechanism: z.string().default(""),
  reference: z.string().optional().default(""),
});

const RiskEventSchema = z.object({
  incident: z.string().min(1, "Incident description is required"),
  date: z.string().min(1, "Date is required"),
  category: z.string().default(""),
  impact: z.string().default(""),
  reference: z.string().optional().default(""),
});

const EsgCommitmentSchema = z.object({
  area: z.string().min(1, "Area is required"),
  commitment: z.string().default(""),
  progress: z.string().default(""),
  period: z.string().default(""),
  reference: z.string().optional().default(""),
});

const EngagementTargetSchema = z.object({
  role: z.string().min(1, "Role is required"),
  contact: z.string().min(1, "Contact is required"),
  engagementHook: z.string().default(""),
});

const InstitutionProfileRowSchema = z.object({
  field: z.string().optional().default(""),
  value: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  reference: z.string().optional().default(""),
});

export const BankIntelligenceSchema = z.object({
  institutionProfile: z.object({
    institutionName: z.string().min(1, "Institution name is required"),
    headquarters: z.string().min(1, "Headquarters is required"),
    ticker: z.string().min(1, "Ticker is required"),
    exchange: z.string().optional().default(""),
    reportPeriod: z.string().min(1, "Report period is required"),
    totalAssets: z.string().min(1, "Total assets is required"),
    totalEmployees: z.string().default(""),
    clientBase: z.string().default(""),
    geographicFootprint: z.string().default(""),
    keyStrategicInvestor: z.string().optional().default(""),
    anniversaryMilestone: z.string().optional().default(""),
    rows: z.array(InstitutionProfileRowSchema).optional().default([]),
  }),
  financialHighlights: z.array(FinancialHighlightSchema).min(1, "At least one financial highlight is required"),
  executiveLeadership: ExecutiveLeadershipSchema,
  boardChanges: z.array(BoardChangeSchema).default([]),
  strategicPriorities: z.array(StrategicPrioritySchema).default([]),
  technologyPosture: TechnologyPostureSchema.optional().default(
    () => ({
      coreBankingPlatform: emptyTechDim(),
      cloudStrategy: emptyTechDim(),
      aiMlInitiatives: emptyTechDim(),
      cybersecurityPosture: emptyTechDim(),
      digitalMobileBanking: emptyTechDim(),
      dataAnalytics: emptyTechDim(),
      regtechSuptech: emptyTechDim(),
    })
  ),
  governance: z.array(GovernanceAreaSchema).default([]),
  riskEvents: z.array(RiskEventSchema).default([]),
  riskResponseActions: z.array(z.string()).default([]),
  esgCommitments: z.array(EsgCommitmentSchema).default([]),
  engagementTargets: z.array(EngagementTargetSchema).default([]),
  keyEngagementThemes: z.array(z.object({
    executive: z.string(),
    theme: z.string(),
  })).default([]),
  references: z.array(z.string()).default([]),
});

export type BankIntelligenceFormData = z.infer<typeof BankIntelligenceSchema>;
