// ═══════════════════════════════════════════════════════════════
// AC-QMS Seed Data — Single source of truth for the prototype
// ═══════════════════════════════════════════════════════════════

import type {
  User, Product, SpecTemplate, MoaTemplate, Instrument, Reagent,
  AuditLog, Batch, BatchDocument, AwsTestSection,
} from '@/types';

// ─── Users ────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
  { id: 'u-admin', name: 'Rajesh Kumar', username: 'admin', email: 'rajesh.kumar@adityachem.com', role: 'SADMIN', department: 'SYSTEM', status: 'Active', lastLogin: '2026-05-19T08:30:00.000Z', password: 'password123' },
  { id: 'u-qc-exec', name: 'Kavya Patel', username: 'qc.exec', email: 'kavya.patel@adityachem.com', role: 'QC_EXEC', department: 'QC', status: 'Active', lastLogin: '2026-05-20T09:15:00.000Z', password: 'password123' },
  { id: 'u-qc-mgr', name: 'Priya Mehta', username: 'qc.mgr', email: 'priya.mehta@adityachem.com', role: 'QC_MGR', department: 'QC', status: 'Active', lastLogin: '2026-05-20T08:45:00.000Z', password: 'password123' },
  { id: 'u-qa-exec', name: 'Anand Joshi', username: 'qa.exec', email: 'anand.joshi@adityachem.com', role: 'QA_EXEC', department: 'QA', status: 'Active', lastLogin: '2026-05-20T09:00:00.000Z', password: 'password123' },
  { id: 'u-qa-mgr', name: 'Sanjay Reddy', username: 'qa.mgr', email: 'sanjay.reddy@adityachem.com', role: 'QA_MGR', department: 'QA', status: 'Active', lastLogin: '2026-05-20T14:00:00.000Z', password: 'password123' },
];

// ─── Products ─────────────────────────────────────────────────

export const SEED_PRODUCTS: Product[] = [
  { id: 'prod-glycine', name: 'Glycine IP', code: 'GLC', formula: 'C₂H₅NO₂', molecularWeight: 75.07, mwUom: 'g/mol', regulatoryRefs: ['IP', 'BP', 'USP'] },
];

// ─── SPEC Templates ───────────────────────────────────────────

export const SEED_SPEC_TEMPLATES: SpecTemplate[] = [
  {
    id: 'spec-tpl-glycine',
    productId: 'prod-glycine',
    version: '01',
    testParameters: [
      { id: 'tp-desc', name: 'Description', mandatory: true, resultType: 'Qualitative', acceptanceCriteria: 'A white crystalline powder' },
      { id: 'tp-sol', name: 'Solubility', mandatory: true, resultType: 'Qualitative', acceptanceCriteria: 'Freely soluble in water' },
      { id: 'tp-ph', name: 'pH', mandatory: true, resultType: 'Quantitative', operator: 'Between', minValue: 5.5, maxValue: 7.0, uom: '' },
      { id: 'tp-lod', name: 'Loss on Drying', mandatory: true, resultType: 'Quantitative', operator: 'NMT', maxValue: 0.5, uom: '% w/w' },
      { id: 'tp-assay', name: 'Assay', mandatory: true, resultType: 'Quantitative', operator: 'Between', minValue: 98.5, maxValue: 101.5, uom: '%' },
      { id: 'tp-hm', name: 'Heavy Metals', mandatory: false, resultType: 'Quantitative', operator: 'NMT', maxValue: 10, uom: 'ppm' },
    ],
  },
];

// ─── MOA Templates ────────────────────────────────────────────

