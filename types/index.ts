export interface InstitutionProfile {
  institutionName: string;
  headquarters: string;
  ticker: string;
  exchange?: string;
  reportPeriod: string;
  totalAssets: string;
  totalEmployees: string;
  clientBase: string;
  geographicFootprint: string;
  keyStrategicInvestor?: string;
  anniversaryMilestone?: string;
}

export interface FinancialHighlight {
  metric: string;
  value: string;
  period: string;
  yoyChange: string;
  notes?: string;
  reference?: string;
}

export interface Executive {
  role: string;
  name: string;
  status: string;
  coreMandate: string;
  reference?: string;
}

export interface ExecutiveLeadership {
  ceo: string;
  cfo: string;
  coo: string;
  cro: string;
  cto: string;
  cco: string;
  headOfRetailBanking: string;
  backgroundNotes: string[];
}

export interface BoardChange {
  directorName: string;
  event: string;
  effectiveDate: string;
  relevance: string;
  reference?: string;
}

export interface StrategicPriority {
  priority: string;
  details: string;
  timeline: string;
  keyOutcome: string;
  reference?: string;
}

export interface TechnologyPosture {
  coreBankingPlatform: { details: string; status: string; reference?: string };
  cloudStrategy: { details: string; status: string; reference?: string };
  aiMlInitiatives: { details: string; status: string; reference?: string };
  cybersecurityPosture: { details: string; status: string; reference?: string };
  digitalMobileBanking: { details: string; status: string; reference?: string };
  dataAnalytics: { details: string; status: string; reference?: string };
  regtechSuptech: { details: string; status: string; reference?: string };
}

export interface GovernanceArea {
  area: string;
  details: string;
  effective: string;
  keyMechanism: string;
  reference?: string;
}

export interface RiskEvent {
  incident: string;
  date: string;
  category: string;
  impact: string;
  reference?: string;
}

export interface EsgCommitment {
  area: string;
  commitment: string;
  progress: string;
  period: string;
  reference?: string;
}

export interface EngagementTarget {
  role: string;
  contact: string;
  engagementHook: string;
}

export interface BankIntelligenceData {
  institutionProfile: InstitutionProfile;
  financialHighlights: FinancialHighlight[];
  executiveLeadership: ExecutiveLeadership;
  boardChanges: BoardChange[];
  strategicPriorities: StrategicPriority[];
  technologyPosture: TechnologyPosture;
  governance: GovernanceArea[];
  riskEvents: RiskEvent[];
  riskResponseActions: string[];
  esgCommitments: EsgCommitment[];
  engagementTargets: EngagementTarget[];
  keyEngagementThemes: { executive: string; theme: string }[];
  references: string[];
}

export interface PlaceholderMapping {
  [placeholder: string]: string;
}

export interface GenerationResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  error?: string;
  replacedCount?: number;
  missingPlaceholders?: string[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  filename: string;
  placeholders: string[];
}
