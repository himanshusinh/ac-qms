// ═══════════════════════════════════════════════════════════════
// AC-QMS Type Definitions
// Sequential 4-Document Approval Chain: SPEC → MOA → AWS → COA
// ═══════════════════════════════════════════════════════════════

// ─── Core Enums ───────────────────────────────────────────────

export type Role = 'SADMIN' | 'QC_EXEC' | 'QC_MGR' | 'QA_EXEC' | 'QA_MGR';
export type Department = 'QC' | 'QA' | 'SYSTEM';
export type DocType = 'SPEC' | 'MOA' | 'AWS' | 'COA';

export type DocStatus =
  | 'PENDING'          // placeholder, not yet started
  | 'DRAFT'            // created/fetched, being worked on
  | 'SUBMITTED'        // submitted by QC Exec → awaiting QC Mgr
  | 'QC_APPROVED'      // approved by QC Mgr → awaiting QA Mgr
  | 'QA_SIGNED'        // signed by QA Mgr → done
  | 'REJECTED'         // returned with comments
  | 'AUTO_GENERATED'   // COA auto-generated, awaiting QA sign
  | 'ISSUED';          // COA signed & issued — final

export type SectionStatus = 'NotStarted' | 'InProgress' | 'Completed';
export type ResultType = 'Qualitative' | 'Quantitative';
export type Operator = 'NMT' | 'NLT' | 'Between';

export type ActionType =
  | 'CREATE'
  | 'FETCH_TEMPLATE'
  | 'UPDATE'
  | 'SUBMIT'
  | 'QC_APPROVE'
  | 'QA_SIGN'
  | 'REJECT'
  | 'AUTO_GENERATE'
  | 'ISSUE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'RESET_PASSWORD'
  | 'SAVE_DRAFT'
  | 'MARK_COMPLETE';

export type DocumentType = 'USER' | 'BATCH' | 'SPEC' | 'MOA' | 'AWS' | 'COA' | 'INSTRUMENT' | 'REAGENT';

// ─── User ─────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  department: Department;
  status: 'Active' | 'Inactive';
  lastLogin: string | null;
  password: string;
  forcePasswordChange?: boolean;
}

// ─── Product Library ──────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  code: string;            // e.g., "GLC" — used in doc numbering
  formula: string;
  molecularWeight: number;
  mwUom: string;
  regulatoryRefs: string[];
}

// ─── SPEC Template ────────────────────────────────────────────

export interface TestParameter {
  id: string;
  name: string;
  mandatory: boolean;
  resultType: ResultType;
  acceptanceCriteria?: string;   // for qualitative
  minValue?: number;
  maxValue?: number;
  operator?: Operator;
  uom?: string;
}

export interface SpecTemplate {
  id: string;
  productId: string;
  version: string;
  testParameters: TestParameter[];
}

// ─── MOA Template ─────────────────────────────────────────────

export interface MoaSection {
  testParameterId: string;
  pharmacopoeia: string;
  samplePrep: string;
  standardPrep: string;
  blankPrep?: string;
  formula?: string;
  conclusionTemplate: string;
}

export interface MoaTemplate {
  id: string;
  productId: string;
  version: string;
  sections: MoaSection[];
}

// ─── Instrument ───────────────────────────────────────────────

export interface Instrument {
  id: string;
  instrumentId: string;     // e.g., "BAL-001"
  name: string;
  calibrationDate: string;
  useBeforeDate: string;
  department: Department;
}

// ─── Reagent ──────────────────────────────────────────────────

export interface Reagent {
  id: string;
  name: string;
  lotNo: string;
  concentration?: string;
  preparationDate: string;
  expiryDate: string;
  supplier: string;
}

// ─── Batch ────────────────────────────────────────────────────

export interface Batch {
  id: string;
  productId: string;
  batchNo: string;
  mfgDate: string;
  expDate: string;
  arNo: string;
  qtySampled: string;
  qtySampledUom: string;
  optionalTestsActivated: string[];  // test parameter IDs
  currentDocPhase: DocType;          // which doc is currently active
  createdBy: string;
  createdAt: string;
  released: boolean;
}

// ─── Batch Document ───────────────────────────────────────────

export interface WorkflowEntry {
  fromStatus: DocStatus | 'CREATED';
  toStatus: DocStatus;
  byUserId: string;
  byUserName: string;
  byRole: Role;
  at: string;
  comment?: string;
}

export interface BatchDocument {
  id: string;
  batchId: string;
  docType: DocType;
  docNo: string;             // e.g., "SPEC/GLC/B-2026-001"
  status: DocStatus;
  sourceTemplateId?: string;
  createdBy?: string;
  submittedBy?: string;
  qcApprovedBy?: string;
  qaSignedBy?: string;
  rejectionComments: string[];
  workflowHistory: WorkflowEntry[];
  // For COA only
  coaResults?: CoaResult[];
  complianceStatement?: string;
  complies?: boolean;
  issuedAt?: string;
}

// ─── AWS Test Section ─────────────────────────────────────────

export interface AwsReagentEntry {
  reagentId: string;
  lotNo: string;
  prepDate: string;
  expiryDate: string;
}

export interface AwsTestSection {
  id: string;
  batchDocumentId: string;   // the AWS BatchDocument ID
  batchId: string;
  testParameterId: string;
  instrumentId?: string;
  reagents: AwsReagentEntry[];
  observations: string;
  inputs: Record<string, string>;     // keyed by formula variable name
  calculatedResult?: string;
  conclusion?: string;
  oosAcknowledged?: boolean;
  expiredInstrumentAcknowledged?: boolean;
  expiredReagentAcknowledged?: boolean;
  outsideLabReportRef?: string;
  outsideLabDate?: string;
  outsideLabAttachment?: string;
  status: SectionStatus;
  lastSaved?: string;
  completedAt?: string;
}

// ─── COA Result ───────────────────────────────────────────────

export interface CoaResult {
  testName: string;
  result: string;
  limits: string;
  conclusion: string;
}

// ─── COA Signature ────────────────────────────────────────────

export interface CoaSignature {
  label: string;          // e.g., "AWS CREATED BY"
  name: string;
  designation: string;
  department: string;
  date: string;
  signed: boolean;
}

// ─── Audit Log ────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  department: Department;
  action: ActionType;
  docType: DocumentType;
  docId: string;
  docRef?: string;
  fieldChanged?: string;
  prevValue?: string;
  newValue?: string;
  comment?: string;
}