export const SEED_MOA_TEMPLATES: MoaTemplate[] = [
  {
    id: 'moa-tpl-glycine',
    productId: 'prod-glycine',
    version: '01',
    sections: [
      { testParameterId: 'tp-desc', pharmacopoeia: 'IP', samplePrep: 'Take about 1.0 g of sample and spread on a clean Petri dish. Check product visually for colour and appearance.', standardPrep: 'Not applicable.', blankPrep: '', formula: '', conclusionTemplate: 'Satisfactory' },
      { testParameterId: 'tp-sol', pharmacopoeia: 'IP', samplePrep: 'Take about 1.0 g of sample in 10 ml of water and check solubility. Take about 10 mg in 100 ml of ethanol (95%) and check solubility. Take about 10 mg in 100 ml of ether and check solubility.', standardPrep: 'Not applicable.', blankPrep: '', formula: '', conclusionTemplate: 'Satisfactory' },
      { testParameterId: 'tp-ph', pharmacopoeia: 'IP', samplePrep: 'Dissolve 5.0 g of sample in 100 ml of carbon dioxide-free water. Measure pH using a calibrated pH meter at 25°C.', standardPrep: 'Calibrate pH meter with pH 4.0 and pH 7.0 buffer solutions.', blankPrep: 'Carbon dioxide-free water.', formula: 'pH = Direct reading from pH meter', conclusionTemplate: 'Satisfactory' },
      { testParameterId: 'tp-lod', pharmacopoeia: 'IP', samplePrep: 'Weigh accurately about 1.0 g of sample (W1) in a pre-dried and tared dish. Dry at 105°C for 4 hours in an oven. Cool in desiccator and weigh (W2).', standardPrep: 'Not applicable.', blankPrep: '', formula: 'LOD (%) = ((W1 - W2) / W1) × 100', conclusionTemplate: 'Satisfactory' },
      { testParameterId: 'tp-assay', pharmacopoeia: 'IP', samplePrep: 'Weigh accurately about 0.200 g of sample, transfer to 100 mL volumetric flask, dissolve in mobile phase, dilute to volume.', standardPrep: 'Weigh 0.200 g Glycine Reference Standard, prepare similarly.', blankPrep: 'Mobile phase (blank injection).', formula: 'Assay (%) = (A_sample / A_standard) × (W_standard / W_sample) × Purity', conclusionTemplate: 'Satisfactory' },
      { testParameterId: 'tp-hm', pharmacopoeia: 'IP', samplePrep: 'As per outside laboratory report.', standardPrep: 'As per outside laboratory report.', blankPrep: '', formula: '', conclusionTemplate: 'Satisfactory' },
    ],
  },
];

// ─── Instruments ──────────────────────────────────────────────

export const SEED_INSTRUMENTS: Instrument[] = [
  { id: 'inst-bal001', instrumentId: 'BAL-001', name: 'Analytical Balance', calibrationDate: '2026-04-01', useBeforeDate: '2026-10-01', department: 'QC' },
  { id: 'inst-hplc001', instrumentId: 'HPLC-001', name: 'HPLC System', calibrationDate: '2026-03-15', useBeforeDate: '2026-09-15', department: 'QC' },
  { id: 'inst-ph001', instrumentId: 'PH-001', name: 'pH Meter', calibrationDate: '2026-05-01', useBeforeDate: '2026-08-01', department: 'QC' },
  { id: 'inst-oven001', instrumentId: 'OVEN-001', name: 'Drying Oven', calibrationDate: '2026-04-20', useBeforeDate: '2026-10-20', department: 'QC' },
  { id: 'inst-ftir001', instrumentId: 'FTIR-001', name: 'FTIR Spectrometer', calibrationDate: '2026-02-10', useBeforeDate: '2026-08-10', department: 'QC' },
];

// ─── Reagents ─────────────────────────────────────────────────

export const SEED_REAGENTS: Reagent[] = [
  { id: 'rgt-mpb', name: 'Mobile Phase Buffer', lotNo: 'MPB-2026-04', concentration: '—', preparationDate: '2026-04-10', expiryDate: '2026-07-10', supplier: 'Merck India' },
  { id: 'rgt-rs-gly', name: 'Reference Standard Glycine', lotNo: 'RS-2026-001', concentration: 'Purity ≥99.5%', preparationDate: '2026-01-15', expiryDate: '2027-04-01', supplier: 'USP Reference Standards' },
  { id: 'rgt-meoh', name: 'Methanol HPLC Grade', lotNo: 'MTH-2026-03', concentration: '≥99.9%', preparationDate: '2026-03-20', expiryDate: '2027-03-20', supplier: 'Thermo Fisher' },
  { id: 'rgt-buf-ph4', name: 'Buffer pH 4.0', lotNo: 'BUF4-2026-05', concentration: 'pH 4.0 ± 0.02', preparationDate: '2026-05-01', expiryDate: '2026-11-01', supplier: 'Himedia' },
  { id: 'rgt-buf-ph7', name: 'Buffer pH 7.0', lotNo: 'BUF7-2026-05', concentration: 'pH 7.0 ± 0.02', preparationDate: '2026-05-01', expiryDate: '2026-11-01', supplier: 'Himedia' },
];

// ─── Batches ──────────────────────────────────────────────────
// 4 batches covering every workflow state for a complete walkthrough

export const SEED_BATCHES: Batch[] = [
  {
    // Batch 1: Fully released — end-to-end complete story
    id: 'batch-001', productId: 'prod-glycine', batchNo: 'B-2026-001',
    mfgDate: '2026-05-01', expDate: '2029-04-30', arNo: 'AR/2026/001',
    qtySampled: '500', qtySampledUom: 'g', optionalTestsActivated: [],
    currentDocPhase: 'COA', createdBy: 'u-qc-exec',
    createdAt: '2026-05-05T09:00:00.000Z', released: true,
  },
  {
    // Batch 2: AWS submitted — QC Mgr needs to review
    id: 'batch-002', productId: 'prod-glycine', batchNo: 'B-2026-002',
    mfgDate: '2026-05-08', expDate: '2029-05-07', arNo: 'AR/2026/002',
    qtySampled: '450', qtySampledUom: 'g', optionalTestsActivated: [],
    currentDocPhase: 'AWS', createdBy: 'u-qc-exec',
    createdAt: '2026-05-12T09:00:00.000Z', released: false,
  },
  {
    // Batch 3: SPEC QC-approved — QA Mgr needs to sign
    id: 'batch-003', productId: 'prod-glycine', batchNo: 'B-2026-003',
    mfgDate: '2026-05-15', expDate: '2029-05-14', arNo: 'AR/2026/003',
    qtySampled: '600', qtySampledUom: 'g', optionalTestsActivated: [],
    currentDocPhase: 'SPEC', createdBy: 'u-qc-exec',
    createdAt: '2026-05-16T09:00:00.000Z', released: false,
  },
  {
    // Batch 4: MOA draft — QC Exec needs to submit
    id: 'batch-004', productId: 'prod-glycine', batchNo: 'B-2026-004',
    mfgDate: '2026-05-19', expDate: '2029-05-18', arNo: 'AR/2026/004',
    qtySampled: '480', qtySampledUom: 'g', optionalTestsActivated: [],
    currentDocPhase: 'MOA', createdBy: 'u-qc-exec',
    createdAt: '2026-05-19T09:00:00.000Z', released: false,
  },
];

// ─── Batch Documents ──────────────────────────────────────────

export const SEED_BATCH_DOCUMENTS: BatchDocument[] = [

  // ══════════════════════════════════════════
  // BATCH 001 — RELEASED (all docs complete)
  // ══════════════════════════════════════════
  {
    id: 'doc-spec-001', batchId: 'batch-001', docType: 'SPEC',
    docNo: 'SPEC/GLC/B-2026-001', status: 'QA_SIGNED',
    sourceTemplateId: 'spec-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-05T09:15:00.000Z', comment: 'Template fetched from product library' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-05T09:45:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-06T10:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-06T14:00:00.000Z' },
    ],
  },
  {
    id: 'doc-moa-001', batchId: 'batch-001', docType: 'MOA',
    docNo: 'MOA/GLC/B-2026-001', status: 'QA_SIGNED',
    sourceTemplateId: 'moa-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-07T09:00:00.000Z', comment: 'MOA template fetched (SPEC is QA-signed)' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-07T09:30:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-07T14:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-08T10:00:00.000Z' },
    ],
  },
  {
    id: 'doc-aws-001', batchId: 'batch-001', docType: 'AWS',
    docNo: 'AWS/GLC/B-2026-001', status: 'QA_SIGNED',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-08T11:00:00.000Z', comment: 'AWS created with 5 test sections' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-10T14:00:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-11T10:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-12T09:00:00.000Z' },
    ],
  },
  {
    id: 'doc-coa-001', batchId: 'batch-001', docType: 'COA',
    docNo: 'COA/GLC/B-2026-001', status: 'ISSUED',
    createdBy: 'SYSTEM', qaSignedBy: 'u-qa-mgr',
    issuedAt: '2026-05-12T11:15:00.000Z',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'AUTO_GENERATED', byUserId: 'SYSTEM', byUserName: 'System', byRole: 'SADMIN', at: '2026-05-12T09:01:00.000Z', comment: 'COA auto-generated from QA-signed AWS AWS/GLC/B-2026-001' },
      { fromStatus: 'AUTO_GENERATED', toStatus: 'ISSUED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-12T11:15:00.000Z' },
    ],
    coaResults: [
      { testName: 'Description', result: 'A white crystalline powder', limits: 'A white crystalline powder', conclusion: 'Satisfactory' },
      { testName: 'Solubility', result: 'Freely soluble in water, practically insoluble in ethanol/ether', limits: 'Freely soluble in water', conclusion: 'Satisfactory' },
      { testName: 'pH', result: '6.2', limits: '5.5 – 7.0', conclusion: 'Satisfactory' },
      { testName: 'Loss on Drying', result: '0.149 % w/w', limits: 'NMT 0.5 % w/w', conclusion: 'Satisfactory' },
      { testName: 'Assay', result: '99.3 %', limits: '98.5 – 101.5 %', conclusion: 'Satisfactory' },
    ],
    complianceStatement: 'This batch COMPLIES with Specification SPEC/GLC/B-2026-001',
    complies: true,
  },

  // ══════════════════════════════════════════
  // BATCH 002 — AWS SUBMITTED (QC Mgr action needed)
  // ══════════════════════════════════════════
  {
    id: 'doc-spec-002', batchId: 'batch-002', docType: 'SPEC',
    docNo: 'SPEC/GLC/B-2026-002', status: 'QA_SIGNED',
    sourceTemplateId: 'spec-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-12T09:30:00.000Z', comment: 'Template fetched from product library' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-12T10:00:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-13T09:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-13T14:00:00.000Z' },
    ],
  },
  {
    id: 'doc-moa-002', batchId: 'batch-002', docType: 'MOA',
    docNo: 'MOA/GLC/B-2026-002', status: 'QA_SIGNED',
    sourceTemplateId: 'moa-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-14T09:00:00.000Z', comment: 'MOA template fetched (SPEC is QA-signed)' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-14T09:30:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-14T14:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-15T10:00:00.000Z' },
    ],
  },
  {
    id: 'doc-aws-002', batchId: 'batch-002', docType: 'AWS',
    docNo: 'AWS/GLC/B-2026-002', status: 'SUBMITTED',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-15T11:00:00.000Z', comment: 'AWS created with 5 test sections' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-20T14:00:00.000Z' },
    ],
  },
  { id: 'doc-coa-002', batchId: 'batch-002', docType: 'COA', docNo: 'COA/GLC/B-2026-002', status: 'PENDING', rejectionComments: [], workflowHistory: [] },

  // ══════════════════════════════════════════
  // BATCH 003 — SPEC QC_APPROVED (QA Mgr action needed)
  // ══════════════════════════════════════════
  {
    id: 'doc-spec-003', batchId: 'batch-003', docType: 'SPEC',
    docNo: 'SPEC/GLC/B-2026-003', status: 'QC_APPROVED',
    sourceTemplateId: 'spec-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec', qcApprovedBy: 'u-qc-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-16T09:30:00.000Z', comment: 'Template fetched from product library' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-16T10:00:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-17T10:00:00.000Z' },
    ],
  },
  { id: 'doc-moa-003', batchId: 'batch-003', docType: 'MOA', docNo: 'MOA/GLC/B-2026-003', status: 'PENDING', rejectionComments: [], workflowHistory: [] },
  { id: 'doc-aws-003', batchId: 'batch-003', docType: 'AWS', docNo: 'AWS/GLC/B-2026-003', status: 'PENDING', rejectionComments: [], workflowHistory: [] },
  { id: 'doc-coa-003', batchId: 'batch-003', docType: 'COA', docNo: 'COA/GLC/B-2026-003', status: 'PENDING', rejectionComments: [], workflowHistory: [] },

  // ══════════════════════════════════════════
  // BATCH 004 — MOA DRAFT (QC Exec to submit)
  // ══════════════════════════════════════════
  {
    id: 'doc-spec-004', batchId: 'batch-004', docType: 'SPEC',
    docNo: 'SPEC/GLC/B-2026-004', status: 'QA_SIGNED',
    sourceTemplateId: 'spec-tpl-glycine',
    createdBy: 'u-qc-exec', submittedBy: 'u-qc-exec',
    qcApprovedBy: 'u-qc-mgr', qaSignedBy: 'u-qa-mgr',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-19T09:30:00.000Z', comment: 'Template fetched from product library' },
      { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-19T10:00:00.000Z' },
      { fromStatus: 'SUBMITTED', toStatus: 'QC_APPROVED', byUserId: 'u-qc-mgr', byUserName: 'Priya Mehta', byRole: 'QC_MGR', at: '2026-05-20T09:00:00.000Z' },
      { fromStatus: 'QC_APPROVED', toStatus: 'QA_SIGNED', byUserId: 'u-qa-mgr', byUserName: 'Sanjay Reddy', byRole: 'QA_MGR', at: '2026-05-20T10:00:00.000Z' },
    ],
  },
  {
    id: 'doc-moa-004', batchId: 'batch-004', docType: 'MOA',
    docNo: 'MOA/GLC/B-2026-004', status: 'DRAFT',
    sourceTemplateId: 'moa-tpl-glycine',
    createdBy: 'u-qc-exec',
    rejectionComments: [],
    workflowHistory: [
      { fromStatus: 'PENDING', toStatus: 'DRAFT', byUserId: 'u-qc-exec', byUserName: 'Kavya Patel', byRole: 'QC_EXEC', at: '2026-05-20T11:00:00.000Z', comment: 'MOA template fetched (SPEC is QA-signed)' },
    ],
  },
  { id: 'doc-aws-004', batchId: 'batch-004', docType: 'AWS', docNo: 'AWS/GLC/B-2026-004', status: 'PENDING', rejectionComments: [], workflowHistory: [] },
  { id: 'doc-coa-004', batchId: 'batch-004', docType: 'COA', docNo: 'COA/GLC/B-2026-004', status: 'PENDING', rejectionComments: [], workflowHistory: [] },
];

// ─── AWS Test Sections ────────────────────────────────────────

export const SEED_AWS_SECTIONS: AwsTestSection[] = [
  // ══════════════════════════════════════════
  // BATCH 001 — All 5 sections Completed
  // ══════════════════════════════════════════
  {
    id: 'sec-001-desc', batchDocumentId: 'doc-aws-001', batchId: 'batch-001',
    testParameterId: 'tp-desc', reagents: [],
    observations: 'A white crystalline powder with characteristic odour, free from extraneous matter.',
    inputs: {}, conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-09T10:30:00.000Z', lastSaved: '2026-05-09T10:30:00.000Z',
  },
  {
    id: 'sec-001-sol', batchDocumentId: 'doc-aws-001', batchId: 'batch-001',
    testParameterId: 'tp-sol',
    reagents: [{ reagentId: 'rgt-meoh', lotNo: 'MTH-2026-03', prepDate: '2026-03-20', expiryDate: '2027-03-20' }],
    observations: 'Freely soluble in water (1 g in ~4.5 mL at 20°C). Practically insoluble in ethanol and ether.',
    inputs: {}, conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-09T11:00:00.000Z', lastSaved: '2026-05-09T11:00:00.000Z',
  },
  {
    id: 'sec-001-ph', batchDocumentId: 'doc-aws-001', batchId: 'batch-001',
    testParameterId: 'tp-ph', instrumentId: 'inst-ph001',
    reagents: [
      { reagentId: 'rgt-buf-ph4', lotNo: 'BUF4-2026-05', prepDate: '2026-05-01', expiryDate: '2026-11-01' },
      { reagentId: 'rgt-buf-ph7', lotNo: 'BUF7-2026-05', prepDate: '2026-05-01', expiryDate: '2026-11-01' },
    ],
    observations: 'pH meter calibrated with standard buffers at 25°C.',
    inputs: { pH_reading: '6.2' }, calculatedResult: '6.2',
    conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-09T13:00:00.000Z', lastSaved: '2026-05-09T13:00:00.000Z',
  },
  {
    id: 'sec-001-lod', batchDocumentId: 'doc-aws-001', batchId: 'batch-001',
    testParameterId: 'tp-lod', instrumentId: 'inst-bal001', reagents: [],
    observations: 'Sample dried at 105°C for 4 hours. Initial: 1.0053 g, Final: 1.0038 g.',
    inputs: { W1: '1.0053', W2: '1.0038' }, calculatedResult: '0.149',
    conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-10T09:00:00.000Z', lastSaved: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'sec-001-assay', batchDocumentId: 'doc-aws-001', batchId: 'batch-001',
    testParameterId: 'tp-assay', instrumentId: 'inst-hplc001',
    reagents: [
      { reagentId: 'rgt-mpb', lotNo: 'MPB-2026-04', prepDate: '2026-04-10', expiryDate: '2026-07-10' },
      { reagentId: 'rgt-rs-gly', lotNo: 'RS-2026-001', prepDate: '2026-01-15', expiryDate: '2027-04-01' },
      { reagentId: 'rgt-meoh', lotNo: 'MTH-2026-03', prepDate: '2026-03-20', expiryDate: '2027-03-20' },
    ],
    observations: 'HPLC analysis completed. Tailing factor: 1.05, Theoretical plates: 4521. System suitability passed.',
    inputs: { A_sample: '102453', A_standard: '102891', W_standard: '0.2002', W_sample: '0.2000', Purity: '99.7' },
    calculatedResult: '99.3', conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-10T12:00:00.000Z', lastSaved: '2026-05-10T12:00:00.000Z',
  },

  // ══════════════════════════════════════════
  // BATCH 002 — All 5 sections Completed (AWS Submitted)
  // ══════════════════════════════════════════
  {
    id: 'sec-002-desc', batchDocumentId: 'doc-aws-002', batchId: 'batch-002',
    testParameterId: 'tp-desc', reagents: [],
    observations: 'A white crystalline powder, odourless, free from visible foreign particles.',
    inputs: {}, conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-17T10:30:00.000Z', lastSaved: '2026-05-17T10:30:00.000Z',
  },
  {
    id: 'sec-002-sol', batchDocumentId: 'doc-aws-002', batchId: 'batch-002',
    testParameterId: 'tp-sol',
    reagents: [{ reagentId: 'rgt-meoh', lotNo: 'MTH-2026-03', prepDate: '2026-03-20', expiryDate: '2027-03-20' }],
    observations: 'Freely soluble in water. Practically insoluble in ethanol and ether.',
    inputs: {}, conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-17T11:00:00.000Z', lastSaved: '2026-05-17T11:00:00.000Z',
  },
  {
    id: 'sec-002-ph', batchDocumentId: 'doc-aws-002', batchId: 'batch-002',
    testParameterId: 'tp-ph', instrumentId: 'inst-ph001',
    reagents: [
      { reagentId: 'rgt-buf-ph4', lotNo: 'BUF4-2026-05', prepDate: '2026-05-01', expiryDate: '2026-11-01' },
      { reagentId: 'rgt-buf-ph7', lotNo: 'BUF7-2026-05', prepDate: '2026-05-01', expiryDate: '2026-11-01' },
    ],
    observations: 'pH measurement at 25°C after instrument calibration.',
    inputs: { pH_reading: '6.5' }, calculatedResult: '6.5',
    conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-18T09:00:00.000Z', lastSaved: '2026-05-18T09:00:00.000Z',
  },
  {
    id: 'sec-002-lod', batchDocumentId: 'doc-aws-002', batchId: 'batch-002',
    testParameterId: 'tp-lod', instrumentId: 'inst-bal001', reagents: [],
    observations: 'Dried at 105°C for 4 hours. W1 = 1.0041 g, W2 = 1.0018 g.',
    inputs: { W1: '1.0041', W2: '1.0018' }, calculatedResult: '0.229',
    conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-19T10:00:00.000Z', lastSaved: '2026-05-19T10:00:00.000Z',
  },
  {
    id: 'sec-002-assay', batchDocumentId: 'doc-aws-002', batchId: 'batch-002',
    testParameterId: 'tp-assay', instrumentId: 'inst-hplc001',
    reagents: [
      { reagentId: 'rgt-mpb', lotNo: 'MPB-2026-04', prepDate: '2026-04-10', expiryDate: '2026-07-10' },
      { reagentId: 'rgt-rs-gly', lotNo: 'RS-2026-001', prepDate: '2026-01-15', expiryDate: '2027-04-01' },
      { reagentId: 'rgt-meoh', lotNo: 'MTH-2026-03', prepDate: '2026-03-20', expiryDate: '2027-03-20' },
    ],
    observations: 'HPLC run completed. Tailing factor: 1.03. System suitability passed.',
    inputs: { A_sample: '103241', A_standard: '103105', W_standard: '0.2001', W_sample: '0.2003', Purity: '99.7' },
    calculatedResult: '99.8', conclusion: 'Satisfactory', status: 'Completed',
    completedAt: '2026-05-20T12:00:00.000Z', lastSaved: '2026-05-20T12:00:00.000Z',
  },
];

// ─── Audit Logs ───────────────────────────────────────────────

export const SEED_AUDIT_LOGS: AuditLog[] = [
  // System
  { id: 'al-001', timestamp: '2026-05-01T08:00:00.000Z', userId: 'u-admin', userName: 'Rajesh Kumar', role: 'SADMIN', department: 'SYSTEM', action: 'LOGIN', docType: 'USER', docId: 'u-admin', docRef: 'admin' },
  // Batch 001 — full trail
  { id: 'al-002', timestamp: '2026-05-05T09:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'BATCH', docId: 'batch-001', docRef: 'B-2026-001' },
  { id: 'al-003', timestamp: '2026-05-05T09:15:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'FETCH_TEMPLATE', docType: 'SPEC', docId: 'doc-spec-001', docRef: 'SPEC/GLC/B-2026-001' },
  { id: 'al-004', timestamp: '2026-05-05T09:45:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'SUBMIT', docType: 'SPEC', docId: 'doc-spec-001', docRef: 'SPEC/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'DRAFT', newValue: 'SUBMITTED' },
  { id: 'al-005', timestamp: '2026-05-06T10:00:00.000Z', userId: 'u-qc-mgr', userName: 'Priya Mehta', role: 'QC_MGR', department: 'QC', action: 'QC_APPROVE', docType: 'SPEC', docId: 'doc-spec-001', docRef: 'SPEC/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'SUBMITTED', newValue: 'QC_APPROVED' },
  { id: 'al-006', timestamp: '2026-05-06T14:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'SPEC', docId: 'doc-spec-001', docRef: 'SPEC/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-007', timestamp: '2026-05-07T09:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'FETCH_TEMPLATE', docType: 'MOA', docId: 'doc-moa-001', docRef: 'MOA/GLC/B-2026-001' },
  { id: 'al-008', timestamp: '2026-05-07T09:30:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'SUBMIT', docType: 'MOA', docId: 'doc-moa-001', docRef: 'MOA/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'DRAFT', newValue: 'SUBMITTED' },
  { id: 'al-009', timestamp: '2026-05-07T14:00:00.000Z', userId: 'u-qc-mgr', userName: 'Priya Mehta', role: 'QC_MGR', department: 'QC', action: 'QC_APPROVE', docType: 'MOA', docId: 'doc-moa-001', docRef: 'MOA/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'SUBMITTED', newValue: 'QC_APPROVED' },
  { id: 'al-010', timestamp: '2026-05-08T10:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'MOA', docId: 'doc-moa-001', docRef: 'MOA/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-011', timestamp: '2026-05-08T11:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'AWS', docId: 'doc-aws-001', docRef: 'AWS/GLC/B-2026-001' },
  { id: 'al-012', timestamp: '2026-05-10T14:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'SUBMIT', docType: 'AWS', docId: 'doc-aws-001', docRef: 'AWS/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'DRAFT', newValue: 'SUBMITTED' },
  { id: 'al-013', timestamp: '2026-05-11T10:00:00.000Z', userId: 'u-qc-mgr', userName: 'Priya Mehta', role: 'QC_MGR', department: 'QC', action: 'QC_APPROVE', docType: 'AWS', docId: 'doc-aws-001', docRef: 'AWS/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'SUBMITTED', newValue: 'QC_APPROVED' },
  { id: 'al-014', timestamp: '2026-05-12T09:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'AWS', docId: 'doc-aws-001', docRef: 'AWS/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-015', timestamp: '2026-05-12T09:01:00.000Z', userId: 'SYSTEM', userName: 'System', role: 'SADMIN', department: 'SYSTEM', action: 'AUTO_GENERATE', docType: 'COA', docId: 'doc-coa-001', docRef: 'COA/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'PENDING', newValue: 'AUTO_GENERATED' },
  { id: 'al-016', timestamp: '2026-05-12T11:15:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'ISSUE', docType: 'COA', docId: 'doc-coa-001', docRef: 'COA/GLC/B-2026-001', fieldChanged: 'status', prevValue: 'AUTO_GENERATED', newValue: 'ISSUED' },
  // Batch 002
  { id: 'al-017', timestamp: '2026-05-12T09:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'BATCH', docId: 'batch-002', docRef: 'B-2026-002' },
  { id: 'al-018', timestamp: '2026-05-13T14:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'SPEC', docId: 'doc-spec-002', docRef: 'SPEC/GLC/B-2026-002', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-019', timestamp: '2026-05-15T10:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'MOA', docId: 'doc-moa-002', docRef: 'MOA/GLC/B-2026-002', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-020', timestamp: '2026-05-15T11:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'AWS', docId: 'doc-aws-002', docRef: 'AWS/GLC/B-2026-002' },
  { id: 'al-021', timestamp: '2026-05-20T14:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'SUBMIT', docType: 'AWS', docId: 'doc-aws-002', docRef: 'AWS/GLC/B-2026-002', fieldChanged: 'status', prevValue: 'DRAFT', newValue: 'SUBMITTED' },
  // Batch 003
  { id: 'al-022', timestamp: '2026-05-16T09:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'BATCH', docId: 'batch-003', docRef: 'B-2026-003' },
  { id: 'al-023', timestamp: '2026-05-16T10:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'SUBMIT', docType: 'SPEC', docId: 'doc-spec-003', docRef: 'SPEC/GLC/B-2026-003', fieldChanged: 'status', prevValue: 'DRAFT', newValue: 'SUBMITTED' },
  { id: 'al-024', timestamp: '2026-05-17T10:00:00.000Z', userId: 'u-qc-mgr', userName: 'Priya Mehta', role: 'QC_MGR', department: 'QC', action: 'QC_APPROVE', docType: 'SPEC', docId: 'doc-spec-003', docRef: 'SPEC/GLC/B-2026-003', fieldChanged: 'status', prevValue: 'SUBMITTED', newValue: 'QC_APPROVED' },
  // Batch 004
  { id: 'al-025', timestamp: '2026-05-19T09:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'CREATE', docType: 'BATCH', docId: 'batch-004', docRef: 'B-2026-004' },
  { id: 'al-026', timestamp: '2026-05-20T10:00:00.000Z', userId: 'u-qa-mgr', userName: 'Sanjay Reddy', role: 'QA_MGR', department: 'QA', action: 'QA_SIGN', docType: 'SPEC', docId: 'doc-spec-004', docRef: 'SPEC/GLC/B-2026-004', fieldChanged: 'status', prevValue: 'QC_APPROVED', newValue: 'QA_SIGNED' },
  { id: 'al-027', timestamp: '2026-05-20T11:00:00.000Z', userId: 'u-qc-exec', userName: 'Kavya Patel', role: 'QC_EXEC', department: 'QC', action: 'FETCH_TEMPLATE', docType: 'MOA', docId: 'doc-moa-004', docRef: 'MOA/GLC/B-2026-004' },
];

// ─── Quick Login Cards ────────────────────────────────────────

export const QUICK_LOGIN_ACCOUNTS = [
  { username: 'admin', password: 'password123', label: 'Super Admin', name: 'Rajesh Kumar', dept: 'System', role: 'SADMIN' as const, icon: '🛡️', color: '#6366F1' },
  { username: 'qc.exec', password: 'password123', label: 'QC Executive', name: 'Kavya Patel', dept: 'QC', role: 'QC_EXEC' as const, icon: '🔬', color: '#2E7D32' },
  { username: 'qc.mgr', password: 'password123', label: 'QC Manager', name: 'Priya Mehta', dept: 'QC', role: 'QC_MGR' as const, icon: '📋', color: '#2E7D32' },
  { username: 'qa.exec', password: 'password123', label: 'QA Executive', name: 'Anand Joshi', dept: 'QA', role: 'QA_EXEC' as const, icon: '🔍', color: '#1565C0' },
  { username: 'qa.mgr', password: 'password123', label: 'QA Manager', name: 'Sanjay Reddy', dept: 'QA', role: 'QA_MGR' as const, icon: '✅', color: '#1565C0' },
];
